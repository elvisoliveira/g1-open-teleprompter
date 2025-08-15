import { StyleSheet } from 'react-native';
import { BadgeStyles, ButtonStyles, CardStyles, ContainerStyles, UtilityStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceConnectionStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
        ...ContainerStyles.content,
    },
    
    // Header
    header: {
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.xxl,
    },
    emoji: {
        fontSize: 24,
        marginBottom: MaterialSpacing.sm,
        color: MaterialColors.primary,
    },
    title: {
        ...MaterialTypography.headlineSmall,
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
    },
    
    // Step Indicator
    stepContainer: {
        ...ContainerStyles.center,
        marginBottom: MaterialSpacing.xxl,
    },
    stepIndicator: {
        ...ContainerStyles.row,
        justifyContent: 'center',
        marginBottom: MaterialSpacing.lg,
    },
    step: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: MaterialColors.primary,
        ...ContainerStyles.center,
    },
    stepInactive: {
        backgroundColor: MaterialColors.outlineVariant,
    },
    stepNumber: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onPrimary,
        fontWeight: '600',
    },
    stepNumberInactive: {
        color: MaterialColors.onSurfaceVariant,
    },
    stepLine: {
        width: 40,
        height: 1,
        backgroundColor: MaterialColors.primary,
        marginHorizontal: MaterialSpacing.md,
    },
    stepLineInactive: {
        backgroundColor: MaterialColors.outlineVariant,
    },
    stepLabels: {
        ...ContainerStyles.row,
        justifyContent: 'space-between',
        width: 140,
    },
    stepLabel: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onSurfaceVariant,
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
        ...ContainerStyles.spaceBetween,
        paddingVertical: MaterialSpacing.md,
        marginBottom: MaterialSpacing.sm,
    },
    listTitle: {
        ...MaterialTypography.titleLarge,
        color: MaterialColors.onSurface,
    },
    refreshButton: {
        ...ButtonStyles.tertiaryButton,
        padding: MaterialSpacing.sm,
    },
    refreshButtonText: {
        ...ButtonStyles.tertiaryButtonText,
        ...MaterialTypography.labelLarge,
    },
    
    // Device Cards
    deviceCard: {
        ...CardStyles.cardOutlined,
        marginBottom: MaterialSpacing.sm,
    },
    deviceCardConnected: {
        borderColor: MaterialColors.primary,
        backgroundColor: MaterialColors.primaryContainer,
    },
    deviceCardConnecting: {
        borderColor: MaterialColors.onSurfaceVariant,
        backgroundColor: MaterialColors.surfaceVariant,
        opacity: 0.7,
    },
    deviceCardDisabled: {
        opacity: 0.5,
        backgroundColor: MaterialColors.surfaceVariant,
    },
    deviceCardContent: {
        paddingVertical: MaterialSpacing.md,
        paddingHorizontal: MaterialSpacing.lg,
    },
    deviceInfo: {
        ...ContainerStyles.row,
        gap: MaterialSpacing.md,
    },
    deviceIcon: {
        fontSize: 12,
        color: MaterialColors.onSurfaceVariant,
    },
    deviceTextContainer: {
        flex: 1,
    },
    deviceName: {
        ...MaterialTypography.bodyLarge,
        color: MaterialColors.onSurface,
        marginBottom: 2,
        fontWeight: '500',
    },
    deviceId: {
        ...MaterialTypography.bodySmall,
        color: MaterialColors.onSurfaceVariant,
    },
    deviceNameConnecting: {
        color: MaterialColors.onSurfaceVariant,
    },
    deviceIdConnecting: {
        color: MaterialColors.onSurfaceVariant,
    },
    
    // Status Badges
    statusBadge: {
        ...BadgeStyles.badge,
        backgroundColor: MaterialColors.surface,
        borderWidth: 1,
        borderColor: MaterialColors.outlineVariant,
    },
    statusBadgeConnected: {
        ...BadgeStyles.badgeSuccess,
    },
    statusBadgeConnecting: {
        ...BadgeStyles.badgeInfo,
        flexDirection: 'row',
        alignItems: 'center',
        gap: MaterialSpacing.xs,
    },
    statusText: {
        ...BadgeStyles.badgeText,
        color: MaterialColors.onSurfaceVariant,
    },
    statusTextConnected: {
        ...BadgeStyles.badgeTextSuccess,
    },
    statusTextConnecting: {
        ...BadgeStyles.badgeTextInfo,
    },
    
    // Empty State
    emptyState: {
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: MaterialSpacing.lg,
        color: MaterialColors.onSurfaceVariant,
        opacity: 0.6,
    },
    emptyTitle: {
        ...MaterialTypography.titleMedium,
        color: MaterialColors.onSurfaceVariant,
        marginBottom: MaterialSpacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: MaterialSpacing.xl,
        lineHeight: 20,
    },
    
    // Action Buttons
    actionButtonGroup: {
        ...ContainerStyles.column,
        width: '100%',
        gap: MaterialSpacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.lg,
        paddingHorizontal: MaterialSpacing.xl,
        borderRadius: MaterialBorderRadius.lg,
        gap: MaterialSpacing.sm,
        minHeight: 48,
    },
    primaryActionButton: {
        ...ButtonStyles.primaryButton,
        ...UtilityStyles.shadowMedium,
    },
    primaryActionText: {
        ...ButtonStyles.primaryButtonText,
        ...MaterialTypography.labelLarge,
    },
    secondaryActionButton: {
        ...ButtonStyles.secondaryButton,
    },
    secondaryActionText: {
        ...ButtonStyles.secondaryButtonText,
        ...MaterialTypography.labelLarge,
    },
    
    // Divider styles for empty state
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: MaterialSpacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: MaterialColors.outlineVariant,
    },
    dividerText: {
        ...MaterialTypography.bodySmall,
        color: MaterialColors.onSurfaceVariant,
        marginHorizontal: MaterialSpacing.md,
        fontStyle: 'italic',
    },
    
    // Loading State
    loadingContainer: {
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.xl,
    },
    loadingIconContainer: {
        marginBottom: MaterialSpacing.lg,
    },
    loadingTitle: {
        ...MaterialTypography.titleMedium,
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.sm,
        textAlign: 'center',
    },
    loadingSubtitle: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: MaterialSpacing.lg,
    },
    
    // Additional styles for comprehensive device connection UI
    instructionsContainer: {
        backgroundColor: MaterialColors.surfaceVariant,
        borderRadius: MaterialBorderRadius.md,
        padding: MaterialSpacing.lg,
        marginVertical: MaterialSpacing.md,
    },
    instructionTitle: {
        ...MaterialTypography.titleMedium,
        color: MaterialColors.onSurfaceVariant,
        marginBottom: MaterialSpacing.sm,
    },
    instructionText: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        lineHeight: 20,
    },
    
    // Connection progress indicator
    progressContainer: {
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.lg,
        padding: MaterialSpacing.lg,
        marginVertical: MaterialSpacing.md,
        ...UtilityStyles.shadowLow,
    },
    progressBar: {
        height: 4,
        backgroundColor: MaterialColors.surfaceVariant,
        borderRadius: 2,
        marginVertical: MaterialSpacing.md,
    },
    progressFill: {
        height: '100%',
        backgroundColor: MaterialColors.primary,
        borderRadius: 2,
    },
    progressText: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurface,
        textAlign: 'center',
    },
    
    // Device type indicators
    deviceTypeChip: {
        backgroundColor: MaterialColors.primaryContainer,
        borderRadius: MaterialBorderRadius.xl,
        paddingHorizontal: MaterialSpacing.md,
        paddingVertical: MaterialSpacing.xs,
        marginLeft: MaterialSpacing.sm,
    },
    deviceTypeText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onPrimaryContainer,
        fontWeight: '500',
    },
    
    // Utility
    sectionDivider: {
        height: 1,
        backgroundColor: MaterialColors.outlineVariant,
        marginVertical: MaterialSpacing.lg,
    },
    flatListContentContainer: {
        paddingBottom: MaterialSpacing.lg,
    },
});
