import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const messageComposerStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        paddingHorizontal: MaterialSpacing.lg,
        paddingVertical: MaterialSpacing.lg,
    },
    
    // Status Card
    statusCard: {
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.lg,
        paddingHorizontal: MaterialSpacing.lg,
        marginBottom: MaterialSpacing.xl,
        borderWidth: 1,
        borderColor: MaterialColors.border,
    },
    statusConnected: {
        backgroundColor: MaterialColors.primaryLight,
        borderColor: MaterialColors.primary,
    },
    statusPartial: {
        backgroundColor: MaterialColors.surface,
        borderColor: MaterialColors.warning,
    },
    statusTitle: {
        ...MaterialTypography.h3,
        color: MaterialColors.text,
        fontWeight: '600' as const,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: MaterialSpacing.lg,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        borderRadius: MaterialBorderRadius.lg,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        gap: MaterialSpacing.xs,
    },
    connectedChip: {
        backgroundColor: MaterialColors.primary,
        borderColor: MaterialColors.primary,
    },
    statusIcon: {
        fontSize: 12,
        color: MaterialColors.textSecondary,
    },
    statusChipText: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        fontWeight: '500' as const,
    },
    connectedChipText: {
        color: MaterialColors.background,
    },

    // Minimalistic Device Status Enhancement
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: MaterialSpacing.md,
    },
    statusOverview: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        fontWeight: '500' as const,
    },
    statusOverviewConnected: {
        color: MaterialColors.primary,
    },
    statusOverviewContainer: {
        alignItems: 'flex-end',
        gap: MaterialSpacing.xs,
    },
    heartbeatStatus: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        fontSize: 10,
    },
    heartbeatHealthy: {
        color: MaterialColors.primary,
    },
    
    // Warning and Reconnection Styles
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF3CD',
        borderWidth: 1,
        borderColor: '#F0AD4E',
        borderRadius: MaterialBorderRadius.md,
        padding: MaterialSpacing.md,
        marginTop: MaterialSpacing.md,
        gap: MaterialSpacing.sm,
    },
    warningIcon: {
        fontSize: 18,
        marginTop: 2,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        ...MaterialTypography.body,
        fontWeight: '600' as const,
        color: '#856404',
        marginBottom: MaterialSpacing.xs,
    },
    warningText: {
        ...MaterialTypography.caption,
        color: '#856404',
        marginBottom: MaterialSpacing.sm,
        lineHeight: 16,
    },
    reconnectButton: {
        backgroundColor: '#F0AD4E',
        borderRadius: MaterialBorderRadius.sm,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        alignSelf: 'flex-start',
    },
    reconnectButtonText: {
        ...MaterialTypography.caption,
        color: '#FFFFFF',
        fontWeight: '600' as const,
    },
    deviceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: MaterialSpacing.md,
    },
    deviceChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.md,
        gap: MaterialSpacing.sm,
    },
    deviceChipConnected: {
        backgroundColor: MaterialColors.primaryLight,
        borderColor: MaterialColors.primary,
    },
    deviceChipWarning: {
        backgroundColor: '#FFF3CD',
        borderColor: '#F0AD4E',
    },
    deviceChipError: {
        backgroundColor: '#F8D7DA',
        borderColor: '#DC3545',
    },
    deviceIcon: {
        fontSize: 14,
        color: MaterialColors.textSecondary,
    },
    deviceIconConnected: {
        color: MaterialColors.primary,
    },
    deviceIconWarning: {
        color: '#F0AD4E',
    },
    deviceIconError: {
        color: '#DC3545',
    },
    deviceText: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        fontWeight: '500' as const,
        flex: 1,
    },
    deviceTextConnected: {
        color: MaterialColors.text,
        fontWeight: '600' as const,
    },
    deviceTextWarning: {
        color: '#856404',
        fontWeight: '600' as const,
    },
    deviceTextError: {
        color: '#721C24',
        fontWeight: '600' as const,
    },
    
    // Input Section
    inputContainer: {
        marginBottom: MaterialSpacing.xl,
    },
    inputLabel: {
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
    inputHint: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
    },
    
    // Action Section
    actionSection: {
        gap: MaterialSpacing.lg,
    },
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
    
    // Lorem Button
    loremButton: {
        marginTop: MaterialSpacing.md,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        backgroundColor: MaterialColors.secondary,
        borderRadius: MaterialBorderRadius.sm,
        alignItems: 'center',
    },
    loremButtonText: {
        ...MaterialTypography.body,
        color: MaterialColors.background,
        fontWeight: '500' as const,
    },
});
