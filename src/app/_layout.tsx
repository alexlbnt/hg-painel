import BottomNav from '@/components/BottomNav';
import HeaderNav from '@/components/HeaderNav';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoomProvider } from '@/contexts/RoomContext';
import { useResponsive } from '@/hooks/useResponsive';
import { DarkTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import FantasyLoadingScreen from '@/components/ui/FantasyLoadingScreen';
import LoginGateScreen from '@/components/auth/LoginGateScreen';

SplashScreen.preventAutoHideAsync();

function MainContentGate() {
  const { isMobile } = useResponsive();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FantasyLoadingScreen />;
  }

  if (!user) {
    return <LoginGateScreen />;
  }

  return (
    <View style={styles.container}>
      <HeaderNav />
      <View style={[styles.mainContent, isMobile && { paddingBottom: 70 }]}>
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <RoomProvider>
        <ThemeProvider value={DarkTheme}>
          <MainContentGate />
        </ThemeProvider>
      </RoomProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#110F0D',
    minHeight: '100%' as any,
    ...Platform.select({
      web: {
        height: '100dvh' as any,
        maxHeight: '100dvh' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
