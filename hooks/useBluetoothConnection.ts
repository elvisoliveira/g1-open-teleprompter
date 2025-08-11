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

    useEffect(() => {
        return () => {
            BluetoothService.disconnect();
        };
    }, []);

    // Auto-advance to next step when devices connected
    useEffect(() => {
        if (leftConnected && rightConnected && connectionStep !== 'complete') {
            setConnectionStep('complete');
        }
    }, [leftConnected, rightConnected, connectionStep]);

    const loadPairedDevices = async () => {
        try {
            setIsScanning(true);
            const devices = await BluetoothService.getPairedDevices();
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
                setLeftConnected(true);
                setConnectionStep('right');
            } else {
                await BluetoothService.connectRight(deviceId);
                setRightConnected(true);
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

            setLeftConnected(true);
            setRightConnected(true);
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
        setLeftConnected(false);
        setRightConnected(false);
        setConnectionStep('left');
    };

    return {
        leftConnected,
        rightConnected,
        isScanning,
        pairedDevices,
        connectionStep,
        isAutoConnecting,
        loadPairedDevices,
        handleDeviceConnection,
        attemptAutoReconnection,
        resetConnection,
    };
};
