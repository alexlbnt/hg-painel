import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { usePathname, useRouter } from 'expo-router';
import { BookOpen, ClipboardList, Crown, Home, Shield } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { user } = useAuth();

  if (!isMobile) {
    return null;
  }

  const isDM = user?.role === 'DM';

  const navItems = [
    { name: 'Taverna', path: '/', icon: Home },
    { name: 'Diário', path: '/journal', icon: BookOpen },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList },
    { name: 'Jogador', path: '/player', icon: Shield },
    ...(isDM ? [{ name: 'Mestre', path: '/dm', icon: Crown }] : []),
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path));

          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              activeOpacity={0.7}
              onPress={() => router.push(item.path as any)}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Icon
                color={isActive ? Colors.fantasy.goldBright : '#80776C'}
                size={20}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20, 17, 15, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingHorizontal: 8,
    minHeight: 58,
    ...Platform.select({
      web: {
        boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 20,
      },
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
    minHeight: 44,
  },
  tabBtnActive: {
    // Leve destaque
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 28,
    height: 3,
    backgroundColor: Colors.fantasy.goldBright,
    borderRadius: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 1px 4px ${Colors.fantasy.goldBright}`,
      } as any,
      default: {
        shadowColor: Colors.fantasy.goldBright,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  tabLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: Colors.fantasy.goldBright,
    fontWeight: '700',
  },
});
