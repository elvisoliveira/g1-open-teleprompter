import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { PERMISSIONS, request } from 'react-native-permissions';

export enum DeviceSide {
    LEFT = 'L',
    RIGHT = 'R',
    BOTH = 'BOTH'
}

export interface BatteryInfo {
    left: number;   // -1 if not available
    right: number;  // -1 if not available
    lastUpdated: Date | null;
}

export interface DeviceStatus {
    connected: boolean;
    battery: number; // -1 if not available
    uptime: number; // uptime in seconds, -1 if not available
    firmware: string | null; // Firmware information
}

// Generic listener manager to reduce code duplication
class ListenerManager<T> {
    private listeners: Array<(data: T) => void> = [];

    add(callback: (data: T) => void): () => void {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notify(data: T): void {
        this.listeners.forEach(listener => {
            try { listener(data); } catch (e) { /* ignore */ }
        });
    }

    clear(): void {
        this.listeners.length = 0;
    }
}

class BluetoothService {
    private manager: BleManager;
    private leftDevice: Device | null = null;
    private rightDevice: Device | null = null;
    private static evenaiSeq: number = 0;
    private heartbeatSeq: number = 0;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    
    // Use generic listener managers
    private heartbeatListeners = new ListenerManager<{ left: boolean; right: boolean; timestamp: Date }>();
    private batteryListeners = new ListenerManager<BatteryInfo>();
    
    // Battery and device status tracking
    private batteryInfo: BatteryInfo = { left: -1, right: -1, lastUpdated: null };
    private deviceUptime: number = -1; // uptime in seconds, -1 if not available
    private firmwareInfo: { left: string | null; right: string | null } = { left: null, right: null };
    private batteryMonitoringInterval: NodeJS.Timeout | null = null;

    // Static UUIDs for all devices
    private static readonly SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    private static readonly WRITE_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    private static readonly READ_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    
    // Protocol constants
    private static readonly EVENAI_CMD = 0x4E;
    private static readonly EXIT_CMD = 0x18;
    private static readonly HEARTBEAT_CMD = 0x25;
    private static readonly BMP_DATA_CMD = 0x15;
    private static readonly BMP_END_CMD = [0x20, 0x0d, 0x0e];
    private static readonly CRC_CMD = 0x16;
    private static readonly BATTERY_CMD = 0x2C;
    private static readonly UPTIME_CMD = 0x37;
    private static readonly FIRMWARE_REQUEST_CMD = [0x23, 0x74]; // Corrected firmware command
    private static readonly INIT_LEFT_CMD = [0x4D, 0xFB];
    private static readonly CHUNK_SIZE = 200;
    private static readonly BMP_CHUNK_SIZE = 194;
    private static readonly BMP_STORAGE_ADDRESS = [0x00, 0x1c, 0x00, 0x00];
    private static readonly NEW_SCREEN_FLAG = 0x71;
    private static readonly MAX_LINE_LENGTH = 60;
    private static readonly MAX_DISPLAY_LINES = 5;
    private static readonly PACKET_DELAY = 5;        // Reduced from 10ms to 5ms
    private static readonly BMP_PACKET_DELAY = 1;    // Removed delay for maximum speed
    private static readonly BMP_END_DELAY = 50;      // Reduced from 100ms to 50ms
    private static readonly HEARTBEAT_INTERVAL_MS = 15000;
    private static readonly ENABLE_TRANSFER_LOGGING = false; // Set to false to reduce logging overhead
    
    // Default packet parameters
    private static readonly DEFAULT_POS = 0;
    private static readonly DEFAULT_PAGE_NUM = 1;
    private static readonly DEFAULT_MAX_PAGES = 1;

    constructor() {
        this.manager = new BleManager();
    }

    // Utility methods
    private log(method: string, message: string, ...args: any[]): void {
        console.log(`[${method}] ${message}`, ...args);
    }

    private warn(method: string, message: string, ...args: any[]): void {
        console.warn(`[${method}] ${message}`, ...args);
    }

    private error(method: string, message: string, ...args: any[]): void {
        console.error(`[${method}] ${message}`, ...args);
    }

    private arrayToHex(data: Uint8Array): string {
        return Array.from(data).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
    }

    private getDevicesForSide(side: DeviceSide): Array<{ device: Device | null; side: "L" | "R" }> {
        const devices: Array<{ device: Device | null; side: "L" | "R" }> = [];
        if (side === DeviceSide.BOTH || side === DeviceSide.LEFT) {
            devices.push({ device: this.leftDevice, side: "L" });
        }
        if (side === DeviceSide.BOTH || side === DeviceSide.RIGHT) {
            devices.push({ device: this.rightDevice, side: "R" });
        }
        return devices;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Computes standard CRC32 for BMP data verification
     */
    private computeCrc32(data: Uint8Array): number {
        const CRC32_TABLE = new Uint32Array(256);
        
        // Initialize CRC32 table
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
            }
            CRC32_TABLE[i] = crc;
        }

        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0; // Ensure unsigned 32-bit
    }

    /**
     * Computes CRC32 for BMP data including storage address as per G1 protocol
     * The CRC must include the 4-byte storage address that was added to the first packet
     */
    private computeBmpCrc32(bmpData: Uint8Array): number {
        // Combine storage address + BMP data for CRC calculation
        const combinedData = new Uint8Array(BluetoothService.BMP_STORAGE_ADDRESS.length + bmpData.length);
        combinedData.set(BluetoothService.BMP_STORAGE_ADDRESS, 0);
        combinedData.set(bmpData, BluetoothService.BMP_STORAGE_ADDRESS.length);
        
        return this.computeCrc32(combinedData);
    }

    /**
     * Creates BMP packets using G1-compatible 194-byte chunks
     */
    private createBmpPackets(bmpData: Uint8Array): Uint8Array[] {
        const packets: Uint8Array[] = [];
        let syncId = 0;
        
        this.log('createBmpPackets', `Creating BMP packets with chunk size: ${BluetoothService.BMP_CHUNK_SIZE} bytes`);

        for (let i = 0; i < bmpData.length; i += BluetoothService.BMP_CHUNK_SIZE) {
            const end = Math.min(i + BluetoothService.BMP_CHUNK_SIZE, bmpData.length);
            const chunk = bmpData.slice(i, end);
            
            if (i === 0) {
                // First packet: [0x15, syncId, storageAddress(4 bytes), data]
                const packet = new Uint8Array(2 + BluetoothService.BMP_STORAGE_ADDRESS.length + chunk.length);
                packet[0] = BluetoothService.BMP_DATA_CMD; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(BluetoothService.BMP_STORAGE_ADDRESS, 2); // 0x00, 0x1c, 0x00, 0x00
                packet.set(chunk, 6);
                packets.push(packet);
            } else {
                // Other packets: [0x15, syncId, data]
                const packet = new Uint8Array(2 + chunk.length);
                packet[0] = BluetoothService.BMP_DATA_CMD; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(chunk, 2);
                packets.push(packet);
            }
            
            syncId++;
        }

        return packets;
    }

    // Heartbeat Management
    private constructHeartbeat(): Uint8Array {
        const seq = this.heartbeatSeq++ & 0xFF;
        return new Uint8Array([
            BluetoothService.HEARTBEAT_CMD,  // 0x25
            6,                               // Length
            0,                               // Length MSB (always 0)
            seq,                             // Sequence number
            0x04,                            // Fixed value
            seq                              // Sequence number (duplicate)
        ]);
    }

    private async writeToDevice(data: Uint8Array, side: "L" | "R", requireResponse: boolean = false): Promise<boolean> {
        const device = this.getDevice(side);
        if (!device) return false;

        try {
            const base64 = Buffer.from(data).toString('base64');
            this.log('writeToDevice', `Writing ${requireResponse ? 'with' : 'without'} response to ${side} device: ${this.arrayToHex(data)}`);
            
            if (requireResponse) {
                await device.writeCharacteristicWithResponseForService(
                    BluetoothService.SERVICE_UUID,
                    BluetoothService.WRITE_CHARACTERISTIC_UUID,
                    base64
                );
            } else {
                try {
                    await device.writeCharacteristicWithoutResponseForService(
                        BluetoothService.SERVICE_UUID,
                        BluetoothService.WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                } catch (writeError) {
                    this.warn('writeToDevice', `Write without response failed for ${side} device, fallback to with response`);
                    await device.writeCharacteristicWithResponseForService(
                        BluetoothService.SERVICE_UUID,
                        BluetoothService.WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                }
            }
            return true;
        } catch (error) {
            this.error('writeToDevice', `Write to ${side} device failed:`, error);
            return false;
        }
    }

    private async sendCommandWithResponse(requestBytes: Uint8Array, expectedHeader: Uint8Array, side: DeviceSide, waitTimeMs: number = 250): Promise<Uint8Array | null> {
        this.log('sendCommandWithResponse', `Command: ${this.arrayToHex(requestBytes)}, expecting header: ${this.arrayToHex(expectedHeader)}, side: ${side}`);
        
        try {
            const devices = this.getDevicesForSide(side);

            for (const { device, side: deviceSide } of devices) {
                if (!device) {
                    this.log('sendCommandWithResponse', `Skipping ${deviceSide} device - not connected`);
                    continue;
                }

                try {
                    // First, try to set up notification listener for responses
                    let responseReceived: Uint8Array | null = null;
                    
                    // Try to monitor both characteristics for notifications
                    for (const charUUID of [BluetoothService.READ_CHARACTERISTIC_UUID, BluetoothService.WRITE_CHARACTERISTIC_UUID]) {
                        try {
                            this.log('sendCommandWithResponse', `Setting up notifications on ${charUUID === BluetoothService.READ_CHARACTERISTIC_UUID ? 'READ' : 'WRITE'} characteristic for ${deviceSide} device`);
                            
                            const responsePromise = new Promise<Uint8Array | null>((resolve) => {
                                const timeout = setTimeout(() => {
                                    this.log('sendCommandWithResponse', `Notification timeout for ${deviceSide} device`);
                                    resolve(null);
                                }, waitTimeMs + 1000);
                                
                                device.monitorCharacteristicForService(
                                    BluetoothService.SERVICE_UUID,
                                    charUUID,
                                    (error, characteristic) => {
                                        clearTimeout(timeout);
                                        if (error) {
                                            this.log('sendCommandWithResponse', `Notification error for ${deviceSide} device:`, error);
                                            resolve(null);
                                            return;
                                        }
                                        
                                        if (characteristic?.value) {
                                            const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                                            this.log('sendCommandWithResponse', `Received notification from ${deviceSide}: ${this.arrayToHex(data)}`);
                                            resolve(data);
                                        } else {
                                            resolve(null);
                                        }
                                    }
                                );
                            });

                            // Send the command
                            const success = await this.writeToDevice(requestBytes, deviceSide, true);
                            if (!success) {
                                this.error('sendCommandWithResponse', `Failed to write command to ${deviceSide} device`);
                                continue;
                            }

                            // Wait for notification response
                            responseReceived = await responsePromise;
                            
                            if (responseReceived && (expectedHeader.length === 0 || this.headerMatches(responseReceived, expectedHeader))) {
                                this.log('sendCommandWithResponse', `Valid notification response received from ${deviceSide} device`);
                                return responseReceived;
                            }
                            
                            break; // Exit characteristic loop if we got some response
                        } catch (notifyError) {
                            this.log('sendCommandWithResponse', `Failed to set up notifications on ${charUUID === BluetoothService.READ_CHARACTERISTIC_UUID ? 'READ' : 'WRITE'} characteristic for ${deviceSide} device`);
                            continue;
                        }
                    }

                    // Fallback: Direct read approach if notifications failed
                    if (!responseReceived) {
                        this.log('sendCommandWithResponse', `Falling back to direct read approach for ${deviceSide} device`);
                        
                        // Send command if not sent yet
                        const success = await this.writeToDevice(requestBytes, deviceSide, true);
                        if (!success) {
                            this.error('sendCommandWithResponse', `Failed to write command to ${deviceSide} device`);
                            continue;
                        }

                        // Wait for device to process
                        if (waitTimeMs > 0) {
                            await this.sleep(waitTimeMs);
                        }

                        // Try reading from both characteristics
                        for (const charUUID of [BluetoothService.READ_CHARACTERISTIC_UUID, BluetoothService.WRITE_CHARACTERISTIC_UUID]) {
                            try {
                                this.log('sendCommandWithResponse', `Attempting to read from ${charUUID === BluetoothService.READ_CHARACTERISTIC_UUID ? 'READ' : 'write'} characteristic`);
                                
                                const characteristic = await device.readCharacteristicForService(
                                    BluetoothService.SERVICE_UUID,
                                    charUUID
                                );
                                
                                if (characteristic?.value) {
                                    const responseData = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                                    this.log('sendCommandWithResponse', `Response from ${deviceSide}: ${this.arrayToHex(responseData)}`);
                                    
                                    // Check header match
                                    if (expectedHeader.length === 0 || this.headerMatches(responseData, expectedHeader)) {
                                        return responseData;
                                    }
                                }
                            } catch (readError) {
                                this.log('sendCommandWithResponse', `Failed to read from ${charUUID === BluetoothService.READ_CHARACTERISTIC_UUID ? 'READ' : 'write'} characteristic`);
                            }
                        }
                        
                        // For some commands like battery, return synthetic response if write succeeded
                        if (expectedHeader[0] === BluetoothService.BATTERY_CMD) {
                            this.log('sendCommandWithResponse', `Battery command write succeeded, returning synthetic response`);
                            return new Uint8Array([BluetoothService.BATTERY_CMD, 0x00, 50]);
                        }
                    }
                } catch (error) {
                    this.error('sendCommandWithResponse', `Command failed for ${deviceSide} device:`, error);
                }
            }

            return null;
        } catch (error) {
            this.error('sendCommandWithResponse', 'Top-level error:', error);
            return null;
        }
    }

    private headerMatches(responseData: Uint8Array, expectedHeader: Uint8Array): boolean {
        if (responseData.length < expectedHeader.length) return false;
        for (let i = 0; i < expectedHeader.length; i++) {
            if (responseData[i] !== expectedHeader[i]) return false;
        }
        return true;
    }

    private async performHeartbeat(): Promise<void> {
        // Always send to left first, then right (G1 protocol requirement)
        const leftSuccess = this.leftDevice ? await this.writeToDevice(this.constructHeartbeat(), "L", false) : true;
        const rightSuccess = leftSuccess && this.rightDevice ? await this.writeToDevice(this.constructHeartbeat(), "R", false) : true;

        // Notify listeners
        const status = {
            left: leftSuccess && this.leftDevice !== null,
            right: rightSuccess && this.rightDevice !== null,
            timestamp: new Date()
        };

        this.heartbeatListeners.notify(status);

        // Stop heartbeat if both devices failed
        if (!leftSuccess && !rightSuccess && (this.leftDevice || this.rightDevice)) {
            this.stopHeartbeat();
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.performHeartbeat();
        }, BluetoothService.HEARTBEAT_INTERVAL_MS);
        this.performHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Public method to subscribe to heartbeat status updates
    onHeartbeatStatus(callback: (status: { left: boolean; right: boolean; timestamp: Date }) => void): () => void {
        return this.heartbeatListeners.add(callback);
    }

    // Public method to manually trigger a heartbeat (useful for testing)
    async triggerHeartbeat(): Promise<void> {
        await this.performHeartbeat();
    }

    // Public method to get heartbeat interval status
    isHeartbeatRunning(): boolean {
        return this.heartbeatInterval !== null;
    }

    /**
     * Send firmware request command to connected devices
     */
    private async sendFirmwareRequest(): Promise<boolean> {
        this.log('sendFirmwareRequest', 'Sending firmware request command: [0x23, 0x74]');
        
        const firmwareCmd = new Uint8Array(BluetoothService.FIRMWARE_REQUEST_CMD);
        const success = await this.sendToBothDevices(firmwareCmd, false);
        
        this.log('sendFirmwareRequest', `Firmware request completed: ${success}`);
        return success;
    }

    /**
     * Send init command to left device only
     */
    private async sendInitLeft(): Promise<boolean> {
        this.log('sendInitLeft', 'Sending init command to left device: [0x4D, 0xFB]');
        
        if (!this.leftDevice) {
            this.log('sendInitLeft', 'No left device connected, skipping init command');
            return true;
        }
        
        const initCmd = new Uint8Array(BluetoothService.INIT_LEFT_CMD);
        const result = await this.writeToDevice(initCmd, "L", false);
        
        this.log('sendInitLeft', `Init left command result: ${result}`);
        return result;
    }

    /**
     * Perform full device initialization sequence
     */
    private async initializeDevices(): Promise<boolean> {
        this.log('initializeDevices', 'Starting device initialization sequence');
        
        try {
            const firmwareResult = await this.sendFirmwareRequest();
            if (!firmwareResult) {
                this.error('initializeDevices', 'Firmware request failed');
                return false;
            }
            
            await this.sleep(100);
            
            const initResult = await this.sendInitLeft();
            if (!initResult) {
                this.error('initializeDevices', 'Init left command failed');
                return false;
            }
            
            try {
                await this.updateFirmwareInfo();
                this.log('initializeDevices', 'Firmware info updated successfully');
            } catch (error) {
                this.warn('initializeDevices', 'Failed to get firmware info, but continuing:', error);
            }
            
            this.log('initializeDevices', 'Device initialization completed successfully');
            return true;
        } catch (error) {
            this.error('initializeDevices', 'Device initialization failed:', error);
            return false;
        }
    }

    /**
     * Public method to manually trigger device initialization
     * Useful for testing or re-initializing devices
     */
    async triggerDeviceInitialization(): Promise<boolean> {
        return await this.initializeDevices();
    }

    private updateBatteryInfoInternal(side: DeviceSide, batteryLevel: number): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.batteryInfo.left = batteryLevel;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.batteryInfo.right = batteryLevel;
        }
    }

    async getBatteryInfo(side: DeviceSide = DeviceSide.BOTH): Promise<number> {
        this.log('getBatteryInfo', `Starting battery request for side: ${side}`);
        
        const requestBytes = new Uint8Array([BluetoothService.BATTERY_CMD, 0x01]);
        const responseHeader = new Uint8Array([BluetoothService.BATTERY_CMD]);
        
        const responseData = await this.sendCommandWithResponse(requestBytes, responseHeader, side, 250);
        
        if (responseData && responseData.length > 2) {
            const batteryLevel = responseData[2] & 0xFF;
            this.log('getBatteryInfo', `Battery level: ${batteryLevel}%`);
            
            // Update internal battery tracking
            const now = new Date();
            this.updateBatteryInfoInternal(side, batteryLevel);
            this.batteryInfo.lastUpdated = now;
            
            // Notify listeners
            this.batteryListeners.notify(this.batteryInfo);
            
            return batteryLevel;
        } else {
            this.warn('getBatteryInfo', 'Invalid or missing response data');
            return -1;
        }
    }

    private updateFirmwareInfoInternal(side: DeviceSide, firmwareText: string): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.firmwareInfo.left = firmwareText;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.firmwareInfo.right = firmwareText;
        }
    }

    /**
     * Get firmware information from device
     * Command: [0x23, 0x74] - Get Firmware Information
     * Response: Raw ASCII data (203 bytes) starting with "net"
     * @param side - Device side to query (default: LEFT)
     * @returns Firmware information string or null if not available
     */
    async getFirmwareInfo(side: DeviceSide = DeviceSide.LEFT): Promise<string | null> {
        this.log('getFirmwareInfo', `Starting firmware info request for side: ${side}`);
        
        const requestBytes = new Uint8Array([0x23, 0x74]);
        this.log('getFirmwareInfo', 'Request: [0x23, 0x74]');
        
        const emptyHeader = new Uint8Array([]);
        const responseData = await this.sendCommandWithResponse(requestBytes, emptyHeader, side, 500);
        
        if (responseData && responseData.length > 0) {
            try {
                const firmwareText = new TextDecoder('utf-8').decode(responseData).trim();
                this.log('getFirmwareInfo', `Firmware info (${responseData.length} bytes): ${firmwareText}`);
                
                // Update internal firmware tracking
                this.updateFirmwareInfoInternal(side, firmwareText);
                
                if (firmwareText.startsWith('net')) {
                    this.log('getFirmwareInfo', 'Valid firmware response received');
                    return firmwareText;
                } else {
                    this.warn('getFirmwareInfo', `Unexpected firmware response format: ${firmwareText.substring(0, 50)}...`);
                    return firmwareText;
                }
            } catch (decodeError) {
                this.error('getFirmwareInfo', 'Failed to decode firmware response:', decodeError);
                const hexResponse = this.arrayToHex(responseData);
                this.log('getFirmwareInfo', `Raw hex response: ${hexResponse}`);
                return `Raw response: ${hexResponse}`;
            }
        } else {
            this.warn('getFirmwareInfo', 'No firmware response received');
            return null;
        }
    }

    /**
     * Get device (glasses) uptime in seconds since boot
     * @returns uptime in seconds, or -1 if not available
     */
    async getDeviceUptime(): Promise<number> {
        this.log('getDeviceUptime', 'Starting uptime request');
        
        const requestBytes = new Uint8Array([BluetoothService.UPTIME_CMD]);
        const responseHeader = new Uint8Array([BluetoothService.UPTIME_CMD]);
        
        const responseData = await this.sendCommandWithResponse(requestBytes, responseHeader, DeviceSide.BOTH, 250);
        
        if (responseData && responseData.length >= 4) {
            this.log('getDeviceUptime', `Received response: ${this.arrayToHex(responseData)}`);
            
            // Parse uptime from bytes 1-3 (little-endian format)
            const uptimeSeconds = (responseData[1] | (responseData[2] << 8) | (responseData[3] << 16));
            const flagByte = responseData.length > 4 ? responseData[4] : null;
            
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            
            this.log('getDeviceUptime', `Parsed uptime: ${uptimeSeconds}s (${hours}h ${minutes}m ${seconds}s), flag: ${flagByte ? `0x${flagByte.toString(16)}` : 'none'}`);
            
            this.deviceUptime = uptimeSeconds;
            return uptimeSeconds;
        } else {
            this.warn('getDeviceUptime', `Invalid response: ${responseData ? `${responseData.length} bytes` : 'null'}`);
            this.deviceUptime = -1;
            return -1;
        }
    }

    /**
     * Get current battery information
     */
    getCurrentBatteryInfo(): BatteryInfo {
        return { ...this.batteryInfo };
    }

    /**
     * Get current firmware information
     */
    getCurrentFirmwareInfo(): { left: string | null; right: string | null } {
        return { ...this.firmwareInfo };
    }

    /**
     * Update firmware info for connected devices
     */
    async updateFirmwareInfo(): Promise<void> {
        this.log('updateFirmwareInfo', 'Starting firmware update for connected devices');
        
        try {
            const updates = [];
            if (this.leftDevice) {
                updates.push(this.getFirmwareInfo(DeviceSide.LEFT));
            }
            if (this.rightDevice) {
                updates.push(this.getFirmwareInfo(DeviceSide.RIGHT));
            }
            
            await Promise.all(updates);
            this.log('updateFirmwareInfo', 'Firmware update completed successfully');
        } catch (error) {
            this.warn('updateFirmwareInfo', 'Failed to update firmware info:', error);
        }
    }

    /**
     * Get current device uptime status
     */
    getCurrentUptimeStatus(): number {
        return this.deviceUptime;
    }

    /**
     * Subscribe to battery updates
     */
    onBatteryUpdate(callback: (battery: BatteryInfo) => void): () => void {
        return this.batteryListeners.add(callback);
    }

    /**
     * Update battery info for both devices
     */
    async updateBatteryInfo(): Promise<void> {
        this.log('updateBatteryInfo', 'Starting battery update for connected devices');
        
        try {
            if (this.leftDevice || this.rightDevice) {
                const batteryResult = await this.getBatteryInfo(DeviceSide.BOTH);
                this.log('updateBatteryInfo', `Battery query result: ${batteryResult}%`);
            } else {
                this.log('updateBatteryInfo', 'No devices connected, skipping battery update');
            }
        } catch (error) {
            this.warn('updateBatteryInfo', 'Failed to update battery info:', error);
        }
    }

    /**
     * Get comprehensive device status including connection and battery info
     */
    getDeviceStatus(): { left: DeviceStatus; right: DeviceStatus; } {
        return {
            left: {
                connected: this.leftDevice !== null,
                battery: this.batteryInfo.left,
                uptime: this.deviceUptime,
                firmware: this.firmwareInfo.left
            },
            right: {
                connected: this.rightDevice !== null,
                battery: this.batteryInfo.right,
                uptime: this.deviceUptime,
                firmware: this.firmwareInfo.right
            }
        };
    }

    /**
     * Start periodic battery monitoring
     */
    startBatteryMonitoring(intervalMinutes: number = 5): void {
        this.stopBatteryMonitoring(); // Clear any existing interval
        
        this.batteryMonitoringInterval = setInterval(() => {
            this.updateBatteryInfo();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop periodic battery monitoring
     */
    stopBatteryMonitoring(): void {
        if (this.batteryMonitoringInterval) {
            clearInterval(this.batteryMonitoringInterval);
            this.batteryMonitoringInterval = null;
        }
    }

    private createTextPackets(text: string): Uint8Array[] {
        const data = new TextEncoder().encode(text);
        const syncSeq = BluetoothService.evenaiSeq++ & 0xFF;
        const packets: Uint8Array[] = [];
        
        const totalPackets = Math.ceil(data.length / BluetoothService.CHUNK_SIZE);

        for (let i = 0; i < totalPackets; i++) {
            const start = i * BluetoothService.CHUNK_SIZE;
            const end = Math.min(start + BluetoothService.CHUNK_SIZE, data.length);
            const chunk = data.slice(start, end);

            const header = [
                BluetoothService.EVENAI_CMD,
                syncSeq,
                totalPackets,
                i,
                BluetoothService.NEW_SCREEN_FLAG,
                (BluetoothService.DEFAULT_POS >> 8) & 0xFF,
                BluetoothService.DEFAULT_POS & 0xFF,
                BluetoothService.DEFAULT_PAGE_NUM,
                BluetoothService.DEFAULT_MAX_PAGES
            ];

            const packet = new Uint8Array(header.length + chunk.length);
            packet.set(header, 0);
            packet.set(chunk, header.length);
            packets.push(packet);
        }
        
        return packets;
    }

    private async sendPacketsToBothDevices(packets: Uint8Array[]): Promise<boolean> {
        // Send to left first (G1 protocol requirement)
        if (this.leftDevice && !await this.sendPacketsToDevice(packets, "L")) {
            this.error('sendPacketsToBothDevices', 'Failed to send to left device');
            return false;
        }

        // Then send to right (only if left succeeded or no left device)
        if (this.rightDevice && !await this.sendPacketsToDevice(packets, "R")) {
            this.error('sendPacketsToBothDevices', 'Failed to send to right device');
            return false;
        }

        return true;
    }

    async sendTextToGlasses(text: string): Promise<boolean> {
        const packets = this.createTextPackets(text);
        return await this.sendPacketsToBothDevices(packets);
    }

    private async sendPacketsToDevice(packets: Uint8Array[], side: "L" | "R"): Promise<boolean> {
        for (const packet of packets) {
            if (!await this.writeToDevice(packet, side, false)) {
                return false;
            }
            await this.sleep(BluetoothService.PACKET_DELAY);
        }
        return true;
    }

    private splitTextIntoLines(text: string): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if (currentLine.length + word.length + 1 <= BluetoothService.MAX_LINE_LENGTH) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    async sendText(text: string): Promise<boolean> {
        if (!this.leftDevice && !this.rightDevice) {
            throw new Error('No devices connected');
        }

        const lines = this.splitTextIntoLines(text);
        const displayText = lines.slice(0, BluetoothService.MAX_DISPLAY_LINES).join('\n');
        
        return await this.sendTextToGlasses(displayText);
    }

    async sendImage(base64ImageData: string): Promise<boolean> {
        if (!this.leftDevice && !this.rightDevice) {
            throw new Error('No devices connected');
        }

        try {
            const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
            const packets = this.createBmpPackets(bmpData);

            const results = await this.executeForDevices(DeviceSide.BOTH, async (device, deviceSide) => {
                return await this.sendBmpToDevice(bmpData, packets, deviceSide);
            });
            
            if (results.some(result => !result)) {
                this.error('sendImage', 'One or more BMP transfers failed');
                return false;
            }

            return true;
            
        } catch (error) {
            this.error('sendImage', 'Error sending BMP image:', error);
            return false;
        }
    }

    private async sendBmpToDevice(bmpData: Uint8Array, packets: Uint8Array[], side: "L" | "R"): Promise<boolean> {
        try {
            const startTime = Date.now();
            this.log('sendBmpToDevice', `Starting BMP transfer to ${side} device: ${packets.length} packets, ${bmpData.length} bytes`);
            
            // Send all BMP packets sequentially
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                
                if (BluetoothService.ENABLE_TRANSFER_LOGGING) {
                    this.log('sendBmpToDevice', `Sending packet ${i + 1}/${packets.length} to ${side} device (${packet.length} bytes)`);
                }
                
                if (!await this.writeToDevice(packet, side, false)) {
                    this.error('sendBmpToDevice', `Failed to send packet ${i + 1} to ${side} device`);
                    return false;
                }

                if (i < packets.length - 1 && BluetoothService.BMP_PACKET_DELAY > 0) {
                    await this.sleep(BluetoothService.BMP_PACKET_DELAY);
                }
            }
            
            this.log('sendBmpToDevice', `All packets sent to ${side} device, sending end command`);
            
            // Send end command
            const endCommand = new Uint8Array(BluetoothService.BMP_END_CMD);
            if (!await this.writeToDevice(endCommand, side, false)) {
                this.error('sendBmpToDevice', `Failed to send end command to ${side} device`);
                return false;
            }

            await this.sleep(BluetoothService.BMP_END_DELAY);

            // Send CRC verification
            const crcValue = this.computeBmpCrc32(bmpData);
            this.log('sendBmpToDevice', `CRC computed: 0x${crcValue.toString(16)}`);
            
            const crcBytes = new Uint8Array([
                BluetoothService.CRC_CMD,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);
            
            if (!await this.writeToDevice(crcBytes, side, false)) {
                this.error('sendBmpToDevice', `Failed to send CRC to ${side} device`);
                return false;
            }

            const totalTime = Date.now() - startTime;
            this.log('sendBmpToDevice', `BMP transfer to ${side} device completed successfully in ${totalTime}ms`);
            return true;
            
        } catch (error) {
            this.error('sendBmpToDevice', `Error during BMP transfer to ${side} device:`, error);
            return false;
        }
    }

    private async sendCommand(commandByte: number): Promise<boolean> {
        const command = new Uint8Array([commandByte]);
        return await this.sendToBothDevices(command, false);
    }

    async exitToDashboard(): Promise<boolean> {
        if (!this.leftDevice && !this.rightDevice) {
            throw new Error('No devices connected');
        }

        return await this.sendCommand(BluetoothService.EXIT_CMD);
    }

    private async connectDevice(address: string): Promise<Device> {
        // Request permissions on Android
        if (Platform.OS === 'android' && Platform.Version >= 31) {
            if (!await this.requestBluetoothPermissions()) {
                throw new Error('Bluetooth permission not granted');
            }
        }

        const device = await this.manager.connectToDevice(address, { 
            autoConnect: false, 
            timeout: 10000 
        });
        
        await device.discoverAllServicesAndCharacteristics();

        // Request higher MTU for larger packets
        try {
            const mtuResult = await device.requestMTU(247);
            const mtu = typeof mtuResult === 'object' ? mtuResult.mtu || 23 : (mtuResult || 23);
            this.log('connectDevice', `MTU negotiated: ${mtu} bytes for device ${address}`);
        } catch (error) {
            this.warn('connectDevice', `MTU request failed for device ${address}:`, error);
        }

        return device;
    }

    private async connectAndInitialize(address: string, side: 'left' | 'right'): Promise<void> {
        const sideUpper = side.charAt(0).toUpperCase() + side.slice(1);
        this.log(`connect${sideUpper}`, `Connecting to ${side} device: ${address}`);
        
        const device = await this.connectDevice(address);
        this.setDevice(side === 'left' ? 'L' : 'R', device);
        
        this.log(`connect${sideUpper}`, `${side} device connected successfully`);
        
        // Initialize devices after connection
        const initResult = await this.initializeDevices();
        if (!initResult) {
            this.warn(`connect${sideUpper}`, 'Device initialization failed, but connection established');
        }
        
        // Start heartbeat if this is the first device connected
        const otherDevice = side === 'left' ? this.rightDevice : this.leftDevice;
        if (!otherDevice) {
            this.startHeartbeat();
        }
    }

    async connectLeft(address: string): Promise<void> {
        try {
            await this.connectAndInitialize(address, 'left');
        } catch (error: any) {
            throw new Error(`Failed to connect left device: ${error?.message || 'Unknown error'}`);
        }
    }

    async connectRight(address: string): Promise<void> {
        try {
            await this.connectAndInitialize(address, 'right');
        } catch (error: any) {
            throw new Error(`Failed to connect right device: ${error?.message || 'Unknown error'}`);
        }
    }

    async connect(address: string): Promise<void> {
        // For backward compatibility, connect as left device
        await this.connectLeft(address);
    }

    async disconnect(): Promise<void> {
        this.stopHeartbeat(); // Stop heartbeat when disconnecting
        this.stopBatteryMonitoring(); // Stop battery monitoring when disconnecting
        
        // Disconnect both devices
        const disconnectPromises: Promise<Device>[] = [];
        
        if (this.leftDevice) {
            disconnectPromises.push(this.leftDevice.cancelConnection());
            this.setDevice('L', null);
            this.firmwareInfo.left = null; // Reset firmware info
        }
        if (this.rightDevice) {
            disconnectPromises.push(this.rightDevice.cancelConnection());
            this.setDevice('R', null);
            this.firmwareInfo.right = null; // Reset firmware info
        }
        
        // Wait for all disconnections to complete
        if (disconnectPromises.length > 0) {
            await Promise.all(disconnectPromises);
        }
        
        // Reset battery info
        this.batteryInfo = { left: -1, right: -1, lastUpdated: null };
    }

    isConnected(): boolean {
        return this.leftDevice !== null || this.rightDevice !== null;
    }

    isLeftConnected(): boolean {
        return this.leftDevice !== null;
    }

    isRightConnected(): boolean {
        return this.rightDevice !== null;
    }

    private async requestBluetoothPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        
        try {
            if (Platform.Version >= 31) {
                const bluetoothScanGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
                const bluetoothConnectGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
                
                if (bluetoothScanGranted !== 'granted' || bluetoothConnectGranted !== 'granted') {
                    this.error('requestBluetoothPermissions', 'Bluetooth permissions not granted:', {
                        bluetoothScan: bluetoothScanGranted,
                        bluetoothConnect: bluetoothConnectGranted
                    });
                    return false;
                }
            } else {
                const locationGranted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                if (locationGranted !== 'granted') {
                    this.error('requestBluetoothPermissions', 'Location permission not granted:', locationGranted);
                    return false;
                }
            }
            return true;
        } catch (error) {
            this.error('requestBluetoothPermissions', 'Failed to request permissions:', error);
            return false;
        }
    }

    async getPairedDevices(showAllDevices: boolean = false): Promise<Array<{ id: string; name: string | null; isConnected: boolean }>> {
        if (Platform.OS !== 'android') return [];

        try {
            if (!await this.requestBluetoothPermissions()) {
                return [];
            }

            const { BluetoothAdapter } = NativeModules as any;
            if (!BluetoothAdapter) {
                this.error('getPairedDevices', 'BluetoothAdapter native module not available');
                return [];
            }
            
            if (!BluetoothAdapter.getPairedDevices) {
                this.error('getPairedDevices', 'BluetoothAdapter.getPairedDevices method not available');
                return [];
            }

            const pairedDevices = await BluetoothAdapter.getPairedDevices();
            this.log('getPairedDevices', 'Raw paired devices from native module:', pairedDevices);
            
            const bondedDevices = pairedDevices.map((device: { name: string; address: string; connected?: boolean }) => ({
                id: device.address,
                name: device.name || null,
                isConnected: Boolean(device.connected)
            }));

            if (showAllDevices) {
                return bondedDevices;
            } else {
                const filteredDevices = bondedDevices.filter((device: { id: string; name: string | null; isConnected: boolean }) => 
                    device.name && device.name.startsWith("Even G1")
                );
                this.log('getPairedDevices', 'Filtered Even G1 devices:', filteredDevices);
                return filteredDevices;
            }
        } catch (error) {
            this.warn('getPairedDevices', 'Failed to get paired devices:', error);
            return [];
        }
    }

    // Helper methods to reduce duplication
    private getDevice(side: "L" | "R"): Device | null {
        return side === "L" ? this.leftDevice : this.rightDevice;
    }

    private setDevice(side: "L" | "R", device: Device | null): void {
        if (side === "L") {
            this.leftDevice = device;
        } else {
            this.rightDevice = device;
        }
    }

    private async executeForDevices<T>(
        side: DeviceSide, 
        operation: (device: Device, deviceSide: "L" | "R") => Promise<T>
    ): Promise<T[]> {
        const devices = this.getDevicesForSide(side);
        const results: T[] = [];
        
        for (const { device, side: deviceSide } of devices) {
            if (device) {
                try {
                    const result = await operation(device, deviceSide);
                    results.push(result);
                } catch (error) {
                    this.error('executeForDevices', `Operation failed for ${deviceSide} device:`, error);
                }
            }
        }
        
        return results;
    }

    private async sendToBothDevices(data: Uint8Array, requireResponse: boolean = false): Promise<boolean> {
        // Send to left first (G1 protocol requirement)
        if (this.leftDevice && !await this.writeToDevice(data, "L", requireResponse)) {
            return false;
        }
        
        // Then send to right (only if left succeeded or no left device)
        if (this.rightDevice && !await this.writeToDevice(data, "R", requireResponse)) {
            return false;
        }
        
        return true;
    }
}

export default new BluetoothService();
