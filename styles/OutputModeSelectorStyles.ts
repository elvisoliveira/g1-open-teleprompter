import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const outputModeSelectorStyles = StyleSheet.create({
    container: {
        marginBottom: MaterialSpacing.lg,
    },
    title: {
        ...MaterialTypography.h3,
        color: MaterialColors.text,
        marginBottom: MaterialSpacing.sm,
    },
    optionsContainer: {
        gap: MaterialSpacing.xs,
    },
    optionButton: {
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.md,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        padding: MaterialSpacing.md,
        marginVertical: MaterialSpacing.xs / 2,
    },
    selectedOption: {
        backgroundColor: MaterialColors.primaryLight,
        borderColor: MaterialColors.primary,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: MaterialColors.border,
        backgroundColor: MaterialColors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: MaterialSpacing.md,
    },
    radioButtonSelected: {
        borderColor: MaterialColors.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: MaterialColors.primary,
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: MaterialColors.text,
        marginBottom: MaterialSpacing.xs / 2,
    },
    selectedLabel: {
        color: MaterialColors.primary,
    },
    optionDescription: {
        fontSize: 14,
        color: MaterialColors.textSecondary,
        lineHeight: 18,
    },
    selectedDescription: {
        color: MaterialColors.text,
    },
});
