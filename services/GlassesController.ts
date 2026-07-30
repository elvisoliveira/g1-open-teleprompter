import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import { BaseDeviceController } from './BaseDeviceController';
import {
    CHARACTERISTIC_SERVICE,
    GLASSES_PACKET_DELAY,
    GLASSES_TELEPROMPTER_MAX_LINE_WIDTH
} from './constants/GlassesConstants';
import { DeviceStatus, GlassSide } from './DeviceTypes';
import { GlassesConnection } from './modules/GlassesConnection';
import { GlassesHeartbeat } from './modules/GlassesHeartbeat';
import { GlassesStatus } from './modules/GlassesStatus';
import { TeleprompterTextProcessor } from './TeleprompterTextProcessor';
import { TextFormatter } from './TextFormatter';
import { BluetoothTransport } from './transport/BluetoothTransport';
import { GlassesProtocol } from './transport/GlassesProtocol';
import { TeleprompterProtocol } from './transport/TeleprompterProtocol';

class GlassesController extends BaseDeviceController {
    private connection = new GlassesConnection();
    private status = new GlassesStatus();
    private heartbeat = new GlassesHeartbeat();
    private teleprompterSeq: number = 0;
    private transferInProgress = false;

    protected getServiceName(): string {
        return 'GlassesController';
    }

    // Public API Methods
    async connectLeft(address: string): Promise<void> {
        await this.connection.connectDevice(address, GlassSide.LEFT);
        await this.status.getFirmwareInfo(this.connection.getDevices().left!, GlassSide.LEFT);
        this.startHeartbeatIfNeeded();
    }

    async connectRight(address: string): Promise<void> {
        await this.connection.connectDevice(address, GlassSide.RIGHT);
        await this.status.getFirmwareInfo(this.connection.getDevices().right!, GlassSide.RIGHT);
        this.startHeartbeatIfNeeded();
    }

    async disconnect(): Promise<void> {
        this.heartbeat.stop();
        await this.connection.disconnectAll();
        this.status.reset();
    }

    // Device Status Methods
    isConnected(): boolean {
        return this.connection.isConnected();
    }

    isLeftConnected(): boolean {
        return this.connection.isLeftConnected();
    }

    isRightConnected(): boolean {
        return this.connection.isRightConnected();
    }

    onConnectionStateChange(callback: (state: { left: boolean; right: boolean }) => void): () => void {
        return this.connection.onConnectionStateChange(callback);
    }

    // Communication Methods
    async sendText(text: string): Promise<boolean> {
        this.assertConnected();
        const packets = GlassesProtocol.createTextPackets(TextFormatter.formatTextForDisplay(text));
        const results = await this.executeForDevices(async (device) => {
            return await BluetoothTransport.sendPacketsToDevice(CHARACTERISTIC_SERVICE, device, packets, GLASSES_PACKET_DELAY);
        });
        return results.every(Boolean);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        this.assertConnected();
        // Pause heartbeats while the multi-second BMP stream is on the wire
        this.transferInProgress = true;
        try {
            const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
            const results = await this.executeForDevices(async (device) => {
                return await GlassesProtocol.sendBmpToDevice(device, bmpData);
            }, true);
            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error sending BMP image:', error);
            return false;
        } finally {
            this.transferInProgress = false;
        }
    }

    async sendOfficialTeleprompter(text: string, slidePercentage?: number): Promise<boolean> {
        this.assertConnected();
        try {
            const formattedText = TeleprompterTextProcessor.addLineBreaks(text, GLASSES_TELEPROMPTER_MAX_LINE_WIDTH);
            const textParts = TeleprompterTextProcessor.splitTextForTeleprompter(formattedText);
            const packets = TeleprompterProtocol.buildTeleprompterPackets(
                textParts.visible,
                textParts.next,
                this.teleprompterSeq,
                slidePercentage
            );
            this.teleprompterSeq = (this.teleprompterSeq + packets.length) & 0xFF;

            const results = await this.executeForDevices(async (device) => {
                return await TeleprompterProtocol.sendTeleprompterPackets(device, packets);
            });
            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error sending official teleprompter:', error);
            return false;
        }
    }

    async exitOfficialTeleprompter(): Promise<boolean> {
        this.assertConnected();
        try {
            const endPacket = TeleprompterProtocol.buildTeleprompterEndPacket(this.teleprompterSeq);
            const results = await this.executeForDevices(async (device) => {
                return await TeleprompterProtocol.sendTeleprompterEndPacket(device, endPacket);
            });
            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error exiting official teleprompter:', error);
            return false;
        }
    }

    async exit(): Promise<boolean> {
        this.assertConnected();
        const results = await this.executeForDevices(async (device) => {
            return await GlassesProtocol.sendExitCommand(device);
        });
        return results.every(Boolean);
    }

    async refreshBatteryInfo(): Promise<void> {
        await this.status.refreshBatteryInfo(this.connection.getDevices());
    }

    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus } {
        return this.status.getDeviceStatus(this.connection.getConnectionState());
    }

    // Private Helper Methods
    private assertConnected(): void {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }
    }

    private startHeartbeatIfNeeded(): void {
        this.heartbeat.start(
            () => this.connection.getDevices(),
            () => this.transferInProgress
        );
    }

    // Runs an operation on each connected side, tolerating per-device failures.
    private async executeForDevices<T>(
        operation: (device: Device) => Promise<T>,
        parallel: boolean = false
    ): Promise<T[]> {
        const { left, right } = this.connection.getDevices();
        const devices = [left, right].filter((d): d is Device => d !== null);

        const run = async (device: Device): Promise<T | undefined> => {
            try {
                return await operation(device);
            } catch (error) {
                console.error('[GlassesController] Operation failed for device:', error);
                return undefined;
            }
        };

        let results: (T | undefined)[];
        if (parallel) {
            results = await Promise.all(devices.map(run));
        } else {
            results = [];
            for (const device of devices) {
                results.push(await run(device));
            }
        }

        return results.filter((r): r is T => r !== undefined);
    }
}

export default new GlassesController();
