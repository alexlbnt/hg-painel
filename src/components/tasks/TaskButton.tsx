import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { BOARD, focusRing } from './taskTheme';

type Variant =
  /** Ação principal sobre o pergaminho (tinta escura). */
  | 'ink'
  /** Ação secundária sobre o pergaminho (contorno de tinta). */
  | 'inkOutline'
  /** Chamada principal da página, sobre o fundo escuro. */
  | 'gold'
  /** Ação secundária sobre o fundo escuro. */
  | 'dark';

interface TaskButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: any;
  disabled?: boolean;
  loading?: boolean;
  grow?: boolean;
  accessibilityLabel?: string;
  compact?: boolean;
}

const COLORS: Record<Variant, { bg: string; fg: string; border: string; hoverBg: string }> = {
  ink: { bg: BOARD.ink, fg: BOARD.parchment, border: BOARD.ink, hoverBg: '#3E3024' },
  inkOutline: { bg: 'transparent', fg: BOARD.ink, border: 'rgba(43, 33, 25, 0.45)', hoverBg: 'rgba(43, 33, 25, 0.08)' },
  gold: { bg: BOARD.gold, fg: '#1A140F', border: BOARD.gold, hoverBg: BOARD.goldBright },
  dark: { bg: 'transparent', fg: BOARD.text, border: '#4A3E33', hoverBg: 'rgba(226, 216, 195, 0.06)' },
};

export function TaskButton({
  label,
  onPress,
  variant = 'ink',
  icon: Icon,
  disabled,
  loading,
  grow,
  accessibilityLabel,
  compact,
}: TaskButtonProps) {
  const c = COLORS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={(state: any) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: state.hovered || state.pressed ? c.hoverBg : c.bg, borderColor: c.border },
        grow && styles.grow,
        (disabled || loading) && styles.disabled,
        focusRing(!!state.focused),
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={c.fg} /> : Icon ? <Icon size={15} color={c.fg} /> : null}
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  grow: {
    flexGrow: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
