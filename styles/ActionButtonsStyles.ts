import { StyleSheet } from 'react-native';
import { ButtonStyles, ContainerStyles } from './CommonStyles';
import { MaterialColors, MaterialElevation, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const actionButtonsStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.column,
        gap: MaterialSpacing.lg,
    },
    
    // Send Button - Using enhanced primary button pattern
    sendButton: {
        ...ButtonStyles.primaryButton,
        elevation: MaterialElevation.level1,
        shadowColor: MaterialColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sendButtonDisabled: {
        ...ButtonStyles.primaryButtonDisabled,
        elevation: 0,
        shadowOpacity: 0,
    },
    sendButtonIcon: {
        fontSize: 20,
    },
    sendButtonText: {
        ...ButtonStyles.primaryButtonText,
        ...MaterialTypography.labelLarge,
    },
    sendButtonTextDisabled: {
        ...ButtonStyles.primaryButtonTextDisabled,
    },
    
    // Control Buttons - Enhanced with better spacing and consistency
    controlsRow: {
        ...ContainerStyles.row,
        justifyContent: 'space-between',
        marginTop: MaterialSpacing.sm,
    },
    controlButton: {
        ...ButtonStyles.secondaryButton,
        flex: 1,
        flexDirection: 'column',
        paddingVertical: MaterialSpacing.lg,
        paddingHorizontal: MaterialSpacing.md,
        gap: MaterialSpacing.xs,
        minHeight: 72,
        marginHorizontal: MaterialSpacing.xs,
    },
    controlButtonIcon: {
        fontSize: 24,
        color: MaterialColors.primary,
    },
    controlButtonText: {
        ...ButtonStyles.secondaryButtonText,
        ...MaterialTypography.labelMedium,
        textAlign: 'center',
    },
});
