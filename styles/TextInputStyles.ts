import { StyleSheet } from 'react-native';
import { ContainerStyles, InputStyles } from './CommonStyles';
import { MaterialTypography } from './MaterialTheme';

export const textInputStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.section,
    },
    label: {
        ...InputStyles.inputLabel,
        ...MaterialTypography.titleMedium,
    },
    textInput: {
        ...InputStyles.textInputMultiline,
        minHeight: 120,
    },
    textInputFocused: {
        ...InputStyles.textInputFocused,
    },
    helperText: {
        ...InputStyles.helperText,
    },
});
