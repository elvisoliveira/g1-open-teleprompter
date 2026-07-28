import React from 'react';
import { PairedDevice } from '../hooks/useBluetoothConnection';
import DeviceConnectionScreen from './DeviceConnectionScreen';

interface RingConnectionProps {
    devices: PairedDevice[];
    isScanning: boolean;
    onRingSelect: (deviceId: string) => Promise<void>;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    ringConnected: boolean;
    isBluetoothEnabled: boolean;
}

const RingConnection: React.FC<RingConnectionProps> = ({
    devices,
    isScanning,
    onRingSelect,
    onRefresh,
    onShowAllDevices,
    isBluetoothEnabled
}) => (
    <DeviceConnectionScreen
        title="Connect Ring Controller"
        subtitle="Select your ring controller device"
        devices={devices}
        isScanning={isScanning}
        isBluetoothEnabled={isBluetoothEnabled}
        onSelect={onRingSelect}
        onRefresh={onRefresh}
        onShowAllDevices={onShowAllDevices}
        deviceIcon="radio-button-unchecked"
        unknownDeviceLabel="Unknown Ring"
        listTitle="Available Ring Controllers"
        loadingTitle="Scanning for Ring Controller"
        emptyTitle="No Ring Controllers Found"
        emptySubtitle="Make sure your ring controller is in pairing mode and try scanning again."
        scanButtonLabel="Scan for Ring"
        bluetoothDisabledSubtitle="Bluetooth must be enabled to connect to your ring controller."
    />
);

export default RingConnection;
