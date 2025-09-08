export const CHARACTERISTIC_SERVICE = '6e40fff0-b5a3-f393-e0a9-e50e24dcca9e';
// export const CHARACTERISTIC_SERVICE_V2 = 'de5bf728-d711-4e47-af26-65e3012a5dc7';

// Ring Protocol Commands
export const RING_BATTERY_CMD = 0x03;

//  (placeholder for future implementation)
export const RING_GESTURE_CMD = 0x30;
export const RING_CALIBRATE_CMD = 0x32;
export const RING_STATUS_CMD = 0x33;

// Ring Configuration
export const RING_SENSITIVITY_MIN = 1;
export const RING_SENSITIVITY_MAX = 10;
export const RING_HEARTBEAT_INTERVAL_MS = 30000;

// Ring Gesture Types
export const RING_GESTURE_SWIPE_LEFT = 0x01;
export const RING_GESTURE_SWIPE_RIGHT = 0x02;
export const RING_GESTURE_TAP = 0x03;
export const RING_GESTURE_DOUBLE_TAP = 0x04;

// Ring Modes
export const RING_MODE_TELEPROMPTER = 'teleprompter';
export const RING_MODE_PRESENTATION = 'presentation';
export const RING_MODE_DISABLED = 'disabled';

// Ring Timing Configuration
export const RING_PACKET_DELAY = 10;
export const RING_CONNECTION_TIMEOUT_MS = 8000;