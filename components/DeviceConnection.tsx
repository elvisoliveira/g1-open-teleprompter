import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
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
    connectionStep: 'left' | 'right' | 'complete';
    onDeviceSelect: (deviceId: string, side: 'left' | 'right') => void;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    leftConnected: boolean;
}

const DeviceConnection: React.FC<DeviceConnectionProps> = ({
    devices,
    isScanning,
    connectionStep,
    onDeviceSelect,
    onRefresh,
    onShowAllDevices,
    leftConnected
}) => {
    const getStepInfo = () => {
        switch (connectionStep) {
            case 'left':
                return { icon: 'arrow-back', title: 'Connect Left Glass', subtitle: 'Select your left smart glass' };
            case 'right':
                return { icon: 'arrow-forward', title: 'Connect Right Glass', subtitle: 'Select your right smart glass' };
            case 'complete':
                return { icon: 'check-circle', title: 'Connected!', subtitle: 'Both glasses connected successfully' };
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
                    ]}>1</Text>
                </View>
                <View style={[
                    styles.stepLine,
                    (!leftConnected || connectionStep === 'left') && styles.stepLineInactive
                ]} />
                <View style={[
                    styles.step,
                    (connectionStep === 'left' || !leftConnected) && styles.stepInactive
                ]}>
                    <Text style={[
                        styles.stepNumber,
                        (connectionStep === 'left' || !leftConnected) && styles.stepNumberInactive
                    ]}>2</Text>
                </View>
            </View>
            <View style={styles.stepLabels}>
                <Text style={[
                    styles.stepLabel,
                    leftConnected && styles.stepLabelActive
                ]}>Left Glass</Text>
                <Text style={[
                    styles.stepLabel,
                    connectionStep === 'complete' && styles.stepLabelActive
                ]}>Right Glass</Text>
            </View>
        </View>
    );

    const renderDeviceCard = ({ item }: { item: PairedDevice }) => (
        <TouchableOpacity
            style={[
                styles.deviceCard,
                item.isConnected && styles.deviceCardConnected
            ]}
            onPress={() => {
                if (connectionStep === 'left') {
                    onDeviceSelect(item.id, 'left');
                } else if (connectionStep === 'right') {
                    onDeviceSelect(item.id, 'right');
                }
            }}
            disabled={connectionStep === 'complete'}
        >
            <View style={styles.deviceCardContent}>
                <View style={styles.deviceInfo}>
                    <MaterialIcons name="bluetooth" size={24} color={MaterialColors.primary} />
                    <View style={styles.deviceTextContainer}>
                        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                        <Text style={styles.deviceId}>{item.id.substring(0, 18)}...</Text>
                    </View>
                    {item.isConnected ? (
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

    if (connectionStep === 'complete') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialIcons name={stepInfo.icon as any} size={48} color={MaterialColors.success} />
                    <Text style={styles.title}>{stepInfo.title}</Text>
                    <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>
                </View>
                {renderStepIndicator()}
                <View style={styles.successCard}>
                    <View style={styles.successIconContainer}>
                        <MaterialIcons name="celebration" size={32} color={MaterialColors.success} />
                        <Text style={styles.successText}>Ready to send messages!</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name={stepInfo.icon as any} size={48} color={MaterialColors.primary} />
                <Text style={styles.title}>{stepInfo.title}</Text>
                <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>
            </View>

            {renderStepIndicator()}

            <View style={styles.deviceList}>
                {isScanning ? (
                    renderLoadingState()
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
                                    color={isScanning ? MaterialColors.textDisabled : MaterialColors.primary} 
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
