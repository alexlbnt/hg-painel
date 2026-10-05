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

export type ActionCategory = 'ALL' | 'ACAO' | 'BONUS' | 'REACAO' | 'LIVRE';

export const normalizeActionType = (act?: string): 'ACAO' | 'BONUS' | 'REACAO' | 'LIVRE' => {
  if (!act) return 'LIVRE';
  const clean = act
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos (ex: Ç -> C, Ã -> A, Ô -> O)

  if (clean.includes('BONUS')) return 'BONUS';
  if (clean.includes('REAC')) return 'REACAO';
  if (clean.includes('LIVRE') || clean.includes('PASSIV') || clean.includes('FREE')) return 'LIVRE';
  if (clean.includes('AC') || clean.includes('ACTION')) return 'ACAO';
  return 'LIVRE';
};

export const formatActionType = (act?: string): string => {
  const norm = normalizeActionType(act);
  switch (norm) {
    case 'ACAO':
      return 'AÇÃO';
    case 'BONUS':
      return 'BÔNUS';
    case 'REACAO':
      return 'REAÇÃO';
    case 'LIVRE':
    default:
      return 'LIVRE';
  }
};

export const getActionBadgeColors = (act?: string) => {
  const norm = normalizeActionType(act);
  switch (norm) {
    case 'ACAO':
      return { bg: 'rgba(224, 82, 82, 0.18)', border: '#E0525288', text: '#FF8A8A' };
    case 'BONUS':
      return { bg: 'rgba(212, 136, 58, 0.18)', border: '#D4883A88', text: '#F0C070' };
    case 'REACAO':
      return { bg: 'rgba(56, 189, 248, 0.18)', border: '#38BDF888', text: '#7DD3FC' };
    case 'LIVRE':
    default:
      return { bg: '#241F1A', border: '#3A322A', text: '#BAAFA0' };
  }
};

const ACTION_FILTERS: { id: ActionCategory; label: string }[] = [
  { id: 'ALL', label: 'Todas' },
  { id: 'ACAO', label: 'Ação' },
  { id: 'BONUS', label: 'Bônus' },
  { id: 'REACAO', label: 'Reação' },
  { id: 'LIVRE', label: 'Livre' },
];

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
  const [filterAction, setFilterAction] = useState<ActionCategory>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const abilities = useMemo(() => char.abilities || [], [char.abilities]);
  const filteredAbilities = useMemo(() => {
    if (filterAction === 'ALL') return abilities;
    return abilities.filter((a) => normalizeActionType(a.actionType) === filterAction);
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
      {(isMonk || (char.maxKiPoints || 0) > 0) && (
        <View style={styles.compactResourceCard}>
          <View style={styles.compactHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              <Zap size={14} color="#D4883A" />
              <Text style={styles.compactTitle}>PONTOS DE QI (MONGE)</Text>
            </View>
            {(char.kiPoints || 0) < (char.maxKiPoints || char.level) ? (
              <TouchableOpacity
                style={[styles.compactRestoreBtn, { borderColor: '#D4883A', backgroundColor: 'rgba(212, 136, 58, 0.1)' }]}
                onPress={() => onUpdateKiPoints(char.maxKiPoints || char.level)}
                activeOpacity={0.7}
              >
                <RotateCcw size={11} color="#D4883A" />
                <Text style={[styles.compactRestoreText, { color: '#D4883A' }]}>Restaurar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.compactRestPill}>
                <Sun size={10} color="#C5A059" />
                <Text style={styles.compactRestText}>Descanso Curto</Text>
              </View>
            )}
          </View>

          <View style={styles.compactTrayRow}>
            <View style={styles.compactCounterGroup}>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() => onUpdateKiPoints(Math.max(0, (char.kiPoints || 0) - 1))}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Minus size={11} color="#BAAFA0" />
              </TouchableOpacity>
              <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 2 }}>
                <Text style={[styles.compactCurrentVal, { color: '#E6C280' }]}>
                  {char.kiPoints || 0}
                </Text>
                <Text style={styles.compactMaxVal}>/{char.maxKiPoints || char.level}</Text>
              </View>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() =>
                  onUpdateKiPoints(
                    Math.min(char.maxKiPoints || char.level, (char.kiPoints || 0) + 1)
                  )
                }
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Plus size={11} color="#BAAFA0" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={styles.compactQuickBtn}
                onPress={() => onUpdateKiPoints(Math.max(0, (char.kiPoints || 0) - 1))}
                activeOpacity={0.7}
              >
                <Minus size={11} color="#BAAFA0" />
                <Text style={styles.compactQuickText}>1 Qi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactQuickBtn}
                onPress={() =>
                  onUpdateKiPoints(
                    Math.min(char.maxKiPoints || char.level, (char.kiPoints || 0) + 1)
                  )
                }
                activeOpacity={0.7}
              >
                <Plus size={11} color="#BAAFA0" />
                <Text style={styles.compactQuickText}>1 Qi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔮 PONTOS DE FEITIÇARIA (FEITICEIRO) */}
      {(isSorcerer || (char.maxSorceryPoints || 0) > 0) && (
        <View style={styles.compactResourceCard}>
          <View style={styles.compactHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              <Sparkles size={14} color="#C084FC" />
              <Text style={styles.compactTitle}>PONTOS DE FEITIÇARIA (FEITICEIRO)</Text>
            </View>
            {(char.sorceryPoints || 0) < (char.maxSorceryPoints || char.level) ? (
              <TouchableOpacity
                style={[styles.compactRestoreBtn, { borderColor: '#C084FC', backgroundColor: 'rgba(192, 132, 252, 0.1)' }]}
                onPress={() => onUpdateSorceryPoints(char.maxSorceryPoints || char.level)}
                activeOpacity={0.7}
              >
                <RotateCcw size={11} color="#C084FC" />
                <Text style={[styles.compactRestoreText, { color: '#C084FC' }]}>Restaurar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.compactRestPill}>
                <Moon size={10} color="#C084FC" />
                <Text style={[styles.compactRestText, { color: '#C084FC' }]}>Descanso Longo</Text>
              </View>
            )}
          </View>

          <View style={styles.compactTrayRow}>
            <View style={styles.compactCounterGroup}>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() => onUpdateSorceryPoints(Math.max(0, (char.sorceryPoints || 0) - 1))}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Minus size={11} color="#BAAFA0" />
              </TouchableOpacity>
              <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 2 }}>
                <Text style={[styles.compactCurrentVal, { color: '#C084FC' }]}>
                  {char.sorceryPoints || 0}
                </Text>
                <Text style={styles.compactMaxVal}>/{char.maxSorceryPoints || char.level}</Text>
              </View>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() =>
                  onUpdateSorceryPoints(
                    Math.min(char.maxSorceryPoints || char.level, (char.sorceryPoints || 0) + 1)
                  )
                }
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Plus size={11} color="#BAAFA0" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={styles.compactQuickBtn}
                onPress={() => onUpdateSorceryPoints(Math.max(0, (char.sorceryPoints || 0) - 1))}
                activeOpacity={0.7}
              >
                <Minus size={11} color="#BAAFA0" />
                <Text style={styles.compactQuickText}>1 PF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactQuickBtn}
                onPress={() =>
                  onUpdateSorceryPoints(
                    Math.min(char.maxSorceryPoints || char.level, (char.sorceryPoints || 0) + 1)
                  )
                }
                activeOpacity={0.7}
              >
                <Plus size={11} color="#BAAFA0" />
                <Text style={styles.compactQuickText}>1 PF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ⚔️ DADOS DE SUPERIORIDADE (GUERREIRO MESTRE DE BATALHA) */}
      {isBattleMaster && (
        <View style={styles.compactResourceCard}>
          {/* Linha 1: Título, CD de Resistência da Manobra e Ação de Restaurar / Info */}
          <View style={styles.compactHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              <Crosshair size={14} color="#E05252" />
              <Text style={styles.compactTitle}>DADOS DE SUPERIORIDADE</Text>
              <View style={styles.compactDcBadge}>
                <Text style={styles.compactDcLabel}>CD</Text>
                <Text style={styles.compactDcVal}>{bmStats.saveDc}</Text>
                <Text style={styles.compactDcAttr}>({bmStats.bestPhysicalAttr})</Text>
              </View>
            </View>

            {bmStats.currentDice < bmStats.maxDice ? (
              <TouchableOpacity
                style={styles.compactRestoreBtn}
                onPress={() => onUpdateSuperiorityDice?.(bmStats.maxDice)}
                activeOpacity={0.7}
              >
                <RotateCcw size={11} color="#E05252" />
                <Text style={styles.compactRestoreText}>Restaurar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.compactRestPill}>
                <Sun size={10} color="#C5A059" />
                <Text style={styles.compactRestText}>Descanso Curto</Text>
              </View>
            )}
          </View>

          {/* Linha 2: Contador Numérico Compacto + Bandeja de Dados Clicáveis */}
          <View style={styles.compactTrayRow}>
            <View style={styles.compactCounterGroup}>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() => onUpdateSuperiorityDice?.(Math.max(0, bmStats.currentDice - 1))}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Minus size={11} color="#BAAFA0" />
              </TouchableOpacity>
              <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 2 }}>
                <Text style={[styles.compactCurrentVal, { color: bmStats.currentDice > 0 ? '#E05252' : '#80776C' }]}>
                  {bmStats.currentDice}
                </Text>
                <Text style={styles.compactMaxVal}>/{bmStats.maxDice}</Text>
              </View>
              <TouchableOpacity
                style={styles.compactMiniStepBtn}
                onPress={() => onUpdateSuperiorityDice?.(Math.min(bmStats.maxDice, bmStats.currentDice + 1))}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Plus size={11} color="#BAAFA0" />
              </TouchableOpacity>
            </View>

            {/* Slots táteis dos dados de superioridade */}
            <View style={styles.compactDiceGrid}>
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
                      styles.compactDiePip,
                      isAvailable ? styles.compactDiePipActive : styles.compactDiePipSpent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.compactDieText,
                        isAvailable ? styles.compactDieTextActive : styles.compactDieTextSpent,
                      ]}
                      numberOfLines={1}
                    >
                      🎲 {isAvailable ? bmStats.dieType : 'Gasto'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
          {ACTION_FILTERS.map((f) => {
            const isSelected = filterAction === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                ]}
                onPress={() => setFilterAction(f.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && { color: '#110F0D', fontWeight: 'bold' },
                  ]}
                >
                  {f.label}
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
                      {ab.actionType && (() => {
                        const badgeColors = getActionBadgeColors(ab.actionType);
                        return (
                          <View
                            style={[
                              styles.actionTypeBadge,
                              { backgroundColor: badgeColors.bg, borderColor: badgeColors.border, borderWidth: 1 },
                            ]}
                          >
                            <Text style={[styles.actionTypeText, { color: badgeColors.text }]}>
                              {formatActionType(ab.actionType)}
                            </Text>
                          </View>
                        );
                      })()}
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
  compactResourceCard: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 6,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  compactDcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  compactDcLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
  },
  compactDcVal: {
    color: '#E05252',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compactDcAttr: {
    color: '#BAAFA0',
    fontSize: 9,
  },
  compactRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(224, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: '#E05252',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactRestoreText: {
    color: '#E05252',
    fontSize: 10,
    fontWeight: 'bold',
  },
  compactRestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactRestText: {
    color: '#C5A059',
    fontSize: 9.5,
    fontWeight: '600',
  },
  compactTrayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactCounterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#26201A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  compactMiniStepBtn: {
    padding: 3,
    borderRadius: 3,
    backgroundColor: '#1D1915',
  },
  compactCurrentVal: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  compactMaxVal: {
    color: '#80776C',
    fontSize: 10.5,
    fontWeight: '600',
  },
  compactDiceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  compactDiePip: {
    flex: 1,
    height: 26,
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  compactDiePipActive: {
    backgroundColor: 'rgba(224, 82, 82, 0.12)',
    borderColor: '#E05252',
  },
  compactDiePipSpent: {
    backgroundColor: '#14120F',
    borderColor: '#26201A',
    opacity: 0.45,
  },
  compactDieText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  compactDieTextActive: {
    color: '#FF7B7B',
  },
  compactDieTextSpent: {
    color: '#706558',
  },
  compactQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
  compactQuickText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: '600',
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
});
