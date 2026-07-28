import { Device } from 'react-native-ble-plx';
import { GLASSES_HEARTBEAT_INTERVAL_MS } from '../constants/GlassesConstants';
import { GlassesProtocol } from '../transport/GlassesProtocol';

/**
 * Periodic heartbeat that keeps the G1 glasses from dropping an idle central.
 * It does not drive connection state — GATT disconnects are reported natively
 * via device.onDisconnected in GlassesConnection.
 */
export class GlassesHeartbeat {
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatSeq: number = 0;

    start(getDevices: () => { left: Device | null; right: Device | null }): void {
        this.stop();
        this.heartbeatInterval = setInterval(async () => {
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
        }, GLASSES_HEARTBEAT_INTERVAL_MS);
    }

    stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
