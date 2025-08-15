import { StyleSheet } from 'react-native';
import { CardStyles, ContainerStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const deviceStatusCardStyles = StyleSheet.create({
    // Base container - flat design without borders
    container: {
        ...CardStyles.card
    },
    containerConnected: {
        backgroundColor: MaterialColors.surfaceContainer,
    },
    containerDisconnected: {
        backgroundColor: MaterialColors.surfaceVariant,
        opacity: 0.8,
    },

    // Header Section - device name and status aligned as specified
    header: {
        ...ContainerStyles.spaceBetween,
        marginBottom: MaterialSpacing.md,
    },
    titleRow: {
        flex: 1,
    },
    title: {
        ...MaterialTypography.titleMedium,
        color: MaterialColors.onSurface,
        fontWeight: '600' as const,
    },
    titleConnected: {
        color: MaterialColors.onSurface,
    },
    titleDisconnected: {
        color: MaterialColors.onSurfaceVariant,
    },
    statusIndicator: {
        alignItems: 'flex-end',
    },
    statusText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.success,
        fontWeight: '500' as const,
    },
    statusTextConnected: {
        color: MaterialColors.success,
    },
    statusTextDisconnected: {
        color: MaterialColors.error,
    },

    // Content Section - battery and firmware info
    content: {
        ...ContainerStyles.column,
        gap: MaterialSpacing.md,
    },
    infoRow: {
        ...ContainerStyles.column,
        alignItems: 'flex-start',
        gap: MaterialSpacing.xs,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelText: {
        ...MaterialTypography.bodySmall,
        color: MaterialColors.onSurfaceVariant,
        fontWeight: '400' as const,
    },
    valueText: {
        ...MaterialTypography.headlineSmall,
        color: MaterialColors.onSurface,
        fontWeight: '700' as const,
    },
    valueTextBattery: {
        ...MaterialTypography.headlineSmall,
        color: MaterialColors.onSurface,
        fontWeight: '700' as const,
    },
    valueTextFirmware: {
        ...MaterialTypography.titleMedium,
        fontWeight: '600' as const,
    },
    valueTextFirmwareUnknown: {
        color: MaterialColors.tertiary, // Purple for unknown firmware
    },
    valueTextFirmwareKnown: {
        color: MaterialColors.onSurface, // Black for known firmware
    },

    // Details Section - light gray background with rounded corners
    detailsSection: {
        marginTop: MaterialSpacing.md,
        padding: MaterialSpacing.md,
        backgroundColor: MaterialColors.surfaceVariant,
        borderRadius: MaterialBorderRadius.md,
    },
    detailsTitle: {
        ...MaterialTypography.labelMedium,
        color: MaterialColors.onSurfaceVariant,
        fontWeight: '500' as const,
        marginBottom: MaterialSpacing.xs,
    },
    detailsText: {
        ...MaterialTypography.bodySmall,
        color: MaterialColors.onSurfaceVariant,
        lineHeight: 16,
    },

    // Disconnected State
    disconnectedContent: {
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.md,
    },
    disconnectedText: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.onSurfaceVariant,
        textAlign: 'center',
    },
});
