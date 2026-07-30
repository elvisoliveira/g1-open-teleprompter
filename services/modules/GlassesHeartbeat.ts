import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BLE_TICK_EVENT, BLE_TICK_INTERVAL_MS } from '../constants/BluetoothConstants';
import { GLASSES_HEARTBEAT_INTERVAL_MS } from '../constants/GlassesConstants';
import { GlassesProtocol } from '../transport/GlassesProtocol';

/**
 * Periodic heartbeat that keeps the G1 glasses from dropping an idle central.
 * Driven by the native BleTick event (not setInterval) so it keeps firing while
 * the app is backgrounded — RN freezes JS timers when the Activity pauses.
 * It does not drive connection state; GATT disconnects are reported natively
 * via device.onDisconnected in GlassesConnection.
 */
export class GlassesHeartbeat {
    private subscription: EmitterSubscription | null = null;
    private heartbeatSeq: number = 0;
    private tickCount: number = 0;
    private readonly ticksPerBeat = Math.max(1, Math.round(GLASSES_HEARTBEAT_INTERVAL_MS / BLE_TICK_INTERVAL_MS));

    start(getDevices: () => { left: Device | null; right: Device | null }): void {
        this.stop();
        this.tickCount = 0;
        this.subscription = DeviceEventEmitter.addListener(BLE_TICK_EVENT, async () => {
            if (++this.tickCount % this.ticksPerBeat !== 0) return;

            const seq = this.heartbeatSeq++ & 0xFF;
            const { left, right } = getDevices();
            for (const device of [left, right]) {
                if (!device) continue;
                try {
                    await GlassesProtocol.sendHeartbeat(device, seq);
                } catch (error) {
                    // A real drop fires onDisconnected; a missed response is not a disconnect
                }
            }
        });
    }

    stop(): void {
        this.subscription?.remove();
        this.subscription = null;
    }
}
