export const CHARACTERISTIC_SERVICE = '6e40fff0-b5a3-f393-e0a9-e50e24dcca9e';
// export const CHARACTERISTIC_SERVICE_V2 = 'de5bf728-d711-4e47-af26-65e3012a5dc7';

// Ring Protocol Commands
export const RING_CMD_BATTERY = 0x03;
export const RING_CMD_KEEPALIVE = 0x48;
export const RING_CMD_TOUCH_PANEL = 0x3b;

// Touch panel Operation Types
export const RING_OP_READ = 0x01;
export const RING_OP_WRITE = 0x02;

// Control Modes
export const RING_MODE_TOUCH = 0x00;
export const RING_MODE_GESTURE = 0x01;

// Touch Control Modes
export const RING_TOUCH_MODE_OFF = 0x00;
export const RING_TOUCH_MODE_MUSIC = 0x01;
export const RING_TOUCH_MODE_SHORT_VIDEO = 0x02;
export const RING_TOUCH_MODE_TASBIH = 0x03;
export const RING_TOUCH_MODE_EBOOK = 0x04;
export const RING_TOUCH_MODE_PHOTO = 0x05;

// Gesture Control Modes
export const RING_GESTURE_MODE_OFF = 0x00;
export const RING_GESTURE_MODE_DEFAULT = 0x01;
export const RING_GESTURE_MODE_SHORT_VIDEO = 0x02;
export const RING_GESTURE_MODE_EBOOK = 0x04;
export const RING_GESTURE_MODE_GAME = 0x07;