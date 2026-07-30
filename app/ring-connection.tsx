import { router } from 'expo-router';
import React, { useEffect } from 'react';
import RingConnection from '../components/RingConnection';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useSavedDevices } from '../hooks/useSavedDevices';

export default function RingConnectionScreen() {
    const { saveRingMacAddress } = useSavedDevices();
    const {
        ringConnected,
        isScanning,
        pairedDevices,
        isBluetoothEnabled,
        loadPairedDevices,
        handleRingConnection,
    } = useBluetoothConnection(undefined, (deviceId) => saveRingMacAddress(deviceId));

    useEffect(() => {
        loadPairedDevices('ring');
    }, []);

    // Ring connected → this screen is done
    useEffect(() => {
        if (ringConnected) {
            router.back();
        }
    }, [ringConnected]);

    return (
        <RingConnection
            devices={pairedDevices}
            isScanning={isScanning}
            onRingSelect={handleRingConnection}
            onRefresh={() => loadPairedDevices('ring')}
            onShowAllDevices={() => loadPairedDevices('all')}
            ringConnected={ringConnected}
            isBluetoothEnabled={isBluetoothEnabled}
        />
    );
}
