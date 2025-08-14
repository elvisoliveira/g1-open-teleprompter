import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { MaterialColors } from '../styles/MaterialTheme';
import { textInputStyles as styles } from '../styles/TextInputStyles';

interface TextInputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
    label,
    value,
    onChangeText,
    placeholder = "Type your message here...",
    multiline = true,
    numberOfLines = 4
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
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
