import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { ApiService } from '@/services/api';
import { CharacterData } from '@/lib/mockData';
import CharacterModal from '@/components/player/CharacterModal';
import { Shield, Plus, Edit, Trash2, Heart, Zap, Moon, Sun, Award, Skull, CheckCircle, Circle, Flame, Sparkles, Scroll, Sword, AlertTriangle, Package, Coins } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';

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
  const { isMobile } = useResponsive();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);
  const [activeTab, setActiveTab] = useState<'spells' | 'abilities' | 'skills' | 'inventory'>('spells');
  const [customHp, setCustomHp] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemIsWeapon, setNewItemIsWeapon] = useState(false);
  const [newItemDamage, setNewItemDamage] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState('1');
  const [newSpellTotal, setNewSpellTotal] = useState('2');
  const [newAbName, setNewAbName] = useState('');
  const [newAbDesc, setNewAbDesc] = useState('');
  const [newAbUses, setNewAbUses] = useState('1');
  const [newAbReset, setNewAbReset] = useState<'SHORT_REST' | 'LONG_REST' | 'NONE'>('SHORT_REST');

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

  const totalWeight = selectedChar ? (selectedChar.items || []).reduce((acc, i) => acc + ((Number(i.weight) || 0) * (Number(i.quantity) || 1)), 0) : 0;
  const maxWeight = selectedChar ? (Number(selectedChar.str) || 10) * 7.5 : 75;
  const isOverloaded = totalWeight > maxWeight;

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

  const addItem = async (newItem: { name: string; description: string; weight: number; quantity: number; isWeapon: boolean; damage?: string }) => {
    if (!selectedChar) return;
    const itemObj = {
      id: `item-${Date.now()}`,
      ...newItem,
    };
    const updatedItems = [...(selectedChar.items || []), itemObj];
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    loadCharacters(true);
  };

  const removeItem = async (itemId: string) => {
    if (!selectedChar) return;
    const updatedItems = (selectedChar.items || []).filter(i => i.id !== itemId);
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    loadCharacters(true);
  };

  const updateCoins = async (gold: number, silver: number, copper: number) => {
    if (!selectedChar) return;
    await ApiService.updateCharacter(selectedChar.id, { gold, silver, copper });
    loadCharacters(true);
  };

  const toggleSkillProficiency = async (skillName: string) => {
    if (!selectedChar) return;
    const currentList = selectedChar.proficientSkills ? selectedChar.proficientSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const exists = currentList.includes(skillName);
    const newList = exists ? currentList.filter(s => s !== skillName) : [...currentList, skillName];
    const newProfString = newList.join(',');
    
    const updated = { ...selectedChar, proficientSkills: newProfString };
    setCharacters(chars => chars.map(c => c.id === selectedChar.id ? updated : c));
    
    await ApiService.updateCharacter(selectedChar.id, { proficientSkills: newProfString });
    loadCharacters(true);
  };

  const addSpellSlot = async () => {
    if (!selectedChar || !newSpellLevel || !newSpellTotal) return;
    const levelNum = parseInt(newSpellLevel, 10) || 1;
    const totalNum = parseInt(newSpellTotal, 10) || 1;
    const newSlot = {
      id: `slot-${Date.now()}`,
      level: levelNum,
      total: totalNum,
      used: 0,
    };
    const updatedSlots = [...selectedChar.spellSlots, newSlot].sort((a, b) => a.level - b.level);
    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    setNewSpellLevel('1');
    setNewSpellTotal('2');
    loadCharacters(true);
  };

  const removeSpellSlot = async (slotId: string) => {
    if (!selectedChar) return;
    const updatedSlots = selectedChar.spellSlots.filter(s => s.id !== slotId);
    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    loadCharacters(true);
  };

  const addAbility = async () => {
    if (!selectedChar || !newAbName.trim()) return;
    const newAb = {
      id: `ab-${Date.now()}`,
      name: newAbName.trim(),
      description: newAbDesc.trim(),
      maxUses: parseInt(newAbUses, 10) || 1,
      currentUses: parseInt(newAbUses, 10) || 1,
      resetType: newAbReset,
    };
    const updatedAbilities = [...selectedChar.abilities, newAb];
    await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
    setNewAbName('');
    setNewAbDesc('');
    setNewAbUses('1');
    loadCharacters(true);
  };

  const removeAbility = async (abId: string) => {
    if (!selectedChar) return;
    const updatedAbilities = selectedChar.abilities.filter(a => a.id !== abId);
    await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
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
        <View style={[styles.mainSheet, isMobile && { padding: 14, gap: 16 }]}>
          {/* Header Medieval da Ficha */}
          <View style={[styles.sheetHeader, isMobile && { gap: 12, paddingBottom: 14 }]}>
            <View style={{ flexShrink: 1, minWidth: isMobile ? '100%' : 180 }}>
              <View style={styles.levelBadge}>
                <Scroll color="#C5A059" size={14} />
                <Text style={styles.levelText}>HERÓI NÍVEL {selectedChar.level} • {selectedChar.race.toUpperCase()}</Text>
              </View>
              <Text style={[styles.charName, isMobile && { fontSize: 24 }]}>{selectedChar.name}</Text>
              <Text style={styles.charMeta}>
                {selectedChar.class} • Jogador: <Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{selectedChar.playerName}</Text>
              </Text>
            </View>

            {/* Estatísticas resumidas e compactas no centro do Header */}
            <View style={[
              styles.headerStatsRibbon,
              isMobile && {
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'space-around',
                gap: 4,
                paddingVertical: 6,
              }
            ]}>
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>PROF.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#C5A059' }]}>+{profBonus}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>CA</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#8C6C90' }]}>{selectedChar.armorClass}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>INIC.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }]}>
                  {selectedChar.initiativeBonus >= 0 ? `+${selectedChar.initiativeBonus}` : selectedChar.initiativeBonus}
                </Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>PERC.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#38783C' }]}>{passivePerception}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>DESL.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }]}>{selectedChar.speed}</Text>
              </View>
            </View>

            <View style={[styles.headerActions, isMobile && { width: '100%', justifyContent: 'flex-end', marginTop: 4 }]}>
              <TouchableOpacity
                style={[styles.actionBtn, isMobile && { flex: 1, justifyContent: 'center' }]}
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

          {/* Painel de Sinais Vitais (HP) e Combate Medieval */}
          <View style={styles.combatPanel}>
            <View style={styles.hpSection}>
              <View style={styles.hpHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
                  <Heart color="#B82828" size={24} />
                  <Text style={styles.hpTitle}>PONTOS DE VIDA</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexShrink: 1, flexWrap: 'wrap' }}>
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
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.restBtnTitle}>Descanso Curto</Text>
                      <Text style={styles.restBtnSub}>Curar & Hab. Marciais</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.longRestBtn} onPress={triggerLongRest}>
                    <Sun color="#C5A059" size={18} />
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.restBtnTitle}>Descanso Longo</Text>
                      <Text style={styles.restBtnSub}>Restaura Vida & Magias</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Grid de Atributos Ancestrais (FOR, DES, CON, INT, SAB, CAR) */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>ATRIBUTOS ANCESTRAIS & TESTES DE RESISTÊNCIA</Text>
            <Text style={{ color: '#BAAFA0', fontSize: 12, marginTop: 4 }}>
              As proficiências em testes de resistência são configuradas na criação ou em "Reescrever Grimório" e são indicadas pela borda em ouro antigo (+{profBonus}).
            </Text>
          </View>
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
                <View
                  key={attr.name}
                  style={[styles.attrCard, attr.prof && { borderColor: '#C5A059' }]}
                >
                  <Text style={[styles.attrName, attr.prof && { color: '#E2D8C3', fontWeight: '700' }]}>{attr.name}</Text>
                  <Text style={styles.attrMod}>{formatMod(attr.score)}</Text>
                  <Text style={styles.attrScore}>Score: {attr.score}</Text>
                  <View style={styles.saveRow}>
                    <View style={[styles.saveDot, attr.prof && styles.saveDotProf]} />
                    <Text style={styles.saveText}>
                      Resistência: <Text style={{ color: '#E6C280', fontWeight: '700' }}>{saveVal >= 0 ? `+${saveVal}` : saveVal}</Text>
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
                Magias ({selectedChar.spellSlots.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'abilities' && styles.tabBtnActive]}
              onPress={() => setActiveTab('abilities')}
            >
              <Sword color={activeTab === 'abilities' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'abilities' && styles.tabBtnTextActive]}>
                Habilidades ({selectedChar.abilities.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'skills' && styles.tabBtnActive]}
              onPress={() => setActiveTab('skills')}
            >
              <Award color={activeTab === 'skills' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'skills' && styles.tabBtnTextActive]}>
                Perícias (18)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
              onPress={() => setActiveTab('inventory')}
            >
              <Package color={activeTab === 'inventory' ? '#E6C280' : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'inventory' && styles.tabBtnTextActive]}>
                Mochila & Armamento ({(selectedChar.items || []).length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo das Abas */}
          <View style={styles.tabContent}>
            {/* ABA: Pergaminhos de Magia */}
            {activeTab === 'spells' && (
              <View>
                {selectedChar.spellSlots.length === 0 ? (
                  <Text style={styles.emptyText}>Este herói não possui magias ou espaços cadastrados no seu grimório.</Text>
                ) : (
                  <View style={styles.slotsGrid}>
                    {selectedChar.spellSlots.map(slot => (
                      <View key={slot.id} style={styles.slotCard}>
                        <View style={styles.slotHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.slotLevel}>MAGIAS DE {slot.level}º NÍVEL (ESPAÇOS)</Text>
                            <Text style={styles.slotCount}>{slot.total - slot.used} / {slot.total} Intactos</Text>
                          </View>
                          <TouchableOpacity style={styles.delItemBtn} onPress={() => removeSpellSlot(slot.id)}>
                            <Trash2 color="#80776C" size={16} />
                          </TouchableOpacity>
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

                {/* Cadastrar Nova Magia / Espaço */}
                <View style={[styles.addItemBox, { marginTop: 24 }]}>
                  <Text style={styles.addItemHeading}>➕ CADASTRAR ESPAÇOS DE MAGIA</Text>
                  <View style={styles.addItemForm}>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Nível da Magia (1 a 9)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newSpellLevel}
                        onChangeText={setNewSpellLevel}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Qtd de Espaços (ex: 2, 4)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newSpellTotal}
                        onChangeText={setNewSpellTotal}
                      />
                    </View>
                    <TouchableOpacity style={styles.addItemSubmitBtn} onPress={addSpellSlot}>
                      <Plus color="#110F0D" size={18} />
                      <Text style={styles.addItemSubmitText}>Cadastrar Magia</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ABA: Habilidades e Poderes */}
            {activeTab === 'abilities' && (
              <View>
                <View style={styles.abilitiesList}>
                  {selectedChar.abilities.length === 0 ? (
                    <Text style={styles.emptyText}>Este herói não possui habilidades ou poderes cadastrados.</Text>
                  ) : (
                    selectedChar.abilities.map(ab => (
                      <View key={ab.id} style={styles.abilityCard}>
                        <View style={styles.abilityHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.abilityName}>{ab.name}</Text>
                            {ab.description ? <Text style={styles.abilityDesc}>{ab.description}</Text> : null}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.resetBadge, ab.resetType === 'LONG_REST' && styles.resetLongBadge]}>
                              <Text style={styles.resetBadgeText}>
                                {ab.resetType === 'SHORT_REST' ? '⚡ Ritual Curto' : ab.resetType === 'LONG_REST' ? '💤 Ritual Longo' : 'Poder Passivo'}
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.delItemBtn} onPress={() => removeAbility(ab.id)}>
                              <Trash2 color="#80776C" size={16} />
                            </TouchableOpacity>
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
                    ))
                  )}
                </View>

                {/* Cadastrar Nova Habilidade */}
                <View style={[styles.addItemBox, { marginTop: 24 }]}>
                  <Text style={styles.addItemHeading}>➕ CADASTRAR NOVA HABILIDADE / PODER</Text>
                  <View style={styles.addItemForm}>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Nome da Habilidade (ex: Fúria, Visão no Escuro...)"
                        placeholderTextColor="#80776C"
                        value={newAbName}
                        onChangeText={setNewAbName}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Usos Máx (ex: 3, ou 99 para Infinito)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newAbUses}
                        onChangeText={setNewAbUses}
                      />
                    </View>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Descrição do poder e efeitos..."
                        placeholderTextColor="#80776C"
                        value={newAbDesc}
                        onChangeText={setNewAbDesc}
                      />
                    </View>
                    <View style={[styles.addInputRow, { alignItems: 'center' }]}>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'SHORT_REST' && { backgroundColor: '#6B4A70', borderColor: '#E6C280' }]}
                          onPress={() => setNewAbReset('SHORT_REST')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'SHORT_REST' && { color: '#FFF' }]}>⚡ Descanso Curto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'LONG_REST' && { backgroundColor: '#C5A059', borderColor: '#FFF' }]}
                          onPress={() => setNewAbReset('LONG_REST')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'LONG_REST' && { color: '#FFF' }]}>💤 Descanso Longo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'NONE' && { backgroundColor: '#3D342C', borderColor: '#E6C280' }]}
                          onPress={() => setNewAbReset('NONE')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'NONE' && { color: '#FFF' }]}>✨ Passivo / Contínuo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.addItemSubmitBtn} onPress={addAbility}>
                      <Plus color="#110F0D" size={18} />
                      <Text style={styles.addItemSubmitText}>Cadastrar Habilidade</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ABA: Perícias */}
            {activeTab === 'skills' && (
              <View>
                <View style={styles.skillsBanner}>
                  <Text style={styles.skillsBannerTitle}>✨ TREINAMENTO & PROFICIÊNCIAS MEDIEVAIS</Text>
                  <Text style={styles.skillsBannerSub}>Toque em qualquer perícia abaixo para adicionar ou remover sua proficiência no grimório do aventureiro (+{profBonus} no teste).</Text>
                </View>
                <View style={styles.skillsGrid}>
                  {SKILLS_LIST.map(skill => {
                    const score = (selectedChar as any)[skill.attr] || 10;
                    const mod = getMod(score);
                    const isProf = selectedChar.proficientSkills ? selectedChar.proficientSkills.includes(skill.name) : false;
                    const total = mod + (isProf ? profBonus : 0);
                    return (
                      <TouchableOpacity
                        key={skill.name}
                        style={[styles.skillItem, isProf && { borderColor: '#C5A059', backgroundColor: 'rgba(197, 160, 89, 0.12)' }]}
                        onPress={() => toggleSkillProficiency(skill.name)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.skillLeft}>
                          <View style={[styles.saveDot, isProf && styles.saveDotProf]} />
                          <Text style={[styles.skillName, isProf && { color: '#E2D8C3', fontWeight: '700' }]}>{skill.name}</Text>
                          <Text style={styles.skillAttr}>({skill.label})</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isProf && <Text style={{ color: '#C5A059', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>PROFICIENTE</Text>}
                          <Text style={[styles.skillTotal, isProf && { color: '#E6C280', fontWeight: '700' }]}>
                            {total >= 0 ? `+${total}` : total}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ABA: Mochila & Armamento */}
            {activeTab === 'inventory' && (
              <View style={styles.inventoryContainer}>
                {/* 1. Alerta de Sobrecarga Se Houver */}
                {isOverloaded && (
                  <View style={styles.overloadBanner}>
                    <AlertTriangle color="#FF4545" size={24} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.overloadBannerTitle}>⚠️ SOBRECARGA ATIVA ({totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg max)</Text>
                      <Text style={styles.overloadBannerDesc}>
                        O aventureiro está carregando excesso de carga! O deslocamento é reduzido em 3m e o Escudo do Mestre foi notificado em tempo real.
                      </Text>
                    </View>
                  </View>
                )}

                {/* 2. Barra de Peso / Capacidade de Carga */}
                <View style={styles.weightSection}>
                  <View style={styles.weightTopRow}>
                    <Text style={styles.weightTitle}>⚖️ CAPACIDADE DE CARGA DO AVENTUREIRO (FOR x 7.5)</Text>
                    <Text style={[styles.weightVal, isOverloaded && { color: '#FF4545', fontWeight: '700' }]}>
                      {totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg
                    </Text>
                  </View>
                  <View style={styles.weightBg}>
                    <View
                      style={[
                        styles.weightFill,
                        {
                          width: `${Math.min(100, (totalWeight / maxWeight) * 100)}%`,
                          backgroundColor: isOverloaded ? '#FF4545' : (totalWeight / maxWeight) > 0.75 ? '#C5A059' : '#38783C',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* 3. Tesouro da Guilda / Moedas */}
                <View style={styles.coinsSection}>
                  <Text style={styles.sectionHeading}>💰 TESOURO DA GUILDA (PORTA-MOEDAS)</Text>
                  <View style={styles.coinsGrid}>
                    {/* Ouro */}
                    <View style={[styles.coinCard, { borderColor: '#E6C280' }]}>
                      <Text style={[styles.coinLabel, { color: '#E6C280' }]}>🥇 PEÇAS DE OURO (PO)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(Math.max(0, (selectedChar.gold || 0) - 10), selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(Math.max(0, (selectedChar.gold || 0) - 1), selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#E6C280' }]}>{selectedChar.gold || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins((selectedChar.gold || 0) + 1, selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins((selectedChar.gold || 0) + 10, selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Prata */}
                    <View style={[styles.coinCard, { borderColor: '#C0C0C0' }]}>
                      <Text style={[styles.coinLabel, { color: '#C0C0C0' }]}>🥈 PEÇAS DE PRATA (PP)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, Math.max(0, (selectedChar.silver || 0) - 10), selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, Math.max(0, (selectedChar.silver || 0) - 1), selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#C0C0C0' }]}>{selectedChar.silver || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, (selectedChar.silver || 0) + 1, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, (selectedChar.silver || 0) + 10, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Cobre */}
                    <View style={[styles.coinCard, { borderColor: '#B87333' }]}>
                      <Text style={[styles.coinLabel, { color: '#B87333' }]}>🥉 PEÇAS DE COBRE (PC)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, Math.max(0, (selectedChar.copper || 0) - 10))}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, Math.max(0, (selectedChar.copper || 0) - 1))}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#B87333' }]}>{selectedChar.copper || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, (selectedChar.copper || 0) + 1)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, (selectedChar.copper || 0) + 10)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Lista de Itens & Armas */}
                <View style={styles.itemsListSection}>
                  <Text style={styles.sectionHeading}>⚔️ ARMAMENTO & ITENS DA MOCHILA</Text>
                  {(selectedChar.items || []).length === 0 ? (
                    <View style={styles.emptyItems}>
                      <Text style={styles.emptyItemsText}>A mochila do herói está vazia.</Text>
                    </View>
                  ) : (
                    <View style={styles.itemsGrid}>
                      {(selectedChar.items || []).map((item) => (
                        <View key={item.id} style={[styles.itemCard, item.isWeapon && styles.weaponCard]}>
                          <View style={styles.itemHeader}>
                            <View style={styles.itemTitleRow}>
                              {item.isWeapon ? <Sword color="#E6C280" size={18} /> : <Package color="#BAAFA0" size={18} />}
                              <Text style={[styles.itemName, item.isWeapon && { color: '#E6C280' }]}>{item.name}</Text>
                              {item.isWeapon && (
                                <View style={styles.weaponBadge}>
                                  <Text style={styles.weaponBadgeText}>Arma • {item.damage || '1d6'}</Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity style={styles.delItemBtn} onPress={() => removeItem(item.id)}>
                              <Trash2 color="#80776C" size={16} />
                            </TouchableOpacity>
                          </View>
                          {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                          <View style={styles.itemFooter}>
                            <Text style={styles.itemMeta}>⚖️ Peso: {Number(item.weight || 0).toFixed(1)} kg ({Number(item.weight || 0) * (item.quantity || 1)} kg total)</Text>
                            <Text style={styles.itemMeta}>📦 Qtd: x{item.quantity || 1}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* 5. Adicionar Novo Item */}
                <View style={styles.addItemBox}>
                  <Text style={styles.addItemHeading}>➕ ADICIONAR NOVO ITEM / ARMA</Text>
                  <View style={styles.addItemForm}>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Nome do Item (ex: Espada Longa, Poção...)"
                        placeholderTextColor="#80776C"
                        value={newItemName}
                        onChangeText={setNewItemName}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Peso (kg)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newItemWeight}
                        onChangeText={setNewItemWeight}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 0.8 }]}
                        placeholder="Qtd"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newItemQty}
                        onChangeText={setNewItemQty}
                      />
                    </View>

                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Descrição ou Notas do item..."
                        placeholderTextColor="#80776C"
                        value={newItemDesc}
                        onChangeText={setNewItemDesc}
                      />
                      <TouchableOpacity
                        style={[styles.weaponToggleBtn, newItemIsWeapon && styles.weaponToggleBtnActive]}
                        onPress={() => setNewItemIsWeapon(!newItemIsWeapon)}
                      >
                        <Sword color={newItemIsWeapon ? '#110F0D' : '#BAAFA0'} size={16} />
                        <Text style={[styles.weaponToggleText, newItemIsWeapon && { color: '#110F0D' }]}>
                          {newItemIsWeapon ? 'É uma Arma ⚔️' : 'Item Normal 📦'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {newItemIsWeapon && (
                      <TextInput
                        style={styles.addInput}
                        placeholder="Dano da Arma (ex: 1d8 cortante, 2d6+4 perfurante...)"
                        placeholderTextColor="#80776C"
                        value={newItemDamage}
                        onChangeText={setNewItemDamage}
                      />
                    )}

                    <TouchableOpacity
                      style={styles.addItemSubmitBtn}
                      onPress={() => {
                        if (!newItemName.trim()) {
                          if (Platform.OS === 'web') window.alert('Por favor, informe o nome do item!');
                          else Alert.alert('Erro', 'Por favor, informe o nome do item!');
                          return;
                        }
                        addItem({
                          name: newItemName.trim(),
                          description: newItemDesc.trim(),
                          weight: Number(newItemWeight) || 1.0,
                          quantity: Number(newItemQty) || 1,
                          isWeapon: newItemIsWeapon,
                          damage: newItemIsWeapon ? (newItemDamage.trim() || '1d6 cortante') : '',
                        });
                        setNewItemName('');
                        setNewItemDesc('');
                        setNewItemWeight('');
                        setNewItemQty('1');
                        setNewItemIsWeapon(false);
                        setNewItemDamage('');
                      }}
                    >
                      <Plus color="#110F0D" size={18} />
                      <Text style={styles.addItemSubmitText}>Guardar na Mochila</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 20,
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
    fontSize: 28,
    fontWeight: '700',
    flexShrink: 1,
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
    flexWrap: 'wrap',
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
  headerStatsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  headerStatItem: {
    alignItems: 'center',
    minWidth: 36,
    flexShrink: 1,
  },
  headerStatLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  headerStatVal: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  headerStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#2D251E',
  },
  combatPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
  hpSection: {
    flex: 2,
    minWidth: 280,
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hpTitle: {
    color: '#B82828',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  customHpInput: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
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
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deathAndRestSection: {
    flex: 1,
    minWidth: 260,
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
    letterSpacing: 0.5,
    flexShrink: 1,
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
    flexWrap: 'wrap',
    gap: 10,
  },
  shortRestBtn: {
    flexGrow: 1,
    flexBasis: 130,
    minWidth: 130,
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
    flexGrow: 1,
    flexBasis: 130,
    minWidth: 130,
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
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restBtnSub: {
    color: '#BAAFA0',
    fontSize: 9,
    flexShrink: 1,
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
    minWidth: 140,
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
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    gap: 12,
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
  skillsBanner: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  skillsBannerTitle: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillsBannerSub: {
    color: '#BAAFA0',
    fontSize: 12,
    lineHeight: 18,
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
  inventoryContainer: {
    gap: 24,
  },
  overloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 69, 69, 0.15)',
    borderWidth: 1,
    borderColor: '#FF4545',
    padding: 16,
    borderRadius: 8,
  },
  overloadBannerTitle: {
    color: '#FF4545',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  overloadBannerDesc: {
    color: '#E2D8C3',
    fontSize: 13,
    marginTop: 4,
  },
  weightSection: {
    backgroundColor: '#161311',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D251E',
    gap: 10,
  },
  weightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightTitle: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  weightVal: {
    color: '#E6C280',
    fontSize: 15,
    fontWeight: '700',
  },
  weightBg: {
    height: 10,
    backgroundColor: '#0A0908',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  weightFill: {
    height: '100%',
    borderRadius: 5,
  },
  coinsSection: {
    gap: 12,
  },
  sectionHeading: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 8,
  },
  coinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coinCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  coinLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  coinControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  coinBtn: {
    backgroundColor: '#26201B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  coinBtnText: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
  },
  coinValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  itemsListSection: {
    gap: 12,
  },
  emptyItems: {
    backgroundColor: '#161311',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  emptyItemsText: {
    color: '#80776C',
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    padding: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  weaponCard: {
    borderColor: '#5C4A32',
    backgroundColor: '#1A1612',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  itemName: {
    color: '#E2D8C3',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  weaponBadge: {
    backgroundColor: '#3D3020',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  weaponBadgeText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '700',
  },
  delItemBtn: {
    padding: 4,
  },
  itemDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#26201B',
    paddingTop: 8,
    marginTop: 4,
  },
  itemMeta: {
    color: '#80776C',
    fontSize: 12,
  },
  addItemBox: {
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  addItemHeading: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  addItemForm: {
    gap: 12,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  addInput: {
    backgroundColor: '#0A0908',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#E2D8C3',
    fontSize: 14,
    minWidth: 120,
  },
  weaponToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26201B',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  weaponToggleBtnActive: {
    backgroundColor: '#E6C280',
    borderColor: '#C5A059',
  },
  weaponToggleText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
  },
  addItemSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  addItemSubmitText: {
    color: '#110F0D',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
