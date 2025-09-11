import { Device } from 'react-native-ble-plx';
import {
    CHARACTERISTIC_SERVICE,
    RING_CMD_BATTERY,
    RING_CMD_KEEPALIVE,
    RING_CMD_TOUCH_PANEL,
    RING_GESTURE_MODE_DEFAULT,
    RING_GESTURE_MODE_EBOOK,
    RING_GESTURE_MODE_GAME,
    RING_GESTURE_MODE_OFF,
    RING_GESTURE_MODE_SHORT_VIDEO,
    RING_MODE_GESTURE,
    RING_MODE_TOUCH,
    RING_OP_READ,
    RING_OP_WRITE,
    RING_TOUCH_MODE_EBOOK,
    RING_TOUCH_MODE_MUSIC,
    RING_TOUCH_MODE_OFF,
    RING_TOUCH_MODE_PHOTO,
    RING_TOUCH_MODE_SHORT_VIDEO,
    RING_TOUCH_MODE_TASBIH
} from '../constants/RingConstants';
import { GestureControlStatus, PanelStatus, TouchControlStatus } from '../DeviceTypes';
import { BluetoothTransport } from './BluetoothTransport';

/**
 * RingProtocol - Handles ring device-specific communication
 * This module handles the ring's 16-byte packet protocol with checksum validation
 */
export class RingProtocol {

    // Operation mappings
    private static readonly operationModes: { [key: number]: 'READ' | 'WRITE' } = {
        [RING_OP_READ]: 'READ',
        [RING_OP_WRITE]: 'WRITE'
    };

    // Touch control mode mappings
    private static readonly touchModes: { [key: number]: string } = {
        [RING_TOUCH_MODE_OFF]: "Off",
        [RING_TOUCH_MODE_MUSIC]: "Music",
        [RING_TOUCH_MODE_SHORT_VIDEO]: "Short Video",
        [RING_TOUCH_MODE_TASBIH]: "Tasbih",
        [RING_TOUCH_MODE_EBOOK]: "Ebook",
        [RING_TOUCH_MODE_PHOTO]: "Photo (Camera)"
    };

    // Gesture control mode mappings
    private static readonly gestureModes: { [key: number]: string } = {
        [RING_GESTURE_MODE_OFF]: "Off",
        [RING_GESTURE_MODE_DEFAULT]: "Gestures (default)",
        [RING_GESTURE_MODE_SHORT_VIDEO]: "Short video",
        [RING_GESTURE_MODE_EBOOK]: "Ebook",
        [RING_GESTURE_MODE_GAME]: "Game"
    };

    // Control type mappings
    private static readonly controlModes: { [key: number]: string } = {
        [RING_MODE_TOUCH]: "Touch Control",
        [RING_MODE_GESTURE]: "Gesture Control"
    };

    /**
     * Get human-readable control mode name
     */
    private static getModeName(mode: { [key: number]: string }, id: number): string {
        return mode[id] || `Unknown (0x${id.toString(16).padStart(2, '0')})`;
    }

    /**
     * Calculate checksum for standard packets (based on Lua implementation)
     */
    private static calculateChecksum(buffer: Uint8Array, length: number): number {
        let checksum = 0;
        for (let i = 0; i < length; i++) {
            checksum = (checksum + buffer[i]) % 256;
        }
        return checksum;
    }

    /**
     * Create a 16-byte packet with command, payload, and calculated checksum
     */
    private static createPacket(command: number, payload: number[] = []): Uint8Array {
        const packet = new Uint8Array(16);
        packet[0] = command;

        // Fill payload bytes
        for (let i = 0; i < payload.length && i < 14; i++) {
            packet[i + 1] = payload[i];
        }

        // Calculate and set checksum (last byte)
        const checksum = this.calculateChecksum(packet, 15);
        packet[15] = checksum;

        return packet;
    }

    static async sendKeepAlive(device: Device): Promise<boolean> {
        console.log('[RingProtocol] Send Keep Alive');

        const requestBytes = this.createPacket(RING_CMD_KEEPALIVE);
        const response = await BluetoothTransport.sendCommandWithResponse(CHARACTERISTIC_SERVICE, device, requestBytes, new Uint8Array([RING_CMD_KEEPALIVE]));

        if (!response || response.length < 16) {
            console.log('[RingProtocol] Invalid keep alive response, isn\'t alive');
            return false;
        }

        // Parse response according to Lua parser structure
        const reqType = response[1];
        const steps = (response[2] << 8) | response[3]; // 16-bit little endian
        const calx10 = (response[7] << 16) | (response[8] << 8) | response[9]; // 24-bit value
        const calories = calx10 / 10.0;
        const distance = (response[11] << 8) | response[12]; // 16-bit distance in meters
        const sequence = response[14];

        console.log(`[RingProtocol] Keep Alive Response:`, {
            reqType: `0x${reqType.toString(16).padStart(2, '0')}`,
            steps,
            calories: `${calories.toFixed(1)} kcal`,
            distance: `${distance}m`,
            sequence
        });

        // Is alive
        return true;
    }


    static async requestBatteryLevel(device: Device): Promise<number | null> {
        console.log('[RingProtocol] Ring battery level request');
        const response = await BluetoothTransport.sendCommandWithResponse(
            CHARACTERISTIC_SERVICE,
            device,
            this.createPacket(RING_CMD_BATTERY),
            new Uint8Array([RING_CMD_BATTERY])
        );
        return response && response.length >= 1 ? response[1] : null;
    }

    static async requestFirmwareInfo(device: Device): Promise<string | null> {
        console.log('[RingProtocol] Ring firmware version request');
        const response = await BluetoothTransport.getDeviceInfo(device);
        return response ? response.firmware : null;
    }

    static async requestPanelStatus(device: Device): Promise<PanelStatus | null> {
        console.log('[RingProtocol] Ring Touchpanel request');
        const response = await BluetoothTransport.sendCommandWithResponse(
            CHARACTERISTIC_SERVICE,
            device,
            this.createPacket(RING_CMD_TOUCH_PANEL, [RING_OP_READ]),
            new Uint8Array([RING_CMD_TOUCH_PANEL])
        );

        if (!response) {
            console.log('[RingProtocol] Invalid touchpanel response');
            return null;
        }

        return this.parsePanelResponse(response);
    }

    private static parsePanelResponse(response: Uint8Array) {
        // Sample response
        // 0x3b 0x01 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x3c


        // Parse response according to protocol structure
        // const operation = response[1];
        const settingId = response[2];

        if (settingId === RING_MODE_TOUCH) {
            // Touch Control: [3]=mode, [4]=sleep minutes (optional)
            const modeValue = response[3];
            const sleepMinutes = response[4];

            const result: TouchControlStatus = {
                controlType: 'touch',
                mode: this.getModeName(this.touchModes, modeValue),
                modeValue,
                sleepMinutes: sleepMinutes
            };

            console.log(`[RingProtocol] Touch Control Status:`, result);
            return result;
        }

        if (settingId === RING_MODE_GESTURE) {
            // Gesture Control: [3]=mode, [4]=enabled flag
            const modeValue = response[3];
            const enabled = response[4] === 1;

            const result: GestureControlStatus = {
                controlType: 'gesture',
                mode: this.getModeName(this.gestureModes, modeValue),
                modeValue,
                enabled
            };

            console.log(`[RingProtocol] Gesture Control Status:`, result);
            return result;
        }

        console.log(`[RingProtocol] Unknown control mode: ${settingId}`);
        return null;
    }

    static async disablePanel(device: Device): Promise<PanelStatus | null> {
        console.log('[RingProtocol] Disable ring touch control');

        // Write operation
        // Touch Control
        // Off Mode
        // Sleep minutes: 0
        const response = await BluetoothTransport.sendCommandWithResponse(
            CHARACTERISTIC_SERVICE,
            device,
            this.createPacket(RING_CMD_TOUCH_PANEL, [RING_OP_WRITE, RING_MODE_TOUCH, RING_TOUCH_MODE_OFF, 0]),
            new Uint8Array([RING_CMD_TOUCH_PANEL])
        );

        if (!response) {
            console.log('[RingProtocol] Invalid touchpanel response');
            return null;
        }

        return this.parsePanelResponse(response);
    }


    static async enablePanel(device: Device): Promise<PanelStatus | null> {
        console.log('[RingProtocol] Disable ring touch control');

        // Write operation
        // Touch Control
        // Music Mode
        // Sleep minutes: 0
        const response = await BluetoothTransport.sendCommandWithResponse(
            CHARACTERISTIC_SERVICE,
            device,
            this.createPacket(RING_CMD_TOUCH_PANEL, [RING_OP_WRITE, RING_MODE_TOUCH, RING_TOUCH_MODE_MUSIC, 0]),
            new Uint8Array([RING_CMD_TOUCH_PANEL])
        );

        if (!response) {
            console.log('[RingProtocol] Invalid touchpanel response');
            return null;
        }

        return this.parsePanelResponse(response);
    }
}



