import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

/** Cartão base do tema (couro/bronze), com título opcional. */
export function Card({
  title,
  accent,
  children,
  style,
}: {
  title?: string;
  accent?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>
      {title ? <Text style={[styles.title, accent ? { color: accent } : null]}>{title}</Text> : null}
      {children}
    </View>
  );
}

/** Selo pequeno de status/etiqueta. */
export function Badge({ label, color = Colors.fantasy.gold }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 10,
  },
  title: {
    color: Colors.fantasy.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
});
