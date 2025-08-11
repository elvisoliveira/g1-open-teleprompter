import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialColors } from '../styles/MaterialTheme';
import { splashScreenStyles as styles } from '../styles/SplashScreenStyles';

interface SplashScreenProps {
    message: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>G1 OpenTeleprompter</Text>
                <ActivityIndicator size="large" color={MaterialColors.primary} style={styles.loader} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
};

export default SplashScreen;
