import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import {
    HEARTBEAT_INTERVAL_MS
} from './constants';
import { PermissionManager } from './PermissionManager';
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
        await this.disconnectAll();
        this.resetStatus();
        this.connectionState = { left: false, right: false };
        this.connectionStateCallback?.(this.connectionState);
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
            startDelaySeconds = 0,
            manual = false
        } = options;

        try {
            const textParts = this.splitTextForTeleprompter(text, showNext);
            const packets = CommunicationManager.buildTeleprompterPackets(
                textParts.visible,
                textParts.next,
                startDelaySeconds,
                manual,
                this.teleprompterSeq
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

    private async getFirmwareInfo(): Promise<void> {
        if (this.isLeftConnected() && this.firmwareInfo.left === null) {
            const leftFirmwareInfo = await CommunicationManager.requestFirmwareInfo(this.devices.left!);
            if (leftFirmwareInfo !== null) {
                this.firmwareInfo.left = leftFirmwareInfo;
            }
        }
        if (this.isRightConnected() && this.firmwareInfo.right === null) {
            const rightFirmwareInfo = await CommunicationManager.requestFirmwareInfo(this.devices.right!);
            if (rightFirmwareInfo !== null) {
                this.firmwareInfo.right = rightFirmwareInfo;
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

            if (showAllDevices) {
                return bondedDevices;
            } else {
                return bondedDevices.filter((device: { id: string; name: string | null; isConnected: boolean }) =>
                    device.name && device.name.startsWith("Even G1")
                );
            }
        } catch (error) {
            console.warn('[BluetoothService] Failed to get paired devices:', error);
            return [];
        }
    }

    // Private Helper Methods
    private async connectDevice(address: string, side: DeviceSide.LEFT | DeviceSide.RIGHT): Promise<void> {
        try {
            const device = await this.connectToDevice(address);
            this.setDevice(side, device);

            if (side === DeviceSide.LEFT) {
                this.connectionState.left = true;
            } else {
                this.connectionState.right = true;
            }

            this.connectionStateCallback?.(this.connectionState);

            await this.getFirmwareInfo();

            if (!this.isConnected() || (side === DeviceSide.LEFT && !this.isRightConnected()) || (side === DeviceSide.RIGHT && !this.isLeftConnected())) {
                this.startHeartbeat();
            }
        } catch (error: any) {
            throw new Error(`Failed to connect ${side === DeviceSide.LEFT ? 'left' : 'right'} device: ${error?.message || 'Unknown error'}`);
        }
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
            await device.requestMTU(247);
        } catch (error) {
            console.warn(`[BluetoothService] MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    private setDevice(side: DeviceSide.LEFT | DeviceSide.RIGHT, device: Device | null): void {
        if (side === DeviceSide.LEFT) {
            this.devices.left = device;
        } else {
            this.devices.right = device;
        }
    }

    private async performHeartbeat(): Promise<void> {
        const seq = this.heartbeatSeq++ & 0xFF;

        let leftSuccess = false;
        let rightSuccess = false;

        if (this.isLeftConnected()) {
            try {
                leftSuccess = await CommunicationManager.sendHeartbeat(this.devices.left!, seq);
            } catch (error) {
                leftSuccess = false;
            }
        }

        if (this.isRightConnected() && leftSuccess) {
            try {
                rightSuccess = await CommunicationManager.sendHeartbeat(this.devices.right!, seq);
            } catch (error) {
                rightSuccess = false;
            }
        }

        const newState = {
            left: leftSuccess && this.isLeftConnected(),
            right: rightSuccess && this.isRightConnected()
        };

        if (this.connectionState.left !== newState.left || this.connectionState.right !== newState.right) {
            this.connectionState = newState;
            this.connectionStateCallback?.(this.connectionState);
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

    private splitTextForTeleprompter(text: string, showNext: boolean): { visible: string; next: string } {
        if (!showNext) {
            return { visible: text, next: '' };
        }
        const splitIndex = Math.floor(text.length * 0.50);
        return {
            visible: text.substring(0, splitIndex),
            next: text.substring(splitIndex)
        };
    }

    private resetStatus(): void {
        this.batteryInfo = { left: -1, right: -1 };
        this.deviceUptime = { left: -1, right: -1 };
        this.firmwareInfo = { left: null, right: null };
    }
}

export default new BluetoothService();
