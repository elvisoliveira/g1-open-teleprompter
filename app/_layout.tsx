import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from 'react';
import { Appearance, NativeModules, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopAppBar from '../components/TopAppBar';
import { OutputModeProvider } from '../hooks/useOutputMode';
import { appStyles } from '../styles/AppStyles';
import { MaterialColors } from '../styles/MaterialTheme';

export default function RootLayout() {
  const systemScheme = Appearance.getColorScheme();

  // Pebble Index 01: start the sync monitor if a bonded ring exists (no-op otherwise).
  // ponytail: phase-1 wiring — always-on monitor, no per-type selection UI yet
  useEffect(() => {
    if (Platform.OS === 'android') {
      (NativeModules as any).PebbleRing?.start?.();
    }
  }, []);

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
