import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TeleprompterApp from '../components/TeleprompterApp';
import { appIndexStyles } from '../styles/AppStyles';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={appIndexStyles.container}>
        <TeleprompterApp />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
