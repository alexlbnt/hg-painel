import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { Heart, Moon, Shield, Skull, Sparkles, Sun, X } from 'lucide-react-native';

interface VitalsCombatPanelProps {
  char: CharacterData;
  themeColor?: string;
  isMobile?: boolean;
  concentratingSpell: string | null;
  onClearConcentration: () => void;
  onApplyHpDelta: (delta: number) => void;
  onTriggerShortRest: () => void;
  onTriggerLongRest: () => void;
  onToggleDeathSave: (type: 'success' | 'fail', index: number) => void;
}

export const VitalsCombatPanel: React.FC<VitalsCombatPanelProps> = ({
  char,
  themeColor = '#C5A059',
  isMobile = false,
  concentratingSpell,
  onClearConcentration,
  onApplyHpDelta,
  onTriggerShortRest,
  onTriggerLongRest,
  onToggleDeathSave,
}) => {
  const [customHp, setCustomHp] = useState('');

  const hpPercent = Math.min(
    100,
    Math.max(0, (char.currentHp / (char.maxHp || 1)) * 100)
  );

  const hpColor =
    char.currentHp / (char.maxHp || 1) > 0.5
      ? '#38783C'
      : char.currentHp / (char.maxHp || 1) > 0.25
      ? '#C5A059'
      : '#B82828';

  const handleAction = (isDamage: boolean) => {
    const val = parseInt(customHp, 10);
    if (isNaN(val) || val <= 0) return;
    onApplyHpDelta(isDamage ? -val : val);
    setCustomHp('');
  };

  return (
    <View style={[styles.container, isMobile && { gap: 10 }]}>
      {/* 🔮 BANNER DE CONCENTRAÇÃO ATIVA (D&D 5e) */}
      {concentratingSpell && (
        <View style={styles.concentrationBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Sparkles size={14} color="#D8B4FE" />
            <Text style={styles.concentrationLabel}>
              CONCENTRANDO:{' '}
              <Text style={{ color: '#F3E8FF', fontWeight: 'bold' }}>
                {concentratingSpell}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.clearConcentrationBtn}
            onPress={onClearConcentration}
            activeOpacity={0.7}
          >
            <X size={12} color="#D8B4FE" />
            <Text style={styles.clearConcentrationText}>Encerrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 💖 CABEÇALHO DE PONTOS DE VIDA */}
      <View style={styles.hpHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Heart color="#B82828" size={18} />
          <Text style={styles.hpTitle}>PONTOS DE VIDA</Text>
          {char.tempHp > 0 && (
            <View style={styles.tempHpBadge}>
              <Shield color="#C5A059" size={11} />
              <Text style={styles.tempHpText}>+{char.tempHp} TEMP</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={[styles.hpCurrent, isMobile && { fontSize: 24 }]}>
            {char.currentHp}
          </Text>
          <Text style={[styles.hpMax, isMobile && { fontSize: 14 }]}>
            / {char.maxHp}
          </Text>
        </View>
      </View>

      {/* BARRA DE VIDA */}
      <View style={styles.hpBarTrack}>
        <View
          style={[
            styles.hpBarFill,
            {
              width: `${hpPercent}%`,
              backgroundColor: hpColor,
            },
          ]}
        />
      </View>

      {/* DADOS DE VIDA & DESCANSOS */}
      <View style={[styles.restRow, isMobile && { flexDirection: 'column', gap: 8 }]}>
        <View style={styles.hitDiceBox}>
          <Text style={styles.hitDiceLabel}>Dados de Vida Restantes:</Text>
          <Text style={[styles.hitDiceVal, { color: themeColor }]}>
            {char.hitDiceTotal - char.hitDiceSpent} / {char.hitDiceTotal}{' '}
            <Text style={{ color: '#80776C', fontSize: 11 }}>({char.hitDiceType})</Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.restBtn, { borderColor: '#C5A059' }]}
            onPress={onTriggerShortRest}
            activeOpacity={0.7}
          >
            <Sun size={13} color="#C5A059" />
            <Text style={[styles.restBtnText, { color: '#C5A059' }]}>Descanso Curto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restBtn, { borderColor: '#6B4A70' }]}
            onPress={onTriggerLongRest}
            activeOpacity={0.7}
          >
            <Moon size={13} color="#D8B4FE" />
            <Text style={[styles.restBtnText, { color: '#D8B4FE' }]}>Descanso Longo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TESTES CONTRA A MORTE (QUANDO HP <= 0) */}
      {char.currentHp <= 0 && (
        <View style={styles.deathSavesContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <Skull size={15} color="#B82828" />
            <Text style={styles.deathSavesTitle}>TESTES CONTRA A MORTE</Text>
          </View>

          <View style={styles.deathSavesRow}>
            {/* Sucessos */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#78C288', fontSize: 11, fontWeight: '700' }}>Sucessos</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <TouchableOpacity
                    key={`succ-${i}`}
                    onPress={() => onToggleDeathSave('success', i)}
                    style={[
                      styles.deathDot,
                      { borderColor: '#78C288' },
                      char.deathSaveSuccesses > i && { backgroundColor: '#78C288' },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Falhas */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#B82828', fontSize: 11, fontWeight: '700' }}>Falhas</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <TouchableOpacity
                    key={`fail-${i}`}
                    onPress={() => onToggleDeathSave('fail', i)}
                    style={[
                      styles.deathDot,
                      { borderColor: '#B82828' },
                      char.deathSaveFailures > i && { backgroundColor: '#B82828' },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* INPUT CUSTOMIZADO DE DANO / CURA */}
      <View style={styles.customHpRow}>
        <TextInput
          style={styles.customHpInput}
          value={customHp}
          onChangeText={setCustomHp}
          placeholder="Valor de dano ou cura"
          placeholderTextColor="#6B6257"
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.hpActionBtn, styles.dmgBtn]}
          onPress={() => handleAction(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dmgBtnText}>- Dano</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hpActionBtn, styles.healBtn]}
          onPress={() => handleAction(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.healBtnText}>+ Cura</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 10,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  concentrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(147, 51, 234, 0.18)',
    borderWidth: 1,
    borderColor: '#9333EA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  concentrationLabel: {
    color: '#D8B4FE',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clearConcentrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    borderWidth: 1,
    borderColor: '#C084FC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearConcentrationText: {
    color: '#F3E8FF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  hpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hpTitle: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tempHpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tempHpText: {
    color: '#E6C280',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  hpCurrent: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  hpMax: {
    color: '#80776C',
    fontSize: 16,
    fontWeight: '600',
  },
  hpBarTrack: {
    height: 10,
    backgroundColor: '#26201B',
    borderRadius: 5,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  restRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  hitDiceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  hitDiceLabel: {
    color: '#80776C',
    fontSize: 11,
  },
  hitDiceVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  restBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    backgroundColor: '#1E1A16',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  restBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deathSavesContainer: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#B82828',
    borderRadius: 8,
    padding: 10,
  },
  deathSavesTitle: {
    color: '#E2D8C3',
    fontSize: 11.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deathSavesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deathDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  customHpRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customHpInput: {
    flex: 1,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  hpActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmgBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.25)',
    borderWidth: 1,
    borderColor: '#B82828',
  },
  dmgBtnText: {
    color: '#E57373',
    fontSize: 12,
    fontWeight: 'bold',
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.25)',
    borderWidth: 1,
    borderColor: '#38783C',
  },
  healBtnText: {
    color: '#78C288',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
