import { Device } from 'react-native-ble-plx';
import { RingStatus as RingStatusType } from '../DeviceTypes';
import { QRingProtocol } from '../transport/QRingProtocol';


export class QRingStatus {
    private status: RingStatusType;

    constructor() {
        this.status = this.resetStatus();
    }

    async refreshBatteryInfo(device: Device | null): Promise<void> {
        if (!device) return;

        const batteryLevel = await QRingProtocol.requestBatteryLevel(device);
        if (batteryLevel !== null) {
            this.status.battery = batteryLevel;
        }
    }

    async getFirmwareInfo(device: Device | null): Promise<void> {
        if (!device) return;

        const firmwareInfo = await QRingProtocol.requestFirmwareInfo(device);
        if (firmwareInfo !== null) {
            this.status.firmware = firmwareInfo;
        }
    }

    async getPanelStatus(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await QRingProtocol.requestPanelStatus(device);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }
    }

    async disablePanel(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await QRingProtocol.disablePanel(device);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }
    }

    async enablePanel(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await QRingProtocol.enablePanel(device);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }
    }

    getDeviceStatus(): RingStatusType {
        return { ...this.status };
    }

    reset(): void {
        this.status = this.resetStatus();
    }

    private resetStatus(): RingStatusType {
        return {
            connected: false,
            battery: -1,
            firmware: null,
            panel: null
        };
    }
}