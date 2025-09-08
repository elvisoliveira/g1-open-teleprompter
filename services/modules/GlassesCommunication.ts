import { Buffer } from 'buffer';
import { EXIT_CMD } from '../Constants';
import { TeleprompterUtils } from '../TeleprompterUtils';
import { GlassesProtocol } from '../transport/GlassesProtocol';
import { TeleprompterProtocol } from '../transport/TeleprompterProtocol';
import { Utils } from '../Utils';

export class GlassesCommunication {
    private teleprompterSeq: number = 0;

    prepareTextPackets(text: string): Uint8Array[] {
        return GlassesProtocol.createTextPackets(
            Utils.formatTextForDisplay(text)
        );
    }

    prepareImageData(base64ImageData: string): { bmpData: Uint8Array; packets: Uint8Array[] } {
        const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
        const packets = GlassesProtocol.createBmpPackets(bmpData);
        return { bmpData, packets };
    }

    prepareOfficialTeleprompterPackets(text: string, slidePercentage?: number): Uint8Array[] {
        const formattedText = TeleprompterUtils.addLineBreaks(text, 180);
        const textParts = TeleprompterUtils.splitTextForTeleprompter(formattedText);
        const packets = TeleprompterProtocol.buildTeleprompterPackets(
            textParts.visible,
            textParts.next,
            this.teleprompterSeq,
            slidePercentage
        );
        
        this.teleprompterSeq = (this.teleprompterSeq + packets.length) & 0xFF;
        return packets;
    }

    prepareOfficialTeleprompterEndPacket(): Uint8Array {
        return TeleprompterProtocol.buildTeleprompterEndPacket(this.teleprompterSeq);
    }

    prepareExitCommand(): Uint8Array {
        return new Uint8Array([EXIT_CMD]);
    }
}