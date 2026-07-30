import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import DevicesStatus from '../../components/DevicesStatus';
import { useBluetoothConnection } from '../../hooks/useBluetoothConnection';
import { useSavedDevices } from '../../hooks/useSavedDevices';

export default function DeviceScreen() {
    const {
        savedLeftGlassMac,
        savedRightGlassMac,
        savedRingMac,
        loadSavedGlassMacAddresses,
        loadSavedRingMacAddress
    } = useSavedDevices();

    const {
        leftGlassConnected,
        rightGlassConnected,
        ringConnected,
        isReconnectingGlasses,
        isReconnectingRing,
        handleGlassDisconnect,
        handleRingDisconnect,
        attemptGlassAutoReconnection,
        attemptRingAutoReconnection,
        toggleRingTouchPanel,
    } = useBluetoothConnection();

    const [isDisconnectingGlasses, setIsDisconnectingGlasses] = useState(false);
    const [isDisconnectingRing, setIsDisconnectingRing] = useState(false);

    useEffect(() => {
        loadSavedGlassMacAddresses();
        loadSavedRingMacAddress();
    }, []);

    const handleRetryGlassConnection = async () => {
        const reconnected = await attemptGlassAutoReconnection(savedLeftGlassMac, savedRightGlassMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved glasses. Please try connecting manually.');
        }
    };

    const handleRetryRingConnection = async () => {
        const reconnected = await attemptRingAutoReconnection(savedRingMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved ring controller. Please try connecting manually.');
        }
    };

    const handleDisconnectGlasses = async () => {
        setIsDisconnectingGlasses(true);
        try {
            await handleGlassDisconnect();
        } finally {
            setIsDisconnectingGlasses(false);
        }
    };

    const handleDisconnectRing = async () => {
        setIsDisconnectingRing(true);
        try {
            await handleRingDisconnect();
        } finally {
            setIsDisconnectingRing(false);
        }
    };

    return (
        <DevicesStatus
            leftConnected={leftGlassConnected}
            rightConnected={rightGlassConnected}
            ringConnected={ringConnected}
            onReconnectGlasses={handleRetryGlassConnection}
            onReconnectRing={handleRetryRingConnection}
            onDisconnectGlasses={handleDisconnectGlasses}
            onDisconnectRing={handleDisconnectRing}
            onSetupGlasses={() => router.push('/glasses-connection')}
            onSetupRing={() => router.push('/ring-connection')}
            onToggleTouchPanel={toggleRingTouchPanel}
            isReconnectingGlasses={isReconnectingGlasses}
            isReconnectingRing={isReconnectingRing}
            isDisconnectingGlasses={isDisconnectingGlasses}
            isDisconnectingRing={isDisconnectingRing}
            hasConfiguredGlasses={!!(savedLeftGlassMac && savedRightGlassMac)}
            hasConfiguredRing={!!savedRingMac}
        />
    );
}
