import { Device } from 'react-native-ble-plx';
import { CommunicationManager } from './CommunicationManager';
import {
    BATTERY_CMD,
    FIRMWARE_REQUEST_CMD,
    INIT_LEFT_CMD,
    UPTIME_CMD
} from './constants';
import { ListenerManager } from './ListenerManager';
import { BatteryInfo, DeviceSide, FirmwareInfo } from './types';
import { Utils } from './utils';

export class DeviceStatusManager {
    private batteryInfo: BatteryInfo = { left: -1, right: -1, lastUpdated: null };
    private deviceUptime: number = -1; // uptime in seconds, -1 if not available
    private firmwareInfo: FirmwareInfo = { left: null, right: null };
    private batteryMonitoringInterval: NodeJS.Timeout | null = null;
    private batteryListeners = new ListenerManager<BatteryInfo>();

    /**
     * Update battery info for specified side
     */
    private updateBatteryInfoInternal(side: DeviceSide, batteryLevel: number): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.batteryInfo.left = batteryLevel;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.batteryInfo.right = batteryLevel;
        }
    }

    /**
     * Update firmware info for specified side
     */
    private updateFirmwareInfoInternal(side: DeviceSide, firmwareText: string): void {
        if (side === DeviceSide.LEFT || side === DeviceSide.BOTH) {
            this.firmwareInfo.left = firmwareText;
        }
        if (side === DeviceSide.RIGHT || side === DeviceSide.BOTH) {
            this.firmwareInfo.right = firmwareText;
        }
    }

    /**
     * Get battery info for specified side
     */
    async getBatteryInfo(
        device: Device, 
        side: DeviceSide = DeviceSide.BOTH
    ): Promise<number> {
        console.log(`[DeviceStatusManager] Starting battery request for side: ${side}`);
        
        const requestBytes = new Uint8Array([BATTERY_CMD, 0x01]);
        const responseHeader = new Uint8Array([BATTERY_CMD]);
        
        const responseData = await CommunicationManager.sendCommandWithResponse(
            device, 
            requestBytes, 
            responseHeader, 
            250
        );
        
        if (responseData && responseData.length > 2) {
            const batteryLevel = responseData[2] & 0xFF;
            console.log(`[DeviceStatusManager] Battery level: ${batteryLevel}%`);
            
            // Update internal battery tracking
            const now = new Date();
            this.updateBatteryInfoInternal(side, batteryLevel);
            this.batteryInfo.lastUpdated = now;
            
            // Notify listeners
            this.batteryListeners.notify(this.batteryInfo);
            
            return batteryLevel;
        } else {
            console.warn('[DeviceStatusManager] Invalid or missing response data');
            return -1;
        }
    }

    /**
     * Get firmware information from device
     */
    async getFirmwareInfo(
        device: Device, 
        side: DeviceSide = DeviceSide.LEFT
    ): Promise<string | null> {
        console.log(`[DeviceStatusManager] Starting firmware info request for side: ${side}`);
        
        const requestBytes = new Uint8Array(FIRMWARE_REQUEST_CMD);
        console.log('[DeviceStatusManager] Request:', FIRMWARE_REQUEST_CMD);
        
        const emptyHeader = new Uint8Array([]);
        const responseData = await CommunicationManager.sendCommandWithResponse(
            device, 
            requestBytes, 
            emptyHeader, 
            500
        );
        
        if (responseData && responseData.length > 0) {
            try {
                const firmwareText = new TextDecoder('utf-8').decode(responseData).trim();
                console.log(`[DeviceStatusManager] Firmware info (${responseData.length} bytes): ${firmwareText}`);
                
                // Update internal firmware tracking
                this.updateFirmwareInfoInternal(side, firmwareText);
                
                if (firmwareText.startsWith('net')) {
                    console.log('[DeviceStatusManager] Valid firmware response received');
                    return firmwareText;
                } else {
                    console.warn(`[DeviceStatusManager] Unexpected firmware response format: ${firmwareText.substring(0, 50)}...`);
                    return firmwareText;
                }
            } catch (decodeError) {
                console.error('[DeviceStatusManager] Failed to decode firmware response:', decodeError);
                const hexResponse = Utils.arrayToHex(responseData);
                console.log(`[DeviceStatusManager] Raw hex response: ${hexResponse}`);
                return `Raw response: ${hexResponse}`;
            }
        } else {
            console.warn('[DeviceStatusManager] No firmware response received');
            return null;
        }
    }

    /**
     * Get device uptime in seconds since boot
     */
    async getDeviceUptime(device: Device): Promise<number> {
        console.log('[DeviceStatusManager] Starting uptime request');
        
        const requestBytes = new Uint8Array([UPTIME_CMD]);
        const responseHeader = new Uint8Array([UPTIME_CMD]);
        
        const responseData = await CommunicationManager.sendCommandWithResponse(
            device, 
            requestBytes, 
            responseHeader, 
            250
        );
        
        if (responseData && responseData.length >= 4) {
            console.log(`[DeviceStatusManager] Received response: ${Utils.arrayToHex(responseData)}`);
            
            // Parse uptime from bytes 1-3 (little-endian format)
            const uptimeSeconds = (responseData[1] | (responseData[2] << 8) | (responseData[3] << 16));
            const flagByte = responseData.length > 4 ? responseData[4] : null;
            
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            
            console.log(`[DeviceStatusManager] Parsed uptime: ${uptimeSeconds}s (${hours}h ${minutes}m ${seconds}s), flag: ${flagByte ? `0x${flagByte.toString(16)}` : 'none'}`);
            
            this.deviceUptime = uptimeSeconds;
            return uptimeSeconds;
        } else {
            console.warn(`[DeviceStatusManager] Invalid response: ${responseData ? `${responseData.length} bytes` : 'null'}`);
            this.deviceUptime = -1;
            return -1;
        }
    }

    /**
     * Send firmware request command to connected devices
     */
    async sendFirmwareRequest(devices: { left: Device | null; right: Device | null }): Promise<boolean> {
        console.log('[DeviceStatusManager] Sending firmware request command:', FIRMWARE_REQUEST_CMD);
        
        const firmwareCmd = new Uint8Array(FIRMWARE_REQUEST_CMD);
        
        let success = true;
        if (devices.left) {
            const leftResult = await CommunicationManager.writeToDevice(devices.left, firmwareCmd, false);
            console.log(`[DeviceStatusManager] Left device result: ${leftResult}`);
            success = success && leftResult;
        }
        if (devices.right) {
            const rightResult = await CommunicationManager.writeToDevice(devices.right, firmwareCmd, false);
            console.log(`[DeviceStatusManager] Right device result: ${rightResult}`);
            success = success && rightResult;
        }
        
        console.log(`[DeviceStatusManager] Firmware request completed: ${success}`);
        return success;
    }

    /**
     * Send init command to left device only
     */
    async sendInitLeft(devices: { left: Device | null; right: Device | null }): Promise<boolean> {
        console.log('[DeviceStatusManager] Sending init command to left device:', INIT_LEFT_CMD);
        
        if (!devices.left) {
            console.log('[DeviceStatusManager] No left device connected, skipping init command');
            return true;
        }
        
        const initCmd = new Uint8Array(INIT_LEFT_CMD);
        const result = await CommunicationManager.writeToDevice(devices.left, initCmd, false);
        
        console.log(`[DeviceStatusManager] Init left command result: ${result}`);
        return result;
    }

    /**
     * Perform full device initialization sequence
     */
    async initializeDevices(devices: { left: Device | null; right: Device | null }): Promise<boolean> {
        console.log('[DeviceStatusManager] Starting device initialization sequence');
        
        try {
            const firmwareResult = await this.sendFirmwareRequest(devices);
            if (!firmwareResult) {
                console.error('[DeviceStatusManager] Firmware request failed');
                return false;
            }
            
            await Utils.sleep(100);
            
            // @TODO: Not sure if we actually need to send this (init command?)
            // const initResult = await this.sendInitLeft(devices);
            // if (!initResult) {
            //     console.error('[DeviceStatusManager] Init left command failed');
            //     return false;
            // }
            
            try {
                await this.updateFirmwareInfo(devices);
                console.log('[DeviceStatusManager] Firmware info updated successfully');
            } catch (error) {
                console.warn('[DeviceStatusManager] Failed to get firmware info, but continuing:', error);
            }
            
            console.log('[DeviceStatusManager] Device initialization completed successfully');
            return true;
        } catch (error) {
            console.error('[DeviceStatusManager] Device initialization failed:', error);
            return false;
        }
    }

    /**
     * Update firmware info for connected devices
     */
    async updateFirmwareInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        console.log('[DeviceStatusManager] Starting firmware update for connected devices');
        
        try {
            const updates = [];
            if (devices.left) {
                updates.push(this.getFirmwareInfo(devices.left, DeviceSide.LEFT));
            }
            if (devices.right) {
                updates.push(this.getFirmwareInfo(devices.right, DeviceSide.RIGHT));
            }
            
            await Promise.all(updates);
            console.log('[DeviceStatusManager] Firmware update completed successfully');
        } catch (error) {
            console.warn('[DeviceStatusManager] Failed to update firmware info:', error);
        }
    }

    /**
     * Update battery info for both devices
     */
    async updateBatteryInfo(devices: { left: Device | null; right: Device | null }): Promise<void> {
        console.log('[DeviceStatusManager] Starting battery update for connected devices');
        
        try {
            if (devices.left || devices.right) {
                const batteryResult = await this.getBatteryInfo(
                    devices.left || devices.right!, 
                    DeviceSide.BOTH
                );
                console.log(`[DeviceStatusManager] Battery query result: ${batteryResult}%`);
            } else {
                console.log('[DeviceStatusManager] No devices connected, skipping battery update');
            }
        } catch (error) {
            console.warn('[DeviceStatusManager] Failed to update battery info:', error);
        }
    }

    /**
     * Start periodic battery monitoring
     */
    startBatteryMonitoring(
        devices: { left: Device | null; right: Device | null }, 
        intervalMinutes: number = 5
    ): void {
        this.stopBatteryMonitoring(); // Clear any existing interval
        
        this.batteryMonitoringInterval = setInterval(() => {
            this.updateBatteryInfo(devices);
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop periodic battery monitoring
     */
    stopBatteryMonitoring(): void {
        if (this.batteryMonitoringInterval) {
            clearInterval(this.batteryMonitoringInterval);
            this.batteryMonitoringInterval = null;
        }
    }

    /**
     * Subscribe to battery updates
     */
    onBatteryUpdate(callback: (battery: BatteryInfo) => void): () => void {
        return this.batteryListeners.add(callback);
    }

    /**
     * Get current battery information
     */
    getCurrentBatteryInfo(): BatteryInfo {
        return { ...this.batteryInfo };
    }

    /**
     * Get current firmware information
     */
    getCurrentFirmwareInfo(): FirmwareInfo {
        return { ...this.firmwareInfo };
    }

    /**
     * Get current device uptime status
     */
    getCurrentUptimeStatus(): number {
        return this.deviceUptime;
    }

    /**
     * Reset all status information
     */
    reset(): void {
        this.batteryInfo = { left: -1, right: -1, lastUpdated: null };
        this.deviceUptime = -1;
        this.firmwareInfo = { left: null, right: null };
        this.stopBatteryMonitoring();
        this.batteryListeners.clear();
    }
} 