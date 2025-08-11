import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const textInputStyles = StyleSheet.create({
    container: {
        marginBottom: MaterialSpacing.xl,
    },
    label: {
        ...MaterialTypography.h3,
        color: MaterialColors.text,
        marginBottom: MaterialSpacing.md,
    },
    textInput: {
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
        ...MaterialTypography.body,
        color: MaterialColors.text,
        textAlignVertical: 'top',
        minHeight: 100,
        marginBottom: MaterialSpacing.sm,
    },
});
