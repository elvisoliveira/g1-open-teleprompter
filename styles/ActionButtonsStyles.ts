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
        shadowColor: MaterialColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sendButtonDisabled: {
        backgroundColor: MaterialColors.textDisabled,
        elevation: 0,
        shadowOpacity: 0,
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
        shadowColor: MaterialColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
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
