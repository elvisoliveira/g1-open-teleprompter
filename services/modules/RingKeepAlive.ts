import { Device } from 'react-native-ble-plx';
import { RingProtocol } from '../transport/RingProtocol';

/**
 * RingKeepAlive - Manages periodic keep-alive communication with ring device
 * Monitors connection health and updates connection state based on response
 */
export class RingKeepAlive {
    private readonly intervalTimeout = 5000; // 5 seconds
    private keepAliveInterval: NodeJS.Timeout | null = null;

    start(
        getDevice: () => Device | null,
        isConnected: () => boolean,
        updateConnectionState: (state: boolean) => void
    ): void {
        this.stop();
        this.keepAliveInterval = setInterval(async () => {
            await this.performKeepAlive(getDevice, isConnected, updateConnectionState);
        }, this.intervalTimeout);
    }

    stop(): void {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    private async performKeepAlive(
        getDevice: () => Device | null,
        isConnected: () => boolean,
        updateConnectionState: (state: boolean) => void
    ): Promise<void> {
        const device = getDevice();
        const currentState = isConnected();

        if (!currentState || !device) {
            return;
        }

        let newState = false;
        try {
            newState = await RingProtocol.sendKeepAlive(device);
        } catch (error) {
            newState = false;
        }

        if (currentState !== newState) {
            updateConnectionState(newState);
        }
    }
}
