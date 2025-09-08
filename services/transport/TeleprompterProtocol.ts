import { Device } from 'react-native-ble-plx';
import {
    TELEPROMPTER_CMD,
    TELEPROMPTER_CONTROL_SIZE,
    TELEPROMPTER_COUNTDOWN,
    TELEPROMPTER_DEFAULT_SCROLL_POSITION,
    TELEPROMPTER_END_CMD,
    TELEPROMPTER_FINISH,
    TELEPROMPTER_FLAGS_MANUAL,
    TELEPROMPTER_FLAGS_NORMAL,
    TELEPROMPTER_HEADER_SIZE,
    TELEPROMPTER_MANUAL_MODE,
    TELEPROMPTER_NEW_SCREEN_MANUAL,
    TELEPROMPTER_NEW_SCREEN_NORMAL,
    TELEPROMPTER_PACKET_DELAY,
    TELEPROMPTER_RESERVED,
    TELEPROMPTER_SUBCMD
} from '../Constants';
import { Utils } from '../Utils';
import { DeviceCommunication } from './DeviceCommunication';

export class TeleprompterProtocol {
    /**
     * Send teleprompter packets to a device
     */
    static async sendTeleprompterPackets(device: Device, packets: Uint8Array[]): Promise<boolean> {
        try {
            for (const packet of packets) {
                if (!await DeviceCommunication.writeToDevice(device, packet, false)) {
                    console.error('[TeleprompterProtocol] Failed to send teleprompter packet');
                    return false;
                }
                // Small delay between packets to ensure proper transmission
                if (packets.length > 1) {
                    await Utils.sleep(TELEPROMPTER_PACKET_DELAY);
                }
            }
            return true;
        } catch (error) {
            console.error('[TeleprompterProtocol] Failed to send teleprompter packets:', error);
            return false;
        }
    }

    /**
     * Send teleprompter end packet to a device
     */
    static async sendTeleprompterEndPacket(device: Device, endPacket: Uint8Array): Promise<boolean> {
        try {
            return await DeviceCommunication.writeToDevice(device, endPacket, false);
        } catch (error) {
            console.error('[TeleprompterProtocol] Failed to send teleprompter end packet:', error);
            return false;
        }
    }

    /**
     * Build a single teleprompter value packet
     */
    static buildTeleprompterValue(
        seq: number,
        numPackets: number,
        partIdx: number,
        payload: Uint8Array,
        slidePercentage: number = TELEPROMPTER_DEFAULT_SCROLL_POSITION
    ): Uint8Array {
        const newScreen = TELEPROMPTER_MANUAL_MODE ? TELEPROMPTER_NEW_SCREEN_MANUAL : TELEPROMPTER_NEW_SCREEN_NORMAL;
        const flags = TELEPROMPTER_MANUAL_MODE ? TELEPROMPTER_FLAGS_MANUAL : TELEPROMPTER_FLAGS_NORMAL;

        // Build control array
        const control = new Uint8Array([
            TELEPROMPTER_RESERVED,           // reserved0
            seq                     & 0xFF,  // seq
            newScreen               & 0xFF,  // newScreen
            numPackets              & 0xFF,  // numPackets
            TELEPROMPTER_RESERVED,           // reserved1
            partIdx                 & 0xFF,  // partIdx
            TELEPROMPTER_RESERVED,           // reserved2
            TELEPROMPTER_COUNTDOWN  & 0xFF,  // countdown (stopwatch delay)
            flags                   & 0xFF,  // flags
            slidePercentage         & 0xFF   // scrollbar position (0-100)
        ]);

        // Calculate total length
        const len = TELEPROMPTER_HEADER_SIZE + TELEPROMPTER_CONTROL_SIZE + payload.length;
        if (len > 255) {
            throw new Error(`Teleprompter value too large: ${len} > 255 bytes`);
        }

        // Build the complete packet
        const packet = new Uint8Array(TELEPROMPTER_HEADER_SIZE + TELEPROMPTER_CONTROL_SIZE + payload.length);
        packet[0] = TELEPROMPTER_CMD; // Cmd.Teleprompter
        packet[1] = len; // total length
        packet.set(control, TELEPROMPTER_HEADER_SIZE); // control array
        packet.set(payload, TELEPROMPTER_HEADER_SIZE + TELEPROMPTER_CONTROL_SIZE); // payload

        return packet;
    }

    /**
     * Build teleprompter packets for visible and next text
     */
    static buildTeleprompterPackets(
        visibleText: string,
        nextText: string,
        sequence: number,
        slidePercentage?: number
    ): Uint8Array[] {
        const packets: Uint8Array[] = [];

        // Build visible text packet (part 1)
        packets.push(this.buildTeleprompterValue(
            sequence,
            nextText ? 2 : 1,
            1,
            this.formatTeleprompterPayload(visibleText),
            slidePercentage
        ));

        // Build next text packet (part 2) if needed
        if (nextText) {
            packets.push(this.buildTeleprompterValue(
                (sequence + 1) & 0xFF,
                2,
                2,
                this.formatTeleprompterPayload(nextText),
                slidePercentage
            ));
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
     * Format text payload for teleprompter
     */
    static formatTeleprompterPayload(text: string): Uint8Array {
        return new TextEncoder().encode(text);
    }

    /**
     * Send teleprompter content to device
     */
    static async sendTeleprompterToDevice(
        device: Device,
        visibleText: string,
        nextText: string,
        sequence: number,
        slidePercentage?: number
    ): Promise<boolean> {
        const packets = this.buildTeleprompterPackets(visibleText, nextText, sequence, slidePercentage);
        return await this.sendTeleprompterPackets(device, packets);
    }

    /**
     * Send teleprompter end to device
     */
    static async sendTeleprompterEndToDevice(device: Device, sequence: number): Promise<boolean> {
        const endPacket = this.buildTeleprompterEndPacket(sequence);
        return await this.sendTeleprompterEndPacket(device, endPacket);
    }
}