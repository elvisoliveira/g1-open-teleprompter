// Bluetooth UUIDs
export const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const WRITE_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const READ_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Protocol Commands
export const TEXT_COMMAND = 0x4E;
export const EXIT_CMD = 0x18;
export const HEARTBEAT_CMD = 0x25;
export const BMP_DATA_CMD = 0x15;
export const BMP_END_CMD = [0x20, 0x0d, 0x0e];
export const CRC_CMD = 0x16;
export const BATTERY_CMD = 0x2C;
export const UPTIME_CMD = 0x37;
export const FIRMWARE_REQUEST_CMD = [0x23, 0x74];
export const INIT_LEFT_CMD = [0x4D, 0xFB];

// Teleprompter Protocol Constants
export const TELEPROMPTER_CMD = 0x09;
export const TELEPROMPTER_END_CMD = 0x06;
export const TELEPROMPTER_SUBCMD = 0x05;
export const TELEPROMPTER_FINISH = 0x01;

// Teleprompter Control Array Constants
export const TELEPROMPTER_RESERVED = 0x00;
export const TELEPROMPTER_NEW_SCREEN_NORMAL = 0x01;
export const TELEPROMPTER_NEW_SCREEN_MANUAL = 0x03;
export const TELEPROMPTER_NEW_SCREEN_CONTINUATION = 0x07;
export const TELEPROMPTER_FLAGS_NORMAL = 0x81;
export const TELEPROMPTER_FLAGS_MANUAL = 0x00;
export const TELEPROMPTER_START_DELAY = 0x00; // No delay for stopwatch start

// Teleprompter Text Splitting Constants
export const TELEPROMPTER_DEFAULT_PAYLOAD_MAX = 154; // bytes of text per packet for current MTU
export const TELEPROMPTER_MAX_BACKTRACK_CHARS = 40;  // how far back we look for a nice break

// Protocol Parameters
export const CHUNK_SIZE = 200;
export const BMP_CHUNK_SIZE = 194;
export const BMP_STORAGE_ADDRESS = [0x00, 0x1c, 0x00, 0x00];
export const NEW_SCREEN_FLAG = 0x71;
export const MAX_LINE_LENGTH = 60;
export const MAX_DISPLAY_LINES = 5;

// Timing Configuration
export const PACKET_DELAY = 5;        // Reduced from 10ms to 5ms
export const BMP_PACKET_DELAY = 5;    // Removed delay for maximum speed
export const BMP_END_DELAY = 10;      // Reduced from 100ms to 50ms
export const HEARTBEAT_INTERVAL_MS = 15000;
export const TELEPROMPTER_PACKET_DELAY = 10; // Delay between teleprompter packets

// Default Values
export const DEFAULT_POS = 0;
export const DEFAULT_PAGE_NUM = 1;
export const DEFAULT_MAX_PAGES = 1;

// Configuration Flags
export const ENABLE_TRANSFER_LOGGING = false; // Set to false to reduce logging overhead 