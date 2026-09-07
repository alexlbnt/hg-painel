import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AbilityData, CharacterData } from '@/lib/mockData';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Infinity as InfinityIcon,
  Minus,
  Moon,
  Plus,
  RotateCcw,
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
  themeColor?: string;
  isMobile?: boolean;
}

export const AbilitiesTab: React.FC<AbilitiesTabProps> = ({
  char,
  onAdjustAbilityUses,
  onResetAbilityUses,
  onOpenAddAbilityModal,
  onEditAbility,
  onDeleteAbility,
  onUpdateKiPoints,
  onUpdateSorceryPoints,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const abilities = char.abilities || [];
  const filteredAbilities =
    filterAction === 'ALL'
      ? abilities
      : abilities.filter((a) => (a.actionType || 'LIVRE').toUpperCase() === filterAction);

  // Recursos Especiais (Monk Ki / Sorcerer Points)
  const isMonk = char.class.toLowerCase().includes('monge');
  const isSorcerer = char.class.toLowerCase().includes('feiticeiro');

  return (
    <View style={styles.container}>
      {/* 🥋 PONTOS DE QI / KI (MONGE) */}
      {(isMonk || (char.maxKiPoints || 0) > 0) && (
        <View style={styles.specialResourceCard}>
          <View style={styles.specialHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={15} color="#D4883A" />
              <Text style={styles.specialTitle}>PONTOS DE QI / KI (MONGE)</Text>
            </View>
            <View style={styles.specialResetPill}>
              <Sun size={11} color="#C5A059" />
              <Text style={styles.specialResetText}>Recarrega em Descanso Curto</Text>
            </View>
          </View>

          <View style={styles.specialControlsRow}>
            <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
              <Text style={styles.specialCurrentVal}>{char.kiPoints || 0}</Text>
              <Text style={styles.specialMaxVal}>/ {char.maxKiPoints || char.level}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.quickStepBtn}
                onPress={() => onUpdateKiPoints(Math.max(0, (char.kiPoints || 0) - 1))}
              >
                <Minus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Qi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickStepBtn}
                onPress={() =>
                  onUpdateKiPoints(
                    Math.min(char.maxKiPoints || char.level, (char.kiPoints || 0) + 1)
                  )
                }
              >
                <Plus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 Qi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, { borderColor: '#D4883A' }]}
                onPress={() => onUpdateKiPoints(char.maxKiPoints || char.level)}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} color="#C084FC" />
              <Text style={styles.specialTitle}>PONTOS DE FEITIÇARIA (FEITICEIRO)</Text>
            </View>
            <View style={styles.specialResetPill}>
              <Moon size={11} color="#C084FC" />
              <Text style={[styles.specialResetText, { color: '#C084FC' }]}>
                Recarrega em Descanso Longo
              </Text>
            </View>
          </View>

          <View style={styles.specialControlsRow}>
            <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
              <Text style={[styles.specialCurrentVal, { color: '#C084FC' }]}>
                {char.sorceryPoints || 0}
              </Text>
              <Text style={styles.specialMaxVal}>
                / {char.maxSorceryPoints || char.level}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.quickStepBtn}
                onPress={() =>
                  onUpdateSorceryPoints(Math.max(0, (char.sorceryPoints || 0) - 1))
                }
              >
                <Minus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 PF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickStepBtn}
                onPress={() =>
                  onUpdateSorceryPoints(
                    Math.min(
                      char.maxSorceryPoints || char.level,
                      (char.sorceryPoints || 0) + 1
                    )
                  )
                }
              >
                <Plus size={13} color="#BAAFA0" />
                <Text style={styles.quickStepText}>1 PF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickStepBtn, { borderColor: '#C084FC' }]}
                onPress={() =>
                  onUpdateSorceryPoints(char.maxSorceryPoints || char.level)
                }
              >
                <RotateCcw size={12} color="#C084FC" />
                <Text style={[styles.quickStepText, { color: '#C084FC' }]}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* BARRA DE FILTRO POR TIPO DE AÇÃO & NOVA HABILIDADE */}
      <View style={styles.toolbar}>
        <View style={styles.actionFilterScroll}>
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
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { borderColor: themeColor }]}
          onPress={onOpenAddAbilityModal}
          activeOpacity={0.7}
        >
          <Plus size={12} color={themeColor} />
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
};

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
    gap: 4,
    backgroundColor: '#161310',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  actionFilterScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 9,
    paddingVertical: 4,
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
    paddingVertical: 5,
    borderRadius: 6,
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
