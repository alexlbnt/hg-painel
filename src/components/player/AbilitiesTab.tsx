import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AbilityData, CharacterData } from '@/lib/mockData';
import { getMod, getProfBonus } from '@/utils/dnd5e';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Edit2,
  Infinity as InfinityIcon,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react-native';

interface AbilitiesTabProps {
  char: CharacterData;
  onAdjustAbilityUses: (abilityId: string, delta: number) => void;
  onResetAbilityUses: (abilityId: string) => void;
  onOpenAddAbilityModal: () => void;
  onEditAbility: (ability: AbilityData) => void;
  onDeleteAbility: (abilityId: string) => void;
  onUpdateKiPoints: (newVal: number) => void;
  onUpdateSorceryPoints: (newVal: number) => void;
  onUpdateSuperiorityDice?: (newVal: number) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const AbilitiesTab: React.FC<AbilitiesTabProps> = React.memo(({
  char,
  onAdjustAbilityUses,
  onResetAbilityUses,
  onOpenAddAbilityModal,
  onEditAbility,
  onDeleteAbility,
  onUpdateKiPoints,
  onUpdateSorceryPoints,
  onUpdateSuperiorityDice,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const abilities = useMemo(() => char.abilities || [], [char.abilities]);
  const filteredAbilities = useMemo(() => {
    return filterAction === 'ALL'
      ? abilities
      : abilities.filter((a) => (a.actionType || 'LIVRE').toUpperCase() === filterAction);
  }, [abilities, filterAction]);

  // Recursos Especiais (Monk Ki / Sorcerer Points / Battle Master Superiority Dice)
  const isMonk = useMemo(() => (char.class || '').toLowerCase().includes('monge'), [char.class]);
  const isSorcerer = useMemo(() => (char.class || '').toLowerCase().includes('feiticeiro'), [char.class]);

  const isBattleMaster = useMemo(() => {
    const cls = (char.class || '').toLowerCase();
    const arch = (char.archetype || '').toLowerCase();
    const isFighter = cls.includes('guerreiro') || cls.includes('fighter');
    const isBM =
      arch.includes('mestre de batalha') ||
      arch.includes('mestre da batalha') ||
      arch.includes('battle master') ||
      arch.includes('battlemaster');
    const directClass = cls.includes('mestre de batalha') || cls.includes('battle master');
    return (isFighter && isBM) || directClass || (char.maxSuperiorityDice || 0) > 0;
  }, [char.class, char.archetype, char.maxSuperiorityDice]);

  const bmStats = useMemo(() => {
    const lvl = char.level || 1;
    const defaultMax = lvl >= 15 ? 6 : lvl >= 7 ? 5 : 4;
    const defaultDie = lvl >= 18 ? 'd12' : lvl >= 10 ? 'd10' : 'd8';
    const maxDice = (char.maxSuperiorityDice && char.maxSuperiorityDice > 0) ? char.maxSuperiorityDice : defaultMax;
    const dieType = char.superiorityDieType || defaultDie;
    const currentDice = char.superiorityDice !== undefined ? char.superiorityDice : maxDice;

    // CD da Manobra: 8 + Bônus de Proficiência + max(Mod FOR, Mod DES)
    const prof = getProfBonus(lvl);
    const strMod = getMod(char.str || 10);
    const dexMod = getMod(char.dex || 10);
    const bestPhysicalMod = Math.max(strMod, dexMod);
    const saveDc = 8 + prof + bestPhysicalMod;

    return {
      maxDice,
      dieType,
      currentDice,
      saveDc,
      bestPhysicalAttr: strMod >= dexMod ? 'FOR' : 'DES',
      bestPhysicalMod,
    };
  }, [char.level, char.maxSuperiorityDice, char.superiorityDieType, char.superiorityDice, char.str, char.dex]);

  return (
    <View style={styles.container}>
      {/* 🥋 PONTOS DE QI / KI (MONGE) */}
      {/* 🥋 PONTOS DE QI / KI (MONGE) */}
      {(isMonk || (char.maxKiPoints || 0) > 0) && (
        <View style={styles.specialResourceCard}>
          <View style={styles.specialHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <Zap size={15} color="#D4883A" />
              <Text style={[styles.specialTitle, isMobile && { fontSize: 11.5 }]}>
                PONTOS DE QI / KI (MONGE)
              </Text>
            </View>
            <View style={styles.specialResetPill}>
              <Sun size={11} color="#C5A059" />
              <Text style={styles.specialResetText}>Recarrega em Descanso Curto</Text>
            </View>
          </View>

          <View style={[styles.specialControlsRow, isMobile && styles.specialControlsRowMobile]}>
            <View style={[styles.specialStatsGroup, isMobile && styles.specialStatsGroupMobile]}>
              <Text style={styles.specialCurrentVal}>{char.kiPoints || 0}</Text>
              <Text style={styles.specialMaxVal}>/ {char.maxKiPoints || char.level}</Text>
            </View>

            <View style={[styles.quickStepBtnRow, isMobile && styles.quickStepBtnRowMobile]}>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() => onUpdateKiPoints(Math.max(0, (char.kiPoints || 0) - 1))}
                activeOpacity={0.7}
              >
                <Minus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Qi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() =>
                  onUpdateKiPoints(
                    Math.min(char.maxKiPoints || char.level, (char.kiPoints || 0) + 1)
                  )
                }
                activeOpacity={0.7}
              >
                <Plus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Qi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile, { borderColor: '#D4883A' }]}
                onPress={() => onUpdateKiPoints(char.maxKiPoints || char.level)}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color="#D4883A" />
                <Text style={[styles.quickStepText, { color: '#D4883A' }]}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔮 PONTOS DE FEITIÇARIA (FEITICEIRO) */}
      {(isSorcerer || (char.maxSorceryPoints || 0) > 0) && (
        <View style={styles.specialResourceCard}>
          <View style={styles.specialHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <Sparkles size={15} color="#C084FC" />
              <Text style={[styles.specialTitle, isMobile && { fontSize: 11.5 }]}>
                PONTOS DE FEITIÇARIA (FEITICEIRO)
              </Text>
            </View>
            <View style={styles.specialResetPill}>
              <Moon size={11} color="#C084FC" />
              <Text style={[styles.specialResetText, { color: '#C084FC' }]}>
                Recarrega em Descanso Longo
              </Text>
            </View>
          </View>

          <View style={[styles.specialControlsRow, isMobile && styles.specialControlsRowMobile]}>
            <View style={[styles.specialStatsGroup, isMobile && styles.specialStatsGroupMobile]}>
              <Text style={[styles.specialCurrentVal, { color: '#C084FC' }]}>
                {char.sorceryPoints || 0}
              </Text>
              <Text style={styles.specialMaxVal}>
                / {char.maxSorceryPoints || char.level}
              </Text>
            </View>

            <View style={[styles.quickStepBtnRow, isMobile && styles.quickStepBtnRowMobile]}>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() =>
                  onUpdateSorceryPoints(Math.max(0, (char.sorceryPoints || 0) - 1))
                }
                activeOpacity={0.7}
              >
                <Minus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 PF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() =>
                  onUpdateSorceryPoints(
                    Math.min(
                      char.maxSorceryPoints || char.level,
                      (char.sorceryPoints || 0) + 1
                    )
                  )
                }
                activeOpacity={0.7}
              >
                <Plus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 PF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile, { borderColor: '#C084FC' }]}
                onPress={() =>
                  onUpdateSorceryPoints(char.maxSorceryPoints || char.level)
                }
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color="#C084FC" />
                <Text style={[styles.quickStepText, { color: '#C084FC' }]}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ⚔️ DADOS DE SUPERIORIDADE (GUERREIRO MESTRE DE BATALHA) */}
      {isBattleMaster && (
        <View style={styles.specialResourceCard}>
          <View style={styles.specialHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <Crosshair size={15} color="#E05252" />
              <Text style={[styles.specialTitle, isMobile && { fontSize: 11.5 }]}>
                DADOS DE SUPERIORIDADE (MESTRE DE BATALHA)
              </Text>
            </View>
            <View style={[styles.specialResetPill, { borderColor: '#E0525244' }]}>
              <Sun size={11} color="#C5A059" />
              <Moon size={11} color="#C084FC" />
              <Text style={[styles.specialResetText, { color: '#E2D8C3' }]}>
                Recarrega em Descanso Curto/Longo
              </Text>
            </View>
          </View>

          <View style={[styles.specialControlsRow, isMobile && styles.specialControlsRowMobile]}>
            <View style={[styles.bmStatsGroup, isMobile && styles.bmStatsGroupMobile]}>
              <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
                <Text style={[styles.specialCurrentVal, { color: '#E05252' }]}>
                  {bmStats.currentDice}
                </Text>
                <Text style={styles.specialMaxVal}>
                  / {bmStats.maxDice} ({bmStats.dieType})
                </Text>
              </View>

              {/* Badge da CD de Resistência da Manobra */}
              <View style={styles.bmDcBadge}>
                <Text style={styles.bmDcLabel}>CD MANOBRA</Text>
                <Text style={styles.bmDcVal}>{bmStats.saveDc}</Text>
                <Text style={styles.bmDcAttr}>({bmStats.bestPhysicalAttr})</Text>
              </View>
            </View>

            <View style={[styles.quickStepBtnRow, isMobile && styles.quickStepBtnRowMobile]}>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() =>
                  onUpdateSuperiorityDice?.(Math.max(0, bmStats.currentDice - 1))
                }
                activeOpacity={0.7}
              >
                <Minus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Dado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile]}
                onPress={() =>
                  onUpdateSuperiorityDice?.(
                    Math.min(bmStats.maxDice, bmStats.currentDice + 1)
                  )
                }
                activeOpacity={0.7}
              >
                <Plus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Dado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, isMobile && styles.quickStepBtnMobile, { borderColor: '#E05252' }]}
                onPress={() => onUpdateSuperiorityDice?.(bmStats.maxDice)}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color="#E05252" />
                <Text style={[styles.quickStepText, { color: '#E05252' }]}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Slots visuais táteis dos dados de superioridade */}
          <View style={[styles.bmDicePipsRow, isMobile && styles.bmDicePipsRowMobile]}>
            {Array.from({ length: bmStats.maxDice }).map((_, idx) => {
              const isAvailable = idx < bmStats.currentDice;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isAvailable) {
                      onUpdateSuperiorityDice?.(idx);
                    } else {
                      onUpdateSuperiorityDice?.(idx + 1);
                    }
                  }}
                  style={[
                    styles.bmDiePip,
                    isMobile && styles.bmDiePipMobile,
                    isAvailable ? styles.bmDiePipActive : styles.bmDiePipSpent,
                  ]}
                >
                  <Text
                    style={[
                      styles.bmDiePipText,
                      isAvailable ? styles.bmDiePipTextActive : styles.bmDiePipTextSpent,
                    ]}
                  >
                    🎲 {isAvailable ? bmStats.dieType : 'Gasto'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* BARRA DE FILTRO POR TIPO DE AÇÃO & NOVA HABILIDADE */}
      <View style={[styles.toolbar, isMobile && styles.toolbarMobile]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionFilterScroll}
        >
          {['ALL', 'AÇÃO', 'BÔNUS', 'REAÇÃO', 'LIVRE'].map((act) => {
            const isSelected = filterAction === act;
            return (
              <TouchableOpacity
                key={act}
                style={[
                  styles.filterPill,
                  isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                ]}
                onPress={() => setFilterAction(act)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && { color: '#110F0D', fontWeight: 'bold' },
                  ]}
                >
                  {act === 'ALL' ? 'Todas' : act}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.addBtn, isMobile && styles.addBtnMobile, { borderColor: themeColor }]}
          onPress={onOpenAddAbilityModal}
          activeOpacity={0.7}
        >
          <Plus size={13} color={themeColor} />
          <Text style={[styles.addBtnText, { color: themeColor }]}>Nova Habilidade</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE HABILIDADES COM PIPS DE USO */}
      {filteredAbilities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Nenhuma habilidade cadastrada neste filtro. Adicione suas características de classe ou talentos!
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filteredAbilities.map((ab) => {
            const hasUses = ab.maxUses > 0;
            const currentUses = ab.currentUses ?? ab.maxUses;
            const isExpanded = expandedIds[ab.id] ?? false;

            return (
              <View key={ab.id} style={styles.abilityCard}>
                {/* Header do Card */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.abilityName}>{ab.name}</Text>
                      {ab.actionType && (
                        <View style={styles.actionTypeBadge}>
                          <Text style={styles.actionTypeText}>{ab.actionType.toUpperCase()}</Text>
                        </View>
                      )}
                      {ab.resetType && ab.resetType !== 'NONE' && (
                        <View style={styles.resetBadge}>
                          {ab.resetType === 'SHORT_REST' ? (
                            <Sun size={10} color="#C5A059" />
                          ) : (
                            <Moon size={10} color="#C084FC" />
                          )}
                          <Text
                            style={[
                              styles.resetBadgeText,
                              { color: ab.resetType === 'SHORT_REST' ? '#C5A059' : '#C084FC' },
                            ]}
                          >
                            {ab.resetType === 'SHORT_REST' ? 'Descanso Curto' : 'Descanso Longo'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Ações: Editar e Excluir */}
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => onEditAbility(ab)}
                    >
                      <Edit2 size={12} color="#80776C" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => onDeleteAbility(ab.id)}
                    >
                      <Trash2 size={12} color="#B82828" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Usos Ilimitados (Passiva) */}
                {!hasUses && (
                  <View style={styles.pipsContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.pipsLabel}>Usos:</Text>
                      <InfinityIcon size={16} color={themeColor} strokeWidth={2.5} />
                    </View>
                  </View>
                )}

                {/* Contadores / Pips de Uso Tátil */}
                {hasUses && (
                  <View style={styles.pipsContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.pipsLabel}>
                        Usos: {currentUses} / {ab.maxUses}
                      </Text>

                      {/* Bolinhas / Pips */}
                      <View style={styles.pipsRow}>
                        {Array.from({ length: ab.maxUses }).map((_, idx) => {
                          const isAvailable = idx < currentUses;
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[
                                styles.pipCircle,
                                isAvailable
                                  ? [styles.pipActive, { backgroundColor: themeColor, borderColor: themeColor }]
                                  : styles.pipSpent,
                              ]}
                              onPress={() =>
                                onAdjustAbilityUses(ab.id, isAvailable ? -1 : 1)
                              }
                              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                            />
                          );
                        })}
                      </View>
                    </View>

                    {/* Botão de Reset Rápido */}
                    {currentUses < ab.maxUses && (
                      <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={() => onResetAbilityUses(ab.id)}
                      >
                        <RotateCcw size={11} color="#C5A059" />
                        <Text style={styles.resetBtnText}>Recarregar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Descrição com Suporte a Expandir */}
                {ab.description ? (
                  <View>
                    <Text
                      style={styles.descText}
                      numberOfLines={isExpanded ? undefined : 3}
                    >
                      {ab.description}
                    </Text>
                    {ab.description.length > 140 && (
                      <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => toggleExpand(ab.id)}
                      >
                        <Text style={styles.expandText}>
                          {isExpanded ? 'Mostrar menos' : 'Ler mais completo'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={12} color="#BAAFA0" />
                        ) : (
                          <ChevronDown size={12} color="#BAAFA0" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  specialResourceCard: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  specialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialTitle: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  specialResetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specialResetText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '600',
  },
  specialControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  specialControlsRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  specialStatsGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  specialStatsGroupMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bmStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  bmStatsGroupMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickStepBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStepBtnRowMobile: {
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
  },
  specialCurrentVal: {
    color: '#E6C280',
    fontSize: 26,
    fontWeight: 'bold',
  },
  specialMaxVal: {
    color: '#80776C',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
  },
  quickStepBtnMobile: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  quickStepText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  actionFilterScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
  },
  filterPillText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnMobile: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#80776C',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  abilityCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  abilityName: {
    color: '#E2D8C3',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  actionTypeBadge: {
    backgroundColor: '#241F1A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  actionTypeText: {
    color: '#BAAFA0',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  resetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#151310',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  resetBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  iconBtn: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 4,
    backgroundColor: '#1E1A16',
  },
  pipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#25201A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pipsLabel: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '600',
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pipCircle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  pipActive: {
    borderWidth: 1.5,
  },
  pipSpent: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4A4137',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resetBtnText: {
    color: '#C5A059',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  descText: {
    color: '#BAAFA0',
    fontSize: 11.5,
    lineHeight: 16,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expandText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  bmDcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bmDcLabel: {
    color: '#80776C',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bmDcVal: {
    color: '#E05252',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bmDcAttr: {
    color: '#BAAFA0',
    fontSize: 9.5,
  },
  bmDicePipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2D251E',
  },
  bmDicePipsRowMobile: {
    gap: 6,
  },
  bmDiePip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmDiePipMobile: {
    flex: 1,
    minWidth: '22%',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  bmDiePipActive: {
    backgroundColor: 'rgba(224, 82, 82, 0.15)',
    borderColor: '#E05252',
  },
  bmDiePipSpent: {
    backgroundColor: '#161310',
    borderColor: '#2D251E',
    opacity: 0.45,
  },
  bmDiePipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bmDiePipTextActive: {
    color: '#FF6B6B',
  },
  bmDiePipTextSpent: {
    color: '#80776C',
  },
});
