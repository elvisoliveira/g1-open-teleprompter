import { BaseDeviceController } from './BaseDeviceController';
import { RingConnection } from './modules/RingConnection';
import { RingKeepAlive } from './modules/RingKeepAlive';
import { RingStatus } from './modules/RingStatus';

class RingController extends BaseDeviceController {
    private connection = new RingConnection();
    private keepAlive = new RingKeepAlive();
    private status = new RingStatus();

    constructor() {
        super();
    }

    protected getServiceName(): string {
        return 'RingController';
    }

    // Public API Methods
    async connect(address: string): Promise<void> {
        await this.connection.connect(address);

        await this.status.getFirmwareInfo(this.connection.getDevice());
        await this.status.getPanelStatus(this.connection.getDevice());

        this.startKeepAliveIfNeeded();
    }

    private startKeepAliveIfNeeded(): void {
        this.keepAlive.start(
            () => this.connection.getDevice(),
            () => this.connection.isConnected(),
            (state: boolean) => {
                if (!state) {
                    this.disconnect();
                }
                this.connection.updateConnectionState(state)
            }
        );
    }

    async disconnect(): Promise<void> {
        this.keepAlive.stop();
        await this.connection.disconnect();
        this.status.reset();
    }

    // Device Status Methods
    isConnected(): boolean {
        return this.connection.isConnected();
    }

    onConnectionStateChange(callback: (connected: boolean) => void): () => void {
        return this.connection.onConnectionStateChange(callback);
    }

    async refreshBatteryInfo(): Promise<void> {
        await this.status.refreshBatteryInfo(this.connection.getDevice());
    }

    getDeviceStatus(): import('./DeviceTypes').RingStatus {
        return this.status.getDeviceStatus();
    }

    // Ring-specific methods
    async toggleRingTouchPanel(): Promise<void> {
        console.log(`ENABLE TOUCH PANEL 3`);
        if (!this.isConnected()) {
            throw new Error('Ring not connected');
        }
        const status = this.status.getDeviceStatus();
        if (!status.panel) {
            throw new Error('Panel status not available');
        }
        const isTouchEnabled = status.panel.controlType === 'touch' && status.panel.mode === 'Music';
        if (isTouchEnabled) {
            console.log(`ENABLE TOUCH PANEL 4`);
            this.status.disablePanel(this.connection.getDevice());
        } else {
            console.log(`ENABLE TOUCH PANEL 5`);
            this.status.enablePanel(this.connection.getDevice());
        }
    }
}

export default new RingController();