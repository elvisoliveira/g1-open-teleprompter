import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopAppBar from '../components/TopAppBar';
import { OutputModeProvider } from '../hooks/useOutputMode';
import { appStyles } from '../styles/AppStyles';
import { MaterialColors } from '../styles/MaterialTheme';

export default function RootLayout() {
  const systemScheme = Appearance.getColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={systemScheme === 'dark' ? 'light' : 'dark'} />
      <OutputModeProvider>
        <SafeAreaView style={appStyles.container}>
          <TopAppBar />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: MaterialColors.surfaceContainer },
            }}
          />
        </SafeAreaView>
      </OutputModeProvider>
    </SafeAreaProvider>
  );
}
