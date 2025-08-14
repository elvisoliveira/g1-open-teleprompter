import React from 'react';
import { View } from 'react-native';
import { deviceScreenStyles as styles } from '../styles/DeviceScreenStyles';
import ConnectionStatus from './ConnectionStatus';

interface DeviceScreenProps {
    leftConnected: boolean;
    rightConnected: boolean;
}

const DeviceScreen: React.FC<DeviceScreenProps> = ({
    leftConnected,
    rightConnected
}) => {
    return (
        <View style={styles.container}>
            <ConnectionStatus
                leftConnected={leftConnected}
                rightConnected={rightConnected}
            />
        </View>
    );
};

export default DeviceScreen;
