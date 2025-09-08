import { BaseBluetoothService } from './BaseBluetoothService';
import { RingConnection } from './modules/RingConnection';
import { RingStatus } from './modules/RingStatus';

class RingBluetoothService extends BaseBluetoothService {
    private connection = new RingConnection();
    private status = new RingStatus();

    constructor() {
        super();
    }

    protected getServiceName(): string {
        return 'RingBluetoothService';
    }

    // Public API Methods
    async connect(address: string): Promise<void> {
        await this.connection.connect(address);
        this.status.updateConnectionState(true);
    }

    async disconnect(): Promise<void> {
        await this.connection.disconnect();
        this.status.updateConnectionState(false);
    }

    // Device Status Methods
    isConnected(): boolean {
        return this.connection.isConnected();
    }

    onConnectionStateChange(callback: (connected: boolean) => void): () => void {
        return this.connection.onConnectionStateChange(callback);
    }

    getRingStatus(): import('./Types').RingStatus {
        return this.status.getRingStatus();
    }

    // Ring-specific methods
    async setGestureMode(mode: 'teleprompter' | 'presentation' | 'disabled'): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('Ring not connected');
        }
        return await this.status.setGestureMode(mode);
    }

    async setSensitivity(sensitivity: number): Promise<boolean> {
        if (!this.isConnected()) {
            throw new Error('Ring not connected');
        }
        return await this.status.setSensitivity(sensitivity);
    }
}

export default new RingBluetoothService();