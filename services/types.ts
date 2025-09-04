import { Device } from 'react-native-ble-plx';

export enum GlassSide {
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

export interface GlassesInfo {
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

// Ring Controller Types
export interface RingStatus {
    connected: boolean;
    battery: number;
    firmware: string | null;
    gestureMode?: 'teleprompter' | 'presentation' | 'disabled';
    sensitivity?: number;
}

export interface RingInfo {
    device: Device | null;
    status: RingStatus | null;
}

// Generic Connected Device Types
export type ConnectedDeviceType = 'glasses' | 'ring';

export type AppView = 'glassesConnection' | 'settings' | 'device' | 'presentations';

/**
 * Output mode types for the teleprompter app
 */
export type OutputMode = 'text' | 'image' | 'official';

export interface ConnectedDevice {
    type: ConnectedDeviceType;
    id: string;
    name: string;
    isConnected: boolean;
}