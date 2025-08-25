import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { DeviceStatus } from '../services/types';
import { ButtonStyles } from '../styles/CommonStyles';
import { connectionStatusStyles as styles } from '../styles/ConnectionStatusStyles';
import { MaterialColors, MaterialSpacing } from '../styles/MaterialTheme';
import DeviceStatusCard from './DeviceStatusCard';

interface ConnectionStatusProps {
    leftConnected: boolean;
    rightConnected: boolean;
    onReconnect?: () => void;
    isRetrying?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    leftConnected,
    rightConnected,
    onReconnect,
    isRetrying
}) => {
    const [deviceStatus, setDeviceStatus] = useState<{ left: DeviceStatus; right: DeviceStatus }>();
    const [isUpdatingBattery, setIsUpdatingBattery] = useState(false);
    const [isUpdatingUptime, setIsUpdatingUptime] = useState(false);
    const bothConnected = leftConnected && rightConnected;

    useEffect(() => {
        let statusInterval: NodeJS.Timeout | null = null;

        // Subscribe to battery updates and get device status
        if (leftConnected || rightConnected) {
            // Get initial battery status and uptime info
            updateBatteryStatus();

            // TODO: Uptime behavior is odd, so we're not updating it for now
            // updateUptimeInfo();

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
            await BluetoothService.refreshUptime();
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
                <Text style={[
                    styles.overallStatusSubtitle,
                    leftConnected && rightConnected ? styles.statusTextConnected : styles.statusTextDisconnected
                ]}>
                    {getDeviceStatus()}
                </Text>

                {/* Reconnect CTA when offline */}
                {(!bothConnected) && (
                    <TouchableOpacity
                        onPress={() => onReconnect?.()}
                        disabled={!onReconnect || isRetrying}
                        style={[
                            ButtonStyles.primaryButton,
                            { marginTop: MaterialSpacing.md },
                            (!onReconnect || isRetrying) && ButtonStyles.primaryButtonDisabled
                        ]}
                    >
                        <MaterialIcons
                            name={isRetrying ? 'sync' : 'refresh'}
                            size={20}
                            color={MaterialColors.onPrimary}
                        />
                        <Text style={ButtonStyles.primaryButtonText}>
                            {isRetrying ? 'Reconnecting…' : 'Try Reconnect'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Device Status Cards */}
            <View style={styles.devicesContainer}>
                <DeviceStatusCard
                    side="left"
                    connected={leftConnected}
                    deviceStatus={deviceStatus?.left}
                    isCompact={true}
                />

                <DeviceStatusCard
                    side="right"
                    connected={rightConnected}
                    deviceStatus={deviceStatus?.right}
                    isCompact={true}
                />
            </View>
        </ScrollView>
    );
};

export default ConnectionStatus;
