import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialColors } from '../styles/MaterialTheme';
import { textInputStyles as styles } from '../styles/TextInputStyles';

interface TextInputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
    onInsertLoremIpsum?: () => void;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
    label,
    value,
    onChangeText,
    placeholder = "Type your message here...",
    multiline = true,
    numberOfLines = 4,
    onInsertLoremIpsum
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{label}</Text>
                {onInsertLoremIpsum && (
                    <TouchableOpacity
                        onPress={onInsertLoremIpsum}
                        style={styles.loremButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="edit-note" size={16} color={MaterialColors.primary} />
                        <Text style={styles.loremButtonText}>Lorem Ipsum</Text>
                    </TouchableOpacity>
                )}
            </View>
            <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                multiline={multiline}
                numberOfLines={numberOfLines}
                placeholderTextColor={MaterialColors.onSurfaceVariant}
            />
        </View>
    );
};

export default TextInputField;
