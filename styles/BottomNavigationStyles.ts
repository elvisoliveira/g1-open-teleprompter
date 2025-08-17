import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const bottomNavigationStyles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: MaterialColors.surfaceContainer,
        height: 80,
    },
    tab: {
        flex: 1,
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        minHeight: 64,
    },
    tabInner: {
        ...ContainerStyles.center,
        paddingVertical: MaterialSpacing.xs,
        paddingHorizontal: MaterialSpacing.sm,
        minWidth: 64,
    },
    iconContainer: {
        ...ContainerStyles.center,
        width: 32,
        height: 32,
        marginBottom: MaterialSpacing.xs,
    },
    activeIconContainer: {
        backgroundColor: MaterialColors.secondaryContainer,
        borderRadius: MaterialBorderRadius.lg,
    },
    tabText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onSurfaceVariant,
        marginTop: MaterialSpacing.xs,
    },
    activeTabText: {
        color: MaterialColors.onSecondaryContainer,
        fontWeight: '500',
    },
});
