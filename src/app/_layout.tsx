import BottomNav from '@/components/BottomNav';
import HeaderNav from '@/components/HeaderNav';
import { AuthProvider } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { DarkTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isMobile } = useResponsive();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <View style={styles.container}>
          <HeaderNav />
          <View style={[styles.mainContent, isMobile && { paddingBottom: 70 }]}>
            <Slot />
          </View>
          <BottomNav />
        </View>
      </ThemeProvider>
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
