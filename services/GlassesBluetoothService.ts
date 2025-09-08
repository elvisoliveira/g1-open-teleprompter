import { BaseBluetoothService } from './BaseBluetoothService';
import { GlassesCommunication } from './modules/GlassesCommunication';
import { GlassesConnection } from './modules/GlassesConnection';
import { GlassesDeviceExecutor } from './modules/GlassesDeviceExecutor';
import { GlassesHeartbeat } from './modules/GlassesHeartbeat';
import { GlassesStatus } from './modules/GlassesStatus';
import { DeviceCommunication } from './transport/DeviceCommunication';
import { GlassesProtocol } from './transport/GlassesProtocol';
import { TeleprompterProtocol } from './transport/TeleprompterProtocol';
import { DeviceStatus, GlassSide } from './Types';

class GlassesBluetoothService extends BaseBluetoothService {
    private connection = new GlassesConnection();
    private status = new GlassesStatus();
    private heartbeat = new GlassesHeartbeat();
    private communication = new GlassesCommunication();
    private executor = new GlassesDeviceExecutor();

    constructor() {
        super();
    }

    protected getServiceName(): string {
        return 'GlassesBluetoothService';
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

        const packets = this.communication.prepareTextPackets(text);
        const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
            return await DeviceCommunication.sendPacketsToDevice(device, packets, 5);
        });

        return results.every(Boolean);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const { bmpData, packets } = this.communication.prepareImageData(base64ImageData);
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await GlassesProtocol.sendBmpToDevice(device, bmpData);
            }, true);

            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesBluetoothService] Error sending BMP image:', error);
            return false;
        }
    }

    async sendOfficialTeleprompter(text: string, slidePercentage?: number): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const packets = this.communication.prepareOfficialTeleprompterPackets(text, slidePercentage);
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await TeleprompterProtocol.sendTeleprompterPackets(device, packets);
            });

            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesBluetoothService] Error sending official teleprompter:', error);
            return false;
        }
    }

    async exitOfficialTeleprompter(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const endPacket = this.communication.prepareOfficialTeleprompterEndPacket();
            const results = await this.executeForDevices(GlassSide.BOTH, async (device) => {
                return await TeleprompterProtocol.sendTeleprompterEndPacket(device, endPacket);
            });
            return results.every(Boolean);
        } catch (error) {
            console.error('[GlassesBluetoothService] Error exiting official teleprompter:', error);
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
            (state: { left: boolean; right: boolean }) => this.connection.updateConnectionState(state)
        );
    }

    private async executeForDevices<T>(
        side: GlassSide,
        operation: (device: any, deviceSide: GlassSide.LEFT | GlassSide.RIGHT) => Promise<T>,
        parallel: boolean = false
    ): Promise<T[]> {
        return await this.executor.executeForDevices(
            this.connection.getDevices(),
            side,
            operation,
            parallel
        );
    }
}

export default new GlassesBluetoothService();
