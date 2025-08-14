import { Device } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import { HEARTBEAT_CMD, HEARTBEAT_INTERVAL_MS } from './constants';
import { ListenerManager } from './ListenerManager';
import { HeartbeatStatus } from './types';

export class HeartbeatManager {
    private heartbeatSeq: number = 0;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private listeners = new ListenerManager<HeartbeatStatus>();

    /**
     * Construct heartbeat packet
     */
    private constructHeartbeat(): Uint8Array {
        const seq = this.heartbeatSeq++ & 0xFF;
        return new Uint8Array([
            HEARTBEAT_CMD,  // 0x25
            6,               // Length
            0,               // Length MSB (always 0)
            seq,             // Sequence number
            0x04,            // Fixed value
            seq              // Sequence number (duplicate)
        ]);
    }

    /**
     * Perform heartbeat for connected devices
     */
    async performHeartbeat(devices: { left: Device | null; right: Device | null }): Promise<HeartbeatStatus> {
        const heartbeatData = this.constructHeartbeat();
        
        // Always send to left first, then right (G1 protocol requirement)
        let leftSuccess = true;
        let rightSuccess = true;

        if (devices.left) {
            leftSuccess = await CommunicationManager.writeToDevice(devices.left, heartbeatData, false);
        }
        
        if (devices.right && leftSuccess) {
            rightSuccess = await CommunicationManager.writeToDevice(devices.right, heartbeatData, false);
        }

        const status: HeartbeatStatus = {
            left: leftSuccess && devices.left !== null,
            right: rightSuccess && devices.right !== null,
            timestamp: new Date()
        };

        // Notify listeners
        this.listeners.notify(status);

        return status;
    }

    /**
     * Start heartbeat monitoring
     */
    start(devices: { left: Device | null; right: Device | null }): void {
        this.stop(); // Clear any existing interval
        
        this.heartbeatInterval = setInterval(async () => {
            await this.performHeartbeat(devices);
        }, HEARTBEAT_INTERVAL_MS);
        
        // Perform initial heartbeat
        this.performHeartbeat(devices);
    }

    /**
     * Stop heartbeat monitoring
     */
    stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Check if heartbeat is running
     */
    isRunning(): boolean {
        return this.heartbeatInterval !== null;
    }

    /**
     * Manually trigger a heartbeat
     */
    async trigger(devices: { left: Device | null; right: Device | null }): Promise<HeartbeatStatus> {
        return await this.performHeartbeat(devices);
    }

    /**
     * Subscribe to heartbeat status updates
     */
    onHeartbeatStatus(callback: (status: HeartbeatStatus) => void): () => void {
        return this.listeners.add(callback);
    }

    /**
     * Clear all listeners
     */
    clearListeners(): void {
        this.listeners.clear();
    }
} 