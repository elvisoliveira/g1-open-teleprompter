import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AppView } from '../services/types';
import { bottomNavigationStyles as styles } from '../styles/BottomNavigationStyles';
import { MaterialColors } from '../styles/MaterialTheme';

interface AppBottomNavigationProps {
    currentView: AppView;
    onNavigate: (view: 'settings' | 'device' | 'presentations') => void;
}

const tabs = [
    { key: 'settings', icon: 'settings', label: 'Settings' },
    { key: 'device', icon: 'devices', label: 'Device' },
    { key: 'presentations', icon: 'slideshow', label: 'Presentations' },
] as const;

const AppBottomNavigation: React.FC<AppBottomNavigationProps> = ({ currentView, onNavigate }) => (
    <View style={styles.tabBar}>
        {tabs.map((tab) => {
            const active = currentView === tab.key;
            return (
                <TouchableOpacity
                    key={tab.key}
                    style={styles.tab}
                    onPress={() => onNavigate(tab.key)}
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

export default AppBottomNavigation;
