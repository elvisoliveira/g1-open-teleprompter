// Bluetooth UUIDs
export const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const WRITE_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const READ_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Protocol Commands
export const EVENAI_CMD = 0x4E;
export const EXIT_CMD = 0x18;
export const HEARTBEAT_CMD = 0x25;
export const BMP_DATA_CMD = 0x15;
export const BMP_END_CMD = [0x20, 0x0d, 0x0e];
export const CRC_CMD = 0x16;
export const BATTERY_CMD = 0x2C;
export const UPTIME_CMD = 0x37;
export const FIRMWARE_REQUEST_CMD = [0x23, 0x74];
export const INIT_LEFT_CMD = [0x4D, 0xFB];

// Protocol Parameters
export const CHUNK_SIZE = 200;
export const BMP_CHUNK_SIZE = 194;
export const BMP_STORAGE_ADDRESS = [0x00, 0x1c, 0x00, 0x00];
export const NEW_SCREEN_FLAG = 0x71;
export const MAX_LINE_LENGTH = 60;
export const MAX_DISPLAY_LINES = 5;

// Timing Configuration
export const PACKET_DELAY = 5;        // Reduced from 10ms to 5ms
export const BMP_PACKET_DELAY = 1;    // Removed delay for maximum speed
export const BMP_END_DELAY = 50;      // Reduced from 100ms to 50ms
export const HEARTBEAT_INTERVAL_MS = 15000;

// Default Values
export const DEFAULT_POS = 0;
export const DEFAULT_PAGE_NUM = 1;
export const DEFAULT_MAX_PAGES = 1;

// Configuration Flags
export const ENABLE_TRANSFER_LOGGING = false; // Set to false to reduce logging overhead 