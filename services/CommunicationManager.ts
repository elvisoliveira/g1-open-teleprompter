import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import {
    BATTERY_CMD,
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
    EXIT_CMD,
    FIRMWARE_REQUEST_CMD,
    HEARTBEAT_CMD,
    NEW_SCREEN_FLAG,
    PACKET_DELAY,
    READ_CHARACTERISTIC_UUID,
    SERVICE_UUID,
    TELEPROMPTER_CMD,
    TELEPROMPTER_END_CMD,
    TELEPROMPTER_FINISH,
    TELEPROMPTER_FLAGS_MANUAL,
    TELEPROMPTER_FLAGS_NORMAL,
    TELEPROMPTER_NEW_SCREEN_MANUAL,
    TELEPROMPTER_NEW_SCREEN_NORMAL,
    TELEPROMPTER_PACKET_DELAY,
    TELEPROMPTER_RESERVED,
    TELEPROMPTER_SUBCMD,
    TEXT_COMMAND,
    UPTIME_CMD,
    WRITE_CHARACTERISTIC_UUID
} from './constants';
import { Utils } from './utils';

export class CommunicationManager {
    private static evenaiSeq: number = 0;

    /**
     * Write data to a specific device
     */
    private static async writeToDevice(
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
    private static async sendCommandWithResponse(
        device: Device,
        requestBytes: Uint8Array,
        expectedHeader: Uint8Array,
        waitTimeMs: number = 250
    ): Promise<Uint8Array | null> {
        console.log(`[CommunicationManager] Command: ${Utils.arrayToHex(requestBytes)}, expecting header: ${Utils.arrayToHex(expectedHeader)}`);

        try {
            const responsePromise = new Promise<Uint8Array | null>((resolve) => {
                const timeout = setTimeout(() => resolve(null), waitTimeMs + 1000);
                const subscription = device.monitorCharacteristicForService(
                    SERVICE_UUID,
                    READ_CHARACTERISTIC_UUID,
                    (error, characteristic) => {
                        clearTimeout(timeout);
                        subscription.remove();
                        if (error || !characteristic?.value) {
                            resolve(null);
                            return;
                        }
                        const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                        console.log(`[CommunicationManager] Received notification: ${Utils.arrayToHex(data)}`);
                        resolve(data);
                    }
                );
            });

            const success = await this.writeToDevice(device, requestBytes, true);
            if (!success) {
                console.error('[CommunicationManager] Failed to write command');
                return null;
            }

            const response = await responsePromise;
            if (response && (expectedHeader.length === 0 || this.headerMatches(response, expectedHeader))) {
                return response;
            }

            if (waitTimeMs > 0) {
                await Utils.sleep(waitTimeMs);
            }

            try {
                const characteristic = await device.readCharacteristicForService(
                    SERVICE_UUID,
                    READ_CHARACTERISTIC_UUID
                );
                if (characteristic?.value) {
                    const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
                    console.log(`[CommunicationManager] Response: ${Utils.arrayToHex(data)}`);
                    if (expectedHeader.length === 0 || this.headerMatches(data, expectedHeader)) {
                        return data;
                    }
                }
            } catch (readError) {
                console.log('[CommunicationManager] Failed to read from characteristic');
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
     * Request battery level from device
     */
    static async requestBatteryLevel(device: Device): Promise<number | null> {
        const requestBytes = new Uint8Array([BATTERY_CMD, 0x01]);
        const response = await this.sendCommandWithResponse(device, requestBytes, new Uint8Array([BATTERY_CMD]), 250);
        if (response && response.length > 2) {
            return response[2] & 0xff;
        }
        return null;
    }

    /**
     * Request firmware information from device
     */
    static async requestFirmwareInfo(device: Device): Promise<string | null> {
        const response = await this.sendCommandWithResponse(device, new Uint8Array(FIRMWARE_REQUEST_CMD), new Uint8Array([]), 500);
        if (response && response.length > 0) {
            try {
                return new TextDecoder('utf-8').decode(response).trim();
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Request device uptime
     */
    static async requestUptime(device: Device): Promise<number | null> {
        const response = await this.sendCommandWithResponse(device, new Uint8Array([UPTIME_CMD]), new Uint8Array([UPTIME_CMD]), 250);
        console.log('uptime response');
        console.log(response);
        if (response && response.length >= 4) {
            const low = response[2] & 0xFF;
            const high = response[3] & 0xFF;
            return (high << 8) | low; // seconds since boot
        }
        return null;
    }

    /**
     * Send exit command
     */
    static async sendExitCommand(device: Device): Promise<boolean> {
        const command = new Uint8Array([EXIT_CMD]);
        return await this.writeToDevice(device, command, false);
    }

    /**
     * Send heartbeat and verify response
     */
    static async sendHeartbeat(device: Device, seq: number): Promise<boolean> {
        const heartbeatData = new Uint8Array([
            HEARTBEAT_CMD,
            6,
            0,
            seq & 0xff,
            0x04,
            seq & 0xff
        ]);
        const response = await this.sendCommandWithResponse(device, heartbeatData, new Uint8Array([HEARTBEAT_CMD]), 1500);
        return !!response && response.length > 5 && response[0] === HEARTBEAT_CMD && response[4] === 0x04;
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
                TEXT_COMMAND,
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

    // Teleprompter Methods
    /**
     * Send teleprompter packets to a device
     */
    static async sendTeleprompterPackets(device: Device, packets: Uint8Array[]): Promise<boolean> {
        try {
            for (const packet of packets) {
                if (!await this.writeToDevice(device, packet, false)) {
                    console.error('[CommunicationManager] Failed to send teleprompter packet');
                    return false;
                }
                // Small delay between packets to ensure proper transmission
                if (packets.length > 1) {
                    await Utils.sleep(TELEPROMPTER_PACKET_DELAY);
                }
            }
            return true;
        } catch (error) {
            console.error('[CommunicationManager] Failed to send teleprompter packets:', error);
            return false;
        }
    }

    /**
     * Send teleprompter end packet to a device
     */
    static async sendTeleprompterEndPacket(device: Device, endPacket: Uint8Array): Promise<boolean> {
        try {
            return await this.writeToDevice(device, endPacket, false);
        } catch (error) {
            console.error('[CommunicationManager] Failed to send teleprompter end packet:', error);
            return false;
        }
    }

    /**
     * Build a single teleprompter value packet
     */
    static buildTeleprompterValue(params: {
        seq: number;
        newScreen: number;
        numPackets: number;
        partIdx: number;
        startDelaySeconds: number;
        flags: number;
        payload: Uint8Array;
    }): Uint8Array {
        const { seq, newScreen, numPackets, partIdx, startDelaySeconds, flags, payload } = params;

        // Build control array (10 bytes)
        const control = new Uint8Array([
            TELEPROMPTER_RESERVED,           // reserved0
            seq & 0xFF,                      // seq
            newScreen & 0xFF,                // newScreen
            numPackets & 0xFF,               // numPackets
            TELEPROMPTER_RESERVED,           // reserved1
            partIdx & 0xFF,                  // partIdx
            TELEPROMPTER_RESERVED,           // reserved2
            startDelaySeconds & 0xFF,        // startDelaySeconds (stopwatch delay)
            flags & 0xFF,                    // flags
            TELEPROMPTER_RESERVED            // reserved3
        ]);

        // Calculate total length
        const len = 12 + payload.length; // cmd(1) + len(1) + control(10) + payload
        if (len > 255) {
            throw new Error(`Teleprompter value too large: ${len} > 255 bytes`);
        }

        // Build the complete packet
        const packet = new Uint8Array(2 + control.length + payload.length);
        packet[0] = TELEPROMPTER_CMD;        // Cmd.Teleprompter
        packet[1] = len;                     // total length
        packet.set(control, 2);              // control array
        packet.set(payload, 12);             // payload

        return packet;
    }

    /**
     * Build teleprompter packets for visible and next text
     */
    static buildTeleprompterPackets(
        visibleText: string,
        nextText: string,
        startDelaySeconds: number,
        manual: boolean,
        sequence: number
    ): Uint8Array[] {
        const packets: Uint8Array[] = [];
        const mode = manual ? TELEPROMPTER_NEW_SCREEN_MANUAL : TELEPROMPTER_NEW_SCREEN_NORMAL;
        const flags = manual ? TELEPROMPTER_FLAGS_MANUAL : TELEPROMPTER_FLAGS_NORMAL;
        const numPackets = nextText ? 2 : 1;

        // Build visible text packet (part 1)
        const visiblePayload = this.formatTeleprompterPayload(visibleText);
        packets.push(this.buildTeleprompterValue({
            seq: sequence,
            newScreen: mode,
            numPackets,
            partIdx: 1,
            startDelaySeconds,
            flags,
            payload: visiblePayload
        }));

        // Build next text packet (part 2) if needed
        if (nextText) {
            const nextSequence = (sequence + 1) & 0xFF;
            const nextPayload = this.formatTeleprompterPayload(nextText);
            packets.push(this.buildTeleprompterValue({
                seq: nextSequence,
                newScreen: mode,
                numPackets: 2,
                partIdx: 2,
                startDelaySeconds,
                flags,
                payload: nextPayload
            }));
        }

        return packets;
    }

    /**
     * Build the end packet for teleprompter
     */
    static buildTeleprompterEndPacket(sequence: number): Uint8Array {
        // Tiny "end" control packet: [0x09, 0x06, 0x00, seq, 0x05, 0x01]
        return new Uint8Array([
            TELEPROMPTER_CMD,                // Cmd.Teleprompter
            TELEPROMPTER_END_CMD,            // cmd = End
            TELEPROMPTER_RESERVED,           // reserved
            sequence & 0xFF,                 // current seq (don't increment)
            TELEPROMPTER_SUBCMD,             // subCmd
            TELEPROMPTER_FINISH              // finish
        ]);
    }

    /**
     * Format text payload for teleprompter with common formatting
     */
    static formatTeleprompterPayload(
        text: string,
        leftPadSpaces: number = 0
    ): Uint8Array {
        const parts: number[] = [];

        // Add left padding spaces
        for (let i = 0; i < leftPadSpaces; i++) {
            parts.push(0x20);
        }

        // Add text as UTF-8 bytes
        const textEncoder = new TextEncoder();
        const textBytes = textEncoder.encode(text);
        parts.push(...textBytes);

        return new Uint8Array(parts);
    }
} 