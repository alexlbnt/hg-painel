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
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { apiStatus, useApiOffline } from '@/lib/apiStatus';
import { getApiBaseUrl } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

function MainContentGate() {
  const { isMobile } = useResponsive();
  const { user, isLoading } = useAuth();
  const offline = useApiOffline();

  if (isLoading) {
    return <FantasyLoadingScreen />;
  }

  if (!user) {
    return <LoginGateScreen />;
  }

  return (
    <View style={styles.container}>
      <HeaderNav />
      {offline && (
        <View style={styles.offlineBanner}>
          <ErrorBanner
            message="Sem conexão com o servidor: exibindo dados salvos neste dispositivo, que podem estar desatualizados."
            onRetry={async () => {
              try {
                const res = await fetch(`${getApiBaseUrl()}/api/rooms?t=${Date.now()}`);
                if (res.ok) apiStatus.reportOk();
              } catch {}
            }}
          />
        </View>
      )}
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
  offlineBanner: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
