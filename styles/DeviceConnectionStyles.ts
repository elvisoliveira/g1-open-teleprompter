import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceConnectionStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
        paddingHorizontal: MaterialSpacing.lg,
    },
    
    // Header
    header: {
        alignItems: 'center',
        paddingVertical: MaterialSpacing.xxl,
    },
    emoji: {
        fontSize: 24,
        marginBottom: MaterialSpacing.sm,
        color: MaterialColors.primary,
    },
    title: {
        ...MaterialTypography.h2,
        color: MaterialColors.text,
        marginBottom: MaterialSpacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...MaterialTypography.body,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
    },
    
    // Step Indicator
    stepContainer: {
        marginBottom: MaterialSpacing.xxl,
        alignItems: 'center',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: MaterialSpacing.lg,
    },
    step: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: MaterialColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepInactive: {
        backgroundColor: MaterialColors.border,
    },
    stepNumber: {
        ...MaterialTypography.small,
        color: MaterialColors.background,
        fontWeight: '600',
    },
    stepNumberInactive: {
        color: MaterialColors.textDisabled,
    },
    stepLine: {
        width: 40,
        height: 1,
        backgroundColor: MaterialColors.primary,
        marginHorizontal: MaterialSpacing.md,
    },
    stepLineInactive: {
        backgroundColor: MaterialColors.border,
    },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 140,
    },
    stepLabel: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: MaterialColors.primary,
        fontWeight: '600',
    },
    
    // Device List
    deviceList: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: MaterialSpacing.md,
        marginBottom: MaterialSpacing.sm,
    },
    listTitle: {
        ...MaterialTypography.h3,
        color: MaterialColors.text,
    },
    refreshButton: {
        padding: MaterialSpacing.sm,
    },
    refreshButtonText: {
        ...MaterialTypography.body,
        color: MaterialColors.primary,
        fontSize: 16,
    },
    
    // Device Cards
    deviceCard: {
        marginBottom: MaterialSpacing.sm,
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        borderRadius: MaterialBorderRadius.md,
    },
    deviceCardConnected: {
        borderColor: MaterialColors.primary,
        backgroundColor: MaterialColors.primaryLight,
    },
    deviceCardContent: {
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: MaterialSpacing.md,
    },
    deviceIcon: {
        fontSize: 12,
        color: MaterialColors.textSecondary,
    },
    deviceTextContainer: {
        flex: 1,
    },
    deviceName: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        marginBottom: 2,
        fontWeight: '500',
    },
    deviceId: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
    },
    // Add base badge styles for non-connected state
    statusBadge: {
        backgroundColor: MaterialColors.background,
        borderWidth: 1,
        borderColor: MaterialColors.border,
        paddingHorizontal: MaterialSpacing.sm,
        paddingVertical: MaterialSpacing.xs,
        borderRadius: MaterialBorderRadius.sm,
    },
    statusBadgeConnected: {
        backgroundColor: MaterialColors.primary,
        paddingHorizontal: MaterialSpacing.sm,
        paddingVertical: MaterialSpacing.xs,
        borderRadius: MaterialBorderRadius.sm,
    },
    statusText: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        fontWeight: '600' as const,
    },
    statusTextConnected: {
        ...MaterialTypography.caption,
        color: MaterialColors.background,
        fontWeight: '600' as const,
    },
    
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: MaterialSpacing.xxl,
    },
    emptyIcon: {
        fontSize: 24,
        marginBottom: MaterialSpacing.md,
        color: MaterialColors.textDisabled,
    },
    emptyTitle: {
        ...MaterialTypography.body,
        color: MaterialColors.textSecondary,
        marginBottom: MaterialSpacing.xs,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptySubtitle: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        marginBottom: MaterialSpacing.lg,
        lineHeight: 16,
    },
    refreshButtonContainer: {
        backgroundColor: MaterialColors.primary,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.lg,
        borderRadius: MaterialBorderRadius.md,
    },
    refreshText: {
        ...MaterialTypography.body,
        color: MaterialColors.background,
        fontWeight: '600',
    },
    buttonGroup: {
        gap: MaterialSpacing.sm,
        width: '100%',
    },
    showAllButton: {
        backgroundColor: MaterialColors.secondary,
    },
    
    // Enhanced Empty State Styles
    emptyIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: MaterialSpacing.lg,
        gap: MaterialSpacing.xs,
    },
    emptyIconSecondary: {
        fontSize: 16,
        color: MaterialColors.textDisabled,
        opacity: 0.6,
    },
    emptyMessageContainer: {
        marginBottom: MaterialSpacing.xl,
    },
    checklistContainer: {
        marginTop: MaterialSpacing.sm,
        paddingLeft: MaterialSpacing.sm,
    },
    checklistItem: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        marginBottom: MaterialSpacing.xs,
        lineHeight: 18,
    },
    actionButtonGroup: {
        width: '100%',
        gap: MaterialSpacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
        borderRadius: MaterialBorderRadius.lg,
        gap: MaterialSpacing.sm,
    },
    primaryActionButton: {
        backgroundColor: MaterialColors.primary,
        elevation: 2,
    },
    secondaryActionButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: MaterialColors.border,
    },
    actionButtonIcon: {
        fontSize: 18,
    },
    primaryActionText: {
        ...MaterialTypography.body,
        color: MaterialColors.background,
        fontWeight: '600',
    },
    secondaryActionText: {
        ...MaterialTypography.body,
        color: MaterialColors.textSecondary,
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: MaterialSpacing.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: MaterialColors.borderLight,
    },
    dividerText: {
        ...MaterialTypography.caption,
        color: MaterialColors.textDisabled,
        marginHorizontal: MaterialSpacing.md,
        fontStyle: 'italic',
    },
    helpTextContainer: {
        marginTop: MaterialSpacing.lg,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        backgroundColor: MaterialColors.backgroundSecondary,
        borderRadius: MaterialBorderRadius.sm,
    },
    helpText: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
        fontStyle: 'italic',
    },
    
    // Loading State
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.xl,
    },
    loadingIconContainer: {
        marginBottom: MaterialSpacing.md,
    },
    loadingIcon: {
        fontSize: 24,
        color: MaterialColors.primary,
    },
    loadingTitle: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        fontWeight: '600',
        marginBottom: MaterialSpacing.xs,
        textAlign: 'center',
    },
    loadingSubtitle: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        textAlign: 'center',
        marginBottom: MaterialSpacing.lg,
    },
    loadingProgressContainer: {
        flexDirection: 'row',
        gap: MaterialSpacing.xs,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: MaterialColors.primary,
        opacity: 0.6,
    },
    loadingText: {
        ...MaterialTypography.body,
        color: MaterialColors.textSecondary,
    },
    
    // Success Card
    successCard: {
        backgroundColor: MaterialColors.primaryLight,
        borderWidth: 1,
        borderColor: MaterialColors.primary,
        borderRadius: MaterialBorderRadius.md,
        paddingVertical: MaterialSpacing.lg,
        paddingHorizontal: MaterialSpacing.xl,
        alignItems: 'center',
        marginTop: MaterialSpacing.xl,
    },
    successIcon: {
        fontSize: 20,
        color: MaterialColors.primary,
        marginBottom: MaterialSpacing.sm,
    },
    successText: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    
    // Section Divider
    sectionDivider: {
        height: 1,
        backgroundColor: MaterialColors.outlineVariant,
        marginVertical: MaterialSpacing.sm,
    },
    // Inline style replacements
    successIconContainer: {
        alignItems: 'center',
    },
    flatListContentContainer: {
        paddingBottom: 8,
    },
});
