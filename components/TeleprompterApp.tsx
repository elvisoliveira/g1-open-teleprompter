import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import { defaultBitmapGenerator } from '../services/BitmapGenerator';
import BluetoothService from '../services/BluetoothService';
import { teleprompterAppStyles } from '../styles/AppStyles';
import { OutputMode } from '../types/OutputMode';
import AppBottomNavigation from './AppBottomNavigation';
import ConnectionStatus from './ConnectionStatus';
import DeviceConnection from './DeviceConnection';
import PresentationsScreen from './PresentationsScreen';
import Settings from './Settings';
import TopAppBar from './TopAppBar';

type AppView = 'connection' | 'settings' | 'device' | 'presentations';

const TeleprompterApp: React.FC = () => {
    // Core view state - start directly with device connection view
    const [currentView, setCurrentView] = useState<AppView>('device');

    // Storage hook
    const { savedLeftMac, savedRightMac, saveMacAddress, loadSavedMacAddresses } =
        useDeviceStorage();

    // Bluetooth connection hook
    const {
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
    } = useBluetoothConnection((side, deviceId) => {
        saveMacAddress(side, deviceId);
    });

    // Message state
    const [inputText, setInputText] = useState('');
    const [outputMode, setOutputMode] = useState<OutputMode>('text');
    const [isSending, setIsSending] = useState(false);

    // Initialize app by loading saved addresses and paired devices
    useEffect(() => {
        const initializeApp = async () => {
            await loadSavedMacAddresses();
            await loadPairedDevices();
        };
        initializeApp();
    }, []);

    // Navigate to settings when both devices connected
    useEffect(() => {
        if (connectionStep === 'complete') {
            setCurrentView('settings');
        }
    }, [connectionStep]);

    // Show all paired devices including non-Even G1
    const handleShowAllDevices = async () => {
        await loadPairedDevices(true);
    };

    const getModeText = (mode: OutputMode, forSuccess: boolean) => {
        if (mode === 'text') return forSuccess ? 'text' : 'message';
        if (mode === 'image') return forSuccess ? 'image (BMP)' : 'image';
        if (mode === 'official') return 'official teleprompter';
        return '';
    };

    const handleSendMessage = async () => {
        const messageText = inputText.trim();
        if (!messageText) return;

        setIsSending(true);
        try {
            let success = false;

            if (outputMode === 'text') {
                success = await BluetoothService.sendText(messageText);
            } else if (outputMode === 'image') {
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
            } else if (outputMode === 'official') {
                success = await BluetoothService.sendOfficialTeleprompter(messageText);
            }

            if (success) {
                setInputText('');
                const modeText = getModeText(outputMode, true);
                console.log(`Successfully sent ${modeText} to glasses`);
            } else {
                const modeText = getModeText(outputMode, false);
                Alert.alert('Error', `Failed to send ${modeText}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const modeText = getModeText(outputMode, false);

            Alert.alert('Error', `Failed to send ${modeText}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleExit = async () => {
        try {
            let success = false;

            if (outputMode === 'official') {
                success = await BluetoothService.exitOfficialTeleprompter();
            } else {
                success = await BluetoothService.exit();
            }

            if (!success) {
                const modeText = outputMode === 'official' ? 'official teleprompter' : 'dashboard';
                Alert.alert('Error', `Failed to exit ${modeText}`);
            }
        } catch (error) {
            console.error('Error exiting:', error);
            const modeText = outputMode === 'official' ? 'official teleprompter' : 'dashboard';
            Alert.alert('Error', `Failed to exit ${modeText}`);
        }
    };

    // Connection handlers
    const handleRetryConnection = async () => {
        const reconnected = await attemptAutoReconnection(savedLeftMac, savedRightMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved devices. Please try connecting manually.');
        }
    };

    const handleSetupDevices = async () => {
        setCurrentView('connection');
        await loadPairedDevices();
    };

    const renderCurrentView = () => {
        const view = (() => {
            switch (currentView) {
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
                            rightConnected={rightConnected}
                            isBluetoothEnabled={isBluetoothEnabled}
                        />
                    );

                case 'settings':
                    return (
                        <Settings
                            inputText={inputText}
                            onTextChange={setInputText}
                            outputMode={outputMode}
                            onOutputModeChange={setOutputMode}
                            onSend={handleSendMessage}
                            onExit={handleExit}
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                            isSending={isSending}
                        />
                    );

                case 'device':
                    return (
                        <ConnectionStatus
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                            onReconnect={handleRetryConnection}
                            onSetupDevices={handleSetupDevices}
                            isReconnecting={isAutoConnecting}
                            hasConfiguredDevices={!!(savedLeftMac && savedRightMac)}
                        />
                    );

                case 'presentations':
                    return (
                        <PresentationsScreen
                            leftConnected={leftConnected}
                            rightConnected={rightConnected}
                            outputMode={outputMode}
                        />
                    );

                default:
                    return null;
            }
        })();

        // Show bottom navigation for all main views
        // const showBottomNav = currentView === 'settings' || currentView === 'device' || currentView === 'presentations';
        const showBottomNav = true;

        // Show top app bar for all main views (not connection)
        // const showTopAppBar = currentView === 'settings' || currentView === 'device' || currentView === 'presentations';
        const showTopAppBar = true;

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

