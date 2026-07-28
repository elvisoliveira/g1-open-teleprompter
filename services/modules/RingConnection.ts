import { Device } from 'react-native-ble-plx';
import { BaseDeviceController } from '../BaseDeviceController';

export class RingConnection extends BaseDeviceController {
    private device: Device | null = null;
    private connectionState: boolean = false;
    private connectionStateCallbacks = new Set<(connected: boolean) => void>();

    protected getServiceName(): string {
        return 'RingConnection';
    }

    async connect(address: string): Promise<void> {
        try {
            const device = await this.establishBleConnection(address);
            this.device = device;
            this.connectionState = true;
            this.notifyConnectionState();
        } catch (error: any) {
            throw new Error(`Failed to connect ring device: ${error?.message || 'Unknown error'}`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.device) {
            await this.device.cancelConnection();
            this.device = null;
        }
        this.connectionState = false;
        this.notifyConnectionState();
    }

    getDevice(): Device | null {
        return this.device;
    }

    getConnectionState(): boolean {
        return this.connectionState;
    }

    updateConnectionState(state: boolean): void {
        this.connectionState = state;
        this.notifyConnectionState();
    }

    onConnectionStateChange(callback: (connected: boolean) => void): () => void {
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
        return this.connectionState;
    }
}
