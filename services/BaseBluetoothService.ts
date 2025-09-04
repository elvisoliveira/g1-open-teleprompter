import { NativeModules, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { CONNECTION_TIMEOUT_MS, MTU_SIZE } from './constants';
import { PermissionManager } from './PermissionManager';

export abstract class BaseBluetoothService {
    protected manager: BleManager;

    constructor() {
        this.manager = new BleManager();
    }

    // Shared Device Status Methods
    async isBluetoothEnabled(): Promise<boolean> {
        try {
            const state = await this.manager.state();
            return state === State.PoweredOn;
        } catch (error) {
            console.warn(`[${this.getServiceName()}] Failed to check Bluetooth state:`, error);
            return false;
        }
    }

    async getPairedDevices(): Promise<Array<{ id: string; name: string | null; isConnected: boolean }>> {
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
            return pairedDevices.map((device: { name: string; address: string; connected?: boolean }) => ({
                id: device.address,
                name: device.name || null,
                isConnected: Boolean(device.connected)
            }));
        } catch (error) {
            console.warn(`[${this.getServiceName()}] Failed to get paired devices:`, error);
            return [];
        }
    }

    // Shared Connection Helper
    protected async establishBleConnection(address: string): Promise<Device> {
        if (!await PermissionManager.requestBluetoothConnectPermission()) {
            throw new Error('Bluetooth permission not granted');
        }

        const device = await this.manager.connectToDevice(address, {
            autoConnect: false,
            timeout: CONNECTION_TIMEOUT_MS
        }); 
       await device.discoverAllServicesAndCharacteristics();

        try {
            await device.requestMTU(MTU_SIZE);
        } catch (error) {
            console.warn(`[${this.getServiceName()}] MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    // Abstract method that subclasses must implement to provide service name for logging
    protected abstract getServiceName(): string;
}