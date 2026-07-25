import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { ApiService } from '@/services/api';
import { CharacterData } from '@/lib/mockData';
import CharacterModal from '@/components/player/CharacterModal';
import { Shield, Plus, Edit, Trash2, Heart, Zap, Moon, Sun, Award, Skull, CheckCircle, Circle, Flame, Sparkles, Scroll, Sword } from 'lucide-react-native';

const SKILLS_LIST = [
  { name: 'Acrobacia', attr: 'dex', label: 'DES' },
  { name: 'Arcanismo', attr: 'int', label: 'INT' },
  { name: 'Atletismo', attr: 'str', label: 'FOR' },
  { name: 'Atuação', attr: 'cha', label: 'CAR' },
  { name: 'Enganação', attr: 'cha', label: 'CAR' },
  { name: 'Furtividade', attr: 'dex', label: 'DES' },
  { name: 'História', attr: 'int', label: 'INT' },
  { name: 'Intimidação', attr: 'cha', label: 'CAR' },
  { name: 'Intuição', attr: 'wis', label: 'SAB' },
  { name: 'Investigação', attr: 'int', label: 'INT' },
  { name: 'Lidar com Animais', attr: 'wis', label: 'SAB' },
  { name: 'Medicina', attr: 'wis', label: 'SAB' },
  { name: 'Natureza', attr: 'int', label: 'INT' },
  { name: 'Percepção', attr: 'wis', label: 'SAB' },
  { name: 'Persuasão', attr: 'cha', label: 'CAR' },
  { name: 'Prestidigitação', attr: 'dex', label: 'DES' },
  { name: 'Religião', attr: 'int', label: 'INT' },
  { name: 'Sobrevivência', attr: 'wis', label: 'SAB' },
];

export default function PlayerModule() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);
  const [activeTab, setActiveTab] = useState<'spells' | 'abilities' | 'skills'>('spells');
  const [customHp, setCustomHp] = useState('');

  const loadCharacters = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ApiService.getCharacters();
      setCharacters(data);
    } catch (e) {
      console.error('Erro ao carregar fichas medievais', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (characters.length > 0) {
      const exists = characters.some(c => c.id === selectedId);
      if (!selectedId || !exists) {
        setSelectedId(characters[0].id);
      }
    } else if (characters.length === 0 && selectedId !== null) {
      setSelectedId(null);
    }
  }, [characters, selectedId]);

  useEffect(() => {
    loadCharacters();
    const interval = setInterval(() => {
      loadCharacters(true);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const selectedChar = characters.find(c => c.id === selectedId) || null;

  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (score: number) => {
    const mod = getMod(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  const profBonus = selectedChar ? Math.floor((selectedChar.level - 1) / 4) + 2 : 2;
  const passivePerception = selectedChar
    ? 10 + getMod(selectedChar.wis) + (selectedChar.proficientSkills.includes('Percepção') ? profBonus : 0)
    : 10;

  const handleCreateOrUpdate = async (data: Partial<CharacterData>) => {
    try {
      if (editingChar) {
        await ApiService.updateCharacter(editingChar.id, data);
      } else {
        const newChar = await ApiService.createCharacter(data);
        setSelectedId(newChar.id);
      }
      loadCharacters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = () => {
      ApiService.deleteCharacter(id).then(() => {
        loadCharacters();
        if (selectedId === id) setSelectedId(null);
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja selar e excluir este grimório de personagem para sempre?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Excluir Grimório', 'Deseja excluir este personagem para sempre?', [
        { text: 'Manter', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const modifyHp = async (delta: number) => {
    if (!selectedChar) return;
    if (delta < 0) {
      await ApiService.dmIntervene(selectedChar.id, { type: 'DAMAGE', value: Math.abs(delta) });
    } else {
      await ApiService.dmIntervene(selectedChar.id, { type: 'HEAL', value: delta });
    }
    loadCharacters(true);
  };

  const handleCustomHpAction = async (isDamage: boolean) => {
    const val = parseInt(customHp, 10);
    if (!val || !selectedChar) return;
    await modifyHp(isDamage ? -val : val);
    setCustomHp('');
  };

  const triggerShortRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      const healAmt = 8 + getMod(selectedChar.con);
      await ApiService.takeShortRest(selectedChar.id, healAmt, 1);
      loadCharacters();
      if (Platform.OS === 'web') {
        window.alert(`Ritual de Descanso Curto concluído! 1 Dado de Vida gasto, recuperou ${healAmt} HP e restaurou habilidades marciais.`);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Realizar Ritual de Descanso Curto? (Gasta 1 Dado de Vida para curar e recarrega poderes marciais)')) {
        executeRest();
      }
    } else {
      Alert.alert('Descanso Curto', 'Gastar 1 Dado de Vida para curar e recarregar poderes?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descansar na Taverna', onPress: executeRest },
      ]);
    }
  };

  const triggerLongRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      await ApiService.takeLongRest(selectedChar.id);
      loadCharacters();
      if (Platform.OS === 'web') {
        window.alert('Ritual de Descanso Longo concluído! Sinais vitais e pergaminhos arcano 100% restaurados!');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Realizar Descanso Longo? (Restaura 100% dos pontos de vida, limpa maldições temporárias e recarrega todos os feitiços)')) {
        executeRest();
      }
    } else {
      Alert.alert('Descanso Longo', 'Restaura 100% do HP, todos os feitiços e poderes marciais.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dormir em Paz', onPress: executeRest },
      ]);
    }
  };

  const toggleSpellSlot = async (slotId: string, currentUsed: number, total: number) => {
    if (!selectedChar) return;
    const newUsed = currentUsed >= total ? 0 : currentUsed + 1;
    const updatedSlots = selectedChar.spellSlots.map(s => s.id === slotId ? { ...s, used: newUsed } : s);
    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    loadCharacters(true);
  };

  const useAbility = async (abId: string, currentUses: number) => {
    if (!selectedChar || currentUses <= 0) return;
    const updatedAbilities = selectedChar.abilities.map(a => a.id === abId ? { ...a, currentUses: currentUses - 1 } : a);
    await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
    loadCharacters(true);
  };

  const toggleDeathSave = async (type: 'success' | 'fail', index: number) => {
    if (!selectedChar) return;
    if (type === 'success') {
      const newSuccesses = selectedChar.deathSaveSuccesses === index + 1 ? index : index + 1;
      await ApiService.updateCharacter(selectedChar.id, { deathSaveSuccesses: newSuccesses });
    } else {
      const newFailures = selectedChar.deathSaveFailures === index + 1 ? index : index + 1;
      await ApiService.updateCharacter(selectedChar.id, { deathSaveFailures: newFailures });
    }
    loadCharacters(true);
  };

  return (
    <View style={styles.container}>
      {/* Seletor de Personagens (Carrossel de Couro e Bronze) */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {characters.map(char => {
            const isSelected = char.id === selectedId;
            return (
              <TouchableOpacity
                key={char.id}
                style={[styles.charChip, isSelected && styles.charChipSelected]}
                onPress={() => setSelectedId(char.id)}
              >
                <Shield color={isSelected ? '#C5A059' : '#80776C'} size={16} />
                <View>
                  <Text style={[styles.chipName, isSelected && styles.chipNameSelected]}>{char.name}</Text>
                  <Text style={styles.chipClass}>{char.class} • Nvl {char.level}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.newCharChip}
            onPress={() => { setEditingChar(null); setModalVisible(true); }}
          >
            <Plus color="#C5A059" size={18} />
            <Text style={styles.newCharText}>Criar Aventureiro</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Conteúdo Principal do Grimório do Aventureiro */}
      {selectedChar ? (
        <View style={styles.mainSheet}>
          {/* Header Medieval da Ficha */}
          <View style={styles.sheetHeader}>
            <View>
              <View style={styles.levelBadge}>
                <Scroll color="#C5A059" size={14} />
                <Text style={styles.levelText}>HERÓI NÍVEL {selectedChar.level} • {selectedChar.race.toUpperCase()}</Text>
              </View>
              <Text style={styles.charName}>{selectedChar.name}</Text>
              <Text style={styles.charMeta}>
                {selectedChar.class} • Jogador: <Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{selectedChar.playerName}</Text>
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { setEditingChar(selectedChar); setModalVisible(true); }}
              >
                <Edit color="#C5A059" size={16} />
                <Text style={styles.actionBtnText}>Reescrever Grimório</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(selectedChar.id)}
              >
                <Trash2 color="#B82828" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ribbon de Estatísticas (Ouro Envelhecido e Bronze) */}
          <View style={styles.statsRibbon}>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>PROFICIÊNCIA</Text>
              <Text style={[styles.ribbonVal, { color: '#C5A059' }]}>+{profBonus}</Text>
            </View>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>CLASSE ARMADURA</Text>
              <Text style={[styles.ribbonVal, { color: '#8C6C90' }]}>{selectedChar.armorClass}</Text>
            </View>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>INICIATIVA</Text>
              <Text style={styles.ribbonVal}>
                {selectedChar.initiativeBonus >= 0 ? `+${selectedChar.initiativeBonus}` : selectedChar.initiativeBonus}
              </Text>
            </View>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>PERCEPÇÃO PASSIVA</Text>
              <Text style={[styles.ribbonVal, { color: '#38783C' }]}>{passivePerception}</Text>
            </View>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>DESLOCAMENTO</Text>
              <Text style={styles.ribbonVal}>{selectedChar.speed}</Text>
            </View>
          </View>

          {/* Painel de Sinais Vitais (HP) e Combate Medieval */}
          <View style={styles.combatPanel}>
            <View style={styles.hpSection}>
              <View style={styles.hpHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Heart color="#B82828" size={24} />
                  <Text style={styles.hpTitle}>SINAIS VITAIS • PONTOS DE VIDA</Text>
                </View>
                {selectedChar.tempHp > 0 && (
                  <View style={styles.tempHpBadge}>
                    <Shield color="#C5A059" size={14} />
                    <Text style={styles.tempHpText}>+{selectedChar.tempHp} TEMP HP</Text>
                  </View>
                )}
              </View>

              {/* Barra de Vida Medieval */}
              <View style={styles.hpBarBg}>
                <View
                  style={[
                    styles.hpBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, (selectedChar.currentHp / selectedChar.maxHp) * 100))}%`,
                      backgroundColor:
                        selectedChar.currentHp / selectedChar.maxHp > 0.5
                          ? '#38783C'
                          : selectedChar.currentHp / selectedChar.maxHp > 0.25
                          ? '#C5A059'
                          : '#B82828',
                    },
                  ]}
                />
              </View>
              
              <View style={styles.hpNumbers}>
                <Text style={styles.hpCurrent}>
                  {selectedChar.currentHp} <Text style={styles.hpMax}>/ {selectedChar.maxHp}</Text>
                </Text>
                <Text style={styles.hitDiceText}>
                  Dados de Vida (Ritual): <Text style={{ color: '#C5A059' }}>{selectedChar.hitDiceTotal - selectedChar.hitDiceSpent}/{selectedChar.hitDiceTotal}</Text> ({selectedChar.hitDiceType})
                </Text>
              </View>

              {/* Controles Rápido de Sangramento e Poção */}
              <View style={styles.hpButtonsRow}>
                <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => modifyHp(-1)}>
                  <Text style={styles.dmgBtnText}>-1 Dano</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => modifyHp(-5)}>
                  <Text style={styles.dmgBtnText}>-5 Dano</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => modifyHp(-10)}>
                  <Text style={styles.dmgBtnText}>-10 Dano</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => modifyHp(1)}>
                  <Text style={styles.healBtnText}>+1 Cura</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => modifyHp(5)}>
                  <Text style={styles.healBtnText}>+5 Cura</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => modifyHp(10)}>
                  <Text style={styles.healBtnText}>+10 Cura</Text>
                </TouchableOpacity>
              </View>

              {/* Input Customizado de Dano / Poção */}
              <View style={styles.customHpRow}>
                <TextInput
                  style={styles.customHpInput}
                  value={customHp}
                  onChangeText={setCustomHp}
                  placeholder="Qtd Dano / Cura"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.customBtn, styles.dmgBtn]} onPress={() => handleCustomHpAction(true)}>
                  <Text style={styles.dmgBtnText}>Ferir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.customBtn, styles.healBtn]} onPress={() => handleCustomHpAction(false)}>
                  <Text style={styles.healBtnText}>Curar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Testes contra a Morte e Rituais de Descanso */}
            <View style={styles.deathAndRestSection}>
              {/* Testes contra a Morte */}
              <View style={styles.deathBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Skull color="#B82828" size={18} />
                  <Text style={styles.deathTitle}>RESISTÊNCIA CONTRA A MORTE</Text>
                </View>

                <View style={styles.deathRow}>
                  <Text style={[styles.deathLabel, { color: '#38783C' }]}>SUCESSOS:</Text>
                  {[0, 1, 2].map(idx => (
                    <TouchableOpacity key={`suc-${idx}`} onPress={() => toggleDeathSave('success', idx)}>
                      {selectedChar.deathSaveSuccesses > idx ? (
                        <CheckCircle color="#38783C" size={20} />
                      ) : (
                        <Circle color="#3D342C" size={20} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.deathRow}>
                  <Text style={[styles.deathLabel, { color: '#B82828' }]}>FALHAS:</Text>
                  {[0, 1, 2].map(idx => (
                    <TouchableOpacity key={`fail-${idx}`} onPress={() => toggleDeathSave('fail', idx)}>
                      {selectedChar.deathSaveFailures > idx ? (
                        <XCircleIcon color="#B82828" size={20} />
                      ) : (
                        <Circle color="#3D342C" size={20} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Botões de Ritual de Descanso */}
              <View style={styles.restBox}>
                <Text style={styles.restTitle}>RITUAIS DE DESCANSO</Text>
                <View style={styles.restButtonsRow}>
                  <TouchableOpacity style={styles.shortRestBtn} onPress={triggerShortRest}>
                    <Moon color="#6B4A70" size={18} />
                    <View>
                      <Text style={styles.restBtnTitle}>Descanso Curto</Text>
                      <Text style={styles.restBtnSub}>Curar & Hab. Marciais</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.longRestBtn} onPress={triggerLongRest}>
                    <Sun color="#C5A059" size={18} />
                    <View>
                      <Text style={styles.restBtnTitle}>Descanso Longo</Text>
                      <Text style={styles.restBtnSub}>Restaura Vida & Magias</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Grid de Atributos Ancestrais (FOR, DES, CON, INT, SAB, CAR) */}
          <Text style={styles.sectionHeader}>ATRIBUTOS ANCESTRAIS & TESTES DE RESISTÊNCIA</Text>
          <View style={styles.attributesGrid}>
            {[
              { name: 'FORÇA', score: selectedChar.str, prof: selectedChar.strProf },
              { name: 'DESTREZA', score: selectedChar.dex, prof: selectedChar.dexProf },
              { name: 'CONSTITUIÇÃO', score: selectedChar.con, prof: selectedChar.conProf },
              { name: 'INTELIGÊNCIA', score: selectedChar.int, prof: selectedChar.intProf },
              { name: 'SABEDORIA', score: selectedChar.wis, prof: selectedChar.wisProf },
              { name: 'CARISMA', score: selectedChar.cha, prof: selectedChar.chaProf },
            ].map((attr) => {
              const modVal = getMod(attr.score);
              const saveVal = modVal + (attr.prof ? profBonus : 0);
              return (
                <View key={attr.name} style={styles.attrCard}>
                  <Text style={styles.attrName}>{attr.name}</Text>
                  <Text style={styles.attrMod}>{formatMod(attr.score)}</Text>
                  <Text style={styles.attrScore}>Score: {attr.score}</Text>
                  <View style={styles.saveRow}>
                    <View style={[styles.saveDot, attr.prof && styles.saveDotProf]} />
                    <Text style={styles.saveText}>
                      Resistência: <Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{saveVal >= 0 ? `+${saveVal}` : saveVal}</Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Abas de Recursos (Pergaminhos, Poderes, Perícias) */}
          <View style={styles.tabsNav}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'spells' && styles.tabBtnActive]}
              onPress={() => setActiveTab('spells')}
            >
              <Scroll color={activeTab === 'spells' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'spells' && styles.tabBtnTextActive]}>
                Pergaminhos Arcane ({selectedChar.spellSlots.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'abilities' && styles.tabBtnActive]}
              onPress={() => setActiveTab('abilities')}
            >
              <Sword color={activeTab === 'abilities' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'abilities' && styles.tabBtnTextActive]}>
                Dons & Poderes ({selectedChar.abilities.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'skills' && styles.tabBtnActive]}
              onPress={() => setActiveTab('skills')}
            >
              <Award color={activeTab === 'skills' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'skills' && styles.tabBtnTextActive]}>
                Perícias Medievais (18)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo das Abas */}
          <View style={styles.tabContent}>
            {/* ABA: Pergaminhos de Magia */}
            {activeTab === 'spells' && (
              <View>
                {selectedChar.spellSlots.length === 0 ? (
                  <Text style={styles.emptyText}>Este herói não possui pergaminhos de magia no seu grimório.</Text>
                ) : (
                  <View style={styles.slotsGrid}>
                    {selectedChar.spellSlots.map(slot => (
                      <View key={slot.id} style={styles.slotCard}>
                        <View style={styles.slotHeader}>
                          <Text style={styles.slotLevel}>PERGAMINHO DE {slot.level}º NÍVEL</Text>
                          <Text style={styles.slotCount}>{slot.total - slot.used} / {slot.total} Intactos</Text>
                        </View>
                        <View style={styles.slotTokensRow}>
                          {Array.from({ length: slot.total }).map((_, idx) => {
                            const isUsed = idx < slot.used;
                            return (
                              <TouchableOpacity
                                key={`token-${slot.id}-${idx}`}
                                style={[styles.slotToken, isUsed && styles.slotTokenUsed]}
                                onPress={() => toggleSpellSlot(slot.id, slot.used, slot.total)}
                              >
                                <Scroll color={isUsed ? '#3D342C' : '#E6C280'} size={16} />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ABA: Habilidades e Poderes */}
            {activeTab === 'abilities' && (
              <View style={styles.abilitiesList}>
                {selectedChar.abilities.map(ab => (
                  <View key={ab.id} style={styles.abilityCard}>
                    <View style={styles.abilityHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.abilityName}>{ab.name}</Text>
                        <Text style={styles.abilityDesc}>{ab.description}</Text>
                      </View>
                      <View style={[styles.resetBadge, ab.resetType === 'LONG_REST' && styles.resetLongBadge]}>
                        <Text style={styles.resetBadgeText}>
                          {ab.resetType === 'SHORT_REST' ? '⚡ Ritual Curto' : ab.resetType === 'LONG_REST' ? '💤 Ritual Longo' : 'Poder Passivo'}
                        </Text>
                      </View>
                    </View>

                    {ab.maxUses < 90 && (
                      <View style={styles.abilityFooter}>
                        <Text style={styles.abilityUses}>
                          Usos Disponíveis: <Text style={{ color: '#E6C280', fontWeight: '700' }}>{ab.currentUses} / {ab.maxUses}</Text>
                        </Text>
                        <TouchableOpacity
                          style={[styles.useBtn, ab.currentUses <= 0 && styles.useBtnDisabled]}
                          disabled={ab.currentUses <= 0}
                          onPress={() => useAbility(ab.id, ab.currentUses)}
                        >
                          <Text style={styles.useBtnText}>{ab.currentUses > 0 ? 'Invocar Poder' : 'Esgotado'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ABA: Perícias */}
            {activeTab === 'skills' && (
              <View style={styles.skillsGrid}>
                {SKILLS_LIST.map(skill => {
                  const score = (selectedChar as any)[skill.attr] || 10;
                  const mod = getMod(score);
                  const isProf = selectedChar.proficientSkills.includes(skill.name);
                  const total = mod + (isProf ? profBonus : 0);
                  return (
                    <View key={skill.name} style={styles.skillItem}>
                      <View style={styles.skillLeft}>
                        <View style={[styles.saveDot, isProf && styles.saveDotProf]} />
                        <Text style={styles.skillName}>{skill.name}</Text>
                        <Text style={styles.skillAttr}>({skill.label})</Text>
                      </View>
                      <Text style={[styles.skillTotal, isProf && { color: '#E6C280', fontWeight: '700' }]}>
                        {total >= 0 ? `+${total}` : total}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Status e Condições Sombrias Ativas */}
          {selectedChar.conditions && selectedChar.conditions.length > 0 && (
            <View style={styles.conditionsBox}>
              <Text style={styles.conditionsHeader}>MALDIÇÕES & CONDIÇÕES ATIVAS (ESCUDO DO MESTRE)</Text>
              <View style={styles.conditionsRow}>
                {selectedChar.conditions.map(cond => (
                  <View key={cond.id} style={styles.conditionChip}>
                    <Text style={styles.conditionName}>⚠️ {cond.name}</Text>
                    <Text style={styles.conditionDesc}>{cond.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noCharBox}>
          <Text style={styles.noCharText}>Nenhum grimório selecionado ou encontrado na taverna.</Text>
          <TouchableOpacity style={styles.createBtnLarge} onPress={() => { setEditingChar(null); setModalVisible(true); }}>
            <Plus color="#110F0D" size={20} />
            <Text style={styles.createBtnLargeText}>Escrever Primeiro Grimório</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Criação / Edição */}
      <CharacterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingChar}
      />
    </View>
  );
}

function XCircleIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#110F0D', fontSize: size * 0.6, fontWeight: '900' }}>✕</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 20,
  },
  selectorBar: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
    marginBottom: 24,
  },
  selectorScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  charChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#110F0D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  charChipSelected: {
    borderColor: '#C5A059',
    backgroundColor: '#24201C',
  },
  chipName: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  chipNameSelected: {
    color: '#E6C280',
  },
  chipClass: {
    color: '#80776C',
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  newCharChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
    borderStyle: 'dashed',
  },
  newCharText: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  mainSheet: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 28,
    gap: 26,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 22,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  levelText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  charName: {
    color: '#E2D8C3',
    fontSize: 34,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  charMeta: {
    color: '#BAAFA0',
    fontSize: 14,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#24201C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  actionBtnText: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deleteBtn: {
    borderColor: 'rgba(184, 40, 40, 0.4)',
    backgroundColor: 'rgba(184, 40, 40, 0.1)',
  },
  statsRibbon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 18,
    justifyContent: 'space-around',
    gap: 16,
  },
  ribbonItem: {
    alignItems: 'center',
  },
  ribbonLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  ribbonVal: {
    color: '#E2D8C3',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  combatPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
  hpSection: {
    flex: 2,
    minWidth: Platform.OS === 'web' ? 330 : '100%',
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 22,
  },
  hpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hpTitle: {
    color: '#B82828',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tempHpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  tempHpText: {
    color: '#E6C280',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpBarBg: {
    height: 22,
    backgroundColor: '#24201C',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  hpNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  hpCurrent: {
    color: '#E2D8C3',
    fontSize: 38,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  hpMax: {
    color: '#80776C',
    fontSize: 18,
    fontWeight: '600',
  },
  hitDiceText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  hpBtn: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
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
  customHpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customHpInput: {
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
  deathAndRestSection: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 290 : '100%',
    gap: 18,
  },
  deathBox: {
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 18,
  },
  deathTitle: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  deathLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 80,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restBox: {
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 18,
    flex: 1,
    justifyContent: 'space-between',
  },
  restTitle: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortRestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(107, 74, 112, 0.15)',
    borderWidth: 1,
    borderColor: '#6B4A70',
    padding: 12,
    borderRadius: 6,
  },
  longRestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#8C704F',
    padding: 12,
    borderRadius: 6,
  },
  restBtnTitle: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restBtnSub: {
    color: '#BAAFA0',
    fontSize: 9,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  sectionHeader: {
    color: '#C5A059',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 10,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  attrCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 160 : '45%',
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
    alignItems: 'center',
  },
  attrName: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  attrMod: {
    color: '#E2D8C3',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  attrScore: {
    color: '#80776C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  saveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D342C',
  },
  saveDotProf: {
    backgroundColor: '#E6C280',
  },
  saveText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tabsNav: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    gap: 22,
    marginTop: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#E6C280',
  },
  tabBtnText: {
    color: '#80776C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tabBtnTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  tabContent: {
    paddingTop: 18,
  },
  emptyText: {
    color: '#80776C',
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  slotCard: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
  },
  slotHeader: {
    marginBottom: 12,
  },
  slotLevel: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotCount: {
    color: '#BAAFA0',
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotTokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotToken: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTokenUsed: {
    backgroundColor: '#1A1714',
    borderColor: '#3D342C',
  },
  abilitiesList: {
    gap: 12,
  },
  abilityCard: {
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 18,
    gap: 12,
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  abilityName: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  abilityDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  resetBadge: {
    backgroundColor: 'rgba(107, 74, 112, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6B4A70',
  },
  resetLongBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#8C704F',
  },
  resetBadgeText: {
    color: '#E2D8C3',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  abilityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 12,
  },
  abilityUses: {
    color: '#BAAFA0',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  useBtn: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#8C704F',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  useBtnDisabled: {
    backgroundColor: '#1A1714',
    borderColor: '#3D342C',
  },
  useBtnText: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillItem: {
    width: Platform.OS === 'web' ? '31%' : '100%',
    minWidth: 240,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#110F0D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  skillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillName: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillAttr: {
    color: '#80776C',
    fontSize: 11,
  },
  skillTotal: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  conditionsBox: {
    backgroundColor: 'rgba(184, 40, 40, 0.1)',
    borderWidth: 1,
    borderColor: '#B82828',
    borderRadius: 8,
    padding: 18,
  },
  conditionsHeader: {
    color: '#B82828',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionChip: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#B82828',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  conditionName: {
    color: '#B82828',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionDesc: {
    color: '#E2D8C3',
    fontSize: 12,
    marginTop: 2,
  },
  noCharBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCharText: {
    color: '#BAAFA0',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  createBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  createBtnLargeText: {
    color: '#110F0D',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
