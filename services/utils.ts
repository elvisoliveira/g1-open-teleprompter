import { MAX_DISPLAY_LINES, MAX_LINE_LENGTH } from './constants';

/**
 * Utility class containing common helper methods
 */
export class Utils {
    /**
     * Split text into lines based on maximum line length
     * @param text - The text to split
     * @returns Array of text lines
     */
    static splitTextIntoLines(text: string): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if (currentLine.length + word.length + 1 <= MAX_LINE_LENGTH) {
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
        return lines.slice(0, MAX_DISPLAY_LINES).join('\n');
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

    /**
     * Check if a string is empty or contains only whitespace
     * @param str - The string to check
     * @returns True if empty or whitespace only
     */
    static isEmptyOrWhitespace(str: string): boolean {
        return !str || str.trim().length === 0;
    }

    /**
     * Truncate string to specified length with ellipsis
     * @param str - The string to truncate
     * @param maxLength - Maximum length before truncation
     * @returns Truncated string
     */
    static truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }

    /**
     * Format bytes to human readable format
     * @param bytes - Number of bytes
     * @param decimals - Number of decimal places
     * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
     */
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format duration in milliseconds to human readable format
     * @param ms - Duration in milliseconds
     * @returns Formatted string (e.g., "1.5s", "2m 30s")
     */
    static formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (remainingSeconds === 0) return `${minutes}m`;
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Generate a random string of specified length
     * @param length - Length of the random string
     * @returns Random string
     */
    static generateRandomString(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Debounce function execution
     * @param func - Function to debounce
     * @param wait - Wait time in milliseconds
     * @returns Debounced function
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T, 
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Throttle function execution
     * @param func - Function to throttle
     * @param limit - Time limit in milliseconds
     * @returns Throttled function
     */
    static throttle<T extends (...args: any[]) => any>(
        func: T, 
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
} 