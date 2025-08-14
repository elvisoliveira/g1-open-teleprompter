import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { bottomNavigationStyles as styles } from '../styles/BottomNavigationStyles';

interface AppBottomNavigationProps {
    currentView: 'home' | 'device';
    onNavigate: (view: 'home' | 'device') => void;
}

const AppBottomNavigation: React.FC<AppBottomNavigationProps> = ({
    currentView,
    onNavigate
}) => {
    const getTabStyle = (tabName: 'home' | 'device') => [
        styles.tab,
        currentView === tabName && styles.activeTab
    ];

    const getTabTextStyle = (tabName: 'home' | 'device') => [
        styles.tabText,
        currentView === tabName && styles.activeTabText
    ];

    const getTabIconStyle = (tabName: 'home' | 'device') => [
        styles.tabIcon,
        currentView === tabName && styles.activeTabIcon
    ];

    const getIconColor = (tabName: 'home' | 'device') => 
        currentView === tabName ? '#6200ee' : '#757575';

    return (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={getTabStyle('home')}
                onPress={() => onNavigate('home')}
                activeOpacity={0.6}
            >
                <MaterialIcons 
                    name="home" 
                    size={24} 
                    color={getIconColor('home')}
                    style={styles.iconSpacing}
                />
                <Text style={getTabTextStyle('home')}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={getTabStyle('device')}
                onPress={() => onNavigate('device')}
                activeOpacity={0.6}
            >
                <MaterialIcons 
                    name="devices" 
                    size={24} 
                    color={getIconColor('device')}
                    style={styles.iconSpacing}
                />
                <Text style={getTabTextStyle('device')}>Device</Text>
            </TouchableOpacity>
        </View>
    );
};

export default AppBottomNavigation;
