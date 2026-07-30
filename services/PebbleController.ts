import { NativeModules } from 'react-native';
import { RingStatus } from './DeviceTypes';

// Device name marker of Pebble Index rings (bonded via the official Pebble app)
export const PEBBLE_DEVICE_NAME = 'Pebble Index';

// Emitted by PebbleRingModule with the final debounced button sequence
export const PEBBLE_BUTTON_SEQUENCE_EVENT = 'PebbleButtonSequence';

/**
 * Driver for the Pebble Index 01 ring. The protocol lives in the native
 * PebbleRingModule (haversine library); "connected" here means the sync
 * monitor is running for the selected ring — the ring itself sleeps
 * between button presses, there is no persistent GATT link to hold.
 */
class PebbleController {
    private connected = false;
    private connectionStateCallbacks = new Set<(connected: boolean) => void>();

    async connect(address: string): Promise<void> {
        await (NativeModules as any).PebbleRing.start(address);
        this.connected = true;
        this.notifyConnectionState();
    }

    async disconnect(): Promise<void> {
        (NativeModules as any).PebbleRing?.stop?.();
        this.connected = false;
        this.notifyConnectionState();
    }

    isConnected(): boolean {
        return this.connected;
    }

    onConnectionStateChange(callback: (connected: boolean) => void): () => void {
        callback(this.connected);
        this.connectionStateCallbacks.add(callback);
        return () => {
            this.connectionStateCallbacks.delete(callback);
        };
    }

    getDeviceStatus(): RingStatus {
        // The haversine library exposes no battery/firmware/panel data
        return { connected: this.connected, battery: -1, firmware: null, panel: null };
    }

    private notifyConnectionState(): void {
        this.connectionStateCallbacks.forEach(callback => callback(this.connected));
    }
}

export default new PebbleController();
