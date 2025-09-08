import { Device } from 'react-native-ble-plx';
import { GlassSide } from '../DeviceTypes';

export class GlassesDispatcher {
    async executeForDevices<T>(
        devices: { left: Device | null; right: Device | null },
        side: GlassSide,
        operation: (device: Device, deviceSide: GlassSide.LEFT | GlassSide.RIGHT) => Promise<T>,
        parallel: boolean = false
    ): Promise<T[]> {
        const entries = this.getDevicesForSide(devices, side)
            .filter((entry): entry is { device: Device; side: GlassSide.LEFT | GlassSide.RIGHT } =>
                entry.device !== null
            );

        const executeOperation = async (entry: { device: Device; side: GlassSide.LEFT | GlassSide.RIGHT }): Promise<T | undefined> => {
            try {
                return await operation(entry.device, entry.side);
            } catch (error) {
                console.error(`[GlassesDispatcher] Operation failed for ${entry.side} device:`, error);
                return undefined;
            }
        };

        if (parallel) {
            const results = await Promise.all(entries.map(executeOperation));
            return results.filter(result => result !== undefined) as T[];
        }

        const validResults: T[] = [];
        for (const entry of entries) {
            const result = await executeOperation(entry);
            if (result !== undefined) {
                validResults.push(result);
            }
        }
        return validResults;
    }

    private getDevicesForSide(
        devices: { left: Device | null; right: Device | null },
        side: GlassSide
    ): Array<{ device: Device | null; side: GlassSide.LEFT | GlassSide.RIGHT }> {
        const deviceList: Array<{ device: Device | null; side: GlassSide.LEFT | GlassSide.RIGHT }> = [];
        if (side === GlassSide.BOTH || side === GlassSide.LEFT) {
            deviceList.push({ device: devices.left, side: GlassSide.LEFT });
        }
        if (side === GlassSide.BOTH || side === GlassSide.RIGHT) {
            deviceList.push({ device: devices.right, side: GlassSide.RIGHT });
        }
        return deviceList;
    }
}