import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface AnimatedBarProps {
  /** Valor atual e máximo; a barra anima ao mudar */
  value: number;
  max: number;
  color: string;
  height?: number;
  /** Segunda camada (ex.: PV temporários) desenhada por cima, em outra cor */
  overlayValue?: number;
  overlayColor?: string;
  /** Pisca em vermelho quando o valor diminui (feedback de dano) */
  flashOnDecrease?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/** Barra de progresso animada (Animated nativo do RN, sem dependências extras). */
export function AnimatedBar({
  value,
  max,
  color,
  height = 10,
  overlayValue = 0,
  overlayColor = '#6B8EC9',
  flashOnDecrease = false,
  style,
  accessibilityLabel,
}: AnimatedBarProps) {
  const ratio = Math.min(1, Math.max(0, value / (max || 1)));
  const overlayRatio = Math.min(1, Math.max(0, overlayValue / (max || 1)));
  const width = useRef(new Animated.Value(ratio)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const prev = useRef(value);

  useEffect(() => {
    Animated.timing(width, {
      toValue: ratio,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (flashOnDecrease && value < prev.current) {
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: false }).start();
    }
    prev.current = value;
  }, [value, max, ratio, flashOnDecrease, width, flash]);

  const widthPct = width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: Math.max(0, Math.min(max, value)) }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <Animated.View style={[styles.fill, { width: widthPct, backgroundColor: color, borderRadius: height / 2 }]} />
      {overlayRatio > 0 && (
        <View
          style={[
            styles.overlay,
            { width: `${overlayRatio * 100}%`, backgroundColor: overlayColor, borderRadius: height / 2 },
          ]}
        />
      )}
      {flashOnDecrease && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B3B', opacity: flashOpacity }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#26201B',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.fantasy.border,
  },
  fill: { height: '100%' },
  overlay: { position: 'absolute', left: 0, bottom: 0, height: 3, opacity: 0.9 },
});
