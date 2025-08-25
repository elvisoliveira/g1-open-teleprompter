import { Device } from 'react-native-ble-plx';

export enum DeviceSide {
    LEFT = 'L',
    RIGHT = 'R',
    BOTH = 'BOTH'
}

export interface BatteryInfo {
    left: number;
    right: number;
}

export interface DeviceStatus {
    connected: boolean;
    battery: number;
    uptime: number;
    firmware: string | null;
}

export interface DeviceInfo {
    left: Device | null;
    right: Device | null;
}

export interface FirmwareInfo {
    left: string | null;
    right: string | null;
}

export interface UptimeInfo {
    left: number;
    right: number;
} 