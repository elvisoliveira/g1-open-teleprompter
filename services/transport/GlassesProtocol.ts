import { Device } from 'react-native-ble-plx';
import {
    CHARACTERISTIC_SERVICE,
    GLASSES_BMP_CHUNK_SIZE,
    GLASSES_BMP_END_DELAY,
    GLASSES_BMP_PACKET_DELAY,
    GLASSES_BMP_STORAGE_ADDRESS,
    GLASSES_CHUNK_SIZE,
    GLASSES_CMD_BATTERY,
    GLASSES_CMD_BMP_DATA,
    GLASSES_CMD_BMP_END,
    GLASSES_CMD_CRC,
    GLASSES_CMD_EXIT,
    GLASSES_CMD_FIRMWARE_REQUEST,
    GLASSES_CMD_HEARTBEAT,
    GLASSES_CMD_TEXT,
    GLASSES_DEFAULT_MAX_PAGES,
    GLASSES_DEFAULT_PAGE_NUM,
    GLASSES_DEFAULT_POS,
    GLASSES_NEW_SCREEN_FLAG
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
        const requestBytes = new Uint8Array([GLASSES_CMD_BATTERY, 0x01]);
        const response = await BluetoothTransport.sendCommandWithResponse(CHARACTERISTIC_SERVICE, device, requestBytes, new Uint8Array([GLASSES_CMD_BATTERY]));
        if (response && response.length > 2) {
            return response[2] & 0xff;
        }
        return null;
    }

    /**
     * Request firmware information from device
     */
    static async requestFirmwareInfo(device: Device): Promise<string | null> {
        const response = await BluetoothTransport.sendCommandWithResponse(CHARACTERISTIC_SERVICE, device, new Uint8Array(GLASSES_CMD_FIRMWARE_REQUEST), new Uint8Array([]));
        if (response && response.length > 0) {
            try {
                const text = new TextDecoder('utf-8').decode(response).trim();
                // The empty expected header accepts any notification; only printable ASCII is firmware text
                return /^[\x20-\x7E\s]+$/.test(text) ? text : null;
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Send exit command
     */
    static async sendExitCommand(device: Device): Promise<boolean> {
        const command = new Uint8Array([GLASSES_CMD_EXIT]);
        return await BluetoothTransport.writeToDevice(CHARACTERISTIC_SERVICE, device, command, false);
    }

    /**
     * Send heartbeat and verify response
     */
    static async sendHeartbeat(device: Device, seq: number): Promise<boolean> {
        const heartbeatData = new Uint8Array([
            GLASSES_CMD_HEARTBEAT,
            6,
            0,
            seq & 0xff,
            0x04,
            seq & 0xff
        ]);
        const response = await BluetoothTransport.sendCommandWithResponse(CHARACTERISTIC_SERVICE, device, heartbeatData, new Uint8Array([GLASSES_CMD_HEARTBEAT]));
        return !!response && response.length > 5 && response[0] === GLASSES_CMD_HEARTBEAT && response[4] === 0x04;
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
                GLASSES_CMD_TEXT,
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

        for (let i = 0; i < bmpData.length; i += GLASSES_BMP_CHUNK_SIZE) {
            const end = Math.min(i + GLASSES_BMP_CHUNK_SIZE, bmpData.length);
            const chunk = bmpData.slice(i, end);

            if (i === 0) {
                // First packet: [0x15, syncId, storageAddress(4 bytes), data]
                const packet = new Uint8Array(2 + GLASSES_BMP_STORAGE_ADDRESS.length + chunk.length);
                packet[0] = GLASSES_CMD_BMP_DATA; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(GLASSES_BMP_STORAGE_ADDRESS, 2); // 0x00, 0x1c, 0x00, 0x00
                packet.set(chunk, 6);
                packets.push(packet);
            } else {
                // Other packets: [0x15, syncId, data]
                const packet = new Uint8Array(2 + chunk.length);
                packet[0] = GLASSES_CMD_BMP_DATA; // 0x15
                packet[1] = syncId & 0xFF;
                packet.set(chunk, 2);
                packets.push(packet);
            }

            syncId++;
        }

        return packets;
    }

    /**
     * Send BMP data to a device
     */
    static async sendBmpToDevice(device: Device, bmpData: Uint8Array): Promise<boolean> {
        try {
            const packets = this.createBmpPackets(bmpData);

            // Send all BMP packets sequentially
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];

                if (!await BluetoothTransport.writeToDevice(CHARACTERISTIC_SERVICE, device, packet, false)) {
                    console.error(`[GlassesProtocol] Failed to send packet ${i + 1}`);
                    return false;
                }

                if (i < packets.length - 1 && GLASSES_BMP_PACKET_DELAY > 0) {
                    await TextFormatter.sleep(GLASSES_BMP_PACKET_DELAY);
                }
            }

            // Send end command
            const endCommand = new Uint8Array(GLASSES_CMD_BMP_END);
            if (!await BluetoothTransport.writeToDevice(CHARACTERISTIC_SERVICE, device, endCommand, false)) {
                console.error('[GlassesProtocol] Failed to send end command');
                return false;
            }

            await TextFormatter.sleep(GLASSES_BMP_END_DELAY);

            // Send CRC verification
            const crcValue = CrcCalculator.computeBmpCrc32(bmpData);
            const crcBytes = new Uint8Array([
                GLASSES_CMD_CRC,  // 0x16
                (crcValue >> 24) & 0xFF,
                (crcValue >> 16) & 0xFF,
                (crcValue >> 8) & 0xFF,
                crcValue & 0xFF,
            ]);

            // The glasses answer the CRC packet with the transfer verdict — silence means failure
            const crcResponse = await BluetoothTransport.sendCommandWithResponse(CHARACTERISTIC_SERVICE, device, crcBytes, new Uint8Array([GLASSES_CMD_CRC]));
            if (crcResponse === null) {
                console.error('[GlassesProtocol] BMP CRC not acknowledged');
                return false;
            }

            return true;

        } catch (error) {
            console.error('[GlassesProtocol] Error during BMP transfer:', error);
            return false;
        }
    }
}