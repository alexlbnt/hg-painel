import { DarkTheme, ThemeProvider } from 'expo-router';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import HeaderNav from '@/components/HeaderNav';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={styles.container}>
        <HeaderNav />
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <Slot />
        </ScrollView>
      </View>
    </ThemeProvider>
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
