import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

/** Bloco pulsante usado como "esqueleto" enquanto o conteúdo carrega. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: '#3A3128', opacity }, style]}
    />
  );
}

/** Esqueleto de uma ficha de personagem (cabeçalho + painel vital + atributos). */
export function CharacterSheetSkeleton() {
  return (
    <View style={styles.sheet}>
      <View style={styles.row}>
        <Skeleton width={64} height={64} radius={32} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
      <Skeleton height={90} radius={12} />
      <View style={styles.row}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={60} height={64} radius={10} />
        ))}
      </View>
      <Skeleton height={160} radius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: 14, padding: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
});
