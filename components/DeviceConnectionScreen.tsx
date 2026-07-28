import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { PairedDevice } from '../hooks/useBluetoothConnection';
import { deviceConnectionStyles as styles } from '../styles/DeviceConnectionStyles';
import { MaterialColors } from '../styles/MaterialTheme';

interface DeviceConnectionScreenProps {
    title: string;
    subtitle: string;
    devices: PairedDevice[];
    isScanning: boolean;
    isBluetoothEnabled: boolean;
    onSelect: (deviceId: string) => Promise<void>;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    deviceIcon: React.ComponentProps<typeof MaterialIcons>['name'];
    unknownDeviceLabel: string;
    listTitle: string;
    loadingTitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    scanButtonLabel: string;
    bluetoothDisabledSubtitle: string;
    header?: React.ReactNode;
}

const DeviceConnectionScreen: React.FC<DeviceConnectionScreenProps> = ({
    title,
    subtitle,
    devices,
    isScanning,
    isBluetoothEnabled,
    onSelect,
    onRefresh,
    onShowAllDevices,
    deviceIcon,
    unknownDeviceLabel,
    listTitle,
    loadingTitle,
    emptyTitle,
    emptySubtitle,
    scanButtonLabel,
    bluetoothDisabledSubtitle,
    header
}) => {
    const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
    const isDisabled = connectingDeviceId !== null;

    const renderDeviceCard = ({ item }: { item: PairedDevice }) => {
        const isConnecting = connectingDeviceId === item.id;

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
                        await onSelect(item.id);
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
                            name={deviceIcon}
                            size={24}
                            color={isConnecting ? MaterialColors.onSurfaceVariant : MaterialColors.primary}
                        />
                        <View style={styles.deviceTextContainer}>
                            <Text style={[
                                styles.deviceName,
                                isConnecting && styles.deviceNameConnecting
                            ]}>
                                {item.name || unknownDeviceLabel}
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
            <Text style={styles.emptySubtitle}>{bluetoothDisabledSubtitle}</Text>

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
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>

            <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                    onPress={onRefresh}
                    style={[styles.actionButton, styles.primaryActionButton]}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="refresh" size={20} color={MaterialColors.onPrimary} />
                    <Text style={styles.primaryActionText}>{scanButtonLabel}</Text>
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
            <Text style={styles.loadingTitle}>{loadingTitle}</Text>
            <Text style={styles.loadingSubtitle}>This may take a few seconds...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {header}
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
                            <Text style={styles.listTitle}>{listTitle}</Text>
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

export default DeviceConnectionScreen;
