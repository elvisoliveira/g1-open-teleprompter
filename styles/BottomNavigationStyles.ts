import { StyleSheet } from 'react-native';

export const bottomNavigationStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: '#e0e0e0',
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
        color: '#757575',
        marginTop: 2,
        fontWeight: '400',
        lineHeight: 14,
    },
    activeTabText: {
        color: '#6200ee',
        fontWeight: '500',
    },
    tabIcon: {
        fontSize: 20,
        color: '#757575',
        marginBottom: 4,
        fontWeight: '400',
    },
    activeTabIcon: {
        color: '#6200ee',
        fontWeight: '600',
    },
    iconSpacing: {
        marginBottom: 4,
    },
});
