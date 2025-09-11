import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useBluetoothConnection } from '../hooks/useBluetoothConnection';
import { useSavedDevices } from '../hooks/useSavedDevices';
import { AppView, OutputMode } from '../services/DeviceTypes';
import { teleprompterAppStyles } from '../styles/AppStyles';
import AppBottomNavigation from './AppBottomNavigation';
import DevicesStatus from './DevicesStatus';
import GlassesConnection from './GlassesConnection';
import PresentationsScreen from './PresentationsScreen';
import RingConnection from './RingConnection';
import Settings from './Settings';
import TopAppBar from './TopAppBar';

const TeleprompterApp: React.FC = () => {
    // Core view state - start directly with device connection view
    const [currentView, setCurrentView] = useState<AppView>('device');

    // Device pairing and connection hooks
    const {
        savedLeftGlassMac,
        savedRightGlassMac,
        savedRingMac,
        saveGlassMacAddress,
        saveRingMacAddress,
        loadSavedGlassMacAddresses,
        loadSavedRingMacAddress
    } = useSavedDevices();

    // Bluetooth connection hook for glasses and ring
    const {
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
        enableRingTouchPanel,
    } = useBluetoothConnection(
        (side, deviceId) => {
            saveGlassMacAddress(side, deviceId);
        },
        (deviceId) => {
            saveRingMacAddress(deviceId);
        }
    );

    // Output mode state (kept at app level as it affects multiple components)
    const [outputMode, setOutputMode] = useState<OutputMode>('text');

    // Initialize app by loading saved addresses and paired devices
    useEffect(() => {
        const initializeApp = async () => {
            await loadSavedGlassMacAddresses();
            await loadSavedRingMacAddress();
            await loadPairedDevices('glasses');
        };
        initializeApp();
    }, []);

    // Navigate back to device view when devices are connected
    useEffect(() => {
        if (ringConnected && currentView === 'ringConnection') {
            setCurrentView('device');
        }
    }, [ringConnected, currentView]);

    useEffect(() => {
        if ((leftGlassConnected || rightGlassConnected) && currentView === 'glassesConnection') {
            setCurrentView('device');
        }
    }, [leftGlassConnected, rightGlassConnected, currentView]);

    // State for disconnect loading
    const [isDisconnectingGlasses, setIsDisconnectingGlasses] = useState(false);
    const [isDisconnectingRing, setIsDisconnectingRing] = useState(false);

    // Show all paired devices including non-Even G1
    const handleShowAllDevices = async () => {
        await loadPairedDevices('all');
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
        await loadPairedDevices('glasses');
    };

    const handleSetupRing = async () => {
        setCurrentView('ringConnection');
        await loadPairedDevices('ring');
    };

    const handleToggleTouchPanel = async () => {
        console.log(`ENABLE TOUCH PANEL`);
        await enableRingTouchPanel();
    };

    const handleRetryRingConnection = async () => {
        const reconnected = await attemptRingAutoReconnection(savedRingMac);
        if (!reconnected) {
            Alert.alert('Connection Failed', 'Could not reconnect to the saved ring controller. Please try connecting manually.');
        }
    };

    const handleDisconnectGlasses = async () => {
        setIsDisconnectingGlasses(true);
        try {
            await handleGlassDisconnect();
        } finally {
            setIsDisconnectingGlasses(false);
        }
    };

    const handleDisconnectRing = async () => {
        setIsDisconnectingRing(true);
        try {
            await handleRingDisconnect();
        } finally {
            setIsDisconnectingRing(false);
        }
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
                            onRefresh={() => loadPairedDevices('glasses')}
                            onShowAllDevices={handleShowAllDevices}
                            leftConnected={leftGlassConnected}
                            rightConnected={rightGlassConnected}
                            isBluetoothEnabled={isBluetoothEnabled}
                        />
                    );

                case 'ringConnection':
                    return (
                        <RingConnection
                            devices={pairedDevices}
                            isScanning={isScanning}
                            onRingSelect={handleRingConnection}
                            onRefresh={() => loadPairedDevices('ring')}
                            onShowAllDevices={handleShowAllDevices}
                            ringConnected={ringConnected}
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
                            ringConnected={ringConnected}
                            onReconnectGlasses={handleRetryGlassConnection}
                            onReconnectRing={handleRetryRingConnection}
                            onDisconnectGlasses={handleDisconnectGlasses}
                            onDisconnectRing={handleDisconnectRing}
                            onSetupGlasses={handleSetupGlasses}
                            onSetupRing={handleSetupRing}
                            onToggleTouchPanel={handleToggleTouchPanel}
                            isReconnectingGlasses={isAutoConnecting}
                            isReconnectingRing={isAutoConnecting}
                            isDisconnectingGlasses={isDisconnectingGlasses}
                            isDisconnectingRing={isDisconnectingRing}
                            hasConfiguredGlasses={!!(savedLeftGlassMac && savedRightGlassMac)}
                            hasConfiguredRing={!!savedRingMac}
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

