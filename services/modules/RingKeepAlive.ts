import { Device } from 'react-native-ble-plx';
import { RingProtocol } from '../transport/RingProtocol';

/**
 * Periodic keep-alive that stops the ring firmware from dropping an idle connection.
 * It does not drive connection state — GATT disconnects are reported natively
 * via device.onDisconnected in RingConnection.
 */
export class RingKeepAlive {
    private readonly intervalTimeout = 5000; // 5 seconds
    private keepAliveInterval: NodeJS.Timeout | null = null;

    start(getDevice: () => Device | null): void {
        this.stop();
        this.keepAliveInterval = setInterval(async () => {
            const device = getDevice();
            if (!device) return;
            try {
                await RingProtocol.sendKeepAlive(device);
            } catch (error) {
                // A real drop fires onDisconnected; a missed response is not a disconnect
            }
        }, this.intervalTimeout);
    }

    stop(): void {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }
}
