import { StyleSheet } from 'react-native';
import { CardStyles, ContainerStyles } from './CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const outputModeSelectorStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.section,
    },
    title: {
        ...MaterialTypography.titleLarge,
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.md,
    },
    optionsContainer: {
        ...ContainerStyles.column,
        gap: MaterialSpacing.sm,
    },
    optionButton: {
        ...CardStyles.cardOutlined,
        padding: MaterialSpacing.lg,
        marginVertical: 0,
    },
    selectedOption: {
        backgroundColor: MaterialColors.primaryContainer,
        borderColor: MaterialColors.primary,
        borderWidth: 2,
    },
    radioContainer: {
        ...ContainerStyles.row,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: MaterialColors.outline,
        backgroundColor: MaterialColors.surface,
        ...ContainerStyles.center,
        marginRight: MaterialSpacing.md,
    },
    radioButtonSelected: {
        borderColor: MaterialColors.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        ...MaterialTypography.bodyLarge,
        fontWeight: '500',
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.xs,
    },
    selectedLabel: {
        color: MaterialColors.primary,
    },
    optionDescription: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        lineHeight: 20,
    },
    selectedDescription: {
        color: MaterialColors.onSurface,
    },
});
