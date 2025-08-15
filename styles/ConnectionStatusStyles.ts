import { StyleSheet } from 'react-native';
import { CardStyles, ContainerStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const connectionStatusStyles = StyleSheet.create({
    // Main Container
    container: {
        ...ContainerStyles.screen,
        ...ContainerStyles.content,
    },

    // Overall Status Card
    overallStatusCard: {
        ...CardStyles.card,
        marginBottom: MaterialSpacing.lg,
    },
    overallStatusHeader: {
        ...ContainerStyles.row,
    },
    overallStatusTextContainer: {
        flex: 1,
    },
    overallStatusTitle: {
        ...MaterialTypography.headlineMedium,
        color: MaterialColors.onSurface,
        fontWeight: '600' as const,
        marginBottom: MaterialSpacing.xs,
    },
    overallStatusSubtitle: {
        ...MaterialTypography.bodyLarge,
        fontWeight: '500' as const,
    },

    // Quick Stats
    quickStatsContainer: {
        ...ContainerStyles.row,
        justifyContent: 'center',
        paddingTop: MaterialSpacing.md,
        borderTopWidth: 1,
        borderTopColor: MaterialColors.outlineVariant,
    },
    quickStat: {
        ...ContainerStyles.center,
        flex: 1,
    },
    quickStatValue: {
        ...MaterialTypography.h3,
        color: MaterialColors.primary,
        fontWeight: '700' as const,
        marginBottom: MaterialSpacing.xs,
    },
    quickStatLabel: {
        ...MaterialTypography.caption,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
        fontWeight: '500' as const,
    },
    quickStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: MaterialColors.outlineVariant,
        marginHorizontal: MaterialSpacing.sm,
    },

    // Devices Container
    devicesContainer: {
        gap: MaterialSpacing.md,
        marginBottom: MaterialSpacing.lg,
    },

    // Last Update Info
    lastUpdateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: MaterialSpacing.md,
        backgroundColor: MaterialColors.surfaceVariant,
        borderRadius: MaterialBorderRadius.sm,
        marginTop: MaterialSpacing.xs,
    },
    lastUpdateText: {
        ...MaterialTypography.caption,
        color: MaterialColors.onSurfaceVariant,
        fontWeight: '400' as const,
    },

    // Legacy styles (kept for compatibility)
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
    batteryIcon: {
        fontSize: 12,
        marginLeft: MaterialSpacing.xs,
    },
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
    firmwareContainer: {
        marginTop: MaterialSpacing.md,
        paddingTop: MaterialSpacing.md,
        borderTopWidth: 1,
        borderTopColor: MaterialColors.border,
    },
    firmwareTitle: {
        ...MaterialTypography.body,
        color: MaterialColors.text,
        fontWeight: '600' as const,
        marginBottom: MaterialSpacing.sm,
    },
    firmwareItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: MaterialSpacing.xs,
        gap: MaterialSpacing.sm,
    },
    firmwareLabel: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        fontWeight: '500' as const,
        minWidth: 40,
    },
    firmwareText: {
        ...MaterialTypography.caption,
        color: MaterialColors.textSecondary,
        flex: 1,
        fontSize: 10,
        lineHeight: 12,
    },
    batteryIconSpacing: {
        marginLeft: 4,
    },
    uptimeIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    uptimeIconSpacing: {
        marginRight: 4,
    },
});
