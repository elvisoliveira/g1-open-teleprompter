import { StyleSheet } from 'react-native';
import { CardStyles, ContainerStyles, StatusStyles, UtilityStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceStatusCardStyles = StyleSheet.create({
    // Base container using common card pattern
    container: {
        ...CardStyles.cardOutlined,
        marginVertical: MaterialSpacing.xs,
    },
    containerConnected: {
        borderColor: MaterialColors.primary,
        backgroundColor: MaterialColors.surface,
        ...UtilityStyles.shadowLow,
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
        ...ContainerStyles.spaceBetween,
        marginBottom: MaterialSpacing.xs,
    },
    title: {
        ...MaterialTypography.titleMedium,
        flex: 1,
    },
    titleConnected: {
        color: MaterialColors.primary,
    },
    titleDisconnected: {
        color: MaterialColors.onSurfaceVariant,
    },
    statusIndicator: {
        ...StatusStyles.statusIndicator,
        flex: 1,
    },
    statusText: {
        ...StatusStyles.statusText,
        ...MaterialTypography.labelSmall,
    },
    statusTextConnected: {
        ...StatusStyles.statusTextSuccess,
    },
    statusTextDisconnected: {
        ...StatusStyles.statusTextError,
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
