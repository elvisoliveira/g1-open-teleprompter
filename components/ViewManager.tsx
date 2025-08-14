import React from 'react';
import { AppView } from '../hooks/useAppInitialization';
import { ConnectionStep, PairedDevice } from '../hooks/useBluetoothConnection';
import { SentTextItem } from '../hooks/useMessageManager';
import DeviceConnection from './DeviceConnection';
import ReconnectionScreen from './ReconnectionScreen';
import SentMessagesScreen from './SentMessagesScreen';
import SplashScreen from './SplashScreen';
import TeleprompterInterface, { OutputMode } from './TeleprompterInterface';

interface ViewManagerProps {
    currentView: AppView;
    splashMessage: string;
    
    // Device connection props
    devices: PairedDevice[];
    isScanning: boolean;
    connectionStep: ConnectionStep;
    leftConnected: boolean;
    rightConnected: boolean;
    isAutoConnecting: boolean;
    onDeviceSelect: (deviceId: string, side: 'left' | 'right') => void;
    onRefresh: () => void;
    onShowAllDevices: () => void;
    
    // Message props
    inputText: string;
    outputMode: OutputMode;
    onOutputModeChange: (mode: OutputMode) => void;
    sentMessages: SentTextItem[];
    currentMessageId: string | null;
    onTextChange: (text: string) => void;
    onSend: () => void;
    onResendText: (text: string) => void;
    onDeleteText: (id: string) => void;
    onExitToDashboard: () => void;
    onSetCurrentMessage: (id: string | null) => void;
    
    // Navigation props
    onViewMessages: () => void;
    onGoBackToComposer: () => void;
    
    // Reconnection props
    onRetryConnection: () => void;
    onConnectAgain: () => void;
}

const ViewManager: React.FC<ViewManagerProps> = ({
    currentView,
    splashMessage,
    devices,
    isScanning,
    connectionStep,
    leftConnected,
    rightConnected,
    isAutoConnecting,
    onDeviceSelect,
    onRefresh,
    onShowAllDevices,
    inputText,
    outputMode,
    onOutputModeChange,
    sentMessages,
    currentMessageId,
    onTextChange,
    onSend,
    onResendText,
    onDeleteText,
    onExitToDashboard,
    onSetCurrentMessage,
    onViewMessages,
    onGoBackToComposer,
    onRetryConnection,
    onConnectAgain,
}) => {
    switch (currentView) {
        case 'splash':
            return <SplashScreen message={splashMessage} />;
        
        case 'connection':
            return (
                <DeviceConnection
                    devices={devices}
                    isScanning={isScanning}
                    connectionStep={connectionStep}
                    onDeviceSelect={onDeviceSelect}
                    onRefresh={onRefresh}
                    onShowAllDevices={onShowAllDevices}
                    leftConnected={leftConnected}
                />
            );
        
        case 'composer':
            return (
                <TeleprompterInterface
                    inputText={inputText}
                    onTextChange={onTextChange}
                    outputMode={outputMode}
                    onOutputModeChange={onOutputModeChange}
                    onSend={onSend}
                    onExitToDashboard={onExitToDashboard}
                    onViewMessages={onViewMessages}
                    leftConnected={leftConnected}
                    rightConnected={rightConnected}
                    messageCount={sentMessages.length}
                />
            );
        
        case 'messages':
            return (
                <SentMessagesScreen
                    sentTexts={sentMessages}
                    onGoBack={onGoBackToComposer}
                    onResendText={onResendText}
                    onDeleteText={onDeleteText}
                    currentlyDisplayedMessageId={currentMessageId}
                    onSetCurrentMessage={onSetCurrentMessage}
                />
            );
        
        case 'reconnection':
            return (
                <ReconnectionScreen
                    isRetrying={isAutoConnecting}
                    onRetry={onRetryConnection}
                    onConnectAgain={onConnectAgain}
                />
            );
        
        default:
            return null;
    }
};

export default ViewManager;
