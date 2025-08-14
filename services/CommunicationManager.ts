import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import {
    BMP_CHUNK_SIZE,
    BMP_DATA_CMD,
    BMP_END_CMD,
    BMP_END_DELAY,
    BMP_PACKET_DELAY,
    BMP_STORAGE_ADDRESS,
    CHUNK_SIZE,
    CRC_CMD,
    DEFAULT_MAX_PAGES,
    DEFAULT_PAGE_NUM,
    DEFAULT_POS,
    ENABLE_TRANSFER_LOGGING,
    EVENAI_CMD,
    NEW_SCREEN_FLAG,
    PACKET_DELAY,
    READ_CHARACTERISTIC_UUID,
    SERVICE_UUID,
    WRITE_CHARACTERISTIC_UUID
} from './constants';
import { Utils } from './utils';

export class CommunicationManager {
    private static evenaiSeq: number = 0;

    /**
     * Write data to a specific device
     */
    static async writeToDevice(
        device: Device, 
        data: Uint8Array, 
        requireResponse: boolean = false
    ): Promise<boolean> {
        try {
            const base64 = Buffer.from(data).toString('base64');
            console.log(`[CommunicationManager] Writing ${requireResponse ? 'with' : 'without'} response: ${Utils.arrayToHex(data)}`);
            
            if (requireResponse) {
                await device.writeCharacteristicWithResponseForService(
                    SERVICE_UUID,
                    WRITE_CHARACTERISTIC_UUID,
                    base64
                );
            } else {
                try {
                    await device.writeCharacteristicWithoutResponseForService(
                        SERVICE_UUID,
                        WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                } catch (writeError) {
                    console.warn('[CommunicationManager] Write without response failed, fallback to with response');
                    await device.writeCharacteristicWithResponseForService(
                        SERVICE_UUID,
                        WRITE_CHARACTERISTIC_UUID,
                        base64
                    );
                }
            }
            return true;
        } catch (error) {
            console.error('[CommunicationManager] Write failed:', error);
            return false;
        }
    }

    /**
     * Send command with response and handle notifications
     */
    static async sendCommandWithResponse(
        device: Device,
        requestBytes: Uint8Array, 
        expectedHeader: Uint8Array, 
        waitTimeMs: number = 250
    ): Promise<Uint8Array | null> {
        console.log(`[CommunicationManager] Command: ${Utils.arrayToHex(requestBytes)}, expecting header: ${Utils.arrayToHex(expectedHeader)}`);
        
        try {
            // Try to set up notification listener for responses
            let responseReceived: Uint8Array | null = null;
            
            // Try to monitor both characteristics for notifications
            for (const charUUID of [READ_CHARACTERISTIC_UUID, WRITE_CHARACTERISTIC_UUID]) {
                try {
                    console.log(`[CommunicationManager] Setting up notifications on ${charUUID === READ_CHARACTERISTIC_UUID ? 'READ' : 'WRITE'} characteristic`);
                    
                    const responsePromise = new Promise<Uint8Array | null>((resolve) => {
                        const timeout = setTimeout(() => {
                            console.log('[CommunicationManager] Notification timeout');
                            resolve(null);
                        }, waitTimeMs + 1000);
                        
                        device.monitorCharacteristicForService(
                            SERVICE_UUID,
                            charUUID,
                            (error, characteristic) => {
                                clearTimeout(timeout);
                                if (error) {
                                    console.log('[CommunicationManager] Notification error:', error);
                                    resolve(null);
                                    return;
                                }
                                
                                if (characteristic?.value) {
                                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                                    console.log(`[CommunicationManager] Received notification: ${Utils.arrayToHex(data)}`);
                                    resolve(data);
                                } else {
                                    resolve(null);
                                }
                            }
                        );
                    });

                    // Send the command
                    const success = await this.writeToDevice(device, requestBytes, true);
                    if (!success) {
                        console.error('[CommunicationManager] Failed to write command');
                        continue;
                    }

                    // Wait for notification response
                    responseReceived = await responsePromise;
                    
                    if (responseReceived && (expectedHeader.length === 0 || this.headerMatches(responseReceived, expectedHeader))) {
                        console.log('[CommunicationManager] Valid notification response received');
                        return responseReceived;
                    }
                    
                    break; // Exit characteristic loop if we got some response
                } catch (notifyError) {
                    console.log('[CommunicationManager] Failed to set up notifications');
                    continue;
                }
            }

            // Fallback: Direct read approach if notifications failed
            if (!responseReceived) {
                console.log('[CommunicationManager] Falling back to direct read approach');
                
                // Send command if not sent yet
                const success = await this.writeToDevice(device, requestBytes, true);
                if (!success) {
                    console.error('[CommunicationManager] Failed to write command');
                    return null;
                }

                // Wait for device to process
                if (waitTimeMs > 0) {
                    await Utils.sleep(waitTimeMs);
                }

                // Try reading from both characteristics
                for (const charUUID of [READ_CHARACTERISTIC_UUID, WRITE_CHARACTERISTIC_UUID]) {
                    try {
                        console.log(`[CommunicationManager] Attempting to read from ${charUUID === READ_CHARACTERISTIC_UUID ? 'READ' : 'write'} characteristic`);
                        
                        const characteristic = await device.readCharacteristicForService(
                            SERVICE_UUID,
                            charUUID
                        );
                        
                        if (characteristic?.value) {
                            const responseData = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                            console.log(`[CommunicationManager] Response: ${Utils.arrayToHex(responseData)}`);
                            
                            // Check header match
                            if (expectedHeader.length === 0 || this.headerMatches(responseData, expectedHeader)) {
                                return responseData;
                            }
                        }
                    } catch (readError) {
                        console.log('[CommunicationManager] Failed to read from characteristic');
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('[CommunicationManager] Top-level error:', error);
            return null;
        }
    }

    /**
     * Check if response header matches expected header
     */
    private static headerMatches(responseData: Uint8Array, expectedHeader: Uint8Array): boolean {
        if (responseData.length < expectedHeader.length) return false;
        for (let i = 0; i < expectedHeader.length; i++) {
            if (responseData[i] !== expectedHeader[i]) return false;
        }
        return true;
    }

    /**
     * Create text packets for transmission
     */
    static createTextPackets(text: string): Uint8Array[] {
        const data = new TextEncoder().encode(text);
        const syncSeq = this.evenaiSeq++ & 0xFF;
        const packets: Uint8Array[] = [];
        
        const totalPackets = Math.ceil(data.length / CHUNK_SIZE);

        for (let i = 0; i < totalPackets; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, data.length);
            const chunk = data.slice(start, end);

            const header = [
                EVENAI_CMD,
                syncSeq,
                totalPackets,
                i,
                NEW_SCREEN_FLAG,
                (DEFAULT_POS >> 8) & 0xFF,
                DEFAULT_POS & 0xFF,
                DEFAULT_PAGE_NUM,
                DEFAULT_MAX_PAGES
            ];

            const packet = new Uint8Array(header.length + chunk.length);
            packet.set(header, 0);
            packet.set(chunk, header.length);
            packets.push(packet);
        }
        
        return packets;
    }

    /**
     * Create BMP packets using G1-compatible chunks
     */
    static createBmpPackets(bmpData: Uint8Array): Uint8Array[] {
        const packets: Uint8Array[] = [];
        let syncId = 0;
        
        console.log(`[CommunicationManager] Creating BMP packets with chunk size: ${BMP_CHUNK_SIZE} bytes`);

        for (let i = 0; i < bmpData.length; i += BMP_CHUNK_SIZE) {
            const end = Math.min(i + BMP_CHUNK_SIZE, bmpData.length);
            const chunk = bmpData.slice(i, end);
            
            if (i === 0) {
                // First packet: [0x15, syncId, storageAddress(4 bytes), data]
                const packet = new Uint8Array(2 + BMP_STORAGE_ADDRESS.length + chunk.length);
                packet[0] = BMP_DATA_CMD; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(BMP_STORAGE_ADDRESS, 2); // 0x00, 0x1c, 0x00, 0x00
                packet.set(chunk, 6);
                packets.push(packet);
            } else {
                // Other packets: [0x15, syncId, data]
                const packet = new Uint8Array(2 + chunk.length);
                packet[0] = BMP_DATA_CMD; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(chunk, 2);
                packets.push(packet);
            }
            
            syncId++;
        }

        return packets;
    }

    /**
     * Send packets to a device with delays
     */
    static async sendPacketsToDevice(device: Device, packets: Uint8Array[], delayMs: number = PACKET_DELAY): Promise<boolean> {
        for (const packet of packets) {
            if (!await this.writeToDevice(device, packet, false)) {
                return false;
            }
            if (delayMs > 0) {
                await Utils.sleep(delayMs);
            }
        }
        return true;
    }

    /**
     * Send BMP data to a device
     */
    static async sendBmpToDevice(device: Device, bmpData: Uint8Array, packets: Uint8Array[]): Promise<boolean> {
        try {
            const startTime = Date.now();
            console.log(`[CommunicationManager] Starting BMP transfer: ${packets.length} packets, ${bmpData.length} bytes`);
            
            // Send all BMP packets sequentially
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                
                if (ENABLE_TRANSFER_LOGGING) {
                    console.log(`[CommunicationManager] Sending packet ${i + 1}/${packets.length} (${packet.length} bytes)`);
                }
                
                if (!await this.writeToDevice(device, packet, false)) {
                    console.error(`[CommunicationManager] Failed to send packet ${i + 1}`);
                    return false;
                }

                if (i < packets.length - 1 && BMP_PACKET_DELAY > 0) {
                    await Utils.sleep(BMP_PACKET_DELAY);
                }
            }
            
            console.log('[CommunicationManager] All packets sent, sending end command');
            
            // Send end command
            const endCommand = new Uint8Array(BMP_END_CMD);
            if (!await this.writeToDevice(device, endCommand, false)) {
                console.error('[CommunicationManager] Failed to send end command');
                return false;
            }

            await Utils.sleep(BMP_END_DELAY);

            // Send CRC verification
            const crcValue = this.computeBmpCrc32(bmpData);
            console.log(`[CommunicationManager] CRC computed: 0x${crcValue.toString(16)}`);
            
            const crcBytes = new Uint8Array([
                CRC_CMD,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);
            
            if (!await this.writeToDevice(device, crcBytes, false)) {
                console.error('[CommunicationManager] Failed to send CRC');
                return false;
            }

            const totalTime = Date.now() - startTime;
            console.log(`[CommunicationManager] BMP transfer completed successfully in ${totalTime}ms`);
            return true;
            
        } catch (error) {
            console.error('[CommunicationManager] Error during BMP transfer:', error);
            return false;
        }
    }

    /**
     * Compute CRC32 for BMP data verification
     */
    static computeCrc32(data: Uint8Array): number {
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
     * Compute CRC32 for BMP data including storage address as per G1 protocol
     */
    static computeBmpCrc32(bmpData: Uint8Array): number {
        // Combine storage address + BMP data for CRC calculation
        const combinedData = new Uint8Array(BMP_STORAGE_ADDRESS.length + bmpData.length);
        combinedData.set(BMP_STORAGE_ADDRESS, 0);
        combinedData.set(bmpData, BMP_STORAGE_ADDRESS.length);
        
        return this.computeCrc32(combinedData);
    }
} 