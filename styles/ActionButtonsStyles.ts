import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const actionButtonsStyles = StyleSheet.create({
    container: {
        gap: MaterialSpacing.lg,
    },
    
    // Send Button
    sendButton: {
        backgroundColor: MaterialColors.primary,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: MaterialSpacing.sm,
        elevation: 2,
    },
    sendButtonDisabled: {
        backgroundColor: MaterialColors.textDisabled,
        elevation: 0,
    },
    sendButtonIcon: {
        fontSize: 16,
        color: MaterialColors.background,
    },
    sendButtonText: {
        ...MaterialTypography.body,
        color: MaterialColors.background,
        fontWeight: '600' as const,
    },
    sendButtonTextDisabled: {
        color: MaterialColors.background,
        opacity: 0.7,
    },
    
    // Control Buttons - Enhanced UI
    controlsRow: {
        flexDirection: 'row',
        gap: MaterialSpacing.sm,
        marginTop: MaterialSpacing.sm,
    },
    controlButton: {
        flex: 1,
        backgroundColor: MaterialColors.surface,
        borderWidth: 2,
        borderColor: MaterialColors.primary,
        borderRadius: MaterialBorderRadius.lg,
        paddingVertical: MaterialSpacing.lg,
        paddingHorizontal: MaterialSpacing.md,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: MaterialSpacing.xs,
        elevation: 3,
    },
    controlButtonIcon: {
        fontSize: 24,
        color: MaterialColors.primary,
        marginBottom: MaterialSpacing.xs,
    },
    controlButtonText: {
        ...MaterialTypography.caption,
        color: MaterialColors.primary,
        fontWeight: '600' as const,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
