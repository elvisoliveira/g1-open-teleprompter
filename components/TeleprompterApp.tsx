import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useSavedDevices } from '../hooks/useSavedDevices';
import { teleprompterAppStyles } from '../styles/AppStyles';
import { OutputMode } from '../types/OutputMode';
import AppBottomNavigation from './AppBottomNavigation';
import DevicesStatus from './DevicesStatus';
import GlassesConnection from './GlassesConnection';
import PresentationsScreen from './PresentationsScreen';
import Settings from './Settings';
import TopAppBar from './TopAppBar';

type AppView = 'glassesConnection' | 'settings' | 'device' | 'presentations';

const TeleprompterApp: React.FC = () => {
    // Core view state - start directly with device connection view
    const [currentView, setCurrentView] = useState<AppView>('device');

    // Glasses pairing and connection hooks
    const { savedLeftGlassMac, savedRightGlassMac, saveGlassMacAddress, loadSavedGlassMacAddresses } =
        useSavedDevices();

    // Glasses Bluetooth connection hook
    const {
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
    } = useBluetoothConnection((side, deviceId) => {
        saveGlassMacAddress(side, deviceId);
    });

    // Output mode state (kept at app level as it affects multiple components)
    const [outputMode, setOutputMode] = useState<OutputMode>('text');

    // Initialize app by loading saved addresses and paired devices
    useEffect(() => {
        const initializeApp = async () => {
            await loadSavedGlassMacAddresses();
            await loadPairedDevices();
        };
        initializeApp();
    }, []);

    // Show all paired devices including non-Even G1
    const handleShowAllDevices = async () => {
        await loadPairedDevices(true);
    };

    // Glasses connection handlers
    const handleRetryGlassConnection = async () => {
        const reconnected = await attemptGlassAutoReconnection(savedLeftGlassMac, savedRightGlassMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved glasses. Please try connecting manually.');
        }
    };

    const handleSetupGlasses = async () => {
        setCurrentView('glassesConnection');
        await loadPairedDevices();
    };

    const renderCurrentView = () => {
        const view = (() => {
            switch (currentView) {
                case 'glassesConnection':
                    return (
                        <GlassesConnection
                            devices={pairedDevices}
                            isScanning={isScanning}
                            connectionStep={(connectionStep as 'left' | 'right')}
                            onGlassSideSelect={handleGlassConnection}
                            onRefresh={() => loadPairedDevices()}
                            onShowAllDevices={handleShowAllDevices}
                            leftConnected={leftGlassConnected}
                            rightConnected={rightGlassConnected}
                            isBluetoothEnabled={isBluetoothEnabled}
                        />
                    );

                case 'settings':
                    return (
                        <Settings
                            outputMode={outputMode}
                            onOutputModeChange={setOutputMode}
                            leftConnected={leftGlassConnected}
                            rightConnected={rightGlassConnected}
                        />
                    );

                case 'device':
                    return (
                        <DevicesStatus
                            leftConnected={leftGlassConnected}
                            rightConnected={rightGlassConnected}
                            onReconnectGlasses={handleRetryGlassConnection}
                            onSetupGlasses={handleSetupGlasses}
                            isReconnectingGlasses={isAutoConnecting}
                            hasConfiguredGlasses={!!(savedLeftGlassMac && savedRightGlassMac)}
                        />
                    );

                case 'presentations':
                    return (
                        <PresentationsScreen
                            leftConnected={leftGlassConnected}
                            rightConnected={rightGlassConnected}
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

