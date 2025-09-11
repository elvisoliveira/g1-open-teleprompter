import { Device } from 'react-native-ble-plx';
import { GLASSES_HEARTBEAT_INTERVAL_MS } from '../constants/GlassesConstants';
import { GlassesProtocol } from '../transport/GlassesProtocol';

export class GlassesHeartbeat {
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatSeq: number = 0;

    start(
        getDevices: () => { left: Device | null; right: Device | null },
        getConnectionState: () => { left: boolean; right: boolean },
        updateConnectionState: (state: { left: boolean; right: boolean }) => void
    ): void {
        this.stop();
        this.heartbeatInterval = setInterval(async () => {
            await this.performHeartbeat(getDevices, getConnectionState, updateConnectionState);
        }, GLASSES_HEARTBEAT_INTERVAL_MS);
    }

    stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async performHeartbeat(
        getDevices: () => { left: Device | null; right: Device | null },
        getConnectionState: () => { left: boolean; right: boolean },
        updateConnectionState: (state: { left: boolean; right: boolean }) => void
    ): Promise<void> {
        const seq = this.heartbeatSeq++ & 0xFF;
        const devices = getDevices();
        const connectionState = getConnectionState();

        const leftSuccess = await this.sendHeartbeatToDevice(devices.left, connectionState.left, seq);
        const rightSuccess = await this.sendHeartbeatToDevice(devices.right, connectionState.right && leftSuccess, seq);

        const newState = {
            left: leftSuccess && connectionState.left,
            right: rightSuccess && connectionState.right
        };

        if (connectionState.left !== newState.left || connectionState.right !== newState.right) {
            updateConnectionState(newState);
        }
    }

    private async sendHeartbeatToDevice(device: Device | null, shouldSend: boolean, seq: number): Promise<boolean> {
        if (!shouldSend || !device) return false;

        try {
            return await GlassesProtocol.sendHeartbeat(device, seq);
        } catch (error) {
            return false;
        }
    }
}