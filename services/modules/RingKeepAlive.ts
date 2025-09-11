import { Device } from 'react-native-ble-plx';
import { RingProtocol } from '../transport/RingProtocol';

/**
 * RingKeepAlive - Manages periodic keep-alive communication with ring device
 * Monitors connection health and updates connection state based on response
 */
export class RingKeepAlive {
    private readonly intervalTimeout = 5000; // 5 seconds
    private keepAliveInterval: NodeJS.Timeout | null = null;

    /**
     * Start the keep-alive monitoring
     */
    start(
        getDevice: () => Device | null,
        isConnected: (isConnected?: boolean) => boolean,
        updateConnectionState: (state: boolean) => void
    ): void {
        console.log('[RingKeepAlive] Starting keep-alive monitoring (5s interval)');
        this.stop();

        this.keepAliveInterval = setInterval(async () => {
            await this.performKeepAlive(getDevice, isConnected, updateConnectionState);
        }, this.intervalTimeout);
    }

    /**
     * Stop the keep-alive monitoring
     */
    stop(): void {
        if (this.keepAliveInterval) {
            console.log('[RingKeepAlive] Stopping keep-alive monitoring');
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    /**
     * Perform keep-alive check and update connection state if needed
     */
    private async performKeepAlive(
        getDevice: () => Device | null,
        isConnected: (isConnected?: boolean) => boolean,
        updateConnectionState: (state: boolean) => void
    ): Promise<void> {
        const device = getDevice();
        const currentState = isConnected();

        console.log(`[RingKeepAlive] Keep-alive check - Current connection state: ${currentState ? 'connected' : 'disconnected'}`);

        // Skip if not connected or no device available
        if (!currentState || !device) {
            console.log(`[RingKeepAlive] Skipping keep-alive - ${!device ? 'no device' : 'not connected'}`);
            return;
        }

        let newState = false;
        try {
            console.log(`[RingKeepAlive] Sending keep-alive to device: ${device.id}`);
            newState = await RingProtocol.sendKeepAlive(device);

            if (newState) {
                console.log('[RingKeepAlive] Keep-alive successful - device is responsive');
            } else {
                console.log('[RingKeepAlive] Keep-alive failed - device not responding');
            }
        } catch (error) {
            console.log(`[RingKeepAlive] Keep-alive error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            newState = false;
        }

        // Update connection state if it changed
        if (currentState !== newState) {
            console.log(`[RingKeepAlive] Connection state changed: ${currentState ? 'connected' : 'disconnected'} → ${newState ? 'connected' : 'disconnected'}`);
            updateConnectionState(newState);
        }
    }
}