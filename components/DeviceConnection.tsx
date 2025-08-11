import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { deviceConnectionStyles as styles } from '../styles/DeviceConnectionStyles';

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
    leftConnected: boolean;
}

const DeviceConnection: React.FC<DeviceConnectionProps> = ({
    devices,
    isScanning,
    connectionStep,
    onDeviceSelect,
    onRefresh,
    leftConnected
}) => {
    const getStepInfo = () => {
        switch (connectionStep) {
            case 'left':
                return { emoji: '👈', title: 'Connect Left Glass', subtitle: 'Select your left smart glass' };
            case 'right':
                return { emoji: '👉', title: 'Connect Right Glass', subtitle: 'Select your right smart glass' };
            case 'complete':
                return { emoji: '✅', title: 'Connected!', subtitle: 'Both glasses connected successfully' };
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
                    <Text style={styles.deviceIcon}>📱</Text>
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
            <Text style={styles.emptyIcon}>�</Text>
            <Text style={styles.emptyTitle}>No Even G1 Glasses Found</Text>
            <Text style={styles.emptySubtitle}>
                This app is a companion for the official Even Realities app. 
                Please ensure your Even G1 glasses are paired and connected to the official Even Realities app first, 
                then try scanning again.
            </Text>
            <TouchableOpacity
                onPress={onRefresh}
                style={styles.refreshButtonContainer}
                activeOpacity={0.8}
            >
                <Text style={styles.refreshText}>🔄 Scan Again</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <Text style={styles.loadingIcon}>🔄</Text>
            <Text style={styles.loadingText}>Scanning...</Text>
        </View>
    );

    if (connectionStep === 'complete') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>{stepInfo.emoji}</Text>
                    <Text style={styles.title}>{stepInfo.title}</Text>
                    <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>
                </View>
                {renderStepIndicator()}
                <View style={styles.successCard}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successText}>Ready to send messages!</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>{stepInfo.emoji}</Text>
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
                                <Text style={styles.refreshButtonText}>
                                    {isScanning ? '🔄' : '↻'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionDivider} />
                        <FlatList
                            data={devices}
                            renderItem={renderDeviceCard}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        />
                    </>
                )}
            </View>
        </View>
    );
};

export default DeviceConnection;
