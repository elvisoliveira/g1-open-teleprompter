import { Buffer } from 'buffer';
import { NativeModules } from 'react-native';
import { sharedBleManager } from './BaseDeviceController';
import { RingStatus } from './DeviceTypes';

// Device name marker of Pebble Index rings (advertised name; the CFW needs no pairing)
export const PEBBLE_DEVICE_NAME = 'Pebble Index';

// CFW click beacon: manufacturer company 0xFFFF, little-endian FF FF; payload[0] = counter
const CFW_COMPANY_LE = [0xff, 0xff];

// Emitted by PebbleRingModule when the ring advertises a button press
// (single vs double is not distinguishable — one press, one event)
export const PEBBLE_ADVERT_CLICK_EVENT = 'PebbleAdvertClick';

export interface DiscoveredRing { id: string; name: string | null; isConnected: boolean }

/**
 * Discover Pebble Index rings running the CFW by their connectionless advertisement
 * (name contains "Pebble Index" and manufacturer company 0xFFFF). The CFW does not
 * pair, so a ring may not be in the bonded list — this scan finds it anyway. Resolves
 * after [durationMs] with the rings seen, deduped by address.
 */
export async function scanForPebbleCfwRings(durationMs = 4000): Promise<DiscoveredRing[]> {
    return new Promise((resolve) => {
        const found = new Map<string, DiscoveredRing>();
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            try { sharedBleManager.stopDeviceScan(); } catch { /* scan may not have started */ }
            resolve([...found.values()]);
        };
        try {
            sharedBleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
                if (error) { finish(); return; }
                if (!device?.name?.includes(PEBBLE_DEVICE_NAME)) return;
                const md = device.manufacturerData;
                if (!md) return;
                // manufacturerData is base64 of [companyLE_lo, companyLE_hi, ...payload]
                const bytes = new Uint8Array(Buffer.from(md, 'base64'));
                if (bytes.length < 2 || bytes[0] !== CFW_COMPANY_LE[0] || bytes[1] !== CFW_COMPANY_LE[1]) return;
                found.set(device.id, { id: device.id, name: device.name, isConnected: false });
            });
        } catch {
            finish();
            return;
        }
        setTimeout(finish, durationMs);
    });
}

/**
 * Driver for the Pebble Index 01 ring running the CFW. The protocol lives in the
 * native PebbleRingModule: a connectionless BLE scan reads the ring's click counter
 * (manufacturer company 0xFFFF) and emits PEBBLE_ADVERT_CLICK_EVENT per press.
 * "connected" here means that scan is running for the selected ring — the ring sleeps
 * between presses; there is no GATT link and no pairing.
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
        // The CFW advertisement exposes no battery/firmware/panel data
        return { connected: this.connected, battery: -1, firmware: null, panel: null };
    }

    private notifyConnectionState(): void {
        this.connectionStateCallbacks.forEach(callback => callback(this.connected));
    }
}

export default new PebbleController();
