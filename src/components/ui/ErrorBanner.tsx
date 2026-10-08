import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

/** Aviso discreto de falha (ex.: servidor indisponível, dados podem estar desatualizados). */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <AlertTriangle color={Colors.fantasy.goldBright} size={16} />
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          style={styles.btn}
        >
          <Text style={styles.btnText}>Tentar de novo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.fantasy.redDark,
    backgroundColor: 'rgba(112, 20, 20, 0.25)',
  },
  text: { flex: 1, color: Colors.fantasy.text, fontSize: 13 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.fantasy.gold,
    minHeight: 32,
    justifyContent: 'center',
  },
  btnText: { color: Colors.fantasy.goldBright, fontSize: 12, fontWeight: '700' },
});
