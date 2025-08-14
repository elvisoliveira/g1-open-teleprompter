import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceStatusCardStyles = StyleSheet.create({
    container: {
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.lg,
        borderWidth: 2,
        borderColor: MaterialColors.outline,
        padding: MaterialSpacing.md,
        marginVertical: MaterialSpacing.xs,
        elevation: 2
    },
    containerConnected: {
        borderColor: MaterialColors.primary,
        backgroundColor: MaterialColors.surface,
    },
    containerDisconnected: {
        borderColor: MaterialColors.outline,
        backgroundColor: MaterialColors.surfaceVariant,
        opacity: 0.8,
    },
    containerCompact: {
        padding: MaterialSpacing.sm,
    },

    // Header Section
    header: {
        marginBottom: MaterialSpacing.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: MaterialSpacing.xs,
    },
    headerIcon: {
        marginRight: MaterialSpacing.xs,
    },
    title: {
        ...MaterialTypography.h3,
        fontWeight: '600' as const,
        flex: 1,
    },
    titleConnected: {
        color: MaterialColors.primary,
    },
    titleDisconnected: {
        color: MaterialColors.onSurfaceVariant,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    heartbeatIcon: {
        marginRight: MaterialSpacing.xs,
    },
    statusText: {
        ...MaterialTypography.caption,
        fontWeight: '500' as const,
    },
    statusTextConnected: {
        color: MaterialColors.success,
    },
    statusTextDisconnected: {
        color: MaterialColors.error,
    },

    // Content Section
    content: {
        gap: MaterialSpacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoIcon: {
        marginRight: MaterialSpacing.sm,
    },
    labelText: {
        ...MaterialTypography.body,
        color: MaterialColors.onSurface,
        fontWeight: '500' as const,
    },
    valueText: {
        ...MaterialTypography.body,
        color: MaterialColors.primary,
        fontWeight: '600' as const,
        textAlign: 'right',
    },

    // Details Section
    detailsSection: {
        marginTop: MaterialSpacing.sm,
        padding: MaterialSpacing.sm,
        backgroundColor: MaterialColors.surfaceVariant,
        borderRadius: MaterialBorderRadius.md,
    },
    detailsTitle: {
        ...MaterialTypography.caption,
        color: MaterialColors.onSurfaceVariant,
        fontWeight: '600' as const,
        marginBottom: MaterialSpacing.xs,
    },
    detailsText: {
        ...MaterialTypography.small,
        color: MaterialColors.onSurfaceVariant,
        lineHeight: 16,
    },

    // Disconnected State
    disconnectedContent: {
        alignItems: 'center',
        paddingVertical: MaterialSpacing.lg,
    },
    disconnectedIcon: {
        marginBottom: MaterialSpacing.sm,
        opacity: 0.6,
    },
    disconnectedText: {
        ...MaterialTypography.body,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
    },
});
