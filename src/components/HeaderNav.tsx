import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Shield, Crown, Sparkles, Home, Scroll, Sword } from 'lucide-react-native';

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: 'Portal da Taverna', path: '/', icon: Home },
    { name: 'Grimório do Jogador', path: '/player', icon: Shield },
    { name: 'Escudo do Mestre', path: '/dm', icon: Crown },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Logo & Emblema Medieval */}
        <TouchableOpacity style={styles.brand} onPress={() => router.push('/')}>
          <View style={styles.iconContainer}>
            <Sword color={Colors.fantasy.gold} size={22} />
          </View>
          <View>
            <Text style={styles.title}>HONRA & EGOÍSMO</Text>
            <Text style={styles.subtitle}>GRIMÓRIO D&D 5E • CAMPANHA MEDIEVAL</Text>
          </View>
        </TouchableOpacity>

        {/* Links de Navegação Medieval */}
        <View style={styles.navLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <TouchableOpacity
                key={item.path}
                style={[styles.navButton, isActive && styles.navButtonActive]}
                onPress={() => router.push(item.path as any)}
              >
                <Icon color={isActive ? Colors.fantasy.goldBright : Colors.fantasy.textSecondary} size={16} />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emblema de Campanha */}
        <View style={styles.roomBadge}>
          <Text style={styles.roomLabel}>MESA EM SESSÃO</Text>
          <Text style={styles.roomCode}>⚔️ #HONRA-5E</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
      },
    }),
  },
  inner: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#E6C280',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  subtitle: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  navButtonActive: {
    backgroundColor: '#24201C',
    borderColor: '#8C704F',
    borderWidth: 1,
  },
  navText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", "Garamond", serif' : undefined,
  },
  navTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  roomBadge: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#5C4E40',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  roomLabel: {
    color: '#80776C',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  roomCode: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
});
