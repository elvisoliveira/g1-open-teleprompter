import fontData from '../assets/g1_fonts.json';

/**
 * Utility class for teleprompter-specific text processing
 */
export class TeleprompterTextProcessor {
    private static charWidths = new Map(fontData.glyphs.map(g => [g.char, g.width]));

    /**
     * Add line breaks to text based on character widths from font data
     * @param text - Text to process
     * @param maxWidth - Maximum pixel width per line
     * @returns Text with appropriate line breaks
     */
    static addLineBreaks(text: string, maxWidth: number = 100): string {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        let currentWidth = 0;

        for (const word of words) {
            const wordWidth = [...word].reduce((w, char) => w + (this.charWidths.get(char) || 5), 0);
            const spaceWidth = this.charWidths.get(' ') || 2;

            if (currentWidth + spaceWidth + wordWidth <= maxWidth || !currentLine) {
                currentLine += (currentLine ? ' ' : '') + word;
                currentWidth += (currentLine === word ? 0 : spaceWidth) + wordWidth;
            } else {
                lines.push(currentLine);
                currentLine = word;
                currentWidth = wordWidth;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines.join('\n');
    }

    /**
     * Calculate the UTF-8 byte length of a string
     * This is important because teleprompter packets have byte limits, not character limits
     */
    static getUtf8ByteLength(text: string): number {
        return new TextEncoder().encode(text).length;
    }

    /**
     * Find the maximum character position that fits within a UTF-8 byte limit
     * This prevents cutting in the middle of multi-byte characters (like emojis)
     * 
     * @param text - The text to measure
     * @param byteLimit - Maximum bytes allowed
     * @returns Character position where we can safely cut the text
     */
    static findSafeCutPosition(text: string, byteLimit: number): number {
        let bytesUsed = 0;
        let charIndex = 0;

        while (charIndex < text.length) {
            const codePoint = text.codePointAt(charIndex)!;

            // Calculate UTF-8 bytes needed for this character
            const bytesNeeded = codePoint <= 0x7F ? 1 :      // ASCII: 1 byte
                codePoint <= 0x7FF ? 2 :      // Latin extended: 2 bytes  
                    codePoint <= 0xFFFF ? 3 : 4;  // Most others: 3-4 bytes

            if (bytesUsed + bytesNeeded > byteLimit) break;

            bytesUsed += bytesNeeded;
            charIndex += codePoint > 0xFFFF ? 2 : 1; // Handle surrogate pairs
        }

        return charIndex;
    }

    /**
     * Find the best place to break text for readability
     * Looks backwards from maxPos to find natural break points like:
     * 1. After punctuation + space (sentence endings)
     * 2. After newlines (paragraph breaks)  
     * 3. At word boundaries (spaces)
     * 
     * @param text - The text to analyze
     * @param maxPos - Maximum position we can cut at
     * @returns Best position to cut for readability
     */
    static findReadableBreakPoint(text: string, maxPos: number): number {
        const searchStart = Math.max(0, maxPos - 50);

        // Search backwards from maxPos for good break points
        for (let i = maxPos; i >= searchStart; i--) {
            if (i === 0) continue;

            const charBefore = text[i - 1];

            // Best: Break after sentence-ending punctuation + space
            if (charBefore === ' ' && i > 1) {
                const punctuationBefore = text[i - 2];
                if ('.:;,!?'.includes(punctuationBefore)) {
                    return i;
                }
            }

            // Good: Break after newlines (paragraph boundaries)
            if (charBefore === '\n') {
                return i;
            }

            // Okay: Break at word boundaries (spaces)
            if (charBefore === ' ') {
                return i;
            }
        }

        // No good break found, use the maximum position
        return maxPos;
    }

    /**
     * Split text into two parts optimized for teleprompter display
     * Uses aggressive splitting to maximize content in the visible portion
     * 
     * @param text - Text to split
     * @returns Object with visible text (current screen) and next text (upcoming)
     */
    static splitTextForTeleprompterDisplay(text: string) {
        const byteLimit = 112;

        // Step 1: Find maximum safe cut position (respects UTF-8 boundaries)
        let cutPosition = this.findSafeCutPosition(text, byteLimit);

        // Step 2: Adjust to a readable break point for better UX
        cutPosition = this.findReadableBreakPoint(text, cutPosition);

        // Step 3: Split the text
        let visibleText = text.slice(0, cutPosition);
        let remainingText = text.slice(cutPosition);

        // Format remaining text with padding for next screen
        const nextText = `${remainingText.trim()}\n        `;

        return {
            visible: visibleText,
            next: nextText
        };
    }

    /**
     * Main text splitting function for teleprompter
     * Splits text into visible and next portions based on showNext flag
     * 
     * @param text - Text to display on teleprompter
     * @returns Object with visible and next text portions
     */
    static splitTextForTeleprompter(text: string) {
        // Split text optimally for teleprompter display
        const result = this.splitTextForTeleprompterDisplay(text);

        // Debug logging to help with optimization
        console.log('Teleprompter text split:');
        console.log(`Visible: ${this.getUtf8ByteLength(result.visible)} bytes`);
        console.log(`Next: ${this.getUtf8ByteLength(result.next)} bytes`);
        console.log(`Properly formatted: ${result.visible.endsWith('\n')}`);

        return result;
    }
}