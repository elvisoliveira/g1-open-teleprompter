import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import BluetoothService from '../services/BluetoothService';
import { teleprompterAppStyles } from '../styles/AppStyles';
import DeviceConnection from './DeviceConnection';
import ReconnectionScreen from './ReconnectionScreen';
import SentMessagesScreen from './SentMessagesScreen';
import SplashScreen from './SplashScreen';
import TeleprompterInterface from './TeleprompterInterface';

interface PairedDevice {
    id: string;
    name: string | null;
    isConnected: boolean;
}

interface SentTextItem {
    id: string;
    text: string;
    timestamp: Date;
}

// Storage keys for saved devices
const STORAGE_KEYS = {
    LEFT_DEVICE_MAC: 'left_device_mac',
    RIGHT_DEVICE_MAC: 'right_device_mac',
};

type AppView = 'splash' | 'connection' | 'composer' | 'messages' | 'reconnection';
type ConnectionStep = 'left' | 'right' | 'complete';

const TeleprompterApp: React.FC = () => {
    // Core state
    const [currentView, setCurrentView] = useState<AppView>('splash');
    
    const [connectionStep, setConnectionStep] = useState<ConnectionStep>('left');
    
    // Device state
    const [leftConnected, setLeftConnected] = useState(false);
    const [rightConnected, setRightConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
    
    // Saved devices and auto-reconnection state
    const [savedLeftMac, setSavedLeftMac] = useState<string | null>(null);
    const [savedRightMac, setSavedRightMac] = useState<string | null>(null);
    const [isAutoConnecting, setIsAutoConnecting] = useState(false);
    const [reconnectionFailed, setReconnectionFailed] = useState(false);
    const [splashMessage, setSplashMessage] = useState('Initializing...');
    
    // Message state
    const [inputText, setInputText] = useState('');
    const [sentMessages, setSentMessages] = useState<SentTextItem[]>([]);
    const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

    useEffect(() => {
        initializeApp();
        return () => {
            BluetoothService.disconnect();
        };
    }, []);

    // Auto-advance to composer when both devices connected
    useEffect(() => {
        if (leftConnected && rightConnected && connectionStep !== 'complete') {
            setConnectionStep('complete');
            setCurrentView('composer');
        }
    }, [leftConnected, rightConnected, connectionStep]);

    // Storage utility functions
    const saveMacAddress = async (side: 'left' | 'right', macAddress: string) => {
        try {
            const key = side === 'left' ? STORAGE_KEYS.LEFT_DEVICE_MAC : STORAGE_KEYS.RIGHT_DEVICE_MAC;
            await AsyncStorage.setItem(key, macAddress);
            if (side === 'left') {
                setSavedLeftMac(macAddress);
            } else {
                setSavedRightMac(macAddress);
            }
        } catch (error) {
            console.error(`Failed to save ${side} device MAC:`, error);
        }
    };

    const loadSavedMacAddresses = async () => {
        try {
            const [leftMac, rightMac] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                AsyncStorage.getItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
            ]);
            setSavedLeftMac(leftMac);
            setSavedRightMac(rightMac);
            return { leftMac, rightMac };
        } catch (error) {
            console.error('Failed to load saved MAC addresses:', error);
            return { leftMac: null, rightMac: null };
        }
    };

    const clearSavedMacAddresses = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.LEFT_DEVICE_MAC),
                AsyncStorage.removeItem(STORAGE_KEYS.RIGHT_DEVICE_MAC)
            ]);
            setSavedLeftMac(null);
            setSavedRightMac(null);
        } catch (error) {
            console.error('Failed to clear saved MAC addresses:', error);
        }
    };

    // Auto-reconnection functions
    const attemptAutoReconnection = async (leftMac: string | null, rightMac: string | null) => {
        if (!leftMac || !rightMac) return false;

        setIsAutoConnecting(true);
        try {
            // Try connecting to both saved devices
            await BluetoothService.connectLeft(leftMac);
            await BluetoothService.connectRight(rightMac);

            // If we reach here, both connections succeeded
            setLeftConnected(true);
            setRightConnected(true);
            setConnectionStep('complete');
            setCurrentView('composer');
            setIsAutoConnecting(false);
            return true;
        } catch (error) {
            console.error('Auto-reconnection failed:', error);
            setIsAutoConnecting(false);
            return false;
        }
    };

    const initializeApp = async () => {
        try {
            // Step 1: Check for saved MAC addresses
            setSplashMessage('Checking for saved devices...');
            const { leftMac, rightMac } = await loadSavedMacAddresses();
            
            // Step 2: If we have saved devices, try auto-reconnection
            if (leftMac && rightMac) {
                setSplashMessage('Connecting to saved Even G1 devices...');
                const reconnected = await attemptAutoReconnection(leftMac, rightMac);
                
                if (reconnected) {
                    // Success! Auto-reconnection worked, we're already in composer view
                    return;
                } else {
                    // Auto-reconnection failed, show reconnection screen
                    setReconnectionFailed(true);
                    setCurrentView('reconnection');
                    return;
                }
            }
            
            // Step 3: No saved devices, go to connection screen
            setSplashMessage('Loading available devices...');
            await loadPairedDevices();
            setCurrentView('connection');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // On error, default to connection screen
            setCurrentView('connection');
            Alert.alert('Initialization Error', 'There was an issue starting the app. Please try connecting manually.');
        }
    };

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
                // Save the MAC address for auto-reconnection
                await saveMacAddress('left', deviceId);
            } else {
                await BluetoothService.connectRight(deviceId);
                setRightConnected(true);
                // Save the MAC address for auto-reconnection
                await saveMacAddress('right', deviceId);
            }
        } catch (error) {
            console.error(`Failed to connect ${side} device:`, error);
            Alert.alert('Connection Error', `Failed to connect to the ${side} device`);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        
        try {
            const success = await BluetoothService.sendText(inputText);
            if (success) {
                const newMessage: SentTextItem = {
                    id: Date.now().toString(),
                    text: inputText,
                    timestamp: new Date()
                };
                setSentMessages(prev => [newMessage, ...prev]);
                setCurrentMessageId(newMessage.id);
                setInputText('');
            } else {
                Alert.alert('Error', 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const handleResendMessage = async (text: string) => {
        try {
            const success = await BluetoothService.sendText(text);
            if (!success) {
                Alert.alert('Error', 'Failed to resend message');
            }
        } catch (error) {
            console.error('Error resending message:', error);
            Alert.alert('Error', 'Failed to resend message');
        }
    };

    const handleExitToDashboard = async () => {
        try {
            const success = await BluetoothService.exitToDashboard();
            if (success) {
                setCurrentMessageId(null);
            } else {
                Alert.alert('Error', 'Failed to exit to dashboard');
            }
        } catch (error) {
            console.error('Error exiting to dashboard:', error);
            Alert.alert('Error', 'Failed to exit to dashboard');
        }
    };

    const handleDeleteMessage = (id: string) => {
        setSentMessages(prev => prev.filter(item => item.id !== id));
        if (currentMessageId === id) {
            setCurrentMessageId(null);
        }
    };

    // Reconnection handlers
    const handleRetryConnection = async () => {
        const reconnected = await attemptAutoReconnection(savedLeftMac, savedRightMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved devices. Please try connecting manually.');
        }
    };

    const handleConnectAgain = async () => {
        // Clear saved devices and go to manual connection
        await clearSavedMacAddresses();
        setReconnectionFailed(false);
        setCurrentView('connection');
        setConnectionStep('left');
        setLeftConnected(false);
        setRightConnected(false);
        await loadPairedDevices();
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'splash':
                return <SplashScreen message={splashMessage} />;
            
            case 'connection':
                return (
                    <DeviceConnection
                        devices={pairedDevices}
                        isScanning={isScanning}
                        connectionStep={connectionStep}
                        onDeviceSelect={handleDeviceConnection}
                        onRefresh={loadPairedDevices}
                        leftConnected={leftConnected}
                    />
                );
            
            case 'composer':
                return (
                    <TeleprompterInterface
                        inputText={inputText}
                        onTextChange={setInputText}
                        onSend={handleSendMessage}
                        onExitToDashboard={handleExitToDashboard}
                        onViewMessages={() => setCurrentView('messages')}
                        leftConnected={leftConnected}
                        rightConnected={rightConnected}
                        messageCount={sentMessages.length}
                    />
                );
            
            case 'messages':
                return (
                    <SentMessagesScreen
                        sentTexts={sentMessages}
                        onGoBack={() => setCurrentView('composer')}
                        onResendText={handleResendMessage}
                        onDeleteText={handleDeleteMessage}
                        currentlyDisplayedMessageId={currentMessageId}
                        onSetCurrentMessage={setCurrentMessageId}
                    />
                );
            
            case 'reconnection':
                return (
                    <ReconnectionScreen
                        isRetrying={isAutoConnecting}
                        onRetry={handleRetryConnection}
                        onConnectAgain={handleConnectAgain}
                    />
                );
            
            default:
                return null;
        }
    };

    return (
        <View style={teleprompterAppStyles.container}>
            {renderCurrentView()}
        </View>
    );
};

export default TeleprompterApp;
