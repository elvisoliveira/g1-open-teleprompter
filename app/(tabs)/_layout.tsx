import { Tabs } from 'expo-router';
import React from 'react';
import AppBottomNavigation from '../../components/AppBottomNavigation';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            backBehavior="initialRoute"
            initialRouteName="index"
            tabBar={() => <AppBottomNavigation />}
        >
            <Tabs.Screen name="settings" />
            <Tabs.Screen name="index" />
            <Tabs.Screen name="presentations" />
        </Tabs>
    );
}
