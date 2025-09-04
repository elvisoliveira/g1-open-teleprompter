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

interface RingConnectionProps {
    devices: PairedDevice[];
    isScanning: boolean;
    onRingSelect: (deviceId: string) => void;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    ringConnected: boolean;
    isBluetoothEnabled: boolean;
}

const RingConnection: React.FC<RingConnectionProps> = ({
    devices,
    isScanning,
    onRingSelect,
    onRefresh,
    onShowAllDevices,
    ringConnected,
    isBluetoothEnabled
}) => {
    const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

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
                onPress={() => {
                    if (isDisabled) return;

                    setConnectingDeviceId(item.id);
                    try {
                        onRingSelect(item.id);
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
                            name="radio-button-unchecked"
                            size={24}
                            color={isConnecting ? MaterialColors.onSurfaceVariant : MaterialColors.primary}
                        />
                        <View style={styles.deviceTextContainer}>
                            <Text style={[
                                styles.deviceName,
                                isConnecting && styles.deviceNameConnecting
                            ]}>
                                {item.name || 'Unknown Ring'}
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

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={MaterialColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No Ring Controllers Found</Text>
            <Text style={styles.emptySubtitle}>
                Make sure your ring controller is in pairing mode and try scanning again.
            </Text>

            <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                    onPress={onRefresh}
                    style={[styles.actionButton, styles.primaryActionButton]}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="refresh" size={20} color={MaterialColors.onPrimary} />
                    <Text style={styles.primaryActionText}>Scan for Ring</Text>
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
            <Text style={styles.loadingTitle}>Scanning for Ring Controller</Text>
            <Text style={styles.loadingSubtitle}>This may take a few seconds...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Connect Ring Controller</Text>
                <Text style={styles.subtitle}>Select your ring controller device</Text>
            </View>

            <View style={styles.deviceList}>
                {isScanning ? (
                    renderLoadingState()
                ) : !isBluetoothEnabled ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="bluetooth-disabled" size={48} color={MaterialColors.onSurfaceVariant} />
                        <Text style={styles.emptyTitle}>Bluetooth is Disabled</Text>
                        <Text style={styles.emptySubtitle}>
                            Bluetooth must be enabled to connect to your ring controller.
                        </Text>
                    </View>
                ) : devices.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>Available Ring Controllers</Text>
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

export default RingConnection;