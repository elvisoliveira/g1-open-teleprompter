import { Device } from 'react-native-ble-plx';
import { RingStatus as RingStatusType } from '../DeviceTypes';
import { RingProtocol } from '../transport/RingProtocol';


export class RingStatus {
    private status: RingStatusType;

    constructor() {
        this.status = this.resetStatus();
    }

    async refreshBatteryInfo(device: Device | null): Promise<void> {
        if (!device) return;

        const batteryLevel = await RingProtocol.requestBatteryLevel(device);
        if (batteryLevel !== null) {
            this.status.battery = batteryLevel;
        }
    }

    async getFirmwareInfo(device: Device | null): Promise<void> {
        if (!device) return;

        const firmwareInfo = await RingProtocol.requestFirmwareInfo(device);
        if (firmwareInfo !== null) {
            this.status.firmware = firmwareInfo;
        }
    }

    async getPanelStatus(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await RingProtocol.requestPanelStatus(device);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }
    }

    async disablePanel(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await RingProtocol.disablePanel(device);
        console.log(panelStatus);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }
    }

    async enablePanel(device: Device | null): Promise<void> {
        if (!device) return;

        const panelStatus = await RingProtocol.enablePanel(device);
        console.log(panelStatus);
        if (panelStatus !== null) {
            this.status.panel = panelStatus;
        }

        return;
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