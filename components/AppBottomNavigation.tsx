import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { bottomNavigationStyles as styles } from '../styles/BottomNavigationStyles';
import { MaterialColors } from '../styles/MaterialTheme';

interface AppBottomNavigationProps {
    currentView: 'home' | 'device' | 'presentations';
    onNavigate: (view: 'home' | 'device' | 'presentations') => void;
}

const AppBottomNavigation: React.FC<AppBottomNavigationProps> = ({
    currentView,
    onNavigate
}) => {
    const getTabStyle = (tabName: 'home' | 'device' | 'presentations') => 
        currentView === tabName ? styles.activeTab : styles.tab;

    const getTabInnerStyle = (tabName: 'home' | 'device' | 'presentations') => 
        currentView === tabName ? styles.activeTabInner : styles.tabInner;

    const getIconContainerStyle = (tabName: 'home' | 'device' | 'presentations') => 
        currentView === tabName ? styles.activeIconContainer : styles.iconContainer;

    const getTabTextStyle = (tabName: 'home' | 'device' | 'presentations') => [
        styles.tabText,
        currentView === tabName && styles.activeTabText
    ];

    const getIconColor = (tabName: 'home' | 'device' | 'presentations') => 
        currentView === tabName ? MaterialColors.onSecondaryContainer : MaterialColors.onSurfaceVariant;

    return (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={getTabStyle('home')}
                onPress={() => onNavigate('home')}
                activeOpacity={0.6}
            >
                <View style={getTabInnerStyle('home')}>
                    <View style={getIconContainerStyle('home')}>
                        <MaterialIcons 
                            name="home" 
                            size={20} 
                            color={getIconColor('home')}
                        />
                    </View>
                    <Text style={getTabTextStyle('home')}>Home</Text>
                </View>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={getTabStyle('device')}
                onPress={() => onNavigate('device')}
                activeOpacity={0.6}
            >
                <View style={getTabInnerStyle('device')}>
                    <View style={getIconContainerStyle('device')}>
                        <MaterialIcons 
                            name="devices" 
                            size={20} 
                            color={getIconColor('device')}
                        />
                    </View>
                    <Text style={getTabTextStyle('device')}>Device</Text>
                </View>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={getTabStyle('presentations')}
                onPress={() => onNavigate('presentations')}
                activeOpacity={0.6}
            >
                <View style={getTabInnerStyle('presentations')}>
                    <View style={getIconContainerStyle('presentations')}>
                        <MaterialIcons 
                            name="slideshow" 
                            size={20} 
                            color={getIconColor('presentations')}
                        />
                    </View>
                    <Text style={getTabTextStyle('presentations')}>Presentations</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default AppBottomNavigation;
