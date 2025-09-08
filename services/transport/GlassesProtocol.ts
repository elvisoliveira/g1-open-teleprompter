import { Device } from 'react-native-ble-plx';
import { ENABLE_TRANSFER_LOGGING } from '../constants/AppConstants';
import {
    GLASSES_BATTERY_CMD,
    GLASSES_BMP_CHUNK_SIZE,
    GLASSES_BMP_DATA_CMD,
    GLASSES_BMP_END_CMD,
    GLASSES_BMP_END_DELAY,
    GLASSES_BMP_PACKET_DELAY,
    GLASSES_BMP_STORAGE_ADDRESS,
    GLASSES_CHUNK_SIZE,
    GLASSES_CRC_CMD,
    GLASSES_DEFAULT_MAX_PAGES,
    GLASSES_DEFAULT_PAGE_NUM,
    GLASSES_DEFAULT_POS,
    GLASSES_EXIT_CMD,
    GLASSES_FIRMWARE_REQUEST_CMD,
    GLASSES_HEARTBEAT_CMD,
    GLASSES_NEW_SCREEN_FLAG,
    GLASSES_PACKET_DELAY,
    GLASSES_TEXT_CMD,
    GLASSES_UPTIME_CMD
} from '../constants/GlassesConstants';
import { TextFormatter } from '../TextFormatter';
import { BluetoothTransport } from './BluetoothTransport';
import { CrcCalculator } from './CrcCalculator';

export class GlassesProtocol {
    private static evenaiSeq: number = 0;

    /**
     * Request battery level from device
     */
    static async requestBatteryLevel(device: Device): Promise<number | null> {
        const requestBytes = new Uint8Array([GLASSES_BATTERY_CMD, 0x01]);
        const response = await BluetoothTransport.sendCommandWithResponse(device, requestBytes, new Uint8Array([GLASSES_BATTERY_CMD]));
        if (response && response.length > 2) {
            return response[2] & 0xff;
        }
        return null;
    }

    /**
     * Request firmware information from device
     */
    static async requestFirmwareInfo(device: Device): Promise<string | null> {
        const response = await BluetoothTransport.sendCommandWithResponse(device, new Uint8Array(GLASSES_FIRMWARE_REQUEST_CMD), new Uint8Array([]));
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
        const response = await BluetoothTransport.sendCommandWithResponse(device, new Uint8Array([GLASSES_UPTIME_CMD]), new Uint8Array([GLASSES_UPTIME_CMD]));
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
        const command = new Uint8Array([GLASSES_EXIT_CMD]);
        return await BluetoothTransport.writeToDevice(device, command, false);
    }

    /**
     * Send heartbeat and verify response
     */
    static async sendHeartbeat(device: Device, seq: number): Promise<boolean> {
        const heartbeatData = new Uint8Array([
            GLASSES_HEARTBEAT_CMD,
            6,
            0,
            seq & 0xff,
            0x04,
            seq & 0xff
        ]);
        const response = await BluetoothTransport.sendCommandWithResponse(device, heartbeatData, new Uint8Array([GLASSES_HEARTBEAT_CMD]));
        return !!response && response.length > 5 && response[0] === GLASSES_HEARTBEAT_CMD && response[4] === 0x04;
    }

    /**
     * Create text packets for transmission
     */
    static createTextPackets(text: string): Uint8Array[] {
        const data = new TextEncoder().encode(text);
        const syncSeq = this.evenaiSeq++ & 0xFF;
        const packets: Uint8Array[] = [];

        const totalPackets = Math.ceil(data.length / GLASSES_CHUNK_SIZE);

        for (let i = 0; i < totalPackets; i++) {
            const start = i * GLASSES_CHUNK_SIZE;
            const end = Math.min(start + GLASSES_CHUNK_SIZE, data.length);
            const chunk = data.slice(start, end);

            const header = [
                GLASSES_TEXT_CMD,
                syncSeq,
                totalPackets,
                i,
                GLASSES_NEW_SCREEN_FLAG,
                (GLASSES_DEFAULT_POS >> 8) & 0xFF,
                GLASSES_DEFAULT_POS & 0xFF,
                GLASSES_DEFAULT_PAGE_NUM,
                GLASSES_DEFAULT_MAX_PAGES
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

        console.log(`[GlassesProtocol] Creating BMP packets with chunk size: ${GLASSES_BMP_CHUNK_SIZE} bytes`);

        for (let i = 0; i < bmpData.length; i += GLASSES_BMP_CHUNK_SIZE) {
            const end = Math.min(i + GLASSES_BMP_CHUNK_SIZE, bmpData.length);
            const chunk = bmpData.slice(i, end);

            if (i === 0) {
                // First packet: [0x15, syncId, storageAddress(4 bytes), data]
                const packet = new Uint8Array(2 + GLASSES_BMP_STORAGE_ADDRESS.length + chunk.length);
                packet[0] = GLASSES_BMP_DATA_CMD; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(GLASSES_BMP_STORAGE_ADDRESS, 2); // 0x00, 0x1c, 0x00, 0x00
                packet.set(chunk, 6);
                packets.push(packet);
            } else {
                // Other packets: [0x15, syncId, data]
                const packet = new Uint8Array(2 + chunk.length);
                packet[0] = GLASSES_BMP_DATA_CMD; // 0x15
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
        return await BluetoothTransport.sendPacketsToDevice(device, packets, GLASSES_PACKET_DELAY);
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

                if (!await BluetoothTransport.writeToDevice(device, packet, false)) {
                    console.error(`[GlassesProtocol] Failed to send packet ${i + 1}`);
                    return false;
                }

                if (i < packets.length - 1 && GLASSES_BMP_PACKET_DELAY > 0) {
                    await TextFormatter.sleep(GLASSES_BMP_PACKET_DELAY);
                }
            }

            console.log('[GlassesProtocol] All packets sent, sending end command');

            // Send end command
            const endCommand = new Uint8Array(GLASSES_BMP_END_CMD);
            if (!await BluetoothTransport.writeToDevice(device, endCommand, false)) {
                console.error('[GlassesProtocol] Failed to send end command');
                return false;
            }

            await TextFormatter.sleep(GLASSES_BMP_END_DELAY);

            // Send CRC verification
            const crcValue = CrcCalculator.computeBmpCrc32(bmpData);
            console.log(`[GlassesProtocol] CRC computed: 0x${crcValue.toString(16)}`);

            const crcBytes = new Uint8Array([
                GLASSES_CRC_CMD,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);

            if (!await BluetoothTransport.writeToDevice(device, crcBytes, false)) {
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