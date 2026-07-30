import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { bottomNavigationStyles as styles } from '../styles/BottomNavigationStyles';
import { MaterialColors } from '../styles/MaterialTheme';

const tabs = [
    { href: '/settings', icon: 'settings', label: 'Settings' },
    { href: '/', icon: 'devices', label: 'Device' },
    { href: '/presentations', icon: 'slideshow', label: 'Presentations' },
] as const;

const AppBottomNavigation: React.FC = () => {
    const pathname = usePathname();

    return (
        <View style={styles.tabBar}>
            {tabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                    <TouchableOpacity
                        key={tab.href}
                        style={styles.tab}
                        onPress={() => router.navigate(tab.href)}
                        activeOpacity={0.6}
                    >
                        <View style={styles.tabInner}>
                            <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
                                <MaterialIcons
                                    name={tab.icon}
                                    size={20}
                                    color={active ? MaterialColors.onSecondaryContainer : MaterialColors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.label}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default AppBottomNavigation;
