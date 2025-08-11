import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { PERMISSIONS, request } from 'react-native-permissions';

class BluetoothService {
    private manager: BleManager;
    private leftDevice: Device | null = null;
    private rightDevice: Device | null = null;
    private static evenaiSeq: number = 0;
    private heartbeatSeq: number = 0;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatListeners: Array<(status: { left: boolean; right: boolean; timestamp: Date }) => void> = [];

    // Static UUIDs for all devices
    private static readonly SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    private static readonly CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    
    // Protocol constants
    private static readonly EVENAI_CMD = 0x4E;
    private static readonly EXIT_CMD = 0x18;
    private static readonly HEARTBEAT_CMD = 0x25;
    private static readonly BMP_DATA_CMD = 0x15;
    private static readonly BMP_END_CMD = [0x20, 0x0d, 0x0e];
    private static readonly CRC_CMD = 0x16;
    private static readonly CHUNK_SIZE = 200;
    private static readonly BMP_CHUNK_SIZE = 194;
    private static readonly BMP_STORAGE_ADDRESS = [0x00, 0x1c, 0x00, 0x00];
    private static readonly NEW_SCREEN_FLAG = 0x71;
    private static readonly MAX_LINE_LENGTH = 60;
    private static readonly MAX_DISPLAY_LINES = 5;
    private static readonly PACKET_DELAY = 5;        // Reduced from 10ms to 5ms
    private static readonly BMP_PACKET_DELAY = 3;    // Reduced from 8ms to 3ms  
    private static readonly BMP_END_DELAY = 50;      // Reduced from 100ms to 50ms
    private static readonly HEARTBEAT_INTERVAL_MS = 5000;
    
    // Default packet parameters
    private static readonly DEFAULT_POS = 0;
    private static readonly DEFAULT_PAGE_NUM = 1;
    private static readonly DEFAULT_MAX_PAGES = 1;

    constructor() {
        this.manager = new BleManager();
    }

    private convertToBase64(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString('base64');
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
     * Creates BMP packets using Java-style chunking (194-byte chunks)
     */
    private createBmpPackets(bmpData: Uint8Array): Uint8Array[] {
        const packets: Uint8Array[] = [];
        let syncId = 0;

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

    private combineHeaderAndData(prefix: number[], data: Uint8Array): Uint8Array {
        const combined = new Uint8Array(prefix.length + data.length);
        combined.set(prefix, 0);
        combined.set(data, prefix.length);
        return combined;
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

    private async writeToDevice(data: Uint8Array, side: "L" | "R"): Promise<boolean> {
        const device = side === "L" ? this.leftDevice : this.rightDevice;
        if (!device) return false;

        try {
            const base64 = this.convertToBase64(data);
            await device.writeCharacteristicWithResponseForService(
                BluetoothService.SERVICE_UUID,
                BluetoothService.CHARACTERISTIC_UUID,
                base64
            );
            return true;
        } catch (error) {
            console.error(`Write to ${side} device failed:`, error);
            return false;
        }
    }

    private async sendHeartbeatToDevice(side: "L" | "R"): Promise<boolean> {
        const heartbeatData = this.constructHeartbeat();
        return this.writeToDevice(heartbeatData, side);
    }

    private async performHeartbeat(): Promise<void> {
        // Always send to left first, then right (G1 protocol requirement)
        const leftSuccess = this.leftDevice ? await this.sendHeartbeatToDevice("L") : true;
        const rightSuccess = leftSuccess && this.rightDevice ? await this.sendHeartbeatToDevice("R") : true;

        // Notify listeners
        const status = {
            left: leftSuccess && this.leftDevice !== null,
            right: rightSuccess && this.rightDevice !== null,
            timestamp: new Date()
        };

        this.heartbeatListeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('Heartbeat listener error:', error);
            }
        });

        // Stop heartbeat if both devices failed
        if (!leftSuccess && !rightSuccess && (this.leftDevice || this.rightDevice)) {
            console.warn('All devices failed heartbeat, stopping manager');
            this.stopHeartbeat();
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat(); // Clear any existing interval
        
        console.log('Starting heartbeat manager');
        this.heartbeatInterval = setInterval(() => {
            this.performHeartbeat();
        }, BluetoothService.HEARTBEAT_INTERVAL_MS);

        // Send initial heartbeat immediately
        this.performHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            console.log('Stopping heartbeat manager');
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Public method to subscribe to heartbeat status updates
    onHeartbeatStatus(callback: (status: { left: boolean; right: boolean; timestamp: Date }) => void): () => void {
        this.heartbeatListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.heartbeatListeners.indexOf(callback);
            if (index > -1) {
                this.heartbeatListeners.splice(index, 1);
            }
        };
    }

    // Public method to manually trigger a heartbeat (useful for testing)
    async triggerHeartbeat(): Promise<void> {
        await this.performHeartbeat();
    }

    // Public method to get heartbeat interval status
    isHeartbeatRunning(): boolean {
        return this.heartbeatInterval !== null;
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
                (BluetoothService.DEFAULT_POS >> 8) & 0xFF,  // Position high byte
                BluetoothService.DEFAULT_POS & 0xFF,         // Position low byte
                BluetoothService.DEFAULT_PAGE_NUM,
                BluetoothService.DEFAULT_MAX_PAGES
            ];

            packets.push(this.combineHeaderAndData(header, chunk));
        }
        
        return packets;
    }

    async sendTextToGlasses(text: string): Promise<boolean> {
        const packets = this.createTextPackets(text);

        // Send to left first (G1 protocol requirement)
        if (this.leftDevice && !await this.sendPacketsToDevice(packets, "L")) {
            console.error('Failed to send to left device');
            return false;
        }

        // Then send to right (only if left succeeded or no left device)
        if (this.rightDevice && !await this.sendPacketsToDevice(packets, "R")) {
            console.error('Failed to send to right device');
            return false;
        }

        return true;
    }

    private async sendPacketsToDevice(packets: Uint8Array[], side: "L" | "R"): Promise<boolean> {
        for (const packet of packets) {
            if (!await this.writeToDevice(packet, side)) {
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
            // Convert base64 to binary data
            const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));

            // Create BMP packets using Java-style chunking
            const packets = this.createBmpPackets(bmpData);

            // Send to left device first (G1 protocol requirement)
            if (this.leftDevice && !await this.sendBmpToDevice(bmpData, packets, "L")) {
                console.error('Failed to send BMP to left device');
                return false;
            }

            // Then send to right device (only if left succeeded or no left device)
            if (this.rightDevice && !await this.sendBmpToDevice(bmpData, packets, "R")) {
                console.error('Failed to send BMP to right device');
                return false;
            }

            return true;
            
        } catch (error) {
            console.error('Error sending BMP image:', error);
            return false;
        }
    }

    private async sendBmpToDevice(bmpData: Uint8Array, packets: Uint8Array[], side: "L" | "R"): Promise<boolean> {
        try {
            // STEP 1: Send all BMP packets sequentially
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                
                if (!await this.writeToDevice(packet, side)) {
                    console.error(`Failed to send packet ${i + 1} to ${side} device`);
                    return false;
                }

                // Minimal delay between packets (3ms optimized)
                if (i < packets.length - 1) {
                    await this.sleep(BluetoothService.BMP_PACKET_DELAY);
                }
            }

            // STEP 2: Send end command
            const endCommand = new Uint8Array(BluetoothService.BMP_END_CMD);
            if (!await this.writeToDevice(endCommand, side)) {
                console.error(`Failed to send end command to ${side} device`);
                return false;
            }

            // Give time to process (50ms optimized)
            await this.sleep(BluetoothService.BMP_END_DELAY);

            // STEP 3: Send CRC verification
            const crcValue = this.computeBmpCrc32(bmpData);
            const crcBytes = new Uint8Array([
                BluetoothService.CRC_CMD,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);
            
            if (!await this.writeToDevice(crcBytes, side)) {
                console.error(`Failed to send CRC to ${side} device`);
                return false;
            }

            return true;
            
        } catch (error) {
            console.error(`Error during BMP transfer to ${side} device:`, error);
            return false;
        }
    }

    private async sendCommand(commandByte: number): Promise<boolean> {
        const command = new Uint8Array([commandByte]);

        // Send to left first (G1 protocol requirement)
        if (this.leftDevice && !await this.writeToDevice(command, "L")) {
            return false;
        }

        // Then send to right (only if left succeeded or no left device)
        if (this.rightDevice && !await this.writeToDevice(command, "R")) {
            return false;
        }

        return true;
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
            const bluetoothGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
            if (bluetoothGranted !== 'granted') {
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
            const mtu = await device.requestMTU(247);
            console.log(`Device MTU negotiated: ${mtu}`);
        } catch (error) {
            console.warn('MTU negotiation failed, using default');
        }

        return device;
    }

    async connectLeft(address: string): Promise<void> {
        try {
            this.leftDevice = await this.connectDevice(address);
            
            // Start heartbeat if this is the first device connected
            if (!this.rightDevice) {
                this.startHeartbeat();
            }
        } catch (error: any) {
            throw new Error(`Failed to connect left device: ${error?.message || 'Unknown error'}`);
        }
    }

    async connectRight(address: string): Promise<void> {
        try {
            this.rightDevice = await this.connectDevice(address);
            
            // Start heartbeat if this is the first device connected
            if (!this.leftDevice) {
                this.startHeartbeat();
            }
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
        
        if (this.leftDevice) {
            await this.leftDevice.cancelConnection();
            this.leftDevice = null;
        }
        if (this.rightDevice) {
            await this.rightDevice.cancelConnection();
            this.rightDevice = null;
        }
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

    async getPairedDevices(): Promise<Array<{ id: string; name: string | null; isConnected: boolean }>> {
        if (Platform.OS !== 'android') return [];

        try {
            // Request required permissions
            const locationGranted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            if (locationGranted !== 'granted') return [];

            if (Platform.Version >= 31) {
                const bluetoothGranted = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
                if (bluetoothGranted !== 'granted') return [];
            }

            const { BluetoothAdapter } = NativeModules as any;
            if (!BluetoothAdapter?.getPairedDevices) return [];

            const pairedDevices = await BluetoothAdapter.getPairedDevices();
            return pairedDevices.map((device: { name: string; address: string; connected?: boolean }) => ({
                id: device.address,
                name: device.name || null,
                isConnected: Boolean(device.connected)
            }));
        } catch (error) {
            console.warn('Failed to get paired devices:', error);
            return [];
        }
    }
}

export default new BluetoothService();
