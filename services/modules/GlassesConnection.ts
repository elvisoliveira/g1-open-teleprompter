import { Device, Subscription } from 'react-native-ble-plx';
import { BaseDeviceController } from '../BaseDeviceController';
import { GLASSES_MIN_MTU } from '../constants/GlassesConstants';
import { GlassSide } from '../DeviceTypes';

export class GlassesConnection extends BaseDeviceController {
    private devices: { left: Device | null; right: Device | null } = { left: null, right: null };
    private connectionState: { left: boolean; right: boolean } = { left: false, right: false };
    private connectionStateCallbacks = new Set<(state: { left: boolean; right: boolean }) => void>();
    private disconnectSubscriptions: { left: Subscription | null; right: Subscription | null } = { left: null, right: null };

    protected getServiceName(): string {
        return 'GlassesConnection';
    }

    async connectDevice(address: string, side: GlassSide.LEFT | GlassSide.RIGHT): Promise<void> {
        const key = side === GlassSide.LEFT ? 'left' : 'right';
        try {
            const device = await this.establishBleConnection(address, GLASSES_MIN_MTU);

            // The native GATT event is the source of truth for disconnection
            this.disconnectSubscriptions[key]?.remove();
            this.disconnectSubscriptions[key] = device.onDisconnected(() => {
                if (this.devices[key]?.id === device.id) {
                    this.devices[key] = null;
                    this.connectionState[key] = false;
                    this.notifyConnectionState();
                }
            });

            this.devices[key] = device;
            this.connectionState[key] = true;
            this.notifyConnectionState();
        } catch (error: any) {
            throw new Error(`Failed to connect ${key} device: ${error?.message || 'Unknown error'}`);
        }
    }

    async disconnectAll(): Promise<void> {
        const disconnectPromises: Promise<Device>[] = [];

        for (const key of ['left', 'right'] as const) {
            this.disconnectSubscriptions[key]?.remove();
            this.disconnectSubscriptions[key] = null;
            const device = this.devices[key];
            if (device) {
                disconnectPromises.push(device.cancelConnection());
                this.devices[key] = null;
            }
        }

        if (disconnectPromises.length > 0) {
            await Promise.all(disconnectPromises);
        }

        this.connectionState = { left: false, right: false };
        this.notifyConnectionState();
    }

    getDevices(): { left: Device | null; right: Device | null } {
        return { ...this.devices };
    }

    getConnectionState(): { left: boolean; right: boolean } {
        return { ...this.connectionState };
    }

    onConnectionStateChange(callback: (state: { left: boolean; right: boolean }) => void): () => void {
        callback(this.connectionState);
        this.connectionStateCallbacks.add(callback);
        return () => {
            this.connectionStateCallbacks.delete(callback);
        };
    }

    private notifyConnectionState(): void {
        this.connectionStateCallbacks.forEach(callback => callback(this.connectionState));
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
}