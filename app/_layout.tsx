import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Set dark status bar permanently
    const setDarkStatusBar = async () => {
      try {
        await SystemUI.setBackgroundColorAsync("#000000");
      } catch (error) {
        console.warn("Failed to set status bar color:", error);
      }
    };
    
    setDarkStatusBar();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
