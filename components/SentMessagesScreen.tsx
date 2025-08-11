import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useKeyEvent } from "expo-key-event";
import { sentMessagesStyles as styles } from '../styles/SentMessagesStyles';

interface SentTextItem {
    id: string;
    text: string;
    timestamp: Date;
}

interface SentMessagesScreenProps {
    sentTexts: SentTextItem[];
    onGoBack: () => void;
    onResendText: (text: string) => void;
    onDeleteText: (id: string) => void;
    currentlyDisplayedMessageId?: string | null;
    onSetCurrentMessage?: (id: string | null) => void;
}

const SentMessagesScreen: React.FC<SentMessagesScreenProps> = ({
    sentTexts,
    onGoBack,
    onResendText,
    onDeleteText,
    currentlyDisplayedMessageId = null,
    onSetCurrentMessage
}) => {
    const { keyEvent } = useKeyEvent();
    const [localCurrentMessageId, setLocalCurrentMessageId] = useState<string | null>(currentlyDisplayedMessageId);

    // Use local state if parent doesn't provide current message management
    const currentMessageId = onSetCurrentMessage ? currentlyDisplayedMessageId : localCurrentMessageId;
    const setCurrentMessageId = onSetCurrentMessage || setLocalCurrentMessageId;

    useEffect(() => {
        if (keyEvent) {
            const keyCode = parseInt(keyEvent.key);
            
            if (keyCode === 88) { // X key - navigate up (previous message)
                navigateToMessage('up');
            } else if (keyCode === 87) { // W key - navigate down (next message)
                navigateToMessage('down');
            }
        }
    }, [keyEvent, sentTexts]);

    const navigateToMessage = (direction: 'up' | 'down') => {
        if (sentTexts.length === 0) return;

        const currentIndex = currentMessageId 
            ? sentTexts.findIndex(item => item.id === currentMessageId)
            : -1;

        let newIndex: number;
        
        if (direction === 'up') {
            // Move to previous message (up in the list)
            newIndex = currentIndex <= 0 ? sentTexts.length - 1 : currentIndex - 1;
        } else {
            // Move to next message (down in the list)
            newIndex = currentIndex >= sentTexts.length - 1 ? 0 : currentIndex + 1;
        }

        const newMessage = sentTexts[newIndex];
        if (newMessage) {
            setCurrentMessageId(newMessage.id);
            // Resend the message without showing success alert
            onResendText(newMessage.text);
        }
    };

    const handleMessageClick = (text: string, id: string) => {
        setCurrentMessageId(id);
        onResendText(text);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={onGoBack}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backButtonIcon}>←</Text>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Sent Messages</Text>
                <View style={styles.placeholder} />
            </View>

            <Text style={styles.keyEvent}>
                {keyEvent?.key} | Use W (87) for next, X (88) for previous
            </Text>
            
            {sentTexts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No messages sent yet</Text>
                    <Text style={styles.emptySubtext}>Messages you send will appear here</Text>
                </View>
            ) : (
                <FlatList
                    data={sentTexts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[
                            styles.sentTextItem,
                            item.id === currentMessageId && styles.currentMessage
                        ]}>
                            <TouchableOpacity
                                style={styles.sentTextContent}
                                onPress={() => handleMessageClick(item.text, item.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.messageHeader}>
                                    <Text style={styles.sentTextText}>{item.text}</Text>
                                    {item.id === currentMessageId && (
                                        <View style={styles.currentIndicator}>
                                            <Text style={styles.currentIndicatorText}>LIVE</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.sentTextTimestamp}>
                                    {item.timestamp.toLocaleString()}
                                </Text>
                                <Text style={styles.tapHint}>Tap to resend</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteText(item.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.deleteButtonIcon}>🗑</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    style={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

export default SentMessagesScreen;
