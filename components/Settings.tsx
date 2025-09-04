import { defaultBitmapGenerator } from '@/services/BitmapGenerator';
import BluetoothService from '@/services/BluetoothService';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ButtonStyles, ContainerStyles } from '../styles/CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';
import { settingsStyles as styles } from '../styles/SettingsStyles';
import { OutputMode } from '../types/OutputMode';

interface SettingsProps {
    outputMode: OutputMode;
    onOutputModeChange: (mode: OutputMode) => void;
    leftConnected: boolean;
    rightConnected: boolean;
}

const Settings: React.FC<SettingsProps> = ({
    outputMode,
    onOutputModeChange,
    leftConnected,
    rightConnected,
}) => {
    // Message state managed internally
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const canSend = inputText.trim().length > 0 && (leftConnected || rightConnected) && !isSending;
    const bothConnected = leftConnected && rightConnected;
    const anyDeviceConnected = leftConnected || rightConnected;

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

    const insertRandomLoremIpsum = () => {
        const randomText = loremIpsumTexts[Math.floor(Math.random() * loremIpsumTexts.length)];
        setInputText(randomText);
    };

    const loremIpsumTexts = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla consequat consequat elit, sed feugiat arcu sollicitudin vel. Etiam lobortis eu eros quis convallis. Donec cursus justo a porta iaculis. Fusce vulputate tincidunt odio eu venenatis. Vivamus ac feugiat tortor. Mauris ac velit tortor.",
        "Vestibulum volutpat, tortor a vestibulum vehicula, eros ligula mollis massa, a tristique dui purus quis sem. Etiam commodo, ante non porta ornare, lacus massa varius dui, et suscipit quam erat quis ante. In bibendum nisl ut quam rutrum tempus eget at lacus. Sed cursus odio justo, a pellentesque arcu luctus at.",
        "Nam porttitor luctus sodales. Aenean varius commodo tortor. Nulla vitae lacus sed purus dapibus pretium. Curabitur sit amet nunc at mauris tempor hendrerit non sit amet lectus. Phasellus interdum justo nulla, eget maximus orci rhoncus sed. Maecenas et lacus diam. Proin id euismod massa, luctus porttitor purus.",
        "Proin a congue nulla. In suscipit consequat consequat. Etiam quis auctor lorem. Duis mattis risus at eros pulvinar, et fringilla erat imperdiet. Pellentesque ligula libero, cursus a placerat sit amet, congue id ante. Morbi semper et velit ut vestibulum. Maecenas imperdiet arcu sollicitudin urna semper laoreet.",
        "In sit amet commodo ligula. Integer eleifend, nisl quis interdum blandit, mi risus ultrices lacus, et porttitor mauris nisl vitae nisi. Ut laoreet turpis id est rhoncus, non gravida libero placerat. Cras sollicitudin lectus tempor dictum aliquam. Suspendisse vitae tristique neque."
    ];



    const getSendButtonText = () => {
        if (isSending) return 'Testing...';

        if (bothConnected) return `Test Settings`;
        if (leftConnected) return `Test on Left`;
        if (rightConnected) return `Test on Right`;

        return 'No Devices Connected';
    };

    // Output Mode Selector
    const renderOutputModeSelector = () => {
        const modes: { value: OutputMode; label: string; description: string; showPerformanceWarning?: boolean }[] = [
            {
                value: 'text',
                label: 'Text Mode',
                description: 'Send text directly to glasses'
            },
            {
                value: 'image',
                label: 'Image Mode',
                description: 'Convert text to 1-bit bitmap (576×136px)',
                showPerformanceWarning: true
            },
            {
                value: 'official',
                label: 'Official Teleprompter',
                description: 'Use the official teleprompter protocol'
            },
        ];

        return (
            <View style={ContainerStyles.section}>
                <Text style={styles.sectionTitle}>
                    Output Mode
                </Text>
                <View style={styles.modesContainer}>
                    {modes.map((mode) => (
                        <TouchableOpacity
                            key={mode.value}
                            style={[
                                styles.modeOption,
                                outputMode === mode.value && styles.modeOptionSelected
                            ]}
                            onPress={() => onOutputModeChange(mode.value)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: outputMode === mode.value }}
                        >
                            <View style={styles.modeContent}>
                                <View style={[
                                    styles.radioButton,
                                    outputMode === mode.value && styles.radioButtonSelected
                                ]}>
                                    {outputMode === mode.value && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                                <View style={styles.modeTextContainer}>
                                    <Text style={[
                                        styles.modeLabel,
                                        outputMode === mode.value
                                            ? styles.modeLabelSelected
                                            : { color: MaterialColors.onSurface }
                                    ]}>
                                        {mode.label}
                                    </Text>
                                    <Text style={[
                                        styles.modeDescription,
                                        outputMode === mode.value
                                            ? styles.modeDescriptionSelected
                                            : styles.modeDescriptionDefault
                                    ]}>
                                        {mode.description}
                                    </Text>
                                    {mode.showPerformanceWarning && outputMode === 'image' && (
                                        <View style={styles.performanceWarning}>
                                            <MaterialIcons
                                                name="timer"
                                                size={16}
                                                style={styles.performanceIcon}
                                            />
                                            <Text style={styles.performanceWarningText}>
                                                Slower than other modes
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // Test Message Section
    const renderTestMessageSection = () => {
        return (
            <View style={styles.textInputSection}>
                <View style={styles.textInputHeader}>
                    <Text style={styles.textInputTitle}>Test Message</Text>
                    <TouchableOpacity
                        onPress={insertRandomLoremIpsum}
                        style={styles.loremButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="edit-note" size={16} color={MaterialColors.primary} />
                        <Text style={styles.loremButtonText}>Lorem Ipsum</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.testDescription}>
                    Enter a message to quickly preview how your selected settings will appear on the glasses
                </Text>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your test message here..."
                    placeholderTextColor={MaterialColors.onSurfaceVariant}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        );
    };

    // Connection Required Message
    const renderConnectionRequiredMessage = () => {
        if (anyDeviceConnected) return null;

        return (
            <View style={styles.connectionRequiredContainer}>
                <MaterialIcons
                    name="bluetooth-disabled"
                    size={24}
                    color={MaterialColors.onSurfaceVariant}
                />
                <Text style={styles.connectionRequiredText}>
                    Connect your glasses to test the settings
                </Text>
            </View>
        );
    };

    return (
        <ScrollView
            style={ContainerStyles.screen}
            contentContainerStyle={{
                paddingHorizontal: MaterialSpacing.lg,
                paddingTop: MaterialSpacing.lg,
                paddingBottom: MaterialSpacing.lg,
            }}
            showsVerticalScrollIndicator={false}
        >
            {renderOutputModeSelector()}
            {renderTestMessageSection()}
            {renderConnectionRequiredMessage()}

            {/* Test and Exit Buttons Row - only show when connected */}
            {anyDeviceConnected && (
                <View style={styles.buttonRow}>
                    {/* Test Button */}
                    <TouchableOpacity
                        style={[
                            ButtonStyles.primaryButton,
                            styles.sendButton,
                            !canSend && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendMessage}
                        disabled={!canSend}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name="preview"
                            size={20}
                            color={canSend ? MaterialColors.onPrimary : MaterialColors.onSurfaceVariant}
                        />
                        <Text style={[
                            ButtonStyles.primaryButtonText,
                            MaterialTypography.labelLarge,
                            !canSend && ButtonStyles.primaryButtonTextDisabled
                        ]}>
                            {getSendButtonText()}
                        </Text>
                    </TouchableOpacity>

                    {/* Exit Button */}
                    <TouchableOpacity
                        onPress={handleExit}
                        style={[
                            ButtonStyles.secondaryButton,
                            styles.exitButton
                        ]}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name={outputMode === 'official' ? 'stop' : 'dashboard'}
                            size={18}
                            color={MaterialColors.onSurface}
                        />
                        <Text style={[ButtonStyles.secondaryButtonText, MaterialTypography.labelMedium]}>
                            {outputMode === 'official' ? 'Stop' : 'Exit'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

export default Settings;