import { BaseDeviceController } from './BaseDeviceController';
import {
    CHARACTERISTIC_SERVICE
} from './constants/GlassesConstants';
import { DeviceStatus, GlassSide } from './DeviceTypes';
import { GlassesConnection } from './modules/GlassesConnection';
import { GlassesDispatcher } from './modules/GlassesDispatcher';
import { GlassesHeartbeat } from './modules/GlassesHeartbeat';
import { GlassesPacketBuilder } from './modules/GlassesPacketBuilder';
import { GlassesStatus } from './modules/GlassesStatus';
import { BluetoothTransport } from './transport/BluetoothTransport';
import { GlassesProtocol } from './transport/GlassesProtocol';
import { TeleprompterProtocol } from './transport/TeleprompterProtocol';

class GlassesController extends BaseDeviceController {
    private connection = new GlassesConnection();
    private status = new GlassesStatus();
    private heartbeat = new GlassesHeartbeat();
    private packetBuilder = new GlassesPacketBuilder();
    private dispatcher = new GlassesDispatcher();

    constructor() {
        super();
    }

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

    async connect(address: string): Promise<void> {
        await this.connectLeft(address);
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
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const packets = this.packetBuilder.prepareTextPackets(text);
        const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
            return await BluetoothTransport.sendPacketsToDevice(CHARACTERISTIC_SERVICE, device, packets, 5);
        });

        return results.every(Boolean);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const { bmpData, packets } = this.packetBuilder.prepareImageData(base64ImageData);
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await GlassesProtocol.sendBmpToDevice(device, bmpData);
            }, true);

            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error sending BMP image:', error);
            return false;
        }
    }

    async sendOfficialTeleprompter(text: string, slidePercentage?: number): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const packets = this.packetBuilder.prepareOfficialTeleprompterPackets(text, slidePercentage);
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await TeleprompterProtocol.sendTeleprompterPackets(device, packets);
            });

            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error sending official teleprompter:', error);
            return false;
        }
    }

    async exitOfficialTeleprompter(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const endPacket = this.packetBuilder.prepareOfficialTeleprompterEndPacket();
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await TeleprompterProtocol.sendTeleprompterEndPacket(device, endPacket);
            });
            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesController] Error exiting official teleprompter:', error);
            return false;
        }
    }

    async exit(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
            return await GlassesProtocol.sendExitCommand(device);
        });
        return results.every(Boolean);
    }

    async refreshUptime(): Promise<void> {
        await this.status.refreshUptime(this.connection.getDevices());
    }

    async refreshBatteryInfo(): Promise<void> {
        await this.status.refreshBatteryInfo(this.connection.getDevices());
    }

    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus } {
        return this.status.getDeviceStatus(this.connection.getConnectionState());
    }

    // Private Helper Methods
    private startHeartbeatIfNeeded(): void {
        this.heartbeat.start(
            () => this.connection.getDevices(),
            () => this.connection.getConnectionState(),
            (state: { left: boolean; right: boolean }) => {
                // @TODO: Check if hearthbeat will keep looping, if so, find a way to call disconnect (side based)
                this.connection.updateConnectionState(state);
            }
        );
    }

    private async executeForDevices<T>(
        side: GlassSide,
        operation: (device: any, deviceSide: GlassSide.LEFT | GlassSide.RIGHT) => Promise<T>,
        parallel: boolean = false
    ): Promise<T[]> {
        return await this.dispatcher.executeForDevices(
            this.connection.getDevices(),
            side,
            operation,
            parallel
        );
    }
}

export default new GlassesController();