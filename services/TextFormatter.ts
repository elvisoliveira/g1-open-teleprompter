import { GLASSES_MAX_DISPLAY_LINES, GLASSES_MAX_LINE_LENGTH } from './constants/GlassesConstants';

/**
 * Utility class for text formatting and display preparation
 */
export class TextFormatter {
    /**
     * Split text into lines based on maximum line length
     * @param text - The text to split
     * @returns Array of text lines
     */
    static splitTextIntoLines(text: string): string[] {
        console.log(text);
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if (currentLine.length + word.length + 1 <= GLASSES_MAX_LINE_LENGTH) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Format text for display by limiting lines and joining with newlines
     * @param text - The text to format
     * @returns Formatted text string
     */
    static formatTextForDisplay(text: string): string {
        const lines = this.splitTextIntoLines(text);
        return lines.slice(0, GLASSES_MAX_DISPLAY_LINES).join('\n');
    }

    /**
     * Sleep utility for async operations
     * @param ms - Milliseconds to sleep
     * @returns Promise that resolves after the specified time
     */
    static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Convert array to hex string for logging
     * @param data - The data array to convert
     * @returns Hex string representation
     */
    static arrayToHex(data: Uint8Array): string {
        return Array.from(data).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
    }
}