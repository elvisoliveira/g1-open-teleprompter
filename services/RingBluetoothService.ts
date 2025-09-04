import { Device } from 'react-native-ble-plx';
import { BaseBluetoothService } from './BaseBluetoothService';
import { RingStatus } from './types';

class RingBluetoothService extends BaseBluetoothService {
    private device: Device | null = null;
    private connectionState: boolean = false;
    private connectionStateCallback: ((connected: boolean) => void) | null = null;
    private ringStatus: RingStatus = {
        connected: false,
        battery: -1,
        firmware: null,
        gestureMode: 'disabled',
        sensitivity: 50
    };

    constructor() {
        super();
    }

    protected getServiceName(): string {
        return 'RingBluetoothService';
    }

    // Public API Methods
    async connect(address: string): Promise<void> {
        try {
            const device = await this.establishBleConnection(address);
            this.device = device;
            this.connectionState = true;
            this.ringStatus.connected = true;
            this.connectionStateCallback?.(this.connectionState);
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
        this.ringStatus.connected = false;
        this.connectionStateCallback?.(this.connectionState);
    }

    // Device Status Methods

    isConnected(): boolean {
        return this.connectionState;
    }

    onConnectionStateChange(callback: (connected: boolean) => void): () => void {
        callback(this.connectionState);
        this.connectionStateCallback = callback;
        return () => {
            this.connectionStateCallback = null;
        };
    }

    getRingStatus(): RingStatus {
        return { ...this.ringStatus };
    }

    // Ring-specific methods
    async setGestureMode(mode: 'teleprompter' | 'presentation' | 'disabled'): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('Ring not connected');
        }

        // TODO: Implement gesture mode setting
        console.log(`Setting ring gesture mode to: ${mode}`);
        this.ringStatus.gestureMode = mode;
        return true;
    }

    async setSensitivity(sensitivity: number): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('Ring not connected');
        }

        if (sensitivity < 0 || sensitivity > 100) {
            throw new Error('Sensitivity must be between 0 and 100');
        }

        // TODO: Implement sensitivity setting
        console.log(`Setting ring sensitivity to: ${sensitivity}`);
        this.ringStatus.sensitivity = sensitivity;
        return true;
    }



    // Private Helper Methods
}

export default new RingBluetoothService();