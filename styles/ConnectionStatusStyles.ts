import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const connectionStatusStyles = StyleSheet.create({
    // Main Container - using common patterns
    container: {
        ...ContainerStyles.screen,
        ...ContainerStyles.content,
    },

    // Overall Status Card - flat design without borders
    overallStatusCard: {
        marginBottom: MaterialSpacing.lg,
    },
    overallStatusTitle: {
        ...MaterialTypography.titleLarge,
        color: MaterialColors.onSurface,
        marginBottom: MaterialSpacing.xs,
    },
    overallStatusSubtitle: {
        ...MaterialTypography.bodyMedium,
        color: MaterialColors.success,
        fontWeight: '500' as const,
    },

    // Devices Container - using common spacing
    devicesContainer: {
        ...ContainerStyles.column,
        gap: MaterialSpacing.md,
        marginBottom: MaterialSpacing.lg,
    },

    // Last Update Info - flat design with subtle background
    lastUpdateContainer: {
        ...ContainerStyles.center,
        marginTop: MaterialSpacing.md,
    },
    lastUpdateText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onSurfaceVariant,
    },
});
