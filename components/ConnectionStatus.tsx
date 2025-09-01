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
    onSetupDevices?: () => void;
    isReconnecting?: boolean;
    hasConfiguredDevices?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    leftConnected,
    rightConnected,
    onReconnect,
    onSetupDevices,
    isReconnecting = false,
    hasConfiguredDevices = false
}) => {
    const [deviceStatus, setDeviceStatus] = useState<{ left: DeviceStatus; right: DeviceStatus }>();
    const [isUpdatingBattery, setIsUpdatingBattery] = useState(false);

    const bothConnected = leftConnected && rightConnected;

    useEffect(() => {
        let statusInterval: NodeJS.Timeout | null = null;

        // Subscribe to battery updates and get device status
        if (leftConnected || rightConnected) {
            // Get initial battery status and device info
            refreshBatteryInfo();
            refreshDeviceStatus();

            // Periodically update device status (every 30 seconds)
            statusInterval = setInterval(() => {
                refreshDeviceStatus();
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

    const refreshBatteryInfo = async () => {
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

    const refreshDeviceStatus = () => {
        try {
            const status = BluetoothService.getDeviceStatus();
            setDeviceStatus(status);
        } catch (error) {
            console.warn('Failed to get device status:', error);
        }
    };

    const getConnectionStatus = () => {
        if (!hasConfiguredDevices) return 'No Devices Configured';
        if (bothConnected) return 'All Devices Online';
        if (leftConnected || rightConnected) return 'Partial Connection';
        return 'All Devices Offline';
    };

    const getStatusDescription = () => {
        if (!hasConfiguredDevices) {
            return 'Connect your Even G1 glasses to get started';
        }
        return getConnectionStatus();
    };

    const renderConnectionActions = () => {
        if (!hasConfiguredDevices) {
            // First-time setup: single primary button
            return (
                <TouchableOpacity
                    onPress={() => onSetupDevices?.()}
                    disabled={!onSetupDevices}
                    style={[
                        ButtonStyles.primaryButton,
                        !onSetupDevices && ButtonStyles.primaryButtonDisabled
                    ]}
                >
                    <MaterialIcons
                        name="bluetooth-searching"
                        size={20}
                        color={MaterialColors.onPrimary}
                    />
                    <Text style={ButtonStyles.primaryButtonText}>
                        Connect Devices
                    </Text>
                </TouchableOpacity>
            );
        }

        // Configured devices: show reconnect + manual options when not fully connected
        if (!bothConnected) {
            return (
                <>
                    <TouchableOpacity
                        onPress={() => onReconnect?.()}
                        disabled={!onReconnect || isReconnecting}
                        style={[
                            ButtonStyles.primaryButton,
                            { marginBottom: MaterialSpacing.sm },
                            (!onReconnect || isReconnecting) && ButtonStyles.primaryButtonDisabled
                        ]}
                    >
                        <MaterialIcons
                            name={isReconnecting ? 'sync' : 'refresh'}
                            size={20}
                            color={MaterialColors.onPrimary}
                        />
                        <Text style={ButtonStyles.primaryButtonText}>
                            {isReconnecting ? 'Reconnecting…' : 'Try Reconnect'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onSetupDevices?.()}
                        disabled={!onSetupDevices}
                        style={[
                            ButtonStyles.secondaryButton,
                            !onSetupDevices && ButtonStyles.secondaryButtonDisabled
                        ]}
                    >
                        <MaterialIcons
                            name="bluetooth-searching"
                            size={20}
                            color={MaterialColors.primary}
                        />
                        <Text style={ButtonStyles.secondaryButtonText}>
                            Connect Manually
                        </Text>
                    </TouchableOpacity>
                </>
            );
        }

        return null;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Status Header */}
            <View style={styles.overallStatusCard}>
                <Text style={styles.overallStatusTitle}>
                    {hasConfiguredDevices ? 'System Status' : 'Device Setup'}
                </Text>
                <Text style={[
                    styles.overallStatusSubtitle,
                    bothConnected ? styles.statusTextConnected : styles.statusTextDisconnected
                ]}>
                    {getStatusDescription()}
                </Text>

                {/* Connection Actions */}
                <View style={{ marginTop: MaterialSpacing.md }}>
                    {renderConnectionActions()}
                </View>
            </View>

            {/* Device Status Cards */}
            {hasConfiguredDevices && (
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
            )}
        </ScrollView>
    );
};

export default ConnectionStatus;
