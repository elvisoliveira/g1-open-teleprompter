import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { defaultBitmapGenerator } from '../services/BitmapGenerator';
import BluetoothService from '../services/BluetoothService';
import { teleprompterAppStyles } from '../styles/AppStyles';
import { OutputMode } from '../types/OutputMode';
import { useAppInitialization } from '../hooks/useAppInitialization';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import AppBottomNavigation from './AppBottomNavigation';
import DeviceConnection from './DeviceConnection';
import DeviceScreen from './DeviceScreen';
import HomeScreen from './HomeScreen';
import PresentationsScreen from './PresentationsScreen';
import ReconnectionScreen from './ReconnectionScreen';
import SplashScreen from './SplashScreen';
import TopAppBar from './TopAppBar';

type AppView = 'splash' | 'connection' | 'home' | 'device' | 'reconnection' | 'presentations';

const TeleprompterApp: React.FC = () => {
    // Core view state
    const [currentView, setCurrentView] = useState<AppView>('splash');

    // Storage hook
    const { savedLeftMac, savedRightMac, saveMacAddress, loadSavedMacAddresses, clearSavedMacAddresses } =
        useDeviceStorage();

    // Bluetooth connection hook
    const {
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
    } = useBluetoothConnection((side, deviceId) => {
        saveMacAddress(side, deviceId);
    });

    // App initialization hook
    const { currentView: initView, splashMessage } = useAppInitialization({
        loadSavedMacAddresses,
        attemptAutoReconnection,
        loadPairedDevices,
    });

    // Message state
    const [inputText, setInputText] = useState('');
    const [outputMode, setOutputMode] = useState<OutputMode>('text');
    const [isSending, setIsSending] = useState(false);

    // Map initialization view to app view
    useEffect(() => {
        if (initView === 'composer') {
            setCurrentView('home');
        } else {
            setCurrentView(initView as AppView);
        }
    }, [initView]);

    // Navigate to home when both devices connected
    useEffect(() => {
        if (connectionStep === 'complete') {
            setCurrentView('home');
        }
    }, [connectionStep]);

    // Show all paired devices including non-Even G1
    const handleShowAllDevices = async () => {
        await loadPairedDevices(true);
    };

    const handleSendMessage = async () => {
        const messageText = inputText.trim();
        if (!messageText) return;

        setIsSending(true);
        try {
            let success = false;

            if (outputMode === 'text') {
                success = await BluetoothService.sendText(messageText);
            } else {
                try {
                    const bmpBuffer = await defaultBitmapGenerator.textToBitmap(messageText);

                    if (!defaultBitmapGenerator.validateBmpFormat(bmpBuffer)) {
                        throw new Error('Generated BMP format is invalid');
                    }

                    const base64Image = defaultBitmapGenerator.bufferToBase64(bmpBuffer);
                    success = await BluetoothService.sendImage(base64Image);
                } catch (bitmapError) {
                    console.error('Error generating bitmap:', bitmapError);
                    Alert.alert('Error', 'Failed to generate image from text');
                    return;
                }
            }

            if (success) {
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

    const handleExitToDashboard = async () => {
        try {
            const success = await BluetoothService.exitToDashboard();
            if (!success) {
                Alert.alert('Error', 'Failed to exit to dashboard');
            }
        } catch (error) {
            console.error('Error exiting to dashboard:', error);
            Alert.alert('Error', 'Failed to exit to dashboard');
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
        await clearSavedMacAddresses();
        resetConnection();
        setCurrentView('connection');
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
                            connectionStep={(connectionStep as 'left' | 'right')}
                            onDeviceSelect={handleDeviceConnection}
                            onRefresh={() => loadPairedDevices()}
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
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                            isSending={isSending}
                        />
                    );

                case 'device':
                    return <DeviceScreen leftConnected={leftConnected} rightConnected={rightConnected} />;

                case 'presentations':
                    return <PresentationsScreen />;

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
        const showBottomNav = currentView === 'home' || currentView === 'device' || currentView === 'presentations';

        // Show top app bar for main app views (not splash, connection, or reconnection)
        const showTopAppBar = currentView === 'home' || currentView === 'device' || currentView === 'presentations';

        return (
            <>
                {showTopAppBar && <TopAppBar />}
                <View style={teleprompterAppStyles.flexContainer}>{view}</View>
                {showBottomNav && (
                    <AppBottomNavigation currentView={currentView} onNavigate={setCurrentView} />
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

