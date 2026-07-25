import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { X, Sword, Heart, Shield, Award, AlertTriangle, CheckCircle2, Zap, Crown } from 'lucide-react-native';

interface InterventionModalProps {
  visible: boolean;
  onClose: () => void;
  character: CharacterData | null;
  onApplyAction: (
    action: {
      type: 'DAMAGE' | 'HEAL' | 'TEMP_HP' | 'ADD_CONDITION' | 'REMOVE_CONDITION' | 'INSPIRATION';
      value?: number;
      conditionName?: string;
      conditionDesc?: string;
    }
  ) => void;
}

const COMMON_CONDITIONS = [
  { name: 'Abençoado', desc: '+1d4 nas jogadas de ataque e testes de resistência.' },
  { name: 'Amedrontado', desc: 'Desvantagem em testes de habilidade e jogadas de ataque.' },
  { name: 'Caído', desc: 'Ataques contra o alvo a até 1,5m têm vantagem.' },
  { name: 'Cegado', desc: 'Falha automática em testes de visão. Ataques têm desvantagem.' },
  { name: 'Envenenado', desc: 'Desvantagem nas jogadas de ataque e testes de habilidade.' },
  { name: 'Inconsciente', desc: 'Incapacitado, derruba o que segura e falha em FOR/DES.' },
  { name: 'Invisível', desc: 'Vantagem nas jogadas de ataque. Inimigos têm desvantagem.' },
  { name: 'Paralisado', desc: 'Incapacitado. Ataques a 1,5m são acertos críticos automáticos.' },
];

export default function InterventionModal({ visible, onClose, character, onApplyAction }: InterventionModalProps) {
  const [customVal, setCustomVal] = useState('');

  if (!character) return null;

  const handleCustomAction = (type: 'DAMAGE' | 'HEAL' | 'TEMP_HP') => {
    const val = parseInt(customVal, 10);
    if (!val || val <= 0) return;
    onApplyAction({ type, value: val });
    setCustomVal('');
  };

  const hasCondition = (name: string) => character.conditions.some(c => c.name === name);

  const toggleCondition = (cond: { name: string; desc: string }) => {
    if (hasCondition(cond.name)) {
      onApplyAction({ type: 'REMOVE_CONDITION', conditionName: cond.name });
    } else {
      onApplyAction({ type: 'ADD_CONDITION', conditionName: cond.name, conditionDesc: cond.desc });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Crown color="#C5A059" size={16} />
                <Text style={styles.tag}>ESCUDO DE INTERVENÇÃO DIVINA (DM)</Text>
              </View>
              <Text style={styles.title}>{character.name} ({character.class})</Text>
              <Text style={styles.subtitle}>Jogador: {character.playerName} • Nível {character.level}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#BAAFA0" size={20} />
            </TouchableOpacity>
          </View>

          {/* Vital Status Bar */}
          <View style={styles.vitalBar}>
            <View style={styles.vitalItem}>
              <Heart color="#B82828" size={18} />
              <Text style={styles.vitalLabel}>HP ATUAL</Text>
              <Text style={[styles.vitalVal, { color: '#B82828' }]}>
                {character.currentHp} / {character.maxHp}
              </Text>
            </View>

            <View style={styles.vitalItem}>
              <Shield color="#C5A059" size={18} />
              <Text style={styles.vitalLabel}>TEMP HP</Text>
              <Text style={[styles.vitalVal, { color: '#C5A059' }]}>+{character.tempHp}</Text>
            </View>

            <View style={styles.vitalItem}>
              <Text style={styles.vitalLabel}>CLASSE ARMADURA</Text>
              <Text style={[styles.vitalVal, { color: '#8C6C90' }]}>{character.armorClass} CA</Text>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* SEÇÃO 1: Controle Rápido de HP (Dano e Cura) */}
            <Text style={styles.sectionTitle}>⚡ Modificar Sinais Vitais em Tempo Real</Text>
            
            <View style={styles.actionSection}>
              <Text style={styles.subLabel}>Aplicar Dano (Abate Temp HP primeiro):</Text>
              <View style={styles.btnGrid}>
                {[1, 5, 10, 15, 20].map(val => (
                  <TouchableOpacity
                    key={`dmg-${val}`}
                    style={[styles.actionBtn, styles.dmgBtn]}
                    onPress={() => onApplyAction({ type: 'DAMAGE', value: val })}
                  >
                    <Sword color="#B82828" size={14} />
                    <Text style={styles.dmgBtnText}>-{val} Dano</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subLabel, { marginTop: 16 }]}>Conceder Cura Divina:</Text>
              <View style={styles.btnGrid}>
                {[1, 5, 10, 15, 20].map(val => (
                  <TouchableOpacity
                    key={`heal-${val}`}
                    style={[styles.actionBtn, styles.healBtn]}
                    onPress={() => onApplyAction({ type: 'HEAL', value: val })}
                  >
                    <Heart color="#38783C" size={14} />
                    <Text style={styles.healBtnText}>+{val} Cura</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subLabel, { marginTop: 16 }]}>Conceder HP Temporário:</Text>
              <View style={styles.btnGrid}>
                {[5, 10, 15, 25].map(val => (
                  <TouchableOpacity
                    key={`temp-${val}`}
                    style={[styles.actionBtn, styles.tempBtn]}
                    onPress={() => onApplyAction({ type: 'TEMP_HP', value: val })}
                  >
                    <Shield color="#C5A059" size={14} />
                    <Text style={styles.tempBtnText}>+{val} Temp HP</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input customizado para qualquer valor */}
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  value={customVal}
                  onChangeText={setCustomVal}
                  placeholder="Valor personalizado"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.customBtn, styles.dmgBtn]}
                  onPress={() => handleCustomAction('DAMAGE')}
                >
                  <Text style={styles.dmgBtnText}>Ferir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customBtn, styles.healBtn]}
                  onPress={() => handleCustomAction('HEAL')}
                >
                  <Text style={styles.healBtnText}>Curar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customBtn, styles.tempBtn]}
                  onPress={() => handleCustomAction('TEMP_HP')}
                >
                  <Text style={styles.tempBtnText}>Temp HP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SEÇÃO 2: Gerenciar Condições de Combate */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🔮 Maldições & Condições de Combate (D&D 5e)</Text>
            <Text style={styles.sectionDesc}>
              Toque no estado para aplicar ou purificar o aventureiro em tempo real.
            </Text>

            <View style={styles.conditionsGrid}>
              {COMMON_CONDITIONS.map(cond => {
                const active = hasCondition(cond.name);
                return (
                  <TouchableOpacity
                    key={cond.name}
                    style={[styles.conditionCard, active && styles.conditionCardActive]}
                    onPress={() => toggleCondition(cond)}
                  >
                    <View style={styles.conditionHeader}>
                      <Text style={[styles.conditionName, active && styles.conditionNameActive]}>
                        {active ? '⚔️ ' : '⚫ '} {cond.name}
                      </Text>
                      {active && <CheckCircle2 color="#38783C" size={16} />}
                    </View>
                    <Text style={styles.conditionDescText}>{cond.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Selar Intervenção</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 15, 13, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    width: '100%',
    maxWidth: 750,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#110F0D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  tag: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  subtitle: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#24201C',
    borderRadius: 6,
  },
  vitalBar: {
    flexDirection: 'row',
    backgroundColor: '#110F0D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  vitalVal: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  body: {
    maxHeight: Platform.OS === 'web' ? 550 : 420,
  },
  bodyContent: {
    padding: 24,
  },
  sectionTitle: {
    color: '#C5A059',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  sectionDesc: {
    color: '#BAAFA0',
    fontSize: 12,
    marginBottom: 16,
  },
  actionSection: {
    backgroundColor: '#110F0D',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  subLabel: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  btnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  dmgBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: 'rgba(184, 40, 40, 0.5)',
  },
  dmgBtnText: {
    color: '#B82828',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.15)',
    borderColor: 'rgba(56, 120, 60, 0.5)',
  },
  healBtnText: {
    color: '#38783C',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tempBtn: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: 'rgba(197, 160, 89, 0.5)',
  },
  tempBtnText: {
    color: '#E6C280',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  customBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionCard: {
    width: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 260,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 14,
  },
  conditionCardActive: {
    backgroundColor: 'rgba(56, 120, 60, 0.15)',
    borderColor: '#38783C',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conditionName: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionNameActive: {
    color: '#38783C',
    fontWeight: '700',
  },
  conditionDescText: {
    color: '#80776C',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: '#110F0D',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
  },
  doneBtn: {
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 6,
  },
  doneBtnText: {
    color: '#110F0D',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
