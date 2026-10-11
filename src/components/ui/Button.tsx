import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors, Radius, Type } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: any;
  disabled?: boolean;
  loading?: boolean;
  /** Ocupa o espaço disponível na linha. */
  grow?: boolean;
  size?: 'md' | 'sm';
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const VARIANTS: Record<ButtonVariant, { bg: string; hover: string; fg: string; border: string }> = {
  primary: { bg: Colors.fantasy.gold, hover: Colors.fantasy.goldBright, fg: '#1A140F', border: Colors.fantasy.gold },
  secondary: { bg: 'transparent', hover: 'rgba(226, 216, 195, 0.06)', fg: Colors.fantasy.text, border: '#4A3E33' },
  danger: { bg: 'transparent', hover: 'rgba(184, 40, 40, 0.14)', fg: Colors.fantasy.dangerText, border: 'rgba(184, 40, 40, 0.55)' },
  ghost: { bg: 'transparent', hover: 'rgba(226, 216, 195, 0.06)', fg: Colors.fantasy.textSecondary, border: 'transparent' },
};

/** Botão-padrão do painel (fundo escuro). Uma ação principal por área; o resto é secundário. */
export function Button({
  label,
  onPress,
  variant = 'secondary',
  icon: Icon,
  disabled,
  loading,
  grow,
  size = 'md',
  accessibilityLabel,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={(state: any) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: state.hovered || state.pressed ? v.hover : v.bg, borderColor: v.border },
        grow && styles.grow,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={v.fg} /> : Icon ? <Icon size={size === 'sm' ? 14 : 16} color={v.fg} /> : null}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    gap: 6,
  },
  grow: {
    flexGrow: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: Type.body,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: Type.small,
  },
});
