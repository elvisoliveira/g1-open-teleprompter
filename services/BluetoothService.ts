import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import {
    HEARTBEAT_INTERVAL_MS
} from './constants';
import { PermissionManager } from './PermissionManager';
import { BatteryInfo, DeviceInfo, DeviceSide, DeviceStatus, FirmwareInfo } from './types';
import { Utils } from './utils';

class BluetoothService {
    private manager: BleManager;
    private devices: DeviceInfo = { left: null, right: null };
    private batteryInfo: BatteryInfo = { left: -1, right: -1, lastUpdated: null };
    private deviceUptime: number = -1;
    private firmwareInfo: FirmwareInfo = { left: null, right: null };
    private batteryMonitoringInterval: NodeJS.Timeout | null = null;
    private batteryListeners: Array<(battery: BatteryInfo) => void> = [];
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatSeq: number = 0;
    private connectionState: { left: boolean; right: boolean } = { left: false, right: false };
    private connectionStateCallback: ((state: { left: boolean; right: boolean }) => void) | null = null;

    constructor() {
        this.manager = new BleManager();
    }

    // Inlined DeviceManager functionality
    private updateBatteryInfoInternal(side: DeviceSide, batteryLevel: number): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.batteryInfo.left = batteryLevel;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.batteryInfo.right = batteryLevel;
        }
    }

    private updateFirmwareInfoInternal(side: DeviceSide, firmwareText: string): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.firmwareInfo.left = firmwareText;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.firmwareInfo.right = firmwareText;
        }
    }

    getDevice(side: DeviceSide.LEFT | DeviceSide.RIGHT): Device | null {
        return side === DeviceSide.LEFT ? this.devices.left : this.devices.right;
    }

    setDevice(side: DeviceSide.LEFT | DeviceSide.RIGHT, device: Device | null): void {
        if (side === DeviceSide.LEFT) {
            this.devices.left = device;
        } else {
            this.devices.right = device;
        }
    }

    getDevicesForSide(side: DeviceSide): Array<{ device: Device | null; side: DeviceSide.LEFT | DeviceSide.RIGHT }> {
        const devices: Array<{ device: Device | null; side: DeviceSide.LEFT | DeviceSide.RIGHT }> = [];
        if (side === DeviceSide.BOTH || side === DeviceSide.LEFT) {
            devices.push({ device: this.devices.left, side: DeviceSide.LEFT });
        }
        if (side === DeviceSide.BOTH || side === DeviceSide.RIGHT) {
            devices.push({ device: this.devices.right, side: DeviceSide.RIGHT });
        }
        return devices;
    }

    getDeviceInfo(): DeviceInfo {
        return this.devices;
    }

    private async connectToDevice(address: string): Promise<Device> {
        if (!await PermissionManager.requestBluetoothConnectPermission()) {
            throw new Error('Bluetooth permission not granted');
        }

        const device = await this.manager.connectToDevice(address, {
            autoConnect: false,
            timeout: 10000
        });

        await device.discoverAllServicesAndCharacteristics();

        try {
            const mtuResult = await device.requestMTU(247);
            const mtu = typeof mtuResult === 'object' ? mtuResult.mtu || 23 : (mtuResult || 23);
            console.log(`[BluetoothService] MTU negotiated: ${mtu} bytes for device ${address}`);
        } catch (error) {
            console.warn(`[BluetoothService] MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    async disconnectAll(): Promise<void> {
        const disconnectPromises: Promise<Device>[] = [];

        if (this.devices.left) {
            disconnectPromises.push(this.devices.left.cancelConnection());
            this.devices.left = null;
        }
        if (this.devices.right) {
            disconnectPromises.push(this.devices.right.cancelConnection());
            this.devices.right = null;
        }

        if (disconnectPromises.length > 0) {
            await Promise.all(disconnectPromises);
        }
    }

    async readBatteryInfo(device: Device, side: DeviceSide = DeviceSide.BOTH): Promise<number> {
        const batteryLevel = await CommunicationManager.requestBatteryLevel(device);
        if (batteryLevel !== null) {
            this.updateBatteryInfoInternal(side, batteryLevel);
            this.batteryInfo.lastUpdated = new Date();
            this.batteryListeners.forEach(listener => {
                try { listener(this.batteryInfo); } catch { /* ignore */ }
            });
            return batteryLevel;
        }
        return -1;
    }

    async readFirmwareInfo(device: Device, side: DeviceSide = DeviceSide.LEFT): Promise<string | null> {
        const firmwareText = await CommunicationManager.requestFirmwareInfo(device);
        if (firmwareText) {
            this.updateFirmwareInfoInternal(side, firmwareText);
            return firmwareText;
        }
        return null;
    }

    async readDeviceUptime(device: Device): Promise<number> {
        const uptimeSeconds = await CommunicationManager.requestUptime(device);
        if (uptimeSeconds !== null) {
            this.deviceUptime = uptimeSeconds;
            return uptimeSeconds;
        }
        this.deviceUptime = -1;
        return -1;
    }

    async sendFirmwareRequest(devices: { left: Device | null; right: Device | null }): Promise<boolean> {
        let success = true;
        if (devices.left) {
            success = await CommunicationManager.sendFirmwareRequest(devices.left) && success;
        }
        if (devices.right) {
            success = await CommunicationManager.sendFirmwareRequest(devices.right) && success;
        }
        return success;
    }

    async initializeDevices(): Promise<boolean> {
        const success = await this.sendFirmwareRequest(this.devices);
        if (!success) {
            return false;
        }
        try {
            await this.updateFirmwareInfo(this.devices);
        } catch {
            // Ignore firmware info errors
        }
        return true;
    }

    async updateFirmwareInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        const updates = [] as Promise<any>[];
        if (devices.left) {
            updates.push(this.readFirmwareInfo(devices.left, DeviceSide.LEFT));
        }
        if (devices.right) {
            updates.push(this.readFirmwareInfo(devices.right, DeviceSide.RIGHT));
        }
        await Promise.all(updates);
    }

    async updateBatteryInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        if (devices.left || devices.right) {
            await this.readBatteryInfo(devices.left || devices.right!, DeviceSide.BOTH);
        }
    }

    startBatteryMonitoring(intervalMinutes: number = 5): void {
        this.stopBatteryMonitoring();
        this.batteryMonitoringInterval = setInterval(() => {
            this.updateBatteryInfo(this.devices);
        }, intervalMinutes * 60 * 1000);
    }

    stopBatteryMonitoring(): void {
        if (this.batteryMonitoringInterval) {
            clearInterval(this.batteryMonitoringInterval);
            this.batteryMonitoringInterval = null;
        }
    }

    onBatteryUpdate(callback: (battery: BatteryInfo) => void): () => void {
        this.batteryListeners.push(callback);
        return () => {
            const index = this.batteryListeners.indexOf(callback);
            if (index > -1) {
                this.batteryListeners.splice(index, 1);
            }
        };
    }

    getCurrentBatteryInfo(): BatteryInfo {
        return { ...this.batteryInfo };
    }

    getCurrentFirmwareInfo(): FirmwareInfo {
        return { ...this.firmwareInfo };
    }

    getCurrentUptimeStatus(): number {
        return this.deviceUptime;
    }

    resetStatus(): void {
        this.batteryInfo = { left: -1, right: -1, lastUpdated: null };
        this.deviceUptime = -1;
        this.firmwareInfo = { left: null, right: null };
        this.stopBatteryMonitoring();
        this.batteryListeners = [];
    }

    // Simple heartbeat management
    private async performHeartbeat(): Promise<void> {
        const devices = this.getDeviceInfo();
        const seq = this.heartbeatSeq++ & 0xFF;

        // Always send to left first, then right (G1 protocol requirement)
        let leftSuccess = false;
        let rightSuccess = false;

        if (devices.left) {
            console.log('[BluetoothService] Performing heartbeat for left device:', devices.left);
            try {
                leftSuccess = await CommunicationManager.sendHeartbeat(devices.left, seq);
                console.log('[BluetoothService] Left heartbeat success:', leftSuccess);
            } catch (error) {
                leftSuccess = false;
                console.error('[BluetoothService] Error in left heartbeat:', error);
            }
        }

        if (devices.right && leftSuccess) {
            console.log('[BluetoothService] Performing heartbeat for right device:', devices.right);
            try {
                rightSuccess = await CommunicationManager.sendHeartbeat(devices.right, seq);
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

            const device = await this.connectToDevice(address);
            this.setDevice(side, device);

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
            const initResult = await this.initializeDevices();
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
        this.stopBatteryMonitoring();
        await this.disconnectAll();
        this.resetStatus();
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
        return await this.readBatteryInfo(targetDevice, side);
    }

    async getFirmwareInfo(side: DeviceSide = DeviceSide.LEFT): Promise<string | null> {
        const targetDevice = this.getTargetDevice(side);
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for firmware query');
            return null;
        }
        return await this.readFirmwareInfo(targetDevice, side);
    }

    async getDeviceUptime(): Promise<number> {
        const targetDevice = this.getDevice(DeviceSide.LEFT) || this.getDevice(DeviceSide.RIGHT);
        if (!targetDevice) {
            console.warn('[BluetoothService] No device available for uptime query');
            return -1;
        }
        return await this.readDeviceUptime(targetDevice);
    }

    private getTargetDevice(side: DeviceSide) {
        return side === DeviceSide.LEFT ? this.getDevice(DeviceSide.LEFT) :
            side === DeviceSide.RIGHT ? this.getDevice(DeviceSide.RIGHT) :
                this.getDevice(DeviceSide.LEFT) || this.getDevice(DeviceSide.RIGHT);
    }

    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus; } {
        const batteryInfo = this.getCurrentBatteryInfo();
        const firmwareInfo = this.getCurrentFirmwareInfo();
        const uptime = this.getCurrentUptimeStatus();

        return {
            left: {
                connected: this.isLeftConnected(),
                battery: batteryInfo.left,
                uptime: uptime,
                firmware: firmwareInfo.left
            },
            right: {
                connected: this.isRightConnected(),
                battery: batteryInfo.right,
                uptime: uptime,
                firmware: firmwareInfo.right
            }
        };
    }

    // Communication Methods
    async sendText(text: string): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const packets = CommunicationManager.createTextPackets(
            Utils.formatTextForDisplay(text)
        );

        const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
            return await CommunicationManager.sendPacketsToDevice(device, packets, 5);
        });

        return results.every(Boolean);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
            const packets = CommunicationManager.createBmpPackets(bmpData);

            const results = await this.executeForDevices(DeviceSide.BOTH, async (device, deviceSide) => {
                return await CommunicationManager.sendBmpToDevice(device, bmpData, packets);
            }, true);

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

    // Official Teleprompter Methods
    private teleprompterSeq: number = 0;

    /**
     * Send text using the official teleprompter protocol (0x09)
     * @param text The text to send
     * @param options Configuration options for the teleprompter
     * @returns Promise<boolean> indicating success
     */
    async sendOfficialTeleprompter(
        text: string, 
        options: {
            showNext?: boolean;
            startDelaySeconds?: number;
            manual?: boolean;
        } = {}
    ): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const {
            showNext = false,
            startDelaySeconds = 0, // No delay for stopwatch start
            manual = false
        } = options;

        try {
            // Split text into visible and next parts if needed
            const textParts = this.splitTextForTeleprompter(text, showNext);

            console.log('[BluetoothService] Text parts:', textParts);
            console.log('[BluetoothService] Teleprompter sequence:', this.teleprompterSeq);
            console.log('[BluetoothService] Show next:', showNext);
            console.log('[BluetoothService] Start delay:', startDelaySeconds);
            console.log('[BluetoothService] Manual:', manual);

            // Build teleprompter packets using CommunicationManager
            const packets = CommunicationManager.buildTeleprompterPackets(
                textParts.visible,
                textParts.next,
                startDelaySeconds,
                manual,
                this.teleprompterSeq
            );

            // Send to all connected devices
            const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
                return await CommunicationManager.sendTeleprompterPackets(device, packets);
            });

            // Increment sequence for next use
            this.teleprompterSeq = (this.teleprompterSeq + packets.length) & 0xFF;

            return results.every(Boolean);
        } catch (error) {
            console.error('[BluetoothService] Error sending official teleprompter:', error);
            return false;
        }
    }

    /**
     * Exit the official teleprompter mode
     * @returns Promise<boolean> indicating success
     */
    async exitOfficialTeleprompter(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        try {
            const endPacket = CommunicationManager.buildTeleprompterEndPacket(this.teleprompterSeq);
            
            const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
                return await CommunicationManager.sendTeleprompterEndPacket(device, endPacket);
            });

            return results.every(Boolean);
        } catch (error) {
            console.error('[BluetoothService] Error exiting official teleprompter:', error);
            return false;
        }
    }

    /**
     * Split text into visible and next parts for teleprompter
     */
    private splitTextForTeleprompter(text: string, showNext: boolean): { visible: string; next: string } {
        if (!showNext) {
            return { visible: text, next: '' };
        }

        // Simple split: first 2/3 visible, last 1/3 as next
        const splitIndex = Math.floor(text.length * 0.50);
        return {
            visible: text.substring(0, splitIndex),
            next: text.substring(splitIndex)
        };
    }

    async exit(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
            return await CommunicationManager.sendExitCommand(device);
        });
        return results.every(Boolean);
    }

    // Heartbeat Methods
    isHeartbeatRunning(): boolean {
        return this.heartbeatInterval !== null;
    }

    // Battery Monitoring Methods
    async refreshBatteryInfo(): Promise<void> {
        await this.updateBatteryInfo(this.getDeviceInfo());
    }

    // Device Initialization
    async triggerDeviceInitialization(): Promise<boolean> {
        return await this.initializeDevices();
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
        operation: (device: any, deviceSide: DeviceSide.LEFT | DeviceSide.RIGHT) => Promise<T>,
        parallel: boolean = false
    ): Promise<T[]> {
        const entries = this.getDevicesForSide(side).filter(({ device }) => !!device);

        const run = async (entry: { device: any; side: DeviceSide.LEFT | DeviceSide.RIGHT }) => {
            try {
                return await operation(entry.device, entry.side);
            } catch (error) {
                console.error(`[BluetoothService] Operation failed for ${entry.side} device:`, error);
                return undefined;
            }
        };

        if (parallel) {
            const results = await Promise.all(entries.map(run));
            // Just filter out undefined, but don't use a type predicate that causes a lint error
            return results.filter((v) => v !== undefined) as T[];
        }

        // sequential (default)
        const out: T[] = [];
        for (const entry of entries) {
            const res = await run(entry);
            if (res !== undefined) out.push(res);
        }
        return out;
    }

}

export default new BluetoothService();
