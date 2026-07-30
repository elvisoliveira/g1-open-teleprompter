import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { bottomNavigationStyles as styles } from '../styles/BottomNavigationStyles';
import { MaterialColors, rippleColor } from '../styles/MaterialTheme';

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
                    <Pressable
                        key={tab.href}
                        style={styles.tab}
                        onPress={() => router.navigate(tab.href)}
                        android_ripple={{ color: rippleColor, borderless: true }}
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
                    </Pressable>
                );
            })}
        </View>
    );
};

export default AppBottomNavigation;
