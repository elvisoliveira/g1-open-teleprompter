import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MaterialColors } from '../styles/MaterialTheme';
import { reconnectionScreenStyles as styles } from '../styles/ReconnectionScreenStyles';

interface ReconnectionScreenProps {
    isRetrying: boolean;
    onRetry: () => void;
    onConnectAgain: () => void;
}

const ReconnectionScreen: React.FC<ReconnectionScreenProps> = ({
    isRetrying,
    onRetry,
    onConnectAgain
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Connection Failed</Text>
                <Text style={styles.message}>
                    Could not reconnect to your saved Even G1 devices. 
                    Make sure your glasses are still paired with the official Even Realities app and try again, 
                    or set up new connections.
                </Text>

                {isRetrying ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={MaterialColors.primary} />
                        <Text style={styles.loadingText}>Retrying connection...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.retryButton]}
                            onPress={onRetry}
                        >
                            <Text style={styles.retryButtonText}>Retry Connection</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.connectButton]}
                            onPress={onConnectAgain}
                        >
                            <Text style={styles.connectButtonText}>Connect New Devices</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ReconnectionScreen;
