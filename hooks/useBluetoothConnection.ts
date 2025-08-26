import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import BluetoothService from '../services/BluetoothService';

export interface PairedDevice {
    id: string;
    name: string | null;
    isConnected: boolean;
}

export type ConnectionStep = 'left' | 'right' | 'complete';

export const useBluetoothConnection = (onDeviceConnected?: (side: 'left' | 'right', deviceId: string) => void) => {
    const [leftConnected, setLeftConnected] = useState(false);
    const [rightConnected, setRightConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
    const [connectionStep, setConnectionStep] = useState<ConnectionStep>('left');
    const [isAutoConnecting, setIsAutoConnecting] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(true);

    useEffect(() => {
        // Subscribe to connection state changes from BluetoothService
        const unsubscribe = BluetoothService.onConnectionStateChange((state) => {
            setLeftConnected(state.left);
            setRightConnected(state.right);
        });

        // Check initial Bluetooth status
        checkBluetoothStatus();

        return () => {
            unsubscribe();
            BluetoothService.disconnect();
        };
    }, []);

    // Auto-advance to next step when devices connected
    useEffect(() => {
        if (leftConnected && rightConnected && connectionStep !== 'complete') {
            setConnectionStep('complete');
        }
    }, [leftConnected, rightConnected, connectionStep]);

    const checkBluetoothStatus = async () => {
        try {
            const enabled = await BluetoothService.isBluetoothEnabled();
            setIsBluetoothEnabled(enabled);
            return enabled;
        } catch (error) {
            console.error('Failed to check Bluetooth status:', error);
            setIsBluetoothEnabled(false);
            return false;
        }
    };

    const loadPairedDevices = async (showAllDevices = false) => {
        try {
            setIsScanning(true);
            
            // Check Bluetooth status first
            const bluetoothEnabled = await checkBluetoothStatus();
            if (!bluetoothEnabled) {
                setPairedDevices([]);
                return;
            }
            
            const devices = await BluetoothService.getPairedDevices(showAllDevices);
            setPairedDevices(devices);
        } catch (error) {
            console.error('Failed to load devices:', error);
            Alert.alert('Error', 'Failed to load paired devices');
        } finally {
            setIsScanning(false);
        }
    };

    const handleDeviceConnection = async (deviceId: string, side: 'left' | 'right') => {
        try {
            if (side === 'left') {
                await BluetoothService.connectLeft(deviceId);
                setConnectionStep('right');
            } else {
                await BluetoothService.connectRight(deviceId);
            }
            
            // Notify parent component about successful connection
            onDeviceConnected?.(side, deviceId);
        } catch (error) {
            console.error(`Failed to connect ${side} device:`, error);
            Alert.alert('Connection Error', `Failed to connect to the ${side} device`);
        }
    };

    const attemptAutoReconnection = async (leftMac: string | null, rightMac: string | null) => {
        if (!leftMac || !rightMac) return false;

        setIsAutoConnecting(true);
        try {
            await BluetoothService.connectLeft(leftMac);
            await BluetoothService.connectRight(rightMac);

            setConnectionStep('complete');
            setIsAutoConnecting(false);
            return true;
        } catch (error) {
            console.error('Auto-reconnection failed:', error);
            setIsAutoConnecting(false);
            return false;
        }
    };

    const resetConnection = () => {
        setConnectionStep('left');
    };

    return {
        leftConnected,
        rightConnected,
        isScanning,
        pairedDevices,
        connectionStep,
        isAutoConnecting,
        isBluetoothEnabled,
        loadPairedDevices,
        handleDeviceConnection,
        attemptAutoReconnection,
        resetConnection,
        checkBluetoothStatus,
    };
};
