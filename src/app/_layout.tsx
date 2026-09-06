import BottomNav from '@/components/BottomNav';
import HeaderNav from '@/components/HeaderNav';
import { AuthProvider } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { DarkTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

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
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[styles.mainContent, isMobile && { paddingBottom: 80 }]}
          >
            <Slot />
          </ScrollView>
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
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
