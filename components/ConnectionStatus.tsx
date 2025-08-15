import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { BatteryInfo, DeviceStatus } from '../services/types';
import { connectionStatusStyles as styles } from '../styles/ConnectionStatusStyles';
import DeviceStatusCard from './DeviceStatusCard';

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
            // updateFirmwareInfo();
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

    const getDeviceStatus = () => {
        if (!leftConnected && !rightConnected) return 'All Devices Offline';
        if (bothConnected) return 'All Devices Online';
        if (leftConnected || rightConnected) return 'Partial Connection';
        return 'All Devices Offline';
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Overall Status Header */}
            <View style={styles.overallStatusCard}>
                <Text style={styles.overallStatusTitle}>System Status</Text>
                <Text style={styles.overallStatusSubtitle}>
                    {getDeviceStatus()}
                </Text>
            </View>

            {/* Device Status Cards */}
            <View style={styles.devicesContainer}>
                <DeviceStatusCard
                    side="left"
                    connected={leftConnected}
                    batteryLevel={batteryInfo.left}
                    deviceStatus={deviceStatus?.left}
                    isCompact={true}
                />

                <DeviceStatusCard
                    side="right"
                    connected={rightConnected}
                    batteryLevel={batteryInfo.right}
                    deviceStatus={deviceStatus?.right}
                    isCompact={true}
                />
            </View>

            {/* Last Update Info */}
            {batteryInfo.lastUpdated && (
                <View style={styles.lastUpdateContainer}>
                    <Text style={styles.lastUpdateText}>
                        Last updated: {new Date(batteryInfo.lastUpdated).toLocaleTimeString()}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

export default ConnectionStatus;
