import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { actionButtonsStyles as styles } from '../styles/ActionButtonsStyles';

interface ActionButtonsProps {
    canSend: boolean;
    onSend: () => void;
    onExitToDashboard: () => void;
    onViewMessages: () => void;
    onInsertLoremIpsum: () => void;
    sendButtonText: string;
    messageCount: number;
    isSending?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    canSend,
    onSend,
    onExitToDashboard,
    onViewMessages,
    onInsertLoremIpsum,
    sendButtonText,
    messageCount,
    isSending = false
}) => {
    const sendButtonDisplayText = isSending ? 'Sending...' : sendButtonText;
    return (
        <View style={styles.container}>
            {/* Send Button */}
            <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={onSend}
                disabled={!canSend}
                activeOpacity={0.8}
            >
                <Text style={styles.sendButtonIcon}>↗</Text>
                <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>
                    {sendButtonDisplayText}
                </Text>
            </TouchableOpacity>

            {/* Control Buttons */}
            <View style={styles.controlsRow}>
                <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={onExitToDashboard}
                    activeOpacity={0.8}
                >
                    <Text style={styles.controlButtonIcon}>⌂</Text>
                    <Text style={styles.controlButtonText}>Dashboard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={onInsertLoremIpsum}
                    activeOpacity={0.8}
                >
                    <Text style={styles.controlButtonIcon}>📝</Text>
                    <Text style={styles.controlButtonText}>Lorem Ipsum</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.controlButton} 
                    onPress={onViewMessages}
                    activeOpacity={0.8}
                >
                    <Text style={styles.controlButtonIcon}>⧖</Text>
                    <Text style={styles.controlButtonText}>
                        History {messageCount > 0 && `(${messageCount})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ActionButtons;
