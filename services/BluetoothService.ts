import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import {
    EXIT_CMD,
    HEARTBEAT_CMD,
    HEARTBEAT_INTERVAL_MS
} from './constants';
import { DeviceManager } from './DeviceManager';
import { DeviceStatusManager } from './DeviceStatusManager';
import { PermissionManager } from './PermissionManager';
import { BatteryInfo, DeviceSide, DeviceStatus } from './types';
import { Utils } from './utils';

class BluetoothService {
    private manager: BleManager;
    private deviceManager: DeviceManager;
    private statusManager: DeviceStatusManager;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatSeq: number = 0;
    private connectionState: { left: boolean; right: boolean } = { left: false, right: false };
    private connectionStateCallback: ((state: { left: boolean; right: boolean }) => void) | null = null;

    constructor() {
        this.manager = new BleManager();
        this.deviceManager = new DeviceManager(this.manager);
        this.statusManager = new DeviceStatusManager();
    }

    // Simple heartbeat management
    private constructHeartbeat(): Uint8Array {
        const seq = this.heartbeatSeq++ & 0xFF;
        return new Uint8Array([
            HEARTBEAT_CMD,  // 0x25
            6,               // Length
            0,               // Length MSB (always 0)
            seq,             // Sequence number
            0x04,            // Fixed value
            seq              // Sequence number (duplicate)
        ]);
    }

    private async performHeartbeat(): Promise<void> {
        const devices = this.deviceManager.getDeviceInfo();
        const heartbeatData = this.constructHeartbeat();

        // Always send to left first, then right (G1 protocol requirement)
        let leftSuccess = false;
        let rightSuccess = false;

        if (devices.left) {
            console.log('[BluetoothService] Performing heartbeat for left device:', devices.left);
            try {
                const leftResponse = await CommunicationManager.sendCommandWithResponse(
                    devices.left,
                    heartbeatData,
                    new Uint8Array([HEARTBEAT_CMD]),
                    1500
                );
                leftSuccess = !!leftResponse &&
                    leftResponse.length > 5 &&    
                    leftResponse[0] === HEARTBEAT_CMD &&
                    leftResponse[4] === 0x04;
                console.log('[BluetoothService] Left heartbeat success:', leftSuccess);
            } catch (error) {
                leftSuccess = false;
                console.error('[BluetoothService] Error in left heartbeat:', error);
            }
        }

        if (devices.right && leftSuccess) {
            console.log('[BluetoothService] Performing heartbeat for right device:', devices.right);
            try {
                const rightResponse = await CommunicationManager.sendCommandWithResponse(
                    devices.right,
                    heartbeatData,
                    new Uint8Array([HEARTBEAT_CMD]),
                    1500
                );
                rightSuccess = !!rightResponse &&
                    rightResponse.length > 5 &&    
                    rightResponse[0] === HEARTBEAT_CMD &&
                    rightResponse[4] === 0x04;
                console.log('[BluetoothService] Right heartbeat success:', rightSuccess);
            } catch (error) {
                rightSuccess = false;
                console.error('[BluetoothService] Error in right heartbeat:', error);
            }
        }

        const newState = {
            left: leftSuccess && devices.left !== null,
            right: rightSuccess && devices.right !== null
        };

        console.log('[BluetoothService] Heartbeat result:', newState);
        console.log('[BluetoothService] Current connection state:', this.connectionState);

        // Only update and notify if state changed
        if (this.connectionState.left !== newState.left || this.connectionState.right !== newState.right) {
            this.connectionState = newState;
            console.log('[BluetoothService] Connection state changed, calling callback...');
            this.connectionStateCallback?.(this.connectionState);
            console.log('[BluetoothService] Connection state updated:', this.connectionState);
        } else {
            console.log('[BluetoothService] Connection state unchanged, no callback needed');
        }
    }

    private startHeartbeat(): void {
        console.log('[BluetoothService] Starting heartbeat...');
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(async () => {
            console.log('[BluetoothService] Heartbeat interval triggered');
            await this.performHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);
        
        // Perform initial heartbeat
        console.log('[BluetoothService] Performing initial heartbeat...');
        this.performHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Device Connection Methods
    private async connectDevice(address: string, side: DeviceSide.LEFT | DeviceSide.RIGHT): Promise<void> {
        try {
            console.log(`[BluetoothService] Connecting to ${side === DeviceSide.LEFT ? 'left' : 'right'} device:`, address);
            
            const device = await this.deviceManager.connectDevice(address);
            this.deviceManager.setDevice(side, device);
            
            console.log(`[BluetoothService] ${side === DeviceSide.LEFT ? 'Left' : 'Right'} device connected successfully`);
            
            // Update connection state immediately for UI responsiveness
            if (side === DeviceSide.LEFT) {
                this.connectionState.left = true;
            } else {
                this.connectionState.right = true;
            }
            
            // Notify UI of connection state change
            this.connectionStateCallback?.(this.connectionState);
            
            // Initialize devices after connection
            const initResult = await this.statusManager.initializeDevices(this.deviceManager.getDeviceInfo());
            if (!initResult) {
                console.warn('[BluetoothService] Device initialization failed, but connection established');
            }
            
            // Start heartbeat if this is the first device connected
            if (!this.isConnected() || (side === DeviceSide.LEFT && !this.isRightConnected()) || (side === DeviceSide.RIGHT && !this.isLeftConnected())) {
                this.startHeartbeat();
            }
        } catch (error: any) {
            throw new Error(`Failed to connect ${side === DeviceSide.LEFT ? 'left' : 'right'} device: ${error?.message || 'Unknown error'}`);
        }
    }

    async connectLeft(address: string): Promise<void> {
        await this.connectDevice(address, DeviceSide.LEFT);
    }

    async connectRight(address: string): Promise<void> {
        await this.connectDevice(address, DeviceSide.RIGHT);
    }

    async connect(address: string): Promise<void> {
        // For backward compatibility, connect as left device
        await this.connectLeft(address);
    }

    async disconnect(): Promise<void> {
        this.stopHeartbeat();
        this.statusManager.stopBatteryMonitoring();
        await this.deviceManager.disconnectAll();
        this.statusManager.reset();
        this.connectionState = { left: false, right: false };
        this.connectionStateCallback?.(this.connectionState);
    }

    // Device Status Methods
    isConnected(): boolean {
        return this.connectionState.left || this.connectionState.right;
    }

    isLeftConnected(): boolean {
        return this.connectionState.left;
    }

    isRightConnected(): boolean {
        return this.connectionState.right;
    }

    // Get current connection state from heartbeat
    getConnectionState(): { left: boolean; right: boolean } {
        return { ...this.connectionState };
    }

        // Subscribe to connection state changes
    onConnectionStateChange(callback: (state: { left: boolean; right: boolean }) => void): () => void {
        console.log('[BluetoothService] onConnectionStateChange called with callback');
        // Call immediately with current state
        callback(this.connectionState);
        
        // Set the callback
        this.connectionStateCallback = callback;
        console.log('[BluetoothService] Callback set, current state:', this.connectionState);
        
        // Return unsubscribe function
        return () => {
            console.log('[BluetoothService] Unsubscribing from connection state changes');
            this.connectionStateCallback = null;
        };
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
        const targetDevice = this.deviceManager.getDevice(DeviceSide.LEFT) || this.deviceManager.getDevice(DeviceSide.RIGHT);
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for uptime query');
            return -1;
        }
        return await this.statusManager.getDeviceUptime(targetDevice);
    }

    private getTargetDevice(side: DeviceSide) {
        return side === DeviceSide.LEFT ? this.deviceManager.getDevice(DeviceSide.LEFT) :
               side === DeviceSide.RIGHT ? this.deviceManager.getDevice(DeviceSide.RIGHT) :
               this.deviceManager.getDevice(DeviceSide.LEFT) || this.deviceManager.getDevice(DeviceSide.RIGHT);
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

        const packets = CommunicationManager.createTextPackets(
            Utils.formatTextForDisplay(text)
        );

        const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
            for (const packet of packets) {
                if (!await CommunicationManager.writeToDevice(device, packet, false)) {
                    return false;
                }
                await Utils.sleep(5);
            }
            return true;
        });

        return results.every(Boolean);
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
        const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
            return await CommunicationManager.writeToDevice(device, command, false);
        });
        return results.every(Boolean);
    }

    // Heartbeat Methods
    isHeartbeatRunning(): boolean {
        return this.heartbeatInterval !== null;
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
        operation: (device: any, deviceSide: DeviceSide.LEFT | DeviceSide.RIGHT) => Promise<T>
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

}

export default new BluetoothService();
