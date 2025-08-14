import { StyleSheet } from 'react-native';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceStatusCardStyles = StyleSheet.create({
    container: {
        backgroundColor: MaterialColors.surface,
        borderRadius: MaterialBorderRadius.md,
        borderWidth: 1,
        borderColor: MaterialColors.outline,
        padding: MaterialSpacing.md,
        marginVertical: MaterialSpacing.xs
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
        marginBottom: MaterialSpacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: MaterialSpacing.xs,
    },
    title: {
        ...MaterialTypography.body,
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
    statusText: {
        ...MaterialTypography.caption,
        fontWeight: '400' as const,
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
    labelText: {
        ...MaterialTypography.caption,
        color: MaterialColors.onSurfaceVariant,
        fontWeight: '400' as const,
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
        paddingVertical: MaterialSpacing.md,
    },
    disconnectedText: {
        ...MaterialTypography.body,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
    },
});
