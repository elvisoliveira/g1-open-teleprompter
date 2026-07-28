import { Device } from 'react-native-ble-plx';
import { BatteryInfo, DeviceStatus, FirmwareInfo, GlassSide } from '../DeviceTypes';
import { GlassesProtocol } from '../transport/GlassesProtocol';

export class GlassesStatus {
    private batteryInfo: BatteryInfo;
    private firmwareInfo: FirmwareInfo;

    constructor() {
        this.batteryInfo = this.resetBatteryInfo();
        this.firmwareInfo = this.resetFirmwareInfo();
    }

    async refreshBatteryInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        if (devices.left) {
            const leftBatteryLevel = await GlassesProtocol.requestBatteryLevel(devices.left);
            if (leftBatteryLevel !== null) {
                this.batteryInfo.left = leftBatteryLevel;
            }
        }
        if (devices.right) {
            const rightBatteryLevel = await GlassesProtocol.requestBatteryLevel(devices.right);
            if (rightBatteryLevel !== null) {
                this.batteryInfo.right = rightBatteryLevel;
            }
        }
    }

    async getFirmwareInfo(device: Device, side: GlassSide.LEFT | GlassSide.RIGHT): Promise<void> {
        const currentFirmware = side === GlassSide.LEFT ? this.firmwareInfo.left : this.firmwareInfo.right;

        if (device && currentFirmware === null) {
            const firmwareInfo = await GlassesProtocol.requestFirmwareInfo(device);
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
                firmware: this.firmwareInfo.left
            },
            right: {
                connected: connectionState.right,
                battery: this.batteryInfo.right,
                firmware: this.firmwareInfo.right
            }
        };
    }

    reset(): void {
        this.batteryInfo = this.resetBatteryInfo();
        this.firmwareInfo = this.resetFirmwareInfo();
    }

    private resetBatteryInfo(): BatteryInfo {
        return {
            left: -1,
            right: -1
        };
    }

    private resetFirmwareInfo(): FirmwareInfo {
        return {
            left: null,
            right: null
        }
    };
}