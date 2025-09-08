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
    TEXT_COMMAND,
    UPTIME_CMD
} from '../Constants';
import { Utils } from '../Utils';
import { DataProcessor } from './DataProcessor';
import { DeviceCommunication } from './DeviceCommunication';

export class GlassesProtocol {
    private static evenaiSeq: number = 0;

    /**
     * Request battery level from device
     */
    static async requestBatteryLevel(device: Device): Promise<number | null> {
        const requestBytes = new Uint8Array([BATTERY_CMD, 0x01]);
        const response = await DeviceCommunication.sendCommandWithResponse(device, requestBytes, new Uint8Array([BATTERY_CMD]));
        if (response && response.length > 2) {
            return response[2] & 0xff;
        }
        return null;
    }

    /**
     * Request firmware information from device
     */
    static async requestFirmwareInfo(device: Device): Promise<string | null> {
        const response = await DeviceCommunication.sendCommandWithResponse(device, new Uint8Array(FIRMWARE_REQUEST_CMD), new Uint8Array([]));
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
        const response = await DeviceCommunication.sendCommandWithResponse(device, new Uint8Array([UPTIME_CMD]), new Uint8Array([UPTIME_CMD]));
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
        return await DeviceCommunication.writeToDevice(device, command, false);
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
        const response = await DeviceCommunication.sendCommandWithResponse(device, heartbeatData, new Uint8Array([HEARTBEAT_CMD]));
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

        console.log(`[GlassesProtocol] Creating BMP packets with chunk size: ${BMP_CHUNK_SIZE} bytes`);

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
     * Send text packets to device
     */
    static async sendTextToDevice(device: Device, text: string): Promise<boolean> {
        const packets = this.createTextPackets(text);
        return await DeviceCommunication.sendPacketsToDevice(device, packets, PACKET_DELAY);
    }

    /**
     * Send BMP data to a device
     */
    static async sendBmpToDevice(device: Device, bmpData: Uint8Array): Promise<boolean> {
        try {
            const startTime = Date.now();
            const packets = this.createBmpPackets(bmpData);
            console.log(`[GlassesProtocol] Starting BMP transfer: ${packets.length} packets, ${bmpData.length} bytes`);

            // Send all BMP packets sequentially
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];

                if (ENABLE_TRANSFER_LOGGING) {
                    console.log(`[GlassesProtocol] Sending packet ${i + 1}/${packets.length} (${packet.length} bytes)`);
                }

                if (!await DeviceCommunication.writeToDevice(device, packet, false)) {
                    console.error(`[GlassesProtocol] Failed to send packet ${i + 1}`);
                    return false;
                }

                if (i < packets.length - 1 && BMP_PACKET_DELAY > 0) {
                    await Utils.sleep(BMP_PACKET_DELAY);
                }
            }

            console.log('[GlassesProtocol] All packets sent, sending end command');

            // Send end command
            const endCommand = new Uint8Array(BMP_END_CMD);
            if (!await DeviceCommunication.writeToDevice(device, endCommand, false)) {
                console.error('[GlassesProtocol] Failed to send end command');
                return false;
            }

            await Utils.sleep(BMP_END_DELAY);

            // Send CRC verification
            const crcValue = DataProcessor.computeBmpCrc32(bmpData);
            console.log(`[GlassesProtocol] CRC computed: 0x${crcValue.toString(16)}`);

            const crcBytes = new Uint8Array([
                CRC_CMD,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);

            if (!await DeviceCommunication.writeToDevice(device, crcBytes, false)) {
                console.error('[GlassesProtocol] Failed to send CRC');
                return false;
            }

            const totalTime = Date.now() - startTime;
            console.log(`[GlassesProtocol] BMP transfer completed successfully in ${totalTime}ms`);
            return true;

        } catch (error) {
            console.error('[GlassesProtocol] Error during BMP transfer:', error);
            return false;
        }
    }
}