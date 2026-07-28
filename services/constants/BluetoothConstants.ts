// Shared Bluetooth UUIDs
export const CHARACTERISTIC_WRITE = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
export const CHARACTERISTIC_NOTIFY = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Shared BLE Configuration
export const MTU_SIZE = 247;
export const CONNECTION_TIMEOUT_MS = 10000;

// Native ping tick cadence — must match TICK_INTERVAL_MS in BluetoothAdapterModule.java
export const BLE_TICK_INTERVAL_MS = 5000;
export const BLE_TICK_EVENT = 'BleTick';

// Standard BLE service/characteristic UUIDs (only the ones this app reads)
export const SERVICES = {
    DEVICE_INFO: '180A',
};

export const CHARACTERISTICS = {
    FIRMWARE_REVISION: '2A26',
    HARDWARE_REVISION: '2A27',
};