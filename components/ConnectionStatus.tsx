import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { BatteryInfo, DeviceStatus } from '../services/types';
import { connectionStatusStyles as styles } from '../styles/ConnectionStatusStyles';
import { MaterialColors } from '../styles/MaterialTheme';

interface ConnectionStatusProps {
    leftConnected: boolean;
    rightConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    leftConnected,
    rightConnected
}) => {
    const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({ left: -1, right: -1, lastUpdated: null });
    const [deviceStatus, setDeviceStatus] = useState<{ left: DeviceStatus; right: DeviceStatus }>();
    const [isUpdatingBattery, setIsUpdatingBattery] = useState(false);
    const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
    const [isUpdatingUptime, setIsUpdatingUptime] = useState(false);
    const bothConnected = leftConnected && rightConnected;

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let statusInterval: NodeJS.Timeout | null = null;
        
        // Subscribe to battery updates and get device status
        if (leftConnected || rightConnected) {
            unsubscribe = BluetoothService.onBatteryUpdate((battery) => {
                setBatteryInfo(battery);
                // Update device status when battery changes
                updateDeviceStatus();
            });
            
            // Get initial battery status and firmware info
            updateBatteryStatus();
            updateFirmwareInfo();
            updateUptimeInfo();
            updateDeviceStatus();
            
            // Periodically update device status (every 30 seconds)
            statusInterval = setInterval(() => {
                updateDeviceStatus();
            }, 30000);
        } else {
            // Clear device status when disconnected
            setDeviceStatus(undefined);
        }
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            if (statusInterval) {
                clearInterval(statusInterval);
            }
        };
    }, [leftConnected, rightConnected]);

    const updateBatteryStatus = async () => {
        if (isUpdatingBattery) return;
        
        setIsUpdatingBattery(true);
        try {
            await BluetoothService.refreshBatteryInfo();
        } catch (error) {
            console.warn('Failed to update battery status:', error);
        } finally {
            setIsUpdatingBattery(false);
        }
    };

    const updateFirmwareInfo = async () => {
        if (isUpdatingFirmware) return;
        
        setIsUpdatingFirmware(true);
        try {
            // Get firmware info for both sides
            await BluetoothService.getFirmwareInfo();
        } catch (error) {
            console.warn('Failed to update firmware info:', error);
        } finally {
            setIsUpdatingFirmware(false);
        }
    };

    const updateUptimeInfo = async () => {
        if (isUpdatingUptime) return;
        
        setIsUpdatingUptime(true);
        try {
            // Get uptime for both devices
            if (leftConnected) {
                await BluetoothService.getDeviceUptime();
            }
            if (rightConnected) {
                await BluetoothService.getDeviceUptime();
            }
        } catch (error) {
            console.warn('Failed to update uptime info:', error);
        } finally {
            setIsUpdatingUptime(false);
        }
    };

    const updateDeviceStatus = () => {
        try {
            const status = BluetoothService.getDeviceStatus();
            setDeviceStatus(status);
        } catch (error) {
            console.warn('Failed to get device status:', error);
        }
    };

    const getDeviceIcon = (connected: boolean) => {
        return connected ? '✓' : '✗';
    };

    const getBatteryDisplay = (batteryLevel: number) => {
        if (batteryLevel < 0) return '';
        return ` (${batteryLevel}%)`;
    };

    const getBatteryIcon = (batteryLevel: number) => {
        if (batteryLevel < 0) return 'battery-unknown';
        if (batteryLevel > 75) return 'battery-full';
        if (batteryLevel > 50) return 'battery-5-bar';
        if (batteryLevel > 25) return 'battery-3-bar';
        return 'battery-1-bar';
    };

    const getBatteryIconColor = (batteryLevel: number) => {
        if (batteryLevel < 0) return MaterialColors.onSurfaceVariant;
        if (batteryLevel > 25) return MaterialColors.success;
        return MaterialColors.error;
    };

    const extractFirmwareVersion = (firmwareText: string | null) => {
        if (!firmwareText) return null;
        
        // Extract version from firmware text
        // Example: "net build time: 2024-12-28 20:21:57, app build time 2024-12-28 20:20:45, ver 1.4.5, JBD DeviceID 4010"
        const versionMatch = firmwareText.match(/ver\s+([\d\.]+)/);
        if (versionMatch) {
            return versionMatch[1];
        }
        
        // Fallback: look for version patterns
        const fallbackMatch = firmwareText.match(/v?(\d+\.\d+\.\d+)/);
        if (fallbackMatch) {
            return fallbackMatch[1];
        }
        
        return 'Unknown';
    };

    const getFirmwareDisplay = (firmwareText: string | null) => {
        if (!firmwareText) return '';
        const version = extractFirmwareVersion(firmwareText);
        return version ? ` (fw: ${version})` : '';
    };

    const getUptimeDisplay = (uptime: number) => {
        if (uptime < 0) return '';
        
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        if (hours > 0) {
            return ` (up: ${hours}h ${minutes}m)`;
        } else if (minutes > 0) {
            return ` (up: ${minutes}m ${seconds}s)`;
        } else {
            return ` (up: ${seconds}s)`;
        }
    };

    const getUptimeIcon = (uptime: number) => {
        return uptime >= 0 ? 'schedule' : 'error';
    };

    const getUptimeIconColor = (uptime: number) => {
        return uptime >= 0 ? MaterialColors.success : MaterialColors.error;
    };

    const getDeviceStatus = () => {
        if (!leftConnected && !rightConnected) return 'Disconnected';
        if (bothConnected) return 'Both Connected';
        if (leftConnected || rightConnected) return 'Partial Connection';
        return 'Disconnected';
    };

    return (
        <View style={[styles.statusCard, bothConnected ? styles.statusConnected : styles.statusPartial]}>
            <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Device Status</Text>
                <Text style={[styles.statusOverview, bothConnected && styles.statusOverviewConnected]}>
                    {getDeviceStatus()}
                </Text>
            </View>
            
            <View style={styles.deviceContainer}>
                <View style={[
                    styles.deviceChip, 
                    leftConnected && styles.deviceChipConnected
                ]}>
                    <Text style={[
                        styles.deviceIcon, 
                        leftConnected && styles.deviceIconConnected
                    ]}>
                        {getDeviceIcon(leftConnected)}
                    </Text>
                    <Text style={[
                        styles.deviceText, 
                        leftConnected && styles.deviceTextConnected
                    ]}>
                        Left Glass{getBatteryDisplay(batteryInfo.left)}{getFirmwareDisplay(deviceStatus?.left?.firmware || null)}{getUptimeDisplay(deviceStatus?.left?.uptime || -1)}
                    </Text>
                    {leftConnected && batteryInfo.left >= 0 && (
                        <MaterialIcons 
                            name={getBatteryIcon(batteryInfo.left) as any} 
                            size={16} 
                            color={getBatteryIconColor(batteryInfo.left)}
                            style={styles.batteryIconSpacing}
                        />
                    )}
                </View>
                
                <View style={[
                    styles.deviceChip, 
                    rightConnected && styles.deviceChipConnected
                ]}>
                    <Text style={[
                        styles.deviceIcon, 
                        rightConnected && styles.deviceIconConnected
                    ]}>
                        {getDeviceIcon(rightConnected)}
                    </Text>
                    <Text style={[
                        styles.deviceText, 
                        rightConnected && styles.deviceTextConnected
                    ]}>
                        Right Glass{getBatteryDisplay(batteryInfo.right)}{getFirmwareDisplay(deviceStatus?.right?.firmware || null)}{getUptimeDisplay(deviceStatus?.right?.uptime || -1)}
                    </Text>
                    {rightConnected && batteryInfo.right >= 0 && (
                        <MaterialIcons 
                            name={getBatteryIcon(batteryInfo.right) as any} 
                            size={16} 
                            color={getBatteryIconColor(batteryInfo.right)}
                            style={styles.batteryIconSpacing}
                        />
                    )}
                </View>
            </View>
            
            {/* Firmware Information Section */}
            {(deviceStatus?.left?.firmware || deviceStatus?.right?.firmware) && (
                <View style={styles.firmwareContainer}>
                    <Text style={styles.firmwareTitle}>Firmware Information</Text>
                    {deviceStatus?.left?.firmware && leftConnected && (
                        <View style={styles.firmwareItem}>
                            <Text style={styles.firmwareLabel}>Left:</Text>
                            <Text style={styles.firmwareText} numberOfLines={2}>
                                {deviceStatus.left.firmware}
                            </Text>
                        </View>
                    )}
                    {deviceStatus?.right?.firmware && rightConnected && (
                        <View style={styles.firmwareItem}>
                            <Text style={styles.firmwareLabel}>Right:</Text>
                            <Text style={styles.firmwareText} numberOfLines={2}>
                                {deviceStatus.right.firmware}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Device Uptime Information */}
            {(leftConnected || rightConnected) && (
                <View style={styles.firmwareContainer}>
                    <Text style={styles.firmwareTitle}>Device Uptime</Text>
                    {leftConnected && (
                        <View style={styles.firmwareItem}>
                            <Text style={styles.firmwareLabel}>Left:</Text>
                            <View style={styles.uptimeIconRow}>
                                <MaterialIcons 
                                    name={getUptimeIcon(deviceStatus?.left?.uptime || -1) as any} 
                                    size={14} 
                                    color={getUptimeIconColor(deviceStatus?.left?.uptime || -1)}
                                    style={styles.uptimeIconSpacing}
                                />
                                <Text style={styles.firmwareText}>
                                    {deviceStatus?.left?.uptime && deviceStatus.left.uptime >= 0 
                                        ? `${Math.floor(deviceStatus.left.uptime / 3600)}h ${Math.floor((deviceStatus.left.uptime % 3600) / 60)}m ${deviceStatus.left.uptime % 60}s` 
                                        : 'Unknown'}
                                </Text>
                            </View>
                        </View>
                    )}
                    {rightConnected && (
                        <View style={styles.firmwareItem}>
                            <Text style={styles.firmwareLabel}>Right:</Text>
                            <View style={styles.uptimeIconRow}>
                                <MaterialIcons 
                                    name={getUptimeIcon(deviceStatus?.right?.uptime || -1) as any} 
                                    size={14} 
                                    color={getUptimeIconColor(deviceStatus?.right?.uptime || -1)}
                                    style={styles.uptimeIconSpacing}
                                />
                                <Text style={styles.firmwareText}>
                                    {deviceStatus?.right?.uptime && deviceStatus.right.uptime >= 0 
                                        ? `${Math.floor(deviceStatus.right.uptime / 3600)}h ${Math.floor((deviceStatus.right.uptime % 3600) / 60)}m ${deviceStatus.right.uptime % 60}s` 
                                        : 'Unknown'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default ConnectionStatus;
