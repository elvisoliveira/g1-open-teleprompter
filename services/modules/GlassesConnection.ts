import { Device } from 'react-native-ble-plx';
import { BaseDeviceController } from '../BaseDeviceController';
import { GlassSide } from '../DeviceTypes';

export class GlassesConnection extends BaseDeviceController {
    private devices: { left: Device | null; right: Device | null } = { left: null, right: null };
    private connectionState: { left: boolean; right: boolean } = { left: false, right: false };
    private connectionStateCallback: ((state: { left: boolean; right: boolean }) => void) | null = null;

    protected getServiceName(): string {
        return 'GlassesConnection';
    }

    async connectDevice(address: string, side: GlassSide.LEFT | GlassSide.RIGHT): Promise<void> {
        try {
            const device = await this.establishBleConnection(address);
            
            if (side === GlassSide.LEFT) {
                this.devices.left = device;
                this.connectionState.left = true;
            } else {
                this.devices.right = device;
                this.connectionState.right = true;
            }

            this.connectionStateCallback?.(this.connectionState);
        } catch (error: any) {
            throw new Error(`Failed to connect ${side === GlassSide.LEFT ? 'left' : 'right'} device: ${error?.message || 'Unknown error'}`);
        }
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

        this.connectionState = { left: false, right: false };
        this.connectionStateCallback?.(this.connectionState);
    }

    getDevices(): { left: Device | null; right: Device | null } {
        return { ...this.devices };
    }

    getConnectionState(): { left: boolean; right: boolean } {
        return { ...this.connectionState };
    }

    updateConnectionState(state: { left: boolean; right: boolean }): void {
        this.connectionState = state;
        this.connectionStateCallback?.(this.connectionState);
    }

    onConnectionStateChange(callback: (state: { left: boolean; right: boolean }) => void): () => void {
        callback(this.connectionState);
        this.connectionStateCallback = callback;
        return () => {
            this.connectionStateCallback = null;
        };
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