import { router } from 'expo-router';
import React, { useEffect } from 'react';
import RingConnection from '../components/RingConnection';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useSavedDevices } from '../hooks/useSavedDevices';

export default function RingConnectionScreen() {
    const { saveRingMacAddress } = useSavedDevices();
    const {
        isScanning,
        pairedDevices,
        isBluetoothEnabled,
        loadPairedDevices,
        handleRingConnection,
    } = useBluetoothConnection(undefined, (deviceId, type) => {
        saveRingMacAddress(deviceId, type);
        // Leave only on a fresh connection, so the screen stays reachable
        // while another ring is already connected (switching rings)
        router.back();
    });

    useEffect(() => {
        loadPairedDevices('ring');
    }, []);

    return (
        <RingConnection
            devices={pairedDevices}
            isScanning={isScanning}
            onRingSelect={handleRingConnection}
            onRefresh={() => loadPairedDevices('ring')}
            onShowAllDevices={() => loadPairedDevices('all')}
            isBluetoothEnabled={isBluetoothEnabled}
        />
    );
}
