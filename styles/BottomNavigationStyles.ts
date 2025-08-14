import { StyleSheet } from 'react-native';
import { MaterialColors } from './MaterialTheme';

export const bottomNavigationStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: MaterialColors.background,
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: MaterialColors.surface,
        borderTopWidth: 0.5,
        borderTopColor: MaterialColors.outlineVariant,
        paddingBottom: 16,
        paddingTop: 12,
        elevation: 0,
        height: 64,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    activeTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontSize: 12,
        color: MaterialColors.onSurfaceVariant,
        marginTop: 2,
        fontWeight: '400',
        lineHeight: 14,
    },
    activeTabText: {
        color: MaterialColors.primary,
        fontWeight: '500',
    },
    tabIcon: {
        fontSize: 20,
        color: MaterialColors.onSurfaceVariant,
        marginBottom: 4,
        fontWeight: '400',
    },
    activeTabIcon: {
        color: MaterialColors.primary,
        fontWeight: '600',
    },
    iconSpacing: {
        marginBottom: 4,
    },
});
