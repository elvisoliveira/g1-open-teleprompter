import { StyleSheet } from 'react-native';
import { ContainerStyles } from './CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from './MaterialTheme';

export const bottomNavigationStyles = StyleSheet.create({
    container: {
        ...ContainerStyles.screen,
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: MaterialColors.surfaceContainer,
        height: 80,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        minHeight: 64,
    },
    activeTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.sm,
        paddingHorizontal: MaterialSpacing.md,
        minHeight: 64,
    },
    tabInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.xs,
        paddingHorizontal: MaterialSpacing.sm,
        minWidth: 64,
    },
    activeTabInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: MaterialSpacing.xs,
        paddingHorizontal: MaterialSpacing.sm,
        minWidth: 64,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        marginBottom: MaterialSpacing.xs,
    },
    activeIconContainer: {
        backgroundColor: MaterialColors.secondaryContainer,
        borderRadius: MaterialBorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        marginBottom: MaterialSpacing.xs,
    },
    tabText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onSurfaceVariant,
        marginTop: MaterialSpacing.xs,
    },
    activeTabText: {
        ...MaterialTypography.labelSmall,
        color: MaterialColors.onSecondaryContainer,
        fontWeight: '500',
    },
    tabIcon: {
        fontSize: 24,
        color: MaterialColors.onSurfaceVariant,
        marginBottom: MaterialSpacing.xs,
    },
    activeTabIcon: {
        fontSize: 24,
        color: MaterialColors.onSecondaryContainer,
    },
    iconSpacing: {
        marginBottom: MaterialSpacing.xs,
    },
});
