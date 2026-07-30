import { router } from 'expo-router';
import React, { useEffect } from 'react';
import GlassesConnection from '../components/GlassesConnection';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useSavedDevices } from '../hooks/useSavedDevices';

export default function GlassesConnectionScreen() {
    const { saveGlassMacAddress } = useSavedDevices();
    const {
        leftGlassConnected,
        rightGlassConnected,
        isScanning,
        pairedDevices,
        connectionStep,
        isBluetoothEnabled,
        loadPairedDevices,
        handleGlassConnection,
    } = useBluetoothConnection((side, deviceId) => saveGlassMacAddress(side, deviceId));

    useEffect(() => {
        loadPairedDevices('glasses');
    }, []);

    // Both sides connected → this screen is done
    useEffect(() => {
        if (leftGlassConnected && rightGlassConnected) {
            router.back();
        }
    }, [leftGlassConnected, rightGlassConnected]);

    return (
        <GlassesConnection
            devices={pairedDevices}
            isScanning={isScanning}
            connectionStep={connectionStep as 'left' | 'right'}
            onGlassSideSelect={handleGlassConnection}
            onRefresh={() => loadPairedDevices('glasses')}
            onShowAllDevices={() => loadPairedDevices('all')}
            leftConnected={leftGlassConnected}
            rightConnected={rightGlassConnected}
            isBluetoothEnabled={isBluetoothEnabled}
        />
    );
}
