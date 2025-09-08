import { Device } from 'react-native-ble-plx';
import { TextFormatter } from '../TextFormatter';
import {
    CHARACTERISTIC_SERVICE,
    GLASSES_TELEPROMPTER_CMD,
    GLASSES_TELEPROMPTER_CONTROL_SIZE,
    GLASSES_TELEPROMPTER_COUNTDOWN,
    GLASSES_TELEPROMPTER_DEFAULT_SCROLL_POSITION,
    GLASSES_TELEPROMPTER_END_CMD,
    GLASSES_TELEPROMPTER_FINISH,
    GLASSES_TELEPROMPTER_FLAGS_MANUAL,
    GLASSES_TELEPROMPTER_FLAGS_NORMAL,
    GLASSES_TELEPROMPTER_HEADER_SIZE,
    GLASSES_TELEPROMPTER_MANUAL_MODE,
    GLASSES_TELEPROMPTER_NEW_SCREEN_MANUAL,
    GLASSES_TELEPROMPTER_NEW_SCREEN_NORMAL,
    GLASSES_TELEPROMPTER_PACKET_DELAY,
    GLASSES_TELEPROMPTER_RESERVED,
    GLASSES_TELEPROMPTER_SUBCMD
} from '../constants/GlassesConstants';
import { BluetoothTransport } from './BluetoothTransport';

export class TeleprompterProtocol {
    /**
     * Send teleprompter packets to a device
     */
    static async sendTeleprompterPackets(device: Device, packets: Uint8Array[]): Promise<boolean> {
        try {
            for (const packet of packets) {
                if (!await BluetoothTransport.writeToDevice(device, packet, CHARACTERISTIC_SERVICE, false)) {
                    console.error('[TeleprompterProtocol] Failed to send teleprompter packet');
                    return false;
                }
                // Small delay between packets to ensure proper transmission
                if (packets.length > 1) {
                    await TextFormatter.sleep(GLASSES_TELEPROMPTER_PACKET_DELAY);
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
            return await BluetoothTransport.writeToDevice(device, endPacket, CHARACTERISTIC_SERVICE, false);
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
        slidePercentage: number = GLASSES_TELEPROMPTER_DEFAULT_SCROLL_POSITION
    ): Uint8Array {
        const newScreen = GLASSES_TELEPROMPTER_MANUAL_MODE ? GLASSES_TELEPROMPTER_NEW_SCREEN_MANUAL : GLASSES_TELEPROMPTER_NEW_SCREEN_NORMAL;
        const flags = GLASSES_TELEPROMPTER_MANUAL_MODE ? GLASSES_TELEPROMPTER_FLAGS_MANUAL : GLASSES_TELEPROMPTER_FLAGS_NORMAL;

        // Build control array
        const control = new Uint8Array([
            GLASSES_TELEPROMPTER_RESERVED,           // reserved0
            seq                             & 0xFF,  // seq
            newScreen                       & 0xFF,  // newScreen
            numPackets                      & 0xFF,  // numPackets
            GLASSES_TELEPROMPTER_RESERVED,           // reserved1
            partIdx                         & 0xFF,  // partIdx
            GLASSES_TELEPROMPTER_RESERVED,           // reserved2
            GLASSES_TELEPROMPTER_COUNTDOWN  & 0xFF,  // countdown (stopwatch delay)
            flags                           & 0xFF,  // flags
            slidePercentage                 & 0xFF   // scrollbar position (0-100)
        ]);

        // Calculate total length
        const len = GLASSES_TELEPROMPTER_HEADER_SIZE + GLASSES_TELEPROMPTER_CONTROL_SIZE + payload.length;
        if (len > 255) {
            throw new Error(`Teleprompter value too large: ${len} > 255 bytes`);
        }

        // Build the complete packet
        const packet = new Uint8Array(GLASSES_TELEPROMPTER_HEADER_SIZE + GLASSES_TELEPROMPTER_CONTROL_SIZE + payload.length);
        packet[0] = GLASSES_TELEPROMPTER_CMD; // Cmd.Teleprompter
        packet[1] = len; // total length
        packet.set(control, GLASSES_TELEPROMPTER_HEADER_SIZE); // control array
        packet.set(payload, GLASSES_TELEPROMPTER_HEADER_SIZE + GLASSES_TELEPROMPTER_CONTROL_SIZE); // payload

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
            GLASSES_TELEPROMPTER_CMD,       // Cmd.Teleprompter
            GLASSES_TELEPROMPTER_END_CMD,   // cmd = End
            GLASSES_TELEPROMPTER_RESERVED,  // reserved
            sequence & 0xFF,                // current seq (don't increment)
            GLASSES_TELEPROMPTER_SUBCMD,    // subCmd
            GLASSES_TELEPROMPTER_FINISH     // finish
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