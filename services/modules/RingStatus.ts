import { Device } from 'react-native-ble-plx';
import { RingStatus as RingStatusType } from '../DeviceTypes';
import { RingProtocol } from '../transport/RingProtocol';


export class RingStatus {
    private status: RingStatusType = {
        connected: false,
        battery: -1,
        firmware: null,
        gestureMode: 'disabled',
        sensitivity: 50
    };

    async refreshBatteryInfo(device: Device | null): Promise<void> {
        if (device) {
            const batteryLevel = await RingProtocol.requestBatteryLevel(device);
            if (batteryLevel !== null) {
                this.status.battery = batteryLevel;
            }
        }
    }

    updateConnectionState(connected: boolean): void {
        this.status.connected = connected;
    }

    async setGestureMode(mode: 'teleprompter' | 'presentation' | 'disabled'): Promise<boolean> {
        // TODO: Implement gesture mode setting
        console.log(`Setting ring gesture mode to: ${mode}`);
        this.status.gestureMode = mode;
        return true;
    }

    async setSensitivity(sensitivity: number): Promise<boolean> {
        if (sensitivity < 0 || sensitivity > 100) {
            throw new Error('Sensitivity must be between 0 and 100');
        }

        // TODO: Implement sensitivity setting
        console.log(`Setting ring sensitivity to: ${sensitivity}`);
        this.status.sensitivity = sensitivity;
        return true;
    }

    getDeviceStatus(): RingStatusType {
        return { ...this.status };
    }
}