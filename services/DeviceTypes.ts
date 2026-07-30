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
    firmware: string | null;
}

export interface FirmwareInfo {
    left: string | null;
    right: string | null;
}

// Ring Controller Types

export interface QRingTouchControlStatus {
    controlType: string;
    mode: string;
    modeValue: number;
    sleepMinutes?: number;
}

export interface QRingGestureControlStatus {
    controlType: string;
    mode: string;
    modeValue: number;
    enabled: boolean;
}

export type QRingPanelStatus = QRingTouchControlStatus | QRingGestureControlStatus;

export type RingType = 'qring' | 'pebble';

export interface RingStatus {
    connected: boolean;
    battery: number;
    firmware: string | null;
    panel: QRingPanelStatus | null;
}

export interface RingStandardDeviceInfo {
    firmware: string | null,
    hardware: string | null,
}

/**
 * Output mode types for the teleprompter app
 */
export type OutputMode = 'text' | 'image' | 'official';

// Presentation Types

export interface Slide {
    id: string;
    text: string;
}

export interface Presentation {
    id: string;
    name: string;
    slides: Slide[];
}