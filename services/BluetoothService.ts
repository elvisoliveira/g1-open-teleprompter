import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import { CONNECTION_TIMEOUT_MS, HEARTBEAT_INTERVAL_MS, MTU_SIZE } from './constants';
import { PermissionManager } from './PermissionManager';
import { TeleprompterUtils } from './TeleprompterUtils';
import { BatteryInfo, DeviceInfo, DeviceSide, DeviceStatus, FirmwareInfo, UptimeInfo } from './types';
import { Utils } from './utils';

class BluetoothService {
    private manager: BleManager;
    private devices: DeviceInfo = { left: null, right: null };
    private batteryInfo: BatteryInfo = { left: -1, right: -1 };
    private deviceUptime: UptimeInfo = { left: -1, right: -1 };
    private firmwareInfo: FirmwareInfo = { left: null, right: null };

    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatSeq: number = 0;
    private connectionState: { left: boolean; right: boolean } = { left: false, right: false };
    private connectionStateCallback: ((state: { left: boolean; right: boolean }) => void) | null = null;
    // Sequence number for teleprompter packets to ensure proper ordering
    private teleprompterSeq: number = 0;

    constructor() {
        this.manager = new BleManager();
    }

    // Public API Methods
    async connectLeft(address: string): Promise<void> {
        await this.connectDevice(address, DeviceSide.LEFT);
    }

    async connectRight(address: string): Promise<void> {
        await this.connectDevice(address, DeviceSide.RIGHT);
    }

    async connect(address: string): Promise<void> {
        await this.connectLeft(address);
    }

    async disconnect(): Promise<void> {
        this.stopHeartbeat();
        await this.disconnectAllDevices();
        this.resetDeviceStatus();
        this.connectionState = { left: false, right: false };
        this.connectionStateCallback?.(this.connectionState);
    }

    // Device Status Methods
    async isBluetoothEnabled(): Promise<boolean> {
        try {
            const state = await this.manager.state();
            return state === State.PoweredOn;
        } catch (error) {
            console.warn('[BluetoothService] Failed to check Bluetooth state:', error);
            return false;
        }
    }

    isConnected(): boolean {
        return this.connectionState.left || this.connectionState.right;
    }

    isLeftConnected(): boolean {
        return this.connectionState.left;
    }

    isRightConnected(): boolean {
        return this.connectionState.right;
    }

    onConnectionStateChange(callback: (state: { left: boolean; right: boolean }) => void): () => void {
        callback(this.connectionState);
        this.connectionStateCallback = callback;
        return () => {
            this.connectionStateCallback = null;
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

            const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
                return await CommunicationManager.sendBmpToDevice(device, bmpData, packets);
            }, true);

            return results.every(Boolean);
        } catch (error) {
            console.error('[BluetoothService] Error sending BMP image:', error);
            return false;
        }
    }

    /**
     * Send text using official teleprompter protocol
     * @param text - Text to display
     * @param scrollPosition - Scrollbar position (0-100%), useful for showing slide progress
     */
    async sendOfficialTeleprompter(
        text: string,
        slidePercentage?: number
    ): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        // Add line breaks based on character widths
        text = TeleprompterUtils.addLineBreaks(text, 180);

        try {
            const textParts = TeleprompterUtils.splitTextForTeleprompter(text);
            const packets = CommunicationManager.buildTeleprompterPackets(
                textParts.visible,
                textParts.next,
                this.teleprompterSeq,
                slidePercentage
            );

            const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
                return await CommunicationManager.sendTeleprompterPackets(device, packets);
            });

            this.teleprompterSeq = (this.teleprompterSeq + packets.length) & 0xFF;
            return results.every(Boolean);
        } catch (error) {
            console.error('[BluetoothService] Error sending official teleprompter:', error);
            return false;
        }
    }

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

    async exit(): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('No devices connected');
        }

        const results = await this.executeForDevices(DeviceSide.BOTH, async (device) => {
            return await CommunicationManager.sendExitCommand(device);
        });
        return results.every(Boolean);
    }

    async refreshUptime(): Promise<void> {
        if (this.isLeftConnected()) {
            const leftUptime = await CommunicationManager.requestUptime(this.devices.left!);
            if (leftUptime !== null) {
                this.deviceUptime.left = leftUptime;
            }
        }
        if (this.isRightConnected()) {
            const rightUptime = await CommunicationManager.requestUptime(this.devices.right!);
            if (rightUptime !== null) {
                this.deviceUptime.right = rightUptime;
            }
        }
    }

    async refreshBatteryInfo(): Promise<void> {
        if (this.isLeftConnected()) {
            const leftBatteryLevel = await CommunicationManager.requestBatteryLevel(this.devices.left!);
            if (leftBatteryLevel !== null) {
                this.batteryInfo.left = leftBatteryLevel;
            }
        }
        if (this.isRightConnected()) {
            const rightBatteryLevel = await CommunicationManager.requestBatteryLevel(this.devices.right!);
            if (rightBatteryLevel !== null) {
                this.batteryInfo.right = rightBatteryLevel;
            }
        }
    }

    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus; } {
        return {
            left: {
                connected: this.isLeftConnected(),
                battery: this.batteryInfo.left,
                uptime: this.deviceUptime.left,
                firmware: this.firmwareInfo.left
            },
            right: {
                connected: this.isRightConnected(),
                battery: this.batteryInfo.right,
                uptime: this.deviceUptime.right,
                firmware: this.firmwareInfo.right
            }
        };
    }

    async getPairedDevices(showAllDevices: boolean = false): Promise<Array<{ id: string; name: string | null; isConnected: boolean }>> {
        if (Platform.OS !== 'android') return [];

        try {
            if (!await PermissionManager.requestBluetoothPermissions()) {
                return [];
            }

            const { BluetoothAdapter } = NativeModules as any;
            if (!BluetoothAdapter?.getPairedDevices) {
                return [];
            }

            const pairedDevices = await BluetoothAdapter.getPairedDevices();
            const bondedDevices = pairedDevices.map((device: { name: string; address: string; connected?: boolean }) => ({
                id: device.address,
                name: device.name || null,
                isConnected: Boolean(device.connected)
            }));

            return showAllDevices
                ? bondedDevices
                : bondedDevices.filter((device: { name: string; }) => device.name?.startsWith("Even G1"));
        } catch (error) {
            console.warn('[BluetoothService] Failed to get paired devices:', error);
            return [];
        }
    }

    // Private Helper Methods
    // Connects a device to the specified side (left or right)
    private async connectDevice(address: string, side: DeviceSide.LEFT | DeviceSide.RIGHT): Promise<void> {
        try {
            // Establishes BLE connection, requests permissions, discovers services, and sets MTU
            const device = await this.establishBleConnection(address);

            // Store device reference and update connection state
            if (side === DeviceSide.LEFT) {
                this.devices.left = device;
                this.connectionState.left = true;
            } else {
                this.devices.right = device;
                this.connectionState.right = true;
            }

            this.connectionStateCallback?.(this.connectionState);

            await this.getFirmwareInfo(side);

            // Initialize device info and heartbeat only for the first connected device
            const isFirstConnection = (side === DeviceSide.LEFT && !this.isRightConnected()) ||
                (side === DeviceSide.RIGHT && !this.isLeftConnected());

            if (isFirstConnection) {
                this.startHeartbeat();
            }
        } catch (error: any) {
            throw new Error(`Failed to connect ${side === DeviceSide.LEFT ? 'left' : 'right'} device: ${error?.message || 'Unknown error'}`);
        }
    }

    // Establishes complete BLE connection: permissions, connection, service discovery, and MTU setup
    private async establishBleConnection(address: string): Promise<Device> {
        if (!await PermissionManager.requestBluetoothConnectPermission()) {
            throw new Error('Bluetooth permission not granted');
        }

        // Connect to device with timeout to prevent hanging connections
        const device = await this.manager.connectToDevice(address, {
            autoConnect: false,
            timeout: CONNECTION_TIMEOUT_MS
        });

        // Service discovery is required to access device characteristics for communication
        await device.discoverAllServicesAndCharacteristics();

        // Request larger MTU for better data throughput (optional, won't fail connection if unsupported)
        try {
            await device.requestMTU(MTU_SIZE);
        } catch (error) {
            console.warn(`[BluetoothService] MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    private async getFirmwareInfo(side: DeviceSide.LEFT | DeviceSide.RIGHT): Promise<void> {
        const device = side === DeviceSide.LEFT ? this.devices.left : this.devices.right;
        const currentFirmware = side === DeviceSide.LEFT ? this.firmwareInfo.left : this.firmwareInfo.right;

        if (device && currentFirmware === null) {
            const firmwareInfo = await CommunicationManager.requestFirmwareInfo(device);
            if (firmwareInfo !== null) {
                if (side === DeviceSide.LEFT) {
                    this.firmwareInfo.left = firmwareInfo;
                } else {
                    this.firmwareInfo.right = firmwareInfo;
                }
            }
        }
    }

    private async performHeartbeat(): Promise<void> {
        const seq = this.heartbeatSeq++ & 0xFF;

        // Send heartbeat to connected devices and track success
        const leftSuccess = await this.sendHeartbeatToDevice(this.devices.left, this.isLeftConnected(), seq);
        const rightSuccess = await this.sendHeartbeatToDevice(this.devices.right, this.isRightConnected() && leftSuccess, seq);

        // Update connection state if it changed
        const newState = {
            left: leftSuccess && this.isLeftConnected(),
            right: rightSuccess && this.isRightConnected()
        };

        if (this.connectionState.left !== newState.left || this.connectionState.right !== newState.right) {
            this.connectionState = newState;
            this.connectionStateCallback?.(this.connectionState);
        }
    }

    private async sendHeartbeatToDevice(device: Device | null, shouldSend: boolean, seq: number): Promise<boolean> {
        if (!shouldSend || !device) return false;

        try {
            return await CommunicationManager.sendHeartbeat(device, seq);
        } catch (error) {
            return false;
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(async () => {
            await this.performHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);
        this.performHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

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
            return results.filter((v) => v !== undefined) as T[];
        }

        const out: T[] = [];
        for (const entry of entries) {
            const res = await run(entry);
            if (res !== undefined) out.push(res);
        }
        return out;
    }

    private getDevicesForSide(side: DeviceSide): Array<{ device: Device | null; side: DeviceSide.LEFT | DeviceSide.RIGHT }> {
        const devices: Array<{ device: Device | null; side: DeviceSide.LEFT | DeviceSide.RIGHT }> = [];
        if (side === DeviceSide.BOTH || side === DeviceSide.LEFT) {
            devices.push({ device: this.devices.left, side: DeviceSide.LEFT });
        }
        if (side === DeviceSide.BOTH || side === DeviceSide.RIGHT) {
            devices.push({ device: this.devices.right, side: DeviceSide.RIGHT });
        }
        return devices;
    }



    private async disconnectAllDevices(): Promise<void> {
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

    // Resets all device status information to initial state
    private resetDeviceStatus(): void {
        this.batteryInfo = { left: -1, right: -1 };
        this.deviceUptime = { left: -1, right: -1 };
        this.firmwareInfo = { left: null, right: null };
    }
}

export default new BluetoothService();
