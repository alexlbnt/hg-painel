import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { X, Sword, Heart, Shield, Skull, Sparkles, Users } from 'lucide-react-native';

interface WhispersModalProps {
  visible: boolean;
  onClose: () => void;
  characters: CharacterData[];
  onApplyMassAction: (
    action: {
      type: 'DAMAGE' | 'HEAL' | 'TEMP_HP' | 'ADD_CONDITION' | 'REMOVE_CONDITION';
      value?: number;
      conditionName?: string;
      conditionDesc?: string;
    }
  ) => void;
  onClearAllConditions: () => void;
}

const GLOBAL_CONDITIONS = [
  { name: 'Surpreso', desc: 'Não pode se mover ou realizar ações no seu primeiro turno do combate nem reagir.' },
  { name: 'Envenenado', desc: 'Desvantagem nas jogadas de ataque e testes de habilidade.' },
  { name: 'Abençoado', desc: '+1d4 nas jogadas de ataque e testes de resistência de todos.' },
  { name: 'Amedrontado', desc: 'Desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte for visível.' },
  { name: 'Caído', desc: 'Ataques contra o alvo a até 1,5m têm vantagem. Deve gastar metade do deslocamento para levantar.' },
  { name: 'Cegado', desc: 'Falha automática em testes de visão. Ataques têm desvantagem e ataques recebidos têm vantagem.' },
  { name: 'Inconsciente', desc: 'Incapacitado, derruba o que segura e falha automaticamente em testes de FOR e DES.' },
  { name: 'Invisível', desc: 'Vantagem nas jogadas de ataque. Inimigos têm desvantagem para acertar.' },
  { name: 'Paralisado', desc: 'Incapacitado. Ataques a 1,5m são acertos críticos automáticos.' },
];

export default function WhispersModal({ visible, onClose, characters, onApplyMassAction, onClearAllConditions }: WhispersModalProps) {
  const [customVal, setCustomVal] = useState('');

  if (!characters || characters.length === 0) return null;

  const handleCustomAction = (type: 'DAMAGE' | 'HEAL' | 'TEMP_HP') => {
    const val = parseInt(customVal, 10);
    if (!val || val <= 0) return;
    onApplyMassAction({ type, value: val });
    setCustomVal('');
  };

  const getConditionCount = (name: string) => {
    return characters.filter(c => c.conditions && c.conditions.some(cond => cond.name === name)).length;
  };

  const handleConditionClick = (cond: { name: string; desc: string }) => {
    const count = getConditionCount(cond.name);
    if (count === characters.length) {
      onApplyMassAction({ type: 'REMOVE_CONDITION', conditionName: cond.name });
    } else {
      onApplyMassAction({ type: 'ADD_CONDITION', conditionName: cond.name, conditionDesc: cond.desc });
    }
  };

  const totalHp = characters.reduce((acc, c) => acc + c.currentHp, 0);
  const totalMaxHp = characters.reduce((acc, c) => acc + c.maxHp, 0);
  const fallenCount = characters.filter(c => c.currentHp === 0).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Skull color="#B82828" size={16} />
                <Text style={styles.tag}>SUSSURROS DO MESTRE (INTERVENÇÃO EM MASSA)</Text>
              </View>
              <Text style={styles.title}>Sussurros Sombrios & Divinos</Text>
              <Text style={styles.subtitle}>
                Apareça como um sussurro nas mentes de todos os {characters.length} heróis da campanha e altere o destino da mesa simultaneamente.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#BAAFA0" size={20} />
            </TouchableOpacity>
          </View>

          {/* Vital Status Bar da Mesa */}
          <View style={styles.vitalBar}>
            <View style={styles.vitalItem}>
              <Users color="#C5A059" size={18} />
              <Text style={styles.vitalLabel}>PERSONAGENS CONECTADOS</Text>
              <Text style={[styles.vitalVal, { color: '#E2D8C3' }]}>{characters.length}</Text>
            </View>

            <View style={styles.vitalItem}>
              <Heart color="#B82828" size={18} />
              <Text style={styles.vitalLabel}>HP TOTAL DA MESA</Text>
              <Text style={[styles.vitalVal, { color: '#B82828' }]}>
                {totalHp} / {totalMaxHp}
              </Text>
            </View>

            <View style={styles.vitalItem}>
              <Skull color={fallenCount > 0 ? '#FF4545' : '#80776C'} size={18} />
              <Text style={styles.vitalLabel}>PERSONAGENS CAÍDOS (0 HP)</Text>
              <Text style={[styles.vitalVal, { color: fallenCount > 0 ? '#FF4545' : '#80776C' }]}>
                {fallenCount} {fallenCount === 1 ? 'caído' : 'caídos'}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* SEÇÃO 1: Controle Rápido de HP em Massa */}
            <Text style={styles.sectionTitle}>⚡ Modificar Vida de Todos em Tempo Real</Text>
            <Text style={styles.sectionDesc}>
              Aplica dano, cura ou pontos de vida temporários simultaneamente em todas as fichas ativas.
            </Text>
            
            <View style={styles.actionSection}>
              <Text style={styles.subLabel}>Dano em Massa (Surto Sombrio / Praga):</Text>
              <View style={styles.btnGrid}>
                {[5, 10, 15, 20, 30].map(val => (
                  <TouchableOpacity
                    key={`dmg-${val}`}
                    style={[styles.actionBtn, styles.dmgBtn]}
                    onPress={() => onApplyMassAction({ type: 'DAMAGE', value: val })}
                  >
                    <Sword color="#B82828" size={14} />
                    <Text style={styles.dmgBtnText}>-{val} Dano Todos</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subLabel, { marginTop: 16 }]}>Cura Divina em Massa:</Text>
              <View style={styles.btnGrid}>
                {[5, 10, 15, 20, 30].map(val => (
                  <TouchableOpacity
                    key={`heal-${val}`}
                    style={[styles.actionBtn, styles.healBtn]}
                    onPress={() => onApplyMassAction({ type: 'HEAL', value: val })}
                  >
                    <Heart color="#38783C" size={14} />
                    <Text style={styles.healBtnText}>+{val} Cura Todos</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subLabel, { marginTop: 16 }]}>HP Temporário em Massa:</Text>
              <View style={styles.btnGrid}>
                {[5, 10, 15, 25, 50].map(val => (
                  <TouchableOpacity
                    key={`temp-${val}`}
                    style={[styles.actionBtn, styles.tempBtn]}
                    onPress={() => onApplyMassAction({ type: 'TEMP_HP', value: val })}
                  >
                    <Shield color="#C5A059" size={14} />
                    <Text style={styles.tempBtnText}>+{val} Temp HP</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input customizado para valor manual em massa */}
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  value={customVal}
                  onChangeText={setCustomVal}
                  placeholder="Valor manual (ex: 12)"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.customBtn, styles.dmgBtn]}
                  onPress={() => handleCustomAction('DAMAGE')}
                >
                  <Text style={styles.dmgBtnText}>- Ferir Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customBtn, styles.healBtn]}
                  onPress={() => handleCustomAction('HEAL')}
                >
                  <Text style={styles.healBtnText}>+ Curar Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customBtn, styles.tempBtn]}
                  onPress={() => handleCustomAction('TEMP_HP')}
                >
                  <Text style={styles.tempBtnText}>+ Temp HP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SEÇÃO 2: Gerenciar Condições Globais na Mesa */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
              <View>
                <Text style={styles.sectionTitle}>🔮 Condições Globais na Campanha (1 Clique)</Text>
                <Text style={styles.sectionDesc}>
                  Toque para propagar condições globais (ex: Surpreso, Envenenado) para todos os heróis da mesa.
                </Text>
              </View>
              <TouchableOpacity style={styles.clearAllBtn} onPress={onClearAllConditions}>
                <Sparkles color="#E6C280" size={14} />
                <Text style={styles.clearAllBtnText}>Purificar Toda a Mesa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.conditionsGrid}>
              {GLOBAL_CONDITIONS.map(cond => {
                const count = getConditionCount(cond.name);
                const allActive = count === characters.length;
                const someActive = count > 0;

                return (
                  <TouchableOpacity
                    key={cond.name}
                    style={[styles.conditionCard, someActive && styles.conditionCardActive, allActive && styles.conditionCardAllActive]}
                    onPress={() => handleConditionClick(cond)}
                  >
                    <View style={styles.conditionHeader}>
                      <Text style={[styles.conditionName, someActive && styles.conditionNameActive]}>
                        {allActive ? '⚡ ' : someActive ? '⚠️ ' : '⚫ '} {cond.name}
                      </Text>
                      <View style={[styles.countBadge, someActive && styles.countBadgeActive]}>
                        <Text style={[styles.countText, someActive && styles.countTextActive]}>
                          {count}/{characters.length}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.conditionDescText}>{cond.desc}</Text>
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.actionHintText, someActive && { color: '#FF4545' }]}>
                        {allActive ? '✓ Todos afetados (Toque para remover)' : someActive ? '⚠️ Alguns afetados (Toque para aplicar a todos)' : '+ Toque para aplicar em todos'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Concluir Sussurros</Text>
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
    maxWidth: 780,
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
    color: '#B82828',
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
    marginTop: 4,
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
    flexWrap: 'wrap',
    gap: 8,
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
    maxHeight: Platform.OS === 'web' ? 560 : 420,
  },
  bodyContent: {
    padding: 24,
  },
  sectionTitle: {
    color: '#C5A059',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  sectionDesc: {
    color: '#80776C',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  actionSection: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 16,
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
    fontSize: 12,
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.15)',
    borderColor: 'rgba(56, 120, 60, 0.5)',
  },
  healBtnText: {
    color: '#38783C',
    fontWeight: '700',
    fontSize: 12,
  },
  tempBtn: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: 'rgba(197, 160, 89, 0.5)',
  },
  tempBtnText: {
    color: '#C5A059',
    fontWeight: '700',
    fontSize: 12,
  },
  customRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#24201C',
  },
  customInput: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 160,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  customBtn: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#8C704F',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearAllBtnText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '700',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  conditionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 260,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 14,
  },
  conditionCardActive: {
    borderColor: 'rgba(197, 160, 89, 0.5)',
    backgroundColor: 'rgba(197, 160, 89, 0.05)',
  },
  conditionCardAllActive: {
    borderColor: '#8C704F',
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conditionName: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionNameActive: {
    color: '#E6C280',
  },
  countBadge: {
    backgroundColor: '#24201C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  countBadgeActive: {
    backgroundColor: '#38783C',
    borderColor: '#4A9C4E',
  },
  countText: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
  },
  countTextActive: {
    color: '#E2D8C3',
  },
  conditionDescText: {
    color: '#80776C',
    fontSize: 11,
    lineHeight: 16,
  },
  actionHintText: {
    color: '#60584C',
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    backgroundColor: '#110F0D',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  doneBtnText: {
    color: '#110F0D',
    fontWeight: '700',
    fontSize: 13,
  },
});
