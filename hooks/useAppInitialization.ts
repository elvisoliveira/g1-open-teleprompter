import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export type AppView = 'splash' | 'connection' | 'composer' | 'messages' | 'reconnection';

interface UseAppInitializationProps {
    loadSavedMacAddresses: () => Promise<{ leftMac: string | null; rightMac: string | null }>;
    attemptAutoReconnection: (leftMac: string | null, rightMac: string | null) => Promise<boolean>;
    loadPairedDevices: () => Promise<void>;
}

export const useAppInitialization = ({
    loadSavedMacAddresses,
    attemptAutoReconnection,
    loadPairedDevices,
}: UseAppInitializationProps) => {
    const [currentView, setCurrentView] = useState<AppView>('splash');
    const [splashMessage, setSplashMessage] = useState('Initializing...');
    const [reconnectionFailed, setReconnectionFailed] = useState(false);

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
                    // Success! Auto-reconnection worked, go to composer
                    setCurrentView('composer');
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

    useEffect(() => {
        initializeApp();
    }, []);

    return {
        currentView,
        setCurrentView,
        splashMessage,
        reconnectionFailed,
        setReconnectionFailed,
        initializeApp,
    };
};
