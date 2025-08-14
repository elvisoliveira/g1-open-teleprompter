import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TeleprompterApp from '../components/TeleprompterApp';
import { appIndexStyles } from '../styles/AppStyles';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={appIndexStyles.container}>
        <TeleprompterApp />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
