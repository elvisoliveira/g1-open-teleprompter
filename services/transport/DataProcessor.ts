import { BMP_STORAGE_ADDRESS } from '../Constants';

export class DataProcessor {
    /**
     * Compute CRC32 for data verification
     */
    static computeCrc32(data: Uint8Array): number {
        const CRC32_TABLE = new Uint32Array(256);

        // Initialize CRC32 table
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
            }
            CRC32_TABLE[i] = crc;
        }

        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0; // Ensure unsigned 32-bit
    }

    /**
     * Compute CRC32 for BMP data including storage address as per G1 protocol
     */
    static computeBmpCrc32(bmpData: Uint8Array): number {
        // Combine storage address + BMP data for CRC calculation
        const combinedData = new Uint8Array(BMP_STORAGE_ADDRESS.length + bmpData.length);
        combinedData.set(BMP_STORAGE_ADDRESS, 0);
        combinedData.set(bmpData, BMP_STORAGE_ADDRESS.length);

        return this.computeCrc32(combinedData);
    }
}