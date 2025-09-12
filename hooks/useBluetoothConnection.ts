import RingController from '@/services/RingController';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import GlassesController from '../services/GlassesController';

export interface PairedDevice {
    id: string;
    name: string | null;
    isConnected: boolean;
}

export type ConnectionStep = 'left' | 'right' | 'complete';
export type DeviceType = 'glasses' | 'ring' | 'all';

export const useBluetoothConnection = (
    onGlassConnected?: (side: 'left' | 'right', deviceId: string) => void,
    onRingConnected?: (deviceId: string) => void
) => {
    const [leftGlassConnected, setLeftGlassConnected] = useState(false);
    const [rightGlassConnected, setRightGlassConnected] = useState(false);
    const [ringConnected, setRingConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
    const [connectionStep, setConnectionStep] = useState<ConnectionStep>('left');
    const [isAutoConnecting, setIsAutoConnecting] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(true);

    useEffect(() => {
        // Subscribe to connection state changes from GlassesBluetoothService
        const unsubscribeGlasses = GlassesController.onConnectionStateChange((state) => {
            setLeftGlassConnected(state.left);
            setRightGlassConnected(state.right);
        });

        // Subscribe to connection state changes from RingController
        const unsubscribeRing = RingController.onConnectionStateChange((connected) => {
            setRingConnected(connected);
        });

        // Check initial Bluetooth status
        checkBluetoothStatus();

        return () => {
            unsubscribeGlasses();
            unsubscribeRing();
            GlassesController.disconnect();
            RingController.disconnect();
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
            const enabled = await GlassesController.isBluetoothEnabled();
            setIsBluetoothEnabled(enabled);
            return enabled;
        } catch (error) {
            console.error('Failed to check Bluetooth status:', error);
            setIsBluetoothEnabled(false);
            return false;
        }
    };

    const loadPairedDevices = async (deviceType: DeviceType = 'glasses') => {
        try {
            setIsScanning(true);

            // Check Bluetooth status first
            const bluetoothEnabled = await checkBluetoothStatus();
            if (!bluetoothEnabled) {
                setPairedDevices([]);
                return;
            }

            let allDevices: Array<{ id: string; name: string | null; isConnected: boolean }> = [];
            
            // Get devices from appropriate service(s)
            if (deviceType === 'all') {
                const glassesDevices = await GlassesController.getPairedDevices();
                const ringDevices = await RingController.getPairedDevices();
                allDevices = [...glassesDevices, ...ringDevices];
            } else if (deviceType === 'glasses') {
                allDevices = await GlassesController.getPairedDevices();
            } else if (deviceType === 'ring') {
                allDevices = await RingController.getPairedDevices();
            }

            // Filter devices based on type
            let filteredDevices = allDevices;
            if (deviceType === 'glasses') {
                filteredDevices = allDevices.filter(device =>
                    device.name?.startsWith('Even G1')
                );
            } else if (deviceType === 'ring') {
                filteredDevices = allDevices.filter(device =>
                    device.name?.startsWith('R08')
                );
            }
            // If deviceType is 'all', return all devices without filtering

            setPairedDevices(filteredDevices);
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
                await GlassesController.connectLeft(deviceId);
                setConnectionStep('right');
            } else {
                await GlassesController.connectRight(deviceId);
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
            await GlassesController.connectLeft(leftMac);
            await GlassesController.connectRight(rightMac);

            setConnectionStep('complete');
            setIsAutoConnecting(false);
            return true;
        } catch (error) {
            console.error('Glass auto-reconnection failed:', error);
            setIsAutoConnecting(false);
            return false;
        }
    };

    const handleRingConnection = async (deviceId: string) => {
        try {
            await RingController.connect(deviceId);

            // Notify parent component about successful connection
            onRingConnected?.(deviceId);
        } catch (error) {
            console.error('Failed to connect ring:', error);
            Alert.alert('Connection Error', 'Failed to connect to the ring controller');
        }
    };

    const toggleRingTouchPanel = async () => {
        try {
            await RingController.toggleRingTouchPanel();
        } catch (error) {
            console.error('@TODO', error);
            Alert.alert('@TODO');
        }
    };

    const attemptRingAutoReconnection = async (ringMac: string | null) => {
        if (!ringMac) return false;

        setIsAutoConnecting(true);
        try {
            await RingController.connect(ringMac);

            setIsAutoConnecting(false);
            return true;
        } catch (error) {
            console.error('Ring auto-reconnection failed:', error);
            setIsAutoConnecting(false);
            return false;
        }
    };

    const handleGlassDisconnect = async () => {
        try {
            await GlassesController.disconnect();
            setConnectionStep('left');
        } catch (error) {
            console.error('Failed to disconnect glasses:', error);
            Alert.alert('Disconnect Error', 'Failed to disconnect glasses');
        }
    };

    const handleRingDisconnect = async () => {
        try {
            await RingController.disconnect();
        } catch (error) {
            console.error('Failed to disconnect ring:', error);
            Alert.alert('Disconnect Error', 'Failed to disconnect ring controller');
        }
    };

    const resetConnection = () => {
        setConnectionStep('left');
    };

    return {
        leftGlassConnected,
        rightGlassConnected,
        ringConnected,
        isScanning,
        pairedDevices,
        connectionStep,
        isAutoConnecting,
        isBluetoothEnabled,
        loadPairedDevices,
        handleGlassConnection,
        handleRingConnection,
        handleGlassDisconnect,
        handleRingDisconnect,
        attemptGlassAutoReconnection,
        attemptRingAutoReconnection,
        resetConnection,
        checkBluetoothStatus,
        toggleRingTouchPanel,
        // Legacy exports for backward compatibility (deprecated)
        leftConnected: leftGlassConnected,
        rightConnected: rightGlassConnected,
        handleDeviceConnection: handleGlassConnection,
        attemptAutoReconnection: attemptGlassAutoReconnection,
    };
};
