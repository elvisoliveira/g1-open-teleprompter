import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BLE_TICK_EVENT } from '../constants/BluetoothConstants';
import { RingProtocol } from '../transport/RingProtocol';

/**
 * Periodic keep-alive that stops the ring firmware from dropping an idle connection.
 * Driven by the native BleTick event (not setInterval) so it keeps firing while
 * the app is backgrounded — RN freezes JS timers when the Activity pauses.
 * It does not drive connection state; GATT disconnects are reported natively
 * via device.onDisconnected in RingConnection.
 */
export class RingKeepAlive {
    private subscription: EmitterSubscription | null = null;

    start(getDevice: () => Device | null): void {
        this.stop();
        this.subscription = DeviceEventEmitter.addListener(BLE_TICK_EVENT, async () => {
            const device = getDevice();
            if (!device) return;
            try {
                await RingProtocol.sendKeepAlive(device);
            } catch (error) {
                // A real drop fires onDisconnected; a missed response is not a disconnect
            }
        });
    }

    stop(): void {
        this.subscription?.remove();
        this.subscription = null;
    }
}
