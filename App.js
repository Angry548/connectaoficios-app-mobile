import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { UnreadMessagesProvider } from './context/UnreadMessagesContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <UnreadMessagesProvider><AppNavigator /></UnreadMessagesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
