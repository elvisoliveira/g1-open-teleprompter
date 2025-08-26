import { StyleSheet } from 'react-native';
import { CardStyles, ContainerStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const homeScreenStyles = StyleSheet.create({
    // Output Mode Selector Styles
    sectionTitle: {
        ...MaterialTypography.titleLarge,
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.md,
    },
    modesContainer: {
        ...ContainerStyles.column,
        gap: MaterialSpacing.sm,
    },
    modeOption: {
        ...CardStyles.cardOutlined,
        padding: MaterialSpacing.lg,
        marginVertical: 0,
    },
    modeOptionSelected: {
        backgroundColor: MaterialColors.primaryContainer,
        borderColor: MaterialColors.primary,
        borderWidth: 2,
    },
    modeContent: {
        ...ContainerStyles.row,
        alignItems: 'center',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: MaterialColors.outline,
        backgroundColor: MaterialColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
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
    modeTextContainer: {
        flex: 1,
    },
    modeLabel: {
        ...MaterialTypography.bodyLarge,
        fontWeight: '500',
        marginBottom: MaterialSpacing.xs,
    },
    modeLabelSelected: {
        color: MaterialColors.primary,
    },
    modeDescription: {
        ...MaterialTypography.bodyMedium,
        lineHeight: 20,
    },
    modeDescriptionSelected: {
        color: MaterialColors.onSurface,
    },
    modeDescriptionDefault: {
        color: MaterialColors.onSurfaceVariant,
    },

    // Text Input Section Styles
    textInputSection: {
        ...ContainerStyles.section,
    },
    textInputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: MaterialSpacing.md,
    },
    textInputTitle: {
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
        minHeight: 120,
        padding: MaterialSpacing.md,
        borderRadius: MaterialSpacing.sm,
        borderWidth: 1,
        borderColor: MaterialColors.outline,
        backgroundColor: MaterialColors.surface,
        color: MaterialColors.onSurface,
        ...MaterialTypography.bodyLarge,
        textAlignVertical: 'top',
    },

    // Button Row Styles
    buttonRow: {
        ...ContainerStyles.row,
        gap: MaterialSpacing.md,
        marginVertical: MaterialSpacing.lg,
    },
    sendButton: {
        flex: 2,
        shadowColor: MaterialColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    sendButtonDisabled: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: MaterialColors.primary,
        borderRadius: MaterialBorderRadius.lg,
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: MaterialSpacing.sm,
        minHeight: 48,
    },
    exitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: MaterialSpacing.sm,
    },

    // Performance Warning Styles
    performanceWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MaterialColors.errorContainer,
        padding: MaterialSpacing.sm,
        borderRadius: MaterialSpacing.sm,
        marginTop: MaterialSpacing.xs,
        gap: MaterialSpacing.xs,
    },
    performanceWarningText: {
        ...MaterialTypography.bodySmall,
        color: MaterialColors.onErrorContainer,
        flex: 1,
    },
    performanceIcon: {
        color: MaterialColors.error,
    },
}); 