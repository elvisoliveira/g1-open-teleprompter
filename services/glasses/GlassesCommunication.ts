import { Buffer } from 'buffer';
import { CommunicationManager } from '../CommunicationManager';
import { EXIT_CMD } from '../constants';
import { TeleprompterUtils } from '../TeleprompterUtils';
import { Utils } from '../utils';

export class GlassesCommunication {
    private teleprompterSeq: number = 0;

    prepareTextPackets(text: string): Uint8Array[] {
        return CommunicationManager.createTextPackets(
            Utils.formatTextForDisplay(text)
        );
    }

    prepareImageData(base64ImageData: string): { bmpData: Uint8Array; packets: Uint8Array[] } {
        const bmpData = new Uint8Array(Buffer.from(base64ImageData, 'base64'));
        const packets = CommunicationManager.createBmpPackets(bmpData);
        return { bmpData, packets };
    }

    prepareOfficialTeleprompterPackets(text: string, slidePercentage?: number): Uint8Array[] {
        const formattedText = TeleprompterUtils.addLineBreaks(text, 180);
        const textParts = TeleprompterUtils.splitTextForTeleprompter(formattedText);
        const packets = CommunicationManager.buildTeleprompterPackets(
            textParts.visible,
            textParts.next,
            this.teleprompterSeq,
            slidePercentage
        );
        
        this.teleprompterSeq = (this.teleprompterSeq + packets.length) & 0xFF;
        return packets;
    }

    prepareOfficialTeleprompterEndPacket(): Uint8Array {
        return CommunicationManager.buildTeleprompterEndPacket(this.teleprompterSeq);
    }

    prepareExitCommand(): Uint8Array {
        return new Uint8Array([EXIT_CMD]);
    }
}