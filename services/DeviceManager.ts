import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionManager } from './PermissionManager';
import { DeviceInfo, DeviceSide } from './types';

export class DeviceManager {
    private manager: BleManager;
    private devices: DeviceInfo = { left: null, right: null };

    constructor(bleManager: BleManager) {
        this.manager = bleManager;
    }

    /**
     * Get device for specified side
     */
    getDevice(side: DeviceSide.LEFT | DeviceSide.RIGHT): Device | null {
        return side === DeviceSide.LEFT ? this.devices.left : this.devices.right;
    }

    /**
     * Set device for specified side
     */
    setDevice(side: DeviceSide.LEFT | DeviceSide.RIGHT, device: Device | null): void {
        if (side === DeviceSide.LEFT) {
            this.devices.left = device;
        } else {
            this.devices.right = device;
        }
    }

    /**
     * Get devices for specified side
     */
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

    /**
     * Check if any device is connected
     */
    isConnected(): boolean {
        return this.devices.left !== null || this.devices.right !== null;
    }

    /**
     * Check if left device is connected
     */
    isLeftConnected(): boolean {
        return this.devices.left !== null;
    }

    /**
     * Check if right device is connected
     */
    isRightConnected(): boolean {
        return this.devices.right !== null;
    }

    /**
     * Get current device info (returns reference, not copy for performance)
     */
    getDeviceInfo(): DeviceInfo {
        return this.devices;
    }

    /**
     * Connect to a device
     */
    async connectDevice(address: string): Promise<Device> {
        // Request permissions on Android
        if (!await PermissionManager.requestBluetoothConnectPermission()) {
            throw new Error('Bluetooth permission not granted');
        }

        const device = await this.manager.connectToDevice(address, { 
            autoConnect: false, 
            timeout: 10000 
        });
        
        await device.discoverAllServicesAndCharacteristics();

        // Request higher MTU for larger packets
        try {
            const mtuResult = await device.requestMTU(247);
            const mtu = typeof mtuResult === 'object' ? mtuResult.mtu || 23 : (mtuResult || 23);
            console.log(`[DeviceManager] MTU negotiated: ${mtu} bytes for device ${address}`);
        } catch (error) {
            console.warn(`[DeviceManager] MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    /**
     * Disconnect all devices
     */
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
        
        // Wait for all disconnections to complete
        if (disconnectPromises.length > 0) {
            await Promise.all(disconnectPromises);
        }
    }

    /**
     * Reset device state
     */
    reset(): void {
        this.devices = { left: null, right: null };
    }
} 