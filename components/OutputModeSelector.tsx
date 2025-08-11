import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { outputModeSelectorStyles as styles } from '../styles/OutputModeSelectorStyles';
import { OutputMode } from './TeleprompterInterface';

interface OutputModeSelectorProps {
    selectedMode: OutputMode;
    onModeChange: (mode: OutputMode) => void;
}

const OutputModeSelector: React.FC<OutputModeSelectorProps> = ({
    selectedMode,
    onModeChange,
}) => {
    const modes: { value: OutputMode; label: string; description: string }[] = [
        {
            value: 'text',
            label: 'Text Mode',
            description: 'Send text directly to glasses'
        },
        {
            value: 'image',
            label: 'Image Mode',
            description: 'Convert text to 1-bit bitmap (576×136px)'
        },
    ];

    const handleModePress = (mode: OutputMode) => {
        onModeChange(mode);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Output Mode</Text>
            <View style={styles.optionsContainer}>
                {modes.map((mode) => (
                    <TouchableOpacity
                        key={mode.value}
                        style={[
                            styles.optionButton,
                            selectedMode === mode.value && styles.selectedOption,
                        ]}
                        onPress={() => handleModePress(mode.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selectedMode === mode.value }}
                    >
                        <View style={styles.radioContainer}>
                            <View style={[
                                styles.radioButton,
                                selectedMode === mode.value && styles.radioButtonSelected,
                            ]}>
                                {selectedMode === mode.value && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[
                                    styles.optionLabel,
                                    selectedMode === mode.value && styles.selectedLabel,
                                ]}>
                                    {mode.label}
                                </Text>
                                <Text style={[
                                    styles.optionDescription,
                                    selectedMode === mode.value && styles.selectedDescription,
                                ]}>
                                    {mode.description}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default OutputModeSelector;
