import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import BluetoothService from '../services/BluetoothService';

export interface PairedDevice {
    id: string;
    name: string | null;
    isConnected: boolean;
}

export type ConnectionStep = 'left' | 'right' | 'complete';

export const useBluetoothConnection = (onGlassConnected?: (side: 'left' | 'right', deviceId: string) => void) => {
    const [leftGlassConnected, setLeftGlassConnected] = useState(false);
    const [rightGlassConnected, setRightGlassConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
    const [connectionStep, setConnectionStep] = useState<ConnectionStep>('left');
    const [isAutoConnecting, setIsAutoConnecting] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(true);

    useEffect(() => {
        // Subscribe to connection state changes from BluetoothService
        const unsubscribe = BluetoothService.onConnectionStateChange((state) => {
            setLeftGlassConnected(state.left);
            setRightGlassConnected(state.right);
        });

        // Check initial Bluetooth status
        checkBluetoothStatus();

        return () => {
            unsubscribe();
            BluetoothService.disconnect();
        };
    }, []);

    // Auto-advance to next step when glasses connected
    useEffect(() => {
        if (leftGlassConnected && rightGlassConnected && connectionStep !== 'complete') {
            setConnectionStep('complete');
        }
    }, [leftGlassConnected, rightGlassConnected, connectionStep]);

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

    const handleGlassConnection = async (deviceId: string, side: 'left' | 'right') => {
        try {
            if (side === 'left') {
                await BluetoothService.connectLeft(deviceId);
                setConnectionStep('right');
            } else {
                await BluetoothService.connectRight(deviceId);
            }
            
            // Notify parent component about successful connection
            onGlassConnected?.(side, deviceId);
        } catch (error) {
            console.error(`Failed to connect ${side} glass:`, error);
            Alert.alert('Connection Error', `Failed to connect to the ${side} glass`);
        }
    };

    const attemptGlassAutoReconnection = async (leftMac: string | null, rightMac: string | null) => {
        if (!leftMac || !rightMac) return false;

        setIsAutoConnecting(true);
        try {
            await BluetoothService.connectLeft(leftMac);
            await BluetoothService.connectRight(rightMac);

            setConnectionStep('complete');
            setIsAutoConnecting(false);
            return true;
        } catch (error) {
            console.error('Glass auto-reconnection failed:', error);
            setIsAutoConnecting(false);
            return false;
        }
    };

    const resetConnection = () => {
        setConnectionStep('left');
    };

    return {
        leftGlassConnected,
        rightGlassConnected,
        isScanning,
        pairedDevices,
        connectionStep,
        isAutoConnecting,
        isBluetoothEnabled,
        loadPairedDevices,
        handleGlassConnection,
        attemptGlassAutoReconnection,
        resetConnection,
        checkBluetoothStatus,
        // Legacy exports for backward compatibility (deprecated)
        leftConnected: leftGlassConnected,
        rightConnected: rightGlassConnected,
        handleDeviceConnection: handleGlassConnection,
        attemptAutoReconnection: attemptGlassAutoReconnection,
    };
};
