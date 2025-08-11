import { useState } from 'react';
import { Alert } from 'react-native';
import BluetoothService from '../services/BluetoothService';

export interface SentTextItem {
    id: string;
    text: string;
    timestamp: Date;
}

export const useMessageManager = () => {
    const [inputText, setInputText] = useState('');
    const [sentMessages, setSentMessages] = useState<SentTextItem[]>([]);
    const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

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

    return {
        inputText,
        sentMessages,
        currentMessageId,
        setInputText,
        setCurrentMessageId,
        handleSendMessage,
        handleResendMessage,
        handleExitToDashboard,
        handleDeleteMessage,
    };
};
