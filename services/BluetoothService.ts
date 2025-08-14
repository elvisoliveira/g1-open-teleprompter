import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import {
    EXIT_CMD
} from './constants';
import { DeviceManager } from './DeviceManager';
import { DeviceStatusManager } from './DeviceStatusManager';
import { HeartbeatManager } from './HeartbeatManager';
import { PermissionManager } from './PermissionManager';
import { BatteryInfo, DeviceSide, DeviceStatus } from './types';
import { Utils } from './utils';

class BluetoothService {
    private manager: BleManager;
    private deviceManager: DeviceManager;
    private heartbeatManager: HeartbeatManager;
    private statusManager: DeviceStatusManager;

    constructor() {
        this.manager = new BleManager();
        this.deviceManager = new DeviceManager(this.manager);
        this.heartbeatManager = new HeartbeatManager();
        this.statusManager = new DeviceStatusManager();
    }

    // Device Connection Methods
    private async connectDevice(address: string, side: 'L' | 'R'): Promise<void> {
        try {
            console.log(`[BluetoothService] Connecting to ${side === 'L' ? 'left' : 'right'} device:`, address);
            
            const device = await this.deviceManager.connectDevice(address);
            this.deviceManager.setDevice(side, device);
            
            console.log(`[BluetoothService] ${side === 'L' ? 'Left' : 'Right'} device connected successfully`);
            
            // Initialize devices after connection
            const initResult = await this.statusManager.initializeDevices(this.deviceManager.getDeviceInfo());
            if (!initResult) {
                console.warn('[BluetoothService] Device initialization failed, but connection established');
            }
            
            // Start heartbeat if this is the first device connected
            if (!this.deviceManager.isConnected() || (side === 'L' && !this.deviceManager.isRightConnected()) || (side === 'R' && !this.deviceManager.isLeftConnected())) {
                this.heartbeatManager.start(this.deviceManager.getDeviceInfo());
            }
        } catch (error: any) {
            throw new Error(`Failed to connect ${side === 'L' ? 'left' : 'right'} device: ${error?.message || 'Unknown error'}`);
        }
    }

    async connectLeft(address: string): Promise<void> {
        await this.connectDevice(address, 'L');
    }

    async connectRight(address: string): Promise<void> {
        await this.connectDevice(address, 'R');
    }

    async connect(address: string): Promise<void> {
        // For backward compatibility, connect as left device
        await this.connectLeft(address);
    }

    async disconnect(): Promise<void> {
        this.heartbeatManager.stop();
        this.statusManager.stopBatteryMonitoring();
        await this.deviceManager.disconnectAll();
        this.statusManager.reset();
    }

    // Device Status Methods
    isConnected(): boolean {
        return this.deviceManager.isConnected();
    }

    isLeftConnected(): boolean {
        return this.deviceManager.isLeftConnected();
    }

    isRightConnected(): boolean {
        return this.deviceManager.isRightConnected();
    }

    // Battery and Status Methods
    async getBatteryInfo(side: DeviceSide = DeviceSide.BOTH): Promise<number> {
        const targetDevice = this.getTargetDevice(side);
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for battery query');
            return -1;
        }
        return await this.statusManager.getBatteryInfo(targetDevice, side);
    }

    async getFirmwareInfo(side: DeviceSide = DeviceSide.LEFT): Promise<string | null> {
        const targetDevice = this.getTargetDevice(side);
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for firmware query');
            return null;
        }
        return await this.statusManager.getFirmwareInfo(targetDevice, side);
    }

    async getDeviceUptime(): Promise<number> {
        const targetDevice = this.deviceManager.getDevice('L') || this.deviceManager.getDevice('R');
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for uptime query');
            return -1;
        }
        return await this.statusManager.getDeviceUptime(targetDevice);
    }

    private getTargetDevice(side: DeviceSide) {
        return side === DeviceSide.LEFT ? this.deviceManager.getDevice('L') :
               side === DeviceSide.RIGHT ? this.deviceManager.getDevice('R') :
               this.deviceManager.getDevice('L') || this.deviceManager.getDevice('R');
    }

    getCurrentBatteryInfo(): BatteryInfo {
        return this.statusManager.getCurrentBatteryInfo();
    }

    getCurrentFirmwareInfo(): { left: string | null; right: string | null } {
        return this.statusManager.getCurrentFirmwareInfo();
    }

    getCurrentUptimeStatus(): number {
        return this.statusManager.getCurrentUptimeStatus();
    }

    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus; } {
        const batteryInfo = this.statusManager.getCurrentBatteryInfo();
        const firmwareInfo = this.statusManager.getCurrentFirmwareInfo();
        const uptime = this.statusManager.getCurrentUptimeStatus();

        return {
            left: {
                connected: this.deviceManager.isLeftConnected(),
                battery: batteryInfo.left,
                uptime: uptime,
                firmware: firmwareInfo.left
            },
            right: {
                connected: this.deviceManager.isRightConnected(),
                battery: batteryInfo.right,
                uptime: uptime,
                firmware: firmwareInfo.right
            }
        };
    }

    // Communication Methods
    async sendText(text: string): Promise<boolean> {
        if (!this.deviceManager.isConnected()) {
            throw new Error('No devices connected');
        }

        const displayText = Utils.formatTextForDisplay(text);
        return await this.sendTextToGlasses(displayText);
    }

    async sendTextToGlasses(text: string): Promise<boolean> {
        const packets = CommunicationManager.createTextPackets(text);
        return await this.sendPacketsToBothDevices(packets);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        if (!this.deviceManager.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
            const packets = CommunicationManager.createBmpPackets(bmpData);

            const results = await this.executeForDevices(DeviceSide.BOTH, async (device, deviceSide) => {
                return await CommunicationManager.sendBmpToDevice(device, bmpData, packets);
            });
            
            if (results.some(result => !result)) {
                console.error('[BluetoothService] One or more BMP transfers failed');
                return false;
            }

            return true;
            
        } catch (error) {
            console.error('[BluetoothService] Error sending BMP image:', error);
            return false;
        }
    }

    async exitToDashboard(): Promise<boolean> {
        if (!this.deviceManager.isConnected()) {
            throw new Error('No devices connected');
        }

        const command = new Uint8Array([EXIT_CMD]);
        return await this.sendToBothDevices(command, false);
    }

    // Heartbeat Methods
    onHeartbeatStatus(callback: (status: { left: boolean; right: boolean; timestamp: Date }) => void): () => void {
        return this.heartbeatManager.onHeartbeatStatus(callback);
    }

    async triggerHeartbeat(): Promise<void> {
        await this.heartbeatManager.trigger(this.deviceManager.getDeviceInfo());
    }

    isHeartbeatRunning(): boolean {
        return this.heartbeatManager.isRunning();
    }

    // Battery Monitoring Methods
    onBatteryUpdate(callback: (battery: BatteryInfo) => void): () => void {
        return this.statusManager.onBatteryUpdate(callback);
    }

    async refreshBatteryInfo(): Promise<void> {
        await this.statusManager.updateBatteryInfo(this.deviceManager.getDeviceInfo());
    }

    startBatteryMonitoring(intervalMinutes: number = 5): void {
        this.statusManager.startBatteryMonitoring(this.deviceManager.getDeviceInfo(), intervalMinutes);
    }

    stopBatteryMonitoring(): void {
        this.statusManager.stopBatteryMonitoring();
    }

    // Device Initialization
    async triggerDeviceInitialization(): Promise<boolean> {
        return await this.statusManager.initializeDevices(this.deviceManager.getDeviceInfo());
    }

    // Paired Devices
    async getPairedDevices(showAllDevices: boolean = false): Promise<Array<{ id: string; name: string | null; isConnected: boolean }>> {
        if (Platform.OS !== 'android') return [];

        try {
            if (!await PermissionManager.requestBluetoothPermissions()) {
                return [];
            }

            const { BluetoothAdapter } = NativeModules as any;
            if (!BluetoothAdapter) {
                console.error('[BluetoothService] BluetoothAdapter native module not available');
                return [];
            }
            
            if (!BluetoothAdapter.getPairedDevices) {
                console.error('[BluetoothService] BluetoothAdapter.getPairedDevices method not available');
                return [];
            }

            const pairedDevices = await BluetoothAdapter.getPairedDevices();
            console.log('[BluetoothService] Raw paired devices from native module:', pairedDevices);
            
            const bondedDevices = pairedDevices.map((device: { name: string; address: string; connected?: boolean }) => ({
                id: device.address,
                name: device.name || null,
                isConnected: Boolean(device.connected)
            }));

            if (showAllDevices) {
                return bondedDevices;
            } else {
                const filteredDevices = bondedDevices.filter((device: { id: string; name: string | null; isConnected: boolean }) => 
                    device.name && device.name.startsWith("Even G1")
                );
                console.log('[BluetoothService] Filtered Even G1 devices:', filteredDevices);
                return filteredDevices;
            }
        } catch (error) {
            console.warn('[BluetoothService] Failed to get paired devices:', error);
            return [];
        }
    }

    // Helper Methods
    private async executeForDevices<T>(
        side: DeviceSide, 
        operation: (device: any, deviceSide: "L" | "R") => Promise<T>
    ): Promise<T[]> {
        const devices = this.deviceManager.getDevicesForSide(side);
        const results: T[] = [];
        
        for (const { device, side: deviceSide } of devices) {
            if (device) {
                try {
                    const result = await operation(device, deviceSide);
                    results.push(result);
                } catch (error) {
                    console.error(`[BluetoothService] Operation failed for ${deviceSide} device:`, error);
                }
            }
        }
        
        return results;
    }

    private async sendToBothDevices(data: Uint8Array, requireResponse: boolean = false): Promise<boolean> {
        // Send to left first (G1 protocol requirement)
        const leftDevice = this.deviceManager.getDevice('L');
        if (leftDevice && !await CommunicationManager.writeToDevice(leftDevice, data, requireResponse)) {
            return false;
        }
        
        // Then send to right (only if left succeeded or no left device)
        const rightDevice = this.deviceManager.getDevice('R');
        if (rightDevice && !await CommunicationManager.writeToDevice(rightDevice, data, requireResponse)) {
            return false;
        }
        
        return true;
    }

    private async sendPacketsToBothDevices(packets: Uint8Array[]): Promise<boolean> {
        // Send to left first (G1 protocol requirement)
        const leftDevice = this.deviceManager.getDevice('L');
        if (leftDevice && !await CommunicationManager.sendPacketsToDevice(leftDevice, packets, 5)) {
            console.error('[BluetoothService] Failed to send to left device');
            return false;
        }

        // Then send to right (only if left succeeded or no left device)
        const rightDevice = this.deviceManager.getDevice('R');
        if (rightDevice && !await CommunicationManager.sendPacketsToDevice(rightDevice, packets, 5)) {
            console.error('[BluetoothService] Failed to send to right device');
            return false;
        }

        return true;
    }
}

export default new BluetoothService();
