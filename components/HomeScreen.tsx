import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ButtonStyles, ContainerStyles } from '../styles/CommonStyles';
import { homeScreenStyles as styles } from '../styles/HomeScreenStyles';
import { MaterialColors, MaterialTypography } from '../styles/MaterialTheme';
import { OutputMode } from '../types/OutputMode';

interface HomeScreenProps {
    inputText: string;
    onTextChange: (text: string) => void;
    outputMode: OutputMode;
    onOutputModeChange: (mode: OutputMode) => void;
    onSend: () => void;
    onExit: () => void;
    leftConnected: boolean;
    rightConnected: boolean;
    isSending?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    inputText,
    onTextChange,
    outputMode,
    onOutputModeChange,
    onSend,
    onExit,
    leftConnected,
    rightConnected,
    isSending = false
}) => {
    const canSend = inputText.trim().length > 0 && (leftConnected || rightConnected) && !isSending;
    const bothConnected = leftConnected && rightConnected;

    const loremIpsumTexts = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla consequat consequat elit, sed feugiat arcu sollicitudin vel. Etiam lobortis eu eros quis convallis. Donec cursus justo a porta iaculis. Fusce vulputate tincidunt odio eu venenatis. Vivamus ac feugiat tortor. Mauris ac velit tortor.",
        "Vestibulum volutpat, tortor a vestibulum vehicula, eros ligula mollis massa, a tristique dui purus quis sem. Etiam commodo, ante non porta ornare, lacus massa varius dui, et suscipit quam erat quis ante. In bibendum nisl ut quam rutrum tempus eget at lacus. Sed cursus odio justo, a pellentesque arcu luctus at.",
        "Nam porttitor luctus sodales. Aenean varius commodo tortor. Nulla vitae lacus sed purus dapibus pretium. Curabitur sit amet nunc at mauris tempor hendrerit non sit amet lectus. Phasellus interdum justo nulla, eget maximus orci rhoncus sed. Maecenas et lacus diam. Proin id euismod massa, luctus porttitor purus.",
        "Proin a congue nulla. In suscipit consequat consequat. Etiam quis auctor lorem. Duis mattis risus at eros pulvinar, et fringilla erat imperdiet. Pellentesque ligula libero, cursus a placerat sit amet, congue id ante. Morbi semper et velit ut vestibulum. Maecenas imperdiet arcu sollicitudin urna semper laoreet.",
        "In sit amet commodo ligula. Integer eleifend, nisl quis interdum blandit, mi risus ultrices lacus, et porttitor mauris nisl vitae nisi. Ut laoreet turpis id est rhoncus, non gravida libero placerat. Cras sollicitudin lectus tempor dictum aliquam. Suspendisse vitae tristique neque.",
        "Nullam non sem quis ligula feugiat aliquam. Nam pharetra dui erat, et ullamcorper sapien semper sed. Nulla pretium neque at scelerisque tristique. Etiam a porta quam. Etiam in pellentesque orci. Ut convallis tempus eros ut hendrerit. Vivamus tincidunt posuere accumsan.",
        "Donec nec pharetra dolor, id fermentum nisi. Maecenas eleifend vestibulum mi, in tempus eros fringilla semper. Vestibulum ut ligula erat. Maecenas facilisis viverra semper. Etiam ac metus tincidunt mi dignissim posuere egestas id neque. In tempor euismod sodales. Nulla facilisi.",
        "Nullam metus turpis, tempus nec turpis id, maximus imperdiet elit. In justo nulla, vulputate id ante at, pretium volutpat purus. Nulla id risus risus. Mauris imperdiet commodo lacus, vel sollicitudin leo scelerisque non. Curabitur aliquet felis in gravida commodo. Sed in tempus ligula.",
        "Quisque laoreet elit viverra convallis tincidunt. Nam id magna ac turpis sollicitudin volutpat. Aenean eu maximus ante. Praesent ut gravida lectus, eu accumsan dolor. Vivamus mollis purus eu tellus fringilla, nec sollicitudin mauris sagittis.",
        "Nulla vehicula elit ut urna porta fringilla. Proin vel libero magna. Sed volutpat elit nec commodo viverra. Sed pulvinar cursus efficitur. Ut consequat, quam quis ullamcorper lacinia, metus mi congue erat, in consequat nulla enim vel urna.",
    ];

    const insertRandomLoremIpsum = () => {
        const randomText = loremIpsumTexts[Math.floor(Math.random() * loremIpsumTexts.length)];
        onTextChange(randomText);
    };

    const getSendButtonText = () => {
        if (isSending) return 'Sending...';

        if (bothConnected) return `Send`;
        if (leftConnected) return `Send to Left`;
        if (rightConnected) return `Send to Right`;

        return 'No Devices Connected';
    };

    // Output Mode Selector (integrated)
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

    // Text Input Section (integrated)
    const renderTextInputSection = () => {
        return (
            <View style={styles.textInputSection}>
                <View style={styles.textInputHeader}>
                    <Text style={styles.textInputTitle}>Your Message</Text>
                    <TouchableOpacity
                        onPress={insertRandomLoremIpsum}
                        style={styles.loremButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="edit-note" size={16} color={MaterialColors.primary} />
                        <Text style={styles.loremButtonText}>Lorem Ipsum</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={onTextChange}
                    placeholder="Type your message here..."
                    placeholderTextColor={MaterialColors.onSurfaceVariant}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        );
    };

    return (
        <View style={[ContainerStyles.screen, ContainerStyles.content]}>
            {renderOutputModeSelector()}
            {renderTextInputSection()}

            {/* Send and Exit Buttons Row */}
            <View style={styles.buttonRow}>
                {/* Send Button */}
                <TouchableOpacity
                    style={[
                        ButtonStyles.primaryButton,
                        styles.sendButton,
                        !canSend && styles.sendButtonDisabled
                    ]}
                    onPress={onSend}
                    disabled={!canSend}
                    activeOpacity={0.8}
                >
                    <MaterialIcons 
                        name="send" 
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
                    onPress={onExit}
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
        </View>
    );
};

export default HomeScreen;
