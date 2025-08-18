import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Appearance } from 'react-native';

export default function RootLayout() {
  const systemScheme = Appearance.getColorScheme();
  return (
    <>
      <StatusBar style={systemScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
