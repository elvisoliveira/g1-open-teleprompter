import React from 'react';
import { Text, View } from 'react-native';
import { connectionStatusStyles as styles } from '../styles/ConnectionStatusStyles';

interface ConnectionStatusProps {
    leftConnected: boolean;
    rightConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    leftConnected,
    rightConnected
}) => {
    const bothConnected = leftConnected && rightConnected;

    const getDeviceIcon = (connected: boolean) => {
        return connected ? '✓' : '✗';
    };

    const getDeviceStatus = () => {
        if (!leftConnected && !rightConnected) return 'Disconnected';
        if (bothConnected) return 'Both Connected';
        if (leftConnected || rightConnected) return 'Partial Connection';
        return 'Disconnected';
    };

    return (
        <View style={[styles.statusCard, bothConnected ? styles.statusConnected : styles.statusPartial]}>
            <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Device Status</Text>
                <Text style={[styles.statusOverview, bothConnected && styles.statusOverviewConnected]}>
                    {getDeviceStatus()}
                </Text>
            </View>
            
            <View style={styles.deviceContainer}>
                <View style={[
                    styles.deviceChip, 
                    leftConnected && styles.deviceChipConnected
                ]}>
                    <Text style={[
                        styles.deviceIcon, 
                        leftConnected && styles.deviceIconConnected
                    ]}>
                        {getDeviceIcon(leftConnected)}
                    </Text>
                    <Text style={[
                        styles.deviceText, 
                        leftConnected && styles.deviceTextConnected
                    ]}>
                        Left Glass
                    </Text>
                </View>
                
                <View style={[
                    styles.deviceChip, 
                    rightConnected && styles.deviceChipConnected
                ]}>
                    <Text style={[
                        styles.deviceIcon, 
                        rightConnected && styles.deviceIconConnected
                    ]}>
                        {getDeviceIcon(rightConnected)}
                    </Text>
                    <Text style={[
                        styles.deviceText, 
                        rightConnected && styles.deviceTextConnected
                    ]}>
                        Right Glass
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default ConnectionStatus;
