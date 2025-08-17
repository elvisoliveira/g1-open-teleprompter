import { StyleSheet } from 'react-native';
import { ContainerStyles, InputStyles } from './CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const textInputStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.section,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: MaterialSpacing.md,
    },
    title: {
        ...MaterialTypography.titleMedium,
        color: MaterialColors.onSurface,
    },
    loremButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: MaterialSpacing.xs,
        paddingHorizontal: MaterialSpacing.sm,
        borderRadius: MaterialSpacing.md,
        backgroundColor: MaterialColors.primaryContainer,
        gap: MaterialSpacing.xs,
    },
    loremButtonText: {
        ...MaterialTypography.labelMedium,
        color: MaterialColors.onPrimaryContainer,
        fontWeight: '500',
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
