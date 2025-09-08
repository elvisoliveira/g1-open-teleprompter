import { Device } from 'react-native-ble-plx';
import { CommunicationManager } from '../CommunicationManager';
import { BatteryInfo, DeviceStatus, FirmwareInfo, GlassSide, UptimeInfo } from '../types';

export class GlassesStatus {
    private batteryInfo: BatteryInfo = { left: -1, right: -1 };
    private deviceUptime: UptimeInfo = { left: -1, right: -1 };
    private firmwareInfo: FirmwareInfo = { left: null, right: null };

    async refreshBatteryInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        if (devices.left) {
            const leftBatteryLevel = await CommunicationManager.requestBatteryLevel(devices.left);
            if (leftBatteryLevel !== null) {
                this.batteryInfo.left = leftBatteryLevel;
            }
        }
        if (devices.right) {
            const rightBatteryLevel = await CommunicationManager.requestBatteryLevel(devices.right);
            if (rightBatteryLevel !== null) {
                this.batteryInfo.right = rightBatteryLevel;
            }
        }
    }

    async refreshUptime(devices: { left: Device | null; right: Device | null }): Promise<void> {
        if (devices.left) {
            const leftUptime = await CommunicationManager.requestUptime(devices.left);
            if (leftUptime !== null) {
                this.deviceUptime.left = leftUptime;
            }
        }
        if (devices.right) {
            const rightUptime = await CommunicationManager.requestUptime(devices.right);
            if (rightUptime !== null) {
                this.deviceUptime.right = rightUptime;
            }
        }
    }

    async getFirmwareInfo(device: Device, side: GlassSide.LEFT | GlassSide.RIGHT): Promise<void> {
        const currentFirmware = side === GlassSide.LEFT ? this.firmwareInfo.left : this.firmwareInfo.right;

        if (device && currentFirmware === null) {
            const firmwareInfo = await CommunicationManager.requestFirmwareInfo(device);
            if (firmwareInfo !== null) {
                if (side === GlassSide.LEFT) {
                    this.firmwareInfo.left = firmwareInfo;
                } else {
                    this.firmwareInfo.right = firmwareInfo;
                }
            }
        }
    }

    getDeviceStatus(connectionState: { left: boolean; right: boolean }): { left: DeviceStatus; right: DeviceStatus } {
        return {
            left: {
                connected: connectionState.left,
                battery: this.batteryInfo.left,
                uptime: this.deviceUptime.left,
                firmware: this.firmwareInfo.left
            },
            right: {
                connected: connectionState.right,
                battery: this.batteryInfo.right,
                uptime: this.deviceUptime.right,
                firmware: this.firmwareInfo.right
            }
        };
    }

    reset(): void {
        this.batteryInfo = { left: -1, right: -1 };
        this.deviceUptime = { left: -1, right: -1 };
        this.firmwareInfo = { left: null, right: null };
    }
}