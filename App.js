import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import WargaHomeScreen from './src/screens/warga/WargaHomeScreen';

function MainNavigator() {
  const { user, token, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1b7480" />
      </View>
    );
  }

  // Jika belum login
  if (!token || !user) {
    if (currentScreen === 'register') {
      return <RegisterScreen onNavigateLogin={() => setCurrentScreen('login')} />;
    }
    return <LoginScreen onNavigateRegister={() => setCurrentScreen('register')} />;
  }

  // Khusus Warga Desa
  return <WargaHomeScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fff" />
        <MainNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f8f9',
  },
});
