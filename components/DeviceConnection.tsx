import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { deviceConnectionStyles as styles } from '../styles/DeviceConnectionStyles';
import { MaterialColors } from '../styles/MaterialTheme';

interface PairedDevice {
    id: string;
    name: string | null;
    isConnected: boolean;
}

interface DeviceConnectionProps {
    devices: PairedDevice[];
    isScanning: boolean;
    connectionStep: 'left' | 'right';
    onDeviceSelect: (deviceId: string, side: 'left' | 'right') => void;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    leftConnected: boolean;
    rightConnected: boolean;
    isBluetoothEnabled: boolean;
}

const DeviceConnection: React.FC<DeviceConnectionProps> = ({
    devices,
    isScanning,
    connectionStep,
    onDeviceSelect,
    onRefresh,
    onShowAllDevices,
    leftConnected,
    rightConnected,
    isBluetoothEnabled
}) => {
    const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
    const getStepInfo = () => {
        switch (connectionStep) {
            case 'left':
                return { title: 'Connect Left Glass', subtitle: 'Select your left smart glass' };
            case 'right':
                return { title: 'Connect Right Glass', subtitle: 'Select your right smart glass' };
            default:
                return { title: 'Connect Glass', subtitle: 'Select your smart glass' };
        }
    };

    const stepInfo = getStepInfo();

    const renderStepIndicator = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepIndicator}>
                <View style={[
                    styles.step,
                    !leftConnected && styles.stepInactive
                ]}>
                    <Text style={[
                        styles.stepNumber,
                        !leftConnected && styles.stepNumberInactive
                    ]}>
                        <MaterialIcons
                            name="arrow-back"
                            size={11}
                            color={leftConnected ? '#1C1B1F' : '#49454F'}
                        />
                    </Text>
                </View>
                <View style={[
                    styles.stepLine,
                    (!leftConnected || connectionStep === 'left') && styles.stepLineInactive
                ]} />
                <View style={[
                    styles.step,
                    !rightConnected && styles.stepInactive
                ]}>
                    <Text style={[
                        styles.stepNumber,
                        !rightConnected && styles.stepNumberInactive
                    ]}>
                        <MaterialIcons
                            name="arrow-forward"
                            size={11}
                            color={rightConnected ? '#1C1B1F' : '#49454F'}
                        />
                    </Text>
                </View>
            </View>
            <View style={styles.stepLabels}>
                <Text style={[
                    styles.stepLabel,
                    leftConnected && styles.stepLabelActive
                ]}>Left Glass</Text>
                <Text style={[
                    styles.stepLabel,
                    rightConnected && styles.stepLabelActive
                ]}>Right Glass</Text>
            </View>
        </View>
    );

    const renderDeviceCard = ({ item }: { item: PairedDevice }) => {
        const isConnecting = connectingDeviceId === item.id;
        const isDisabled = isConnecting || connectingDeviceId !== null;

        return (
            <TouchableOpacity
                style={[
                    styles.deviceCard,
                    item.isConnected && styles.deviceCardConnected,
                    isConnecting && styles.deviceCardConnecting,
                    isDisabled && styles.deviceCardDisabled
                ]}
                onPress={async () => {
                    if (isDisabled) return;

                    setConnectingDeviceId(item.id);
                    try {
                        if (connectionStep === 'left') {
                            await onDeviceSelect(item.id, 'left');
                        } else if (connectionStep === 'right') {
                            await onDeviceSelect(item.id, 'right');
                        }
                    } finally {
                        setConnectingDeviceId(null);
                    }
                }}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.7}
            >
                <View style={styles.deviceCardContent}>
                    <View style={styles.deviceInfo}>
                        <MaterialIcons
                            name="bluetooth"
                            size={24}
                            color={isConnecting ? MaterialColors.onSurfaceVariant : MaterialColors.primary}
                        />
                        <View style={styles.deviceTextContainer}>
                            <Text style={[
                                styles.deviceName,
                                isConnecting && styles.deviceNameConnecting
                            ]}>
                                {item.name || 'Unknown Device'}
                            </Text>
                            <Text style={[
                                styles.deviceId,
                                isConnecting && styles.deviceIdConnecting
                            ]}>
                                {item.id.substring(0, 18)}...
                            </Text>
                        </View>

                        {isConnecting ? (
                            <View style={styles.statusBadgeConnecting}>
                                <MaterialIcons
                                    name="hourglass-empty"
                                    size={16}
                                    color={MaterialColors.onSurfaceVariant}
                                />
                                <Text style={styles.statusTextConnecting}>Connecting...</Text>
                            </View>
                        ) : item.isConnected ? (
                            <View style={styles.statusBadgeConnected}>
                                <Text style={styles.statusTextConnected}>● Connected</Text>
                            </View>
                        ) : (
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>○ Available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderBluetoothDisabledState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="bluetooth-disabled" size={48} color={MaterialColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>Bluetooth is Disabled</Text>
            <Text style={styles.emptySubtitle}>
                Bluetooth must be enabled to connect to your Even G1 glasses.
                Please enable Bluetooth in your device settings and try again.
            </Text>

            <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                    onPress={onRefresh}
                    style={[styles.actionButton, styles.primaryActionButton]}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="refresh" size={20} color={MaterialColors.onPrimary} />
                    <Text style={styles.primaryActionText}>Check Bluetooth Status</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={MaterialColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No Even G1 Glasses Found</Text>
            <Text style={styles.emptySubtitle}>
                This app is a companion for the official Even Realities app.
                Please ensure your Even G1 glasses are paired and connected to the official Even Realities app first,
                then try scanning again.
            </Text>

            <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                    onPress={onRefresh}
                    style={[styles.actionButton, styles.primaryActionButton]}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="refresh" size={20} color={MaterialColors.onPrimary} />
                    <Text style={styles.primaryActionText}>Scan for G1 Glasses</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                    onPress={onShowAllDevices}
                    style={[styles.actionButton, styles.secondaryActionButton]}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="bluetooth-searching" size={20} color={MaterialColors.onSurfaceVariant} />
                    <Text style={styles.secondaryActionText}>Show All Bluetooth Devices</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
                <MaterialIcons name="bluetooth-searching" size={32} color={MaterialColors.primary} />
            </View>
            <Text style={styles.loadingTitle}>Scanning for Even G1 Glasses</Text>
            <Text style={styles.loadingSubtitle}>This may take a few seconds...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{stepInfo.title}</Text>
                <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>
            </View>
            {renderStepIndicator()}
            <View style={styles.deviceList}>
                {isScanning ? (
                    renderLoadingState()
                ) : !isBluetoothEnabled ? (
                    renderBluetoothDisabledState()
                ) : devices.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>Available Devices</Text>
                            <TouchableOpacity
                                onPress={onRefresh}
                                disabled={isScanning}
                                style={styles.refreshButton}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons
                                    name="refresh"
                                    size={18}
                                    color={isScanning ? MaterialColors.onSurfaceVariant : MaterialColors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={devices}
                            renderItem={renderDeviceCard}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.flatListContentContainer}
                        />
                    </>
                )}
            </View>
        </View>
    );
};

export default DeviceConnection;
