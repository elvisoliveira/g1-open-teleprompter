import GlassesBluetoothService from '@/services/GlassesBluetoothService';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DeviceStatus, RingStatus } from '../services/Types';
import { ButtonStyles } from '../styles/CommonStyles';
import { connectionStatusStyles as styles } from '../styles/ConnectionStatusStyles';
import { MaterialColors, MaterialSpacing } from '../styles/MaterialTheme';
import GlassSideStatusCard from './GlassSideStatusCard';
import RingStatusCard from './RingStatusCard';

interface DevicesStatusProps {
    // Glasses props
    leftConnected: boolean;
    rightConnected: boolean;
    onReconnectGlasses?: () => void;
    onDisconnectGlasses?: () => void;
    onSetupGlasses?: () => void;
    isReconnectingGlasses?: boolean;
    isDisconnectingGlasses?: boolean;
    hasConfiguredGlasses?: boolean;

    // Ring props
    ringConnected?: boolean;
    onReconnectRing?: () => void;
    onDisconnectRing?: () => void;
    onSetupRing?: () => void;
    isReconnectingRing?: boolean;
    isDisconnectingRing?: boolean;
    hasConfiguredRing?: boolean;
}

const DevicesStatus: React.FC<DevicesStatusProps> = ({
    leftConnected,
    rightConnected,
    onReconnectGlasses,
    onDisconnectGlasses,
    onSetupGlasses,
    isReconnectingGlasses = false,
    isDisconnectingGlasses = false,
    hasConfiguredGlasses = false,

    ringConnected = false,
    onReconnectRing,
    onDisconnectRing,
    onSetupRing,
    isReconnectingRing = false,
    isDisconnectingRing = false,
    hasConfiguredRing = false
}) => {
    const [glassSidesStatus, setGlassSidesStatus] = useState<{ left: DeviceStatus; right: DeviceStatus }>();
    const [ringStatus, setRingStatus] = useState<RingStatus>();
    const [isUpdatingBattery, setIsUpdatingBattery] = useState(false);

    const bothGlassSidesConnected = leftConnected && rightConnected;
    const anyDeviceConnected = leftConnected || rightConnected || ringConnected;
    const hasAnyConfiguredDevice = hasConfiguredGlasses || hasConfiguredRing;

    useEffect(() => {
        let statusInterval: NodeJS.Timeout | null = null;

        // Subscribe to battery updates and get device status
        if (anyDeviceConnected) {
            // Get initial battery status and device info
            refreshBatteryInfo();
            refreshDevicesStatus();

            // Periodically update device status (every 5 seconds)
            statusInterval = setInterval(() => {
                refreshDevicesStatus();
            }, 5000);
        } else {
            // Clear device status when all disconnected
            setGlassSidesStatus(undefined);
            setRingStatus(undefined);
        }

        return () => {
            if (statusInterval) {
                clearInterval(statusInterval);
            }
        };
    }, [leftConnected, rightConnected, ringConnected]);

    const refreshBatteryInfo = async () => {
        if (isUpdatingBattery) return;

        setIsUpdatingBattery(true);
        try {
            await GlassesBluetoothService.refreshBatteryInfo();
        } catch (error) {
            console.warn('Failed to update battery status:', error);
        } finally {
            setIsUpdatingBattery(false);
        }
    };

    const refreshDevicesStatus = () => {
        try {
            // Refresh glasses status
            if (leftConnected || rightConnected) {
                const glassesStatus = GlassesBluetoothService.getDeviceStatus();
                setGlassSidesStatus(glassesStatus);
            }

            // TODO: Refresh ring status when ring service is implemented
            if (ringConnected) {
                // const ringStatus = RingService.getStatus();
                // setRingStatus(ringStatus);
            }
        } catch (error) {
            console.warn('Failed to get devices status:', error);
        }
    };

    const getConnectionStatus = () => {
        if (!hasAnyConfiguredDevice) return 'No Devices Configured';

        const connectedDevices = [];
        if (bothGlassSidesConnected) connectedDevices.push('Glasses');
        else if (leftConnected || rightConnected) connectedDevices.push('Glasses (Partial)');

        if (ringConnected) connectedDevices.push('Ring');

        if (connectedDevices.length === 0) return 'All Devices Offline';
        if (connectedDevices.length === 1) return `${connectedDevices[0]} Online`;
        return `${connectedDevices.join(' & ')} Online`;
    };

    const getStatusDescription = () => {
        if (!hasAnyConfiguredDevice) {
            return 'Connect your devices to get started';
        }
        return getConnectionStatus();
    };

    const renderConnectionActions = () => {
        if (!hasAnyConfiguredDevice) {
            // First-time setup: show both device options
            return (
                <View>
                    <TouchableOpacity
                        onPress={() => onSetupGlasses?.()}
                        disabled={!onSetupGlasses}
                        style={[
                            ButtonStyles.primaryButton,
                            { marginBottom: MaterialSpacing.sm },
                            !onSetupGlasses && ButtonStyles.primaryButtonDisabled
                        ]}
                    >
                        <MaterialIcons
                            name="bluetooth-searching"
                            size={20}
                            color={MaterialColors.onPrimary}
                        />
                        <Text style={ButtonStyles.primaryButtonText}>
                            Connect Glasses
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onSetupRing?.()}
                        disabled={!onSetupRing}
                        style={[
                            ButtonStyles.secondaryButton,
                            !onSetupRing && ButtonStyles.secondaryButtonDisabled
                        ]}
                    >
                        <MaterialIcons
                            name="bluetooth-searching"
                            size={20}
                            color={MaterialColors.primary}
                        />
                        <Text style={ButtonStyles.secondaryButtonText}>
                            Connect Ring
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const actions = [];

        // Disconnect buttons for connected devices
        if (hasConfiguredGlasses && (leftConnected || rightConnected)) {
            actions.push(
                <TouchableOpacity
                    key="glasses-disconnect"
                    onPress={() => onDisconnectGlasses?.()}
                    disabled={!onDisconnectGlasses || isDisconnectingGlasses}
                    style={[
                        ButtonStyles.secondaryButton,
                        { marginBottom: MaterialSpacing.sm },
                        (!onDisconnectGlasses || isDisconnectingGlasses) && ButtonStyles.secondaryButtonDisabled
                    ]}
                >
                    <MaterialIcons
                        name={isDisconnectingGlasses ? 'sync' : 'bluetooth-disabled'}
                        size={20}
                        color={MaterialColors.primary}
                    />
                    <Text style={ButtonStyles.secondaryButtonText}>
                        {isDisconnectingGlasses ? 'Disconnecting Glasses…' : 'Disconnect Glasses'}
                    </Text>
                </TouchableOpacity>
            );
        }

        if (hasConfiguredRing && ringConnected) {
            actions.push(
                <TouchableOpacity
                    key="ring-disconnect"
                    onPress={() => onDisconnectRing?.()}
                    disabled={!onDisconnectRing || isDisconnectingRing}
                    style={[
                        ButtonStyles.secondaryButton,
                        { marginBottom: MaterialSpacing.sm },
                        (!onDisconnectRing || isDisconnectingRing) && ButtonStyles.secondaryButtonDisabled
                    ]}
                >
                    <MaterialIcons
                        name={isDisconnectingRing ? 'sync' : 'radio-button-off'}
                        size={20}
                        color={MaterialColors.primary}
                    />
                    <Text style={ButtonStyles.secondaryButtonText}>
                        {isDisconnectingRing ? 'Disconnecting Ring…' : 'Disconnect Ring'}
                    </Text>
                </TouchableOpacity>
            );
        }

        // Reconnect options for configured but disconnected devices
        if (hasConfiguredGlasses && !bothGlassSidesConnected) {
            actions.push(
                <TouchableOpacity
                    key="glasses-reconnect"
                    onPress={() => onReconnectGlasses?.()}
                    disabled={!onReconnectGlasses || isReconnectingGlasses}
                    style={[
                        ButtonStyles.primaryButton,
                        { marginBottom: MaterialSpacing.sm },
                        (!onReconnectGlasses || isReconnectingGlasses) && ButtonStyles.primaryButtonDisabled
                    ]}
                >
                    <MaterialIcons
                        name={isReconnectingGlasses ? 'sync' : 'refresh'}
                        size={20}
                        color={MaterialColors.onPrimary}
                    />
                    <Text style={ButtonStyles.primaryButtonText}>
                        {isReconnectingGlasses ? 'Reconnecting Glasses…' : 'Reconnect Glasses'}
                    </Text>
                </TouchableOpacity>
            );
        }

        if (hasConfiguredRing && !ringConnected) {
            actions.push(
                <TouchableOpacity
                    key="ring-reconnect"
                    onPress={() => onReconnectRing?.()}
                    disabled={!onReconnectRing || isReconnectingRing}
                    style={[
                        ButtonStyles.primaryButton,
                        { marginBottom: MaterialSpacing.sm },
                        (!onReconnectRing || isReconnectingRing) && ButtonStyles.primaryButtonDisabled
                    ]}
                >
                    <MaterialIcons
                        name={isReconnectingRing ? 'sync' : 'refresh'}
                        size={20}
                        color={MaterialColors.onPrimary}
                    />
                    <Text style={ButtonStyles.primaryButtonText}>
                        {isReconnectingRing ? 'Reconnecting Ring…' : 'Reconnect Ring'}
                    </Text>
                </TouchableOpacity>
            );
        }

        // Manual setup options (always show for troubleshooting)
        if (!hasConfiguredGlasses || !hasConfiguredRing) {
            actions.push(
                <View key="manual-options" style={{ flexDirection: 'row', gap: MaterialSpacing.sm }}>
                    {!hasConfiguredGlasses && (
                        <TouchableOpacity
                            onPress={() => onSetupGlasses?.()}
                            disabled={!onSetupGlasses}
                            style={[
                                ButtonStyles.secondaryButton,
                                { flex: 1 },
                                !onSetupGlasses && ButtonStyles.secondaryButtonDisabled
                            ]}
                        >
                            <MaterialIcons
                                name="bluetooth-searching"
                                size={18}
                                color={MaterialColors.primary}
                            />
                            <Text style={[ButtonStyles.secondaryButtonText, { fontSize: 14 }]}>
                                Setup Glasses
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!hasConfiguredRing && (
                        <TouchableOpacity
                            onPress={() => onSetupRing?.()}
                            disabled={!onSetupRing}
                            style={[
                                ButtonStyles.secondaryButton,
                                { flex: 1 },
                                !onSetupRing && ButtonStyles.secondaryButtonDisabled
                            ]}
                        >
                            <MaterialIcons
                                name="radio-button-unchecked"
                                size={18}
                                color={MaterialColors.primary}
                            />
                            <Text style={[ButtonStyles.secondaryButtonText, { fontSize: 14 }]}>
                                Setup Ring
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return actions.length > 0 ? <View>{actions}</View> : null;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Status Header */}
            <View style={styles.overallStatusCard}>
                <Text style={styles.overallStatusTitle}>
                    {hasAnyConfiguredDevice ? 'Devices Status' : 'Device Setup'}
                </Text>
                <Text style={[
                    styles.overallStatusSubtitle,
                    anyDeviceConnected ? styles.statusTextConnected : styles.statusTextDisconnected
                ]}>
                    {getStatusDescription()}
                </Text>

                {/* Connection Actions */}
                <View style={{ marginTop: MaterialSpacing.md }}>
                    {renderConnectionActions()}
                </View>
            </View>

            {/* Glasses Status Cards */}
            {hasConfiguredGlasses && (
                <View>
                    <Text style={[styles.overallStatusTitle, { marginTop: MaterialSpacing.lg, marginBottom: MaterialSpacing.md }]}>
                        Even G1 Glasses
                    </Text>
                    <View style={styles.devicesContainer}>
                        <GlassSideStatusCard
                            side="left"
                            connected={leftConnected}
                            glassSideStatus={glassSidesStatus?.left}
                            isCompact={true}
                        />

                        <GlassSideStatusCard
                            side="right"
                            connected={rightConnected}
                            glassSideStatus={glassSidesStatus?.right}
                            isCompact={true}
                        />
                    </View>
                </View>
            )}

            {/* Ring Controller Status Card */}
            {hasConfiguredRing && (
                <View>
                    <Text style={[styles.overallStatusTitle, { marginTop: MaterialSpacing.lg, marginBottom: MaterialSpacing.md }]}>
                        Ring Controller
                    </Text>
                    <View style={styles.devicesContainer}>
                        <RingStatusCard
                            connected={ringConnected}
                            ringStatus={ringStatus}
                            isCompact={true}
                        />
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

export default DevicesStatus;