import { Buffer } from 'buffer';

/**
 * Bitmap Generation Service
 * Creates 1-bit bitmap images (576x136 pixels) from text for Even Realities G1 glasses
 */

export interface BitmapDimensions {
    width: number;
    height: number;
}

export const G1_DISPLAY_DIMENSIONS: BitmapDimensions = {
    width: 576,
    height: 136, // Official G1 documentation specifies 576x136
};

/**
 * Font configuration for text rendering
 */
export interface FontConfig {
    size: number;
    family: string;
    weight: 'normal' | 'bold';
    lineHeight: number;
}

export const DEFAULT_FONT_CONFIG: FontConfig = {
    size: 16,
    family: 'monospace',
    weight: 'normal',
    lineHeight: 1.2,
};

/**
 * Text layout configuration
 */
export interface TextLayout {
    padding: number;
    alignment: 'left' | 'center' | 'right';
    verticalAlignment: 'top' | 'center' | 'bottom';
    wordWrap: boolean;
}

export const DEFAULT_TEXT_LAYOUT: TextLayout = {
    padding: 8,
    alignment: 'left',
    verticalAlignment: 'top',
    wordWrap: true,
};

/**
 * Simple text-to-bitmap converter for G1 glasses
 * This creates a 1-bit bitmap (black and white) of the specified dimensions
 */
export class BitmapRenderer {
    private dimensions: BitmapDimensions;
    private fontConfig: FontConfig;
    private layout: TextLayout;

    // Static character patterns for better performance (shared across instances)
    private static readonly CHARACTER_PATTERNS: { [key: string]: number[] } = {
        // Uppercase letters
        'A': [0x00, 0x00, 0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'B': [0x00, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x66, 0x7C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'C': [0x00, 0x00, 0x3C, 0x66, 0x60, 0x60, 0x60, 0x60, 0x60, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'D': [0x00, 0x00, 0x78, 0x6C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x6C, 0x78, 0x00, 0x00, 0x00, 0x00, 0x00],
        'E': [0x00, 0x00, 0x7E, 0x60, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00],
        'F': [0x00, 0x00, 0x7E, 0x60, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00],
        'G': [0x00, 0x00, 0x3C, 0x66, 0x60, 0x60, 0x6E, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'H': [0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'I': [0x00, 0x00, 0x3C, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'J': [0x00, 0x00, 0x1E, 0x0C, 0x0C, 0x0C, 0x0C, 0x0C, 0x6C, 0x6C, 0x38, 0x00, 0x00, 0x00, 0x00, 0x00],
        'K': [0x00, 0x00, 0x66, 0x6C, 0x78, 0x70, 0x70, 0x78, 0x6C, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'L': [0x00, 0x00, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00],
        'M': [0x00, 0x00, 0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0x63, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00],
        'N': [0x00, 0x00, 0x66, 0x76, 0x7E, 0x7E, 0x6E, 0x66, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'O': [0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'P': [0x00, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00],
        'Q': [0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x0E, 0x00, 0x00, 0x00, 0x00, 0x00],
        'R': [0x00, 0x00, 0x7C, 0x66, 0x66, 0x66, 0x7C, 0x78, 0x6C, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'S': [0x00, 0x00, 0x3C, 0x66, 0x60, 0x30, 0x18, 0x0C, 0x06, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'T': [0x00, 0x00, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        'U': [0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        'V': [0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        'W': [0x00, 0x00, 0x63, 0x63, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00],
        'X': [0x00, 0x00, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x3C, 0x66, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00],
        'Y': [0x00, 0x00, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        'Z': [0x00, 0x00, 0x7E, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x60, 0x60, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00],
        
        // Numbers
        '0': [0x00, 0x00, 0x3C, 0x66, 0x6E, 0x76, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '1': [0x00, 0x00, 0x18, 0x38, 0x58, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00],
        '2': [0x00, 0x00, 0x3C, 0x66, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x60, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00],
        '3': [0x00, 0x00, 0x3C, 0x66, 0x06, 0x06, 0x1C, 0x06, 0x06, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '4': [0x00, 0x00, 0x0C, 0x1C, 0x3C, 0x6C, 0x6C, 0x7E, 0x0C, 0x0C, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '5': [0x00, 0x00, 0x7E, 0x60, 0x60, 0x7C, 0x06, 0x06, 0x06, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '6': [0x00, 0x00, 0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '7': [0x00, 0x00, 0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x30, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00],
        '8': [0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x66, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00],
        '9': [0x00, 0x00, 0x3C, 0x66, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x18, 0x38, 0x00, 0x00, 0x00, 0x00, 0x00],
        
        // Special characters
        ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        ',': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00],
        '!': [0x00, 0x00, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        '?': [0x00, 0x00, 0x3C, 0x66, 0x06, 0x0C, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00],
        ':': [0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        ';': [0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00],
        '-': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        '_': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00],
        "'": [0x00, 0x00, 0x18, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    };

    // Static default pattern for unknown characters (shared across instances)
    private static readonly DEFAULT_PATTERN = [0x00, 0x00, 0x7E, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7E, 0x00, 0x00, 0x00, 0x00, 0x00];

    constructor(
        dimensions: BitmapDimensions = G1_DISPLAY_DIMENSIONS,
        fontConfig: FontConfig = DEFAULT_FONT_CONFIG,
        layout: TextLayout = DEFAULT_TEXT_LAYOUT
    ) {
        this.dimensions = dimensions;
        this.fontConfig = fontConfig;
        this.layout = layout;
    }

    /**
     * Converts text to a 1-bit BMP image buffer
     * Returns a Buffer containing the BMP image data
     */
    async textToBitmap(text: string): Promise<Buffer> {
        try {
            // Create the 1-bit bitmap data
            const bitmapData = this.createSimplifiedBitmap(text);
            
            // Convert to proper BMP format
            const bmpBuffer = this.createBmpFile(bitmapData);
            
            // Quick validation (skip detailed logging for performance)
            if (!this.validateBmpFormat(bmpBuffer)) {
                throw new Error('Generated BMP format is invalid');
            }
            
            return bmpBuffer;
        } catch (error) {
            console.error('❌ Error creating bitmap:', error);
            throw new Error('Failed to generate bitmap from text');
        }
    }

    /**
     * Creates a proper BMP file with headers for the bitmap data
     * Based on the official BMP specification from Microsoft
     */
    private createBmpFile(bitmapData: Buffer): Buffer {
        const { width, height } = this.dimensions;
        
        // BMP file header (14 bytes)
        const fileHeaderSize = 14;
        const infoHeaderSize = 40;
        const paletteSize = 8; // 2 colors * 4 bytes each (black and white)
        const imageDataOffset = fileHeaderSize + infoHeaderSize + paletteSize;
        const fileSize = imageDataOffset + bitmapData.length;
        
        // Create BMP buffer
        const bmpBuffer = Buffer.alloc(fileSize);
        let offset = 0;
        
        // BMP File Header (14 bytes) - BITMAPFILEHEADER
        bmpBuffer.write('BM', offset); offset += 2;               // Signature (0x42 0x4D)
        bmpBuffer.writeUInt32LE(fileSize, offset); offset += 4;   // File size in bytes
        bmpBuffer.writeUInt16LE(0, offset); offset += 2;          // Reserved 1 (must be 0)
        bmpBuffer.writeUInt16LE(0, offset); offset += 2;          // Reserved 2 (must be 0)
        bmpBuffer.writeUInt32LE(imageDataOffset, offset); offset += 4; // Offset to pixel data
        
        // BMP Info Header (40 bytes) - BITMAPINFOHEADER
        bmpBuffer.writeUInt32LE(infoHeaderSize, offset); offset += 4;  // Header size (40)
        bmpBuffer.writeInt32LE(width, offset); offset += 4;            // Width (signed)
        bmpBuffer.writeInt32LE(height, offset); offset += 4;           // Height (positive = bottom-up)
        bmpBuffer.writeUInt16LE(1, offset); offset += 2;               // Planes (must be 1)
        bmpBuffer.writeUInt16LE(1, offset); offset += 2;               // Bits per pixel (1 for monochrome)
        bmpBuffer.writeUInt32LE(0, offset); offset += 4;               // Compression (0 = BI_RGB, no compression)
        bmpBuffer.writeUInt32LE(bitmapData.length, offset); offset += 4; // Image size (can be 0 for BI_RGB)
        bmpBuffer.writeInt32LE(2835, offset); offset += 4;             // X pixels per meter (72 DPI standard)
        bmpBuffer.writeInt32LE(2835, offset); offset += 4;             // Y pixels per meter (72 DPI standard)
        bmpBuffer.writeUInt32LE(2, offset); offset += 4;               // Colors used (2 for 1-bit)
        bmpBuffer.writeUInt32LE(2, offset); offset += 4;               // Important colors (2 for 1-bit)
        
        // Color palette (8 bytes) - RGBQUAD structures
        // For 1-bit: 0 = first color (white), 1 = second color (black)
        // Colors are stored in BGRA format (Blue, Green, Red, Alpha/Reserved)
        bmpBuffer.writeUInt32LE(0x00FFFFFF, offset); offset += 4;      // Color 0: White (BGRA)
        bmpBuffer.writeUInt32LE(0x00000000, offset); offset += 4;      // Color 1: Black (BGRA)
        
        // Copy bitmap data (pixels)
        bitmapData.copy(bmpBuffer, offset);
        
        return bmpBuffer;
    }

    /**
     * Creates a simplified bitmap by generating a monospace text layout
     * Following the official BMP specification for 1-bit images
     * Optimized for performance with pre-calculated values and efficient rendering
     */
    private createSimplifiedBitmap(text: string): Buffer {
        const { width, height } = this.dimensions;
        
        // Pre-calculate all layout values once (simplified)
        const bytesPerRowPadded = Math.ceil(Math.ceil(width / 8) / 4) * 4;
        const totalBytes = bytesPerRowPadded * height;
        
        // Text rendering constants (pre-calculated)
        const charWidth = 8;
        const charHeight = 16;
        const textAreaWidth = width - (this.layout.padding * 2);
        const textAreaHeight = height - (this.layout.padding * 2);
        const charsPerRow = Math.floor(textAreaWidth / charWidth);
        const maxRows = Math.floor(textAreaHeight / charHeight);
        
        // Create buffer filled with white background (0xFF = all bits set = white pixels)
        const buffer = Buffer.alloc(totalBytes, 0xFF);
        
        // Early exit if no text or no space
        if (!text.trim() || charsPerRow <= 0 || maxRows <= 0) {
            return buffer;
        }
        
        // Split text into renderable lines
        const lines = this.wrapText(text, charsPerRow);
        const linesToRender = Math.min(lines.length, maxRows);
        
        // Optimized rendering: batch process characters
        for (let lineIndex = 0; lineIndex < linesToRender; lineIndex++) {
            const line = lines[lineIndex];
            const lineY = this.layout.padding + (lineIndex * charHeight);
            const charsToRender = Math.min(line.length, charsPerRow);
            
            for (let charIndex = 0; charIndex < charsToRender; charIndex++) {
                const char = line[charIndex];
                const charX = this.layout.padding + (charIndex * charWidth);
                
                // Skip spaces (already white background)
                if (char === ' ') continue;
                
                // Get character pattern and render efficiently
                const pattern = this.getCharacterPattern(char);
                this.renderCharacterPatternOptimized(buffer, pattern, charX, lineY, bytesPerRowPadded, height);
            }
        }
        
        return buffer;
    }

    /**
     * Wraps text to fit within the specified character width
     */
    private wrapText(text: string, maxCharsPerLine: number): string[] {
        if (!this.layout.wordWrap) {
            // Simple line splitting without word wrap
            const lines: string[] = [];
            for (let i = 0; i < text.length; i += maxCharsPerLine) {
                lines.push(text.slice(i, i + maxCharsPerLine));
            }
            return lines;
        }

        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            
            if (testLine.length <= maxCharsPerLine) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is longer than max width, split it
                    for (let i = 0; i < word.length; i += maxCharsPerLine) {
                        lines.push(word.slice(i, i + maxCharsPerLine));
                    }
                }
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Returns a simple 8x16 pattern for basic ASCII characters
     * This is a simplified font representation
     */
    private getCharacterPattern(char: string): number[] {
        // Use static pattern lookup for better performance
        return BitmapRenderer.CHARACTER_PATTERNS[char.toUpperCase()] || BitmapRenderer.DEFAULT_PATTERN;
    }

    /**
     * Optimized character pattern rendering with pre-calculated values and efficient bit operations
     * BMP stores pixels bottom-up, so we need to flip the Y coordinate
     */
    private renderCharacterPatternOptimized(
        buffer: Buffer, 
        pattern: number[], 
        x: number, 
        y: number, 
        bytesPerRow: number,
        imageHeight: number
    ): void {
        // Pre-calculate base values to avoid repeated calculations
        const patternHeight = pattern.length;
        const maxX = Math.min(x + 8, this.dimensions.width);
        const maxY = Math.min(y + patternHeight, imageHeight);
        
        // Optimized inner loops with fewer calculations
        for (let row = 0; row < patternHeight && (y + row) < maxY; row++) {
            const patternByte = pattern[row];
            
            // Skip empty rows (optimization for sparse patterns)
            if (patternByte === 0) continue;
            
            // Convert top-down Y to bottom-up Y (BMP standard) - calculated once per row
            const bmpY = imageHeight - 1 - (y + row);
            const rowOffset = bmpY * bytesPerRow;
            
            // Process 8 bits efficiently with bit manipulation
            for (let bit = 0; bit < 8 && (x + bit) < maxX; bit++) {
                // Check if pixel should be set (black text)
                if ((patternByte & (0x80 >> bit)) !== 0) {
                    const pixelX = x + bit;
                    const byteIndex = rowOffset + (pixelX >> 3); // Fast division by 8
                    const bitIndex = 7 - (pixelX & 7); // Fast modulo 8
                    
                    // Clear bit for black text
                    buffer[byteIndex] &= ~(1 << bitIndex);
                }
            }
        }
    }

    /**
     * Converts the bitmap buffer to a base64 string for transmission
     */
    bufferToBase64(buffer: Buffer): string {
        return buffer.toString('base64');
    }

    /**
     * Validates if the generated BMP has the correct format
     */
    validateBmpFormat(bmpBuffer: Buffer): boolean {
        const { width, height } = this.dimensions;
        try {
            // Quick signature check
            if (bmpBuffer.length < 2 || bmpBuffer.toString('ascii', 0, 2) !== 'BM') {
                return false;
            }
            
            // Quick file size check
            const fileSize = bmpBuffer.readUInt32LE(2);
            if (fileSize !== bmpBuffer.length) {
                return false;
            }
            
            const bmpWidth = bmpBuffer.readInt32LE(18);
            const bmpHeight = Math.abs(bmpBuffer.readInt32LE(22));

            // Quick dimensions check
            return bmpWidth === width && bmpHeight === height;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Default instance for easy use
 */
export const defaultBitmapRenderer = new BitmapRenderer();