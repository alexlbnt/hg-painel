import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

/** Peças visuais compartilhadas pelos passos do assistente (sem ícones, para ficarem leves e testáveis). */

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={ui.label}>{children}</Text>
      {hint ? <Text style={ui.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  disabled,
  locked,
  color = Colors.fantasy.gold,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  locked?: boolean;
  color?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || locked}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected: !!selected, disabled: !!(disabled || locked) }}
      style={[
        ui.chip,
        selected && { borderColor: color, backgroundColor: `${color}22` },
        locked && { borderStyle: 'dashed' },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Text style={[ui.chipText, selected && { color: '#FFF', fontWeight: '800' }, locked && { color: Colors.fantasy.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={ui.chipRow}>{children}</View>;
}

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Label hint={hint}>{label}</Label>
      <TextInput
        placeholderTextColor={Colors.fantasy.textMuted}
        accessibilityLabel={label}
        {...input}
        style={[ui.input, input.style]}
      />
    </View>
  );
}

/** Controle − valor + (alvos de toque de 40 px) */
export function Stepper({
  value,
  onChange,
  min,
  max,
  canIncrease = true,
  format,
  label,
  style,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  canIncrease?: boolean;
  format?: (v: number) => string;
  label: string;
  style?: ViewStyle;
}) {
  const dec = value > min;
  const inc = value < max && canIncrease;
  return (
    <View style={[ui.stepper, style]}>
      <TouchableOpacity
        onPress={() => dec && onChange(value - 1)}
        disabled={!dec}
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${label}`}
        style={[ui.stepBtn, !dec && { opacity: 0.3 }]}
      >
        <Text style={ui.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={ui.stepValue} accessibilityLabel={`${label}: ${value}`}>
        {format ? format(value) : value}
      </Text>
      <TouchableOpacity
        onPress={() => inc && onChange(value + 1)}
        disabled={!inc}
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${label}`}
        style={[ui.stepBtn, !inc && { opacity: 0.3 }]}
      >
        <Text style={ui.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function InfoBox({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'warn' | 'error' }) {
  const color = tone === 'error' ? '#E26A6A' : tone === 'warn' ? '#D9A441' : Colors.fantasy.goldDark;
  return (
    <View style={[ui.info, { borderColor: color, backgroundColor: `${color}1A` }]}>
      {typeof children === 'string' ? <Text style={ui.infoText}>{children}</Text> : children}
    </View>
  );
}

export const ui = StyleSheet.create({
  label: { color: Colors.fantasy.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  hint: { color: Colors.fantasy.textMuted, fontSize: 12, lineHeight: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    backgroundColor: Colors.fantasy.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: Colors.fantasy.text, fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    color: Colors.fantasy.text,
    backgroundColor: Colors.fantasy.background,
    fontSize: 15,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    backgroundColor: Colors.fantasy.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: Colors.fantasy.goldBright, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepValue: { minWidth: 34, textAlign: 'center', color: Colors.fantasy.text, fontSize: 17, fontWeight: '800' },
  info: { borderWidth: 1, borderRadius: Radius.md, padding: 10 },
  infoText: { color: Colors.fantasy.text, fontSize: 13, lineHeight: 18 },
  section: { gap: 10 },
  card: {
    backgroundColor: Colors.fantasy.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
    borderRadius: Radius.lg,
    padding: 12,
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
