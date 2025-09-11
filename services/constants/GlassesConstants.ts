export const CHARACTERISTIC_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

// G1 Glasses Protocol Commands
export const GLASSES_CMD_TEXT = 0x4E;
export const GLASSES_CMD_EXIT = 0x18;
export const GLASSES_CMD_HEARTBEAT = 0x25;
export const GLASSES_CMD_BMP_DATA = 0x15;
export const GLASSES_CMD_BMP_END = [0x20, 0x0d, 0x0e];
export const GLASSES_CMD_CRC = 0x16;
export const GLASSES_CMD_BATTERY = 0x2C;
export const GLASSES_CMD_UPTIME = 0x37;
export const GLASSES_CMD_FIRMWARE_REQUEST = [0x23, 0x74];
export const GLASSES_CMD_INIT_LEFT = [0x4D, 0xFB];

// G1 Teleprompter Protocol Constants
export const GLASSES_CMD_TELEPROMPTER = 0x09;
export const GLASSES_CMD_TELEPROMPTER_END = 0x06;
export const GLASSES_TELEPROMPTER_SUBCMD = 0x05;
export const GLASSES_TELEPROMPTER_FINISH = 0x01;

// G1 Teleprompter Control Array Constants
export const GLASSES_TELEPROMPTER_RESERVED = 0x00;
export const GLASSES_TELEPROMPTER_NEW_SCREEN_NORMAL = 0x01;
export const GLASSES_TELEPROMPTER_NEW_SCREEN_MANUAL = 0x03;
export const GLASSES_TELEPROMPTER_NEW_SCREEN_CONTINUATION = 0x07;
export const GLASSES_TELEPROMPTER_FLAGS_NORMAL = 0x81;
export const GLASSES_TELEPROMPTER_FLAGS_MANUAL = 0x00;
export const GLASSES_TELEPROMPTER_START_DELAY = 0x00;

// G1 Teleprompter Default Options
export const GLASSES_TELEPROMPTER_CONTROL_SIZE = 10;
export const GLASSES_TELEPROMPTER_HEADER_SIZE = 2;

// G1 Teleprompter Fixed Values
export const GLASSES_TELEPROMPTER_COUNTDOWN = 1;
export const GLASSES_TELEPROMPTER_MANUAL_MODE = false;

// G1 Teleprompter Scrollbar Position
export const GLASSES_TELEPROMPTER_DEFAULT_SCROLL_POSITION = 0;

// G1 Display Parameters
export const GLASSES_CHUNK_SIZE = 200;
export const GLASSES_BMP_CHUNK_SIZE = 194;
export const GLASSES_BMP_STORAGE_ADDRESS = [0x00, 0x1c, 0x00, 0x00];
export const GLASSES_NEW_SCREEN_FLAG = 0x71;
export const GLASSES_MAX_LINE_LENGTH = 60;
export const GLASSES_MAX_DISPLAY_LINES = 5;

// G1 Timing Configuration
export const GLASSES_PACKET_DELAY = 5;
export const GLASSES_BMP_PACKET_DELAY = 5;
export const GLASSES_BMP_END_DELAY = 10;
export const GLASSES_HEARTBEAT_INTERVAL_MS = 15000;
export const GLASSES_TELEPROMPTER_PACKET_DELAY = 10;

// G1 Default Values
export const GLASSES_DEFAULT_POS = 0;
export const GLASSES_DEFAULT_PAGE_NUM = 1;
export const GLASSES_DEFAULT_MAX_PAGES = 1;