import { Device } from 'react-native-ble-plx';

export enum DeviceSide {
    LEFT = 'L',
    RIGHT = 'R',
    BOTH = 'BOTH'
}

export interface BatteryInfo {
    left: number;   // -1 if not available
    right: number;  // -1 if not available
    lastUpdated: Date | null;
}

export interface DeviceStatus {
    connected: boolean;
    battery: number; // -1 if not available
    uptime: number; // uptime in seconds, -1 if not available
    firmware: string | null; // Firmware information
}

export interface HeartbeatStatus {
    left: boolean;
    right: boolean;
    timestamp: Date;
}

export interface DeviceInfo {
    left: Device | null;
    right: Device | null;
}

export interface FirmwareInfo {
    left: string | null;
    right: string | null;
} 