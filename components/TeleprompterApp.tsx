import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { defaultBitmapGenerator } from '../services/BitmapGenerator';
import BluetoothService from '../services/BluetoothService';
import { teleprompterAppStyles } from '../styles/AppStyles';
import { OutputMode } from '../types/OutputMode';
import AppBottomNavigation from './AppBottomNavigation';
import DeviceConnection from './DeviceConnection';
import DeviceScreen from './DeviceScreen';
import HomeScreen from './HomeScreen';
import ReconnectionScreen from './ReconnectionScreen';
import SentMessagesScreen from './SentMessagesScreen';
import SplashScreen from './SplashScreen';

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

type AppView = 'splash' | 'connection' | 'home' | 'device' | 'messages' | 'reconnection';
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
    const [outputMode, setOutputMode] = useState<OutputMode>('text');
    const [sentMessages, setSentMessages] = useState<SentTextItem[]>([]);
    const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        initializeApp();
        return () => {
            BluetoothService.disconnect();
        };
    }, []);

    // Auto-advance to home when both devices connected
    useEffect(() => {
        if (leftConnected && rightConnected && connectionStep !== 'complete') {
            setConnectionStep('complete');
            setCurrentView('home');
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
            setCurrentView('home');
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
                    // Success! Auto-reconnection worked, we're already in home view
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
            console.log('Loading paired devices...');
            const devices = await BluetoothService.getPairedDevices(false); // Default to filtered (Even G1 only)
            console.log('Loaded devices:', devices);
            setPairedDevices(devices);
            
            if (devices.length === 0) {
                console.warn('No devices found. This could be due to:');
                console.warn('1. Missing permissions');
                console.warn('2. No paired Bluetooth devices');
                console.warn('3. Native module not properly linked');
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            Alert.alert('Error', 'Failed to load paired devices');
        } finally {
            setIsScanning(false);
        }
    };

    const handleShowAllDevices = async () => {
        // Directly call getPairedDevices with true to show all devices
        try {
            setIsScanning(true);
            const devices = await BluetoothService.getPairedDevices(true);
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
        
        setIsSending(true);
        try {
            let success = false;
            
            if (outputMode === 'text') {
                // Send as text directly
                success = await BluetoothService.sendText(inputText);
            } else {
                // Convert text to BMP bitmap and send as image
                try {
                    const bmpBuffer = await defaultBitmapGenerator.textToBitmap(inputText);
                    
                    // Validate the BMP format
                    if (!defaultBitmapGenerator.validateBmpFormat(bmpBuffer)) {
                        throw new Error('Generated BMP format is invalid');
                    }
                    
                    const base64Image = defaultBitmapGenerator.bufferToBase64(bmpBuffer);
                    
                    // Send the BMP image using the BLE protocol
                    success = await BluetoothService.sendImage(base64Image);
                } catch (bitmapError) {
                    console.error('Error generating bitmap:', bitmapError);
                    Alert.alert('Error', 'Failed to generate image from text');
                    return;
                }
            }
            
            if (success) {
                const newMessage: SentTextItem = {
                    id: Date.now().toString(),
                    text: inputText,
                    timestamp: new Date()
                };
                setSentMessages(prev => [newMessage, ...prev]);
                setCurrentMessageId(newMessage.id);
                setInputText('');
                
                // Show success message with mode info
                const modeText = outputMode === 'text' ? 'text' : 'image (BMP)';
                console.log(`Successfully sent ${modeText} to glasses`);
            } else {
                Alert.alert('Error', `Failed to send ${outputMode === 'text' ? 'message' : 'image'}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', `Failed to send ${outputMode === 'text' ? 'message' : 'image'}`);
        } finally {
            setIsSending(false);
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
        const view = (() => {
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
                            onShowAllDevices={handleShowAllDevices}
                            leftConnected={leftConnected}
                        />
                    );
                
                case 'home':
                    return (
                        <HomeScreen
                            inputText={inputText}
                            onTextChange={setInputText}
                            outputMode={outputMode}
                            onOutputModeChange={setOutputMode}
                            onSend={handleSendMessage}
                            onExitToDashboard={handleExitToDashboard}
                            onViewMessages={() => setCurrentView('messages')}
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                            messageCount={sentMessages.length}
                            isSending={isSending}
                        />
                    );
                
                case 'device':
                    return (
                        <DeviceScreen
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                        />
                    );
                
                case 'messages':
                    return (
                        <SentMessagesScreen
                            sentTexts={sentMessages}
                            onGoBack={() => setCurrentView('home')}
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
        })();

        // Show bottom navigation for home and device views
        const showBottomNav = currentView === 'home' || currentView === 'device';
        
        return (
            <>
                <View style={{ flex: 1 }}>
                    {view}
                </View>
                {showBottomNav && (
                    <AppBottomNavigation
                        currentView={currentView}
                        onNavigate={(newView) => setCurrentView(newView)}
                    />
                )}
            </>
        );
    };

    return (
        <View style={teleprompterAppStyles.container}>
            {renderCurrentView()}
        </View>
    );
};

export default TeleprompterApp;
