import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Heart, ShieldHalf, Skull } from 'lucide-react-native';
import { CharacterData } from '@/lib/mockData';
import { STANDARD_CONDITIONS } from '@/utils/dnd5e';
import { AnimatedBar } from '@/components/ui/AnimatedBar';
import { Colors, Radius, hpColorFor } from '@/constants/theme';

interface StickyStatusBarProps {
  char: CharacterData;
  /** CA já somada com armaduras/escudos equipados */
  totalAc: number;
  concentratingSpell: string | null;
  themeColor?: string;
  /** Faixa visível (o painel de vida saiu da tela) */
  visible: boolean;
  /** Rola a ficha de volta ao topo (onde ficam os controles de vida) */
  onScrollToTop?: () => void;
}

/**
 * Faixa fina fixa no topo (celular) com PV, CA e condições, que acompanha a rolagem.
 * Tocar nela expande a lista de condições e a concentração ativa.
 */
export function StickyStatusBar({
  char,
  totalAc,
  concentratingSpell,
  themeColor = '#C5A059',
  visible,
  onScrollToTop,
}: StickyStatusBarProps) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
    if (!visible) setExpanded(false);
  }, [visible, anim]);

  const conditions = char.conditions || [];
  const hpRatio = char.currentHp / (char.maxHp || 1);
  const isDown = char.currentHp <= 0;
  const hpColor = hpColorFor(hpRatio);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  const summary = isDown
    ? 'Caído'
    : conditions.length > 0
      ? `${conditions.length} ${conditions.length === 1 ? 'condição' : 'condições'}`
      : null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.wrap, { opacity: anim, transform: [{ translateY }], borderBottomColor: themeColor }]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Status de ${char.name}: ${char.currentHp} de ${char.maxHp} pontos de vida, CA ${totalAc}${
          summary ? `, ${summary}` : ''
        }. Toque para ${expanded ? 'recolher' : 'ver condições'}`}
        style={styles.touch}
      >
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: themeColor }]} numberOfLines={1}>
            {char.name}
          </Text>

          <View style={styles.right}>
            <View style={styles.ac}>
              <ShieldHalf size={14} color={Colors.fantasy.goldBright} />
              <Text style={styles.acText}>{totalAc}</Text>
            </View>
            {summary && (
              <View style={[styles.chip, isDown && styles.chipDown]}>
                {isDown && <Skull size={11} color="#FF8A8A" />}
                <Text style={[styles.chipText, isDown && { color: '#FF8A8A' }]}>{summary}</Text>
              </View>
            )}
            {expanded ? (
              <ChevronUp size={16} color={Colors.fantasy.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.fantasy.textMuted} />
            )}
          </View>
        </View>

        <View style={styles.rowHp}>
          <Heart size={14} color="#B82828" />
          <View style={{ flex: 1 }}>
            <AnimatedBar
              value={char.currentHp}
              max={char.maxHp || 1}
              color={hpColor}
              height={8}
              overlayValue={char.tempHp}
              flashOnDecrease
            />
          </View>
          <Text style={styles.hpText}>
            {char.currentHp}/{char.maxHp}
            {char.tempHp > 0 ? <Text style={styles.temp}> +{char.tempHp}</Text> : null}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.panel}>
          {isDown && (
            <Text style={styles.death}>
              Testes contra a morte: {char.deathSaveSuccesses}/3 sucessos · {char.deathSaveFailures}/3 falhas
            </Text>
          )}

          <Text style={styles.sectionLabel}>CONDIÇÕES</Text>
          {conditions.length === 0 ? (
            <Text style={styles.empty}>Nenhuma condição ativa.</Text>
          ) : (
            <View style={styles.chips}>
              {conditions.map((c) => {
                const def = STANDARD_CONDITIONS[c.name];
                const color = def?.color || themeColor;
                return (
                  <View key={c.id || c.name} style={[styles.condChip, { borderColor: color, backgroundColor: def?.badgeBg }]}>
                    <Text style={[styles.condText, { color }]}>{c.name}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {concentratingSpell && (
            <View style={styles.concentration}>
              <Text style={styles.concentrationText} numberOfLines={1}>
                Concentração: {concentratingSpell}
              </Text>
            </View>
          )}

          {onScrollToTop && (
            <TouchableOpacity
              onPress={() => {
                setExpanded(false);
                onScrollToTop();
              }}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao topo da ficha"
              style={styles.topBtn}
            >
              <Text style={styles.topBtnText}>Ir para os controles de vida</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(20, 17, 15, 0.97)',
    borderBottomWidth: 1,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.45)' } as any)
      : { elevation: 12 }),
  },
  touch: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, minHeight: 56, justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 14, fontWeight: '800' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ac: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  acText: { color: Colors.fantasy.goldBright, fontSize: 14, fontWeight: '800' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.fantasy.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipDown: { borderColor: '#B82828', backgroundColor: 'rgba(184, 40, 40, 0.18)' },
  chipText: { color: '#D8B4FE', fontSize: 11, fontWeight: '700' },
  rowHp: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hpText: { color: Colors.fantasy.text, fontSize: 13, fontWeight: '800', minWidth: 56, textAlign: 'right' },
  temp: { color: '#8FB0E6', fontSize: 11 },
  panel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.fantasy.border,
  },
  death: { color: '#FF8A8A', fontSize: 12, fontWeight: '700' },
  sectionLabel: { color: Colors.fantasy.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  empty: { color: Colors.fantasy.textSecondary, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  condChip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  condText: { fontSize: 12, fontWeight: '700' },
  concentration: {
    borderWidth: 1,
    borderColor: Colors.fantasy.accent,
    backgroundColor: 'rgba(107, 74, 112, 0.2)',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  concentrationText: { color: '#D8B4FE', fontSize: 12, fontWeight: '700' },
  topBtn: {
    minHeight: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.fantasy.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnText: { color: Colors.fantasy.gold, fontSize: 13, fontWeight: '700' },
});
