import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { PairedDevice } from '../hooks/useBluetoothConnection';
import { deviceConnectionStyles as styles } from '../styles/DeviceConnectionStyles';
import DeviceConnectionScreen from './DeviceConnectionScreen';

interface GlassesConnectionProps {
    devices: PairedDevice[];
    isScanning: boolean;
    connectionStep: 'left' | 'right';
    onGlassSideSelect: (deviceId: string, side: 'left' | 'right') => Promise<void>;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    leftConnected: boolean;
    rightConnected: boolean;
    isBluetoothEnabled: boolean;
}

const GlassesConnection: React.FC<GlassesConnectionProps> = ({
    devices,
    isScanning,
    connectionStep,
    onGlassSideSelect,
    onRefresh,
    onShowAllDevices,
    leftConnected,
    rightConnected,
    isBluetoothEnabled
}) => {
    const stepIndicator = (
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

    return (
        <DeviceConnectionScreen
            title={connectionStep === 'left' ? 'Connect Left Glass' : 'Connect Right Glass'}
            subtitle={connectionStep === 'left' ? 'Select your left smart glass' : 'Select your right smart glass'}
            devices={devices}
            isScanning={isScanning}
            isBluetoothEnabled={isBluetoothEnabled}
            onSelect={(deviceId) => onGlassSideSelect(deviceId, connectionStep)}
            onRefresh={onRefresh}
            onShowAllDevices={onShowAllDevices}
            deviceIcon="bluetooth"
            unknownDeviceLabel="Unknown Device"
            listTitle="Available Devices"
            loadingTitle="Scanning for Even G1 Glasses"
            emptyTitle="No Even G1 Glasses Found"
            emptySubtitle={'This app is a companion for the official Even Realities app. Please ensure your Even G1 glasses are paired and connected to the official Even Realities app first, then try scanning again.'}
            scanButtonLabel="Scan for G1 Glasses"
            bluetoothDisabledSubtitle={'Bluetooth must be enabled to connect to your Even G1 glasses. Please enable Bluetooth in your device settings and try again.'}
            header={stepIndicator}
        />
    );
};

export default GlassesConnection;
