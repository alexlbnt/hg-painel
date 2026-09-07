import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData, SpellItemData } from '@/lib/mockData';
import { getMod, getProfBonus } from '@/utils/dnd5e';
import { parseClassesAndCalculateSlots } from '@/utils/spellProgression';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react-native';

interface SpellsManagerTabProps {
  char: CharacterData;
  onToggleSpellSlot: (level: number, slotIndex: number) => void;
  onRestoreSlotsLevel: (level: number) => void;
  onToggleSpellPrepared: (spellId: string) => void;
  onSetConcentration: (spellName: string) => void;
  activeConcentration: string | null;
  onOpenAddSpellModal: (level?: number) => void;
  onOpenSrdSearch: () => void;
  onEditSpell: (spell: SpellItemData) => void;
  onDeleteSpell: (spellId: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const SpellsManagerTab: React.FC<SpellsManagerTabProps> = ({
  char,
  onToggleSpellSlot,
  onRestoreSlotsLevel,
  onToggleSpellPrepared,
  onSetConcentration,
  activeConcentration,
  onOpenAddSpellModal,
  onOpenSrdSearch,
  onEditSpell,
  onDeleteSpell,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [filterPreparedOnly, setFilterPreparedOnly] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const prof = getProfBonus(char.level);

  // Atributo de Conjuração
  const spellAttr =
    char.class.toLowerCase().includes('mago')
      ? 'int'
      : char.class.toLowerCase().includes('clérigo') ||
        char.class.toLowerCase().includes('clerigo') ||
        char.class.toLowerCase().includes('druida') ||
        char.class.toLowerCase().includes('patrulheiro')
      ? 'wis'
      : 'cha';

  const attrName = spellAttr === 'int' ? 'Inteligência' : spellAttr === 'wis' ? 'Sabedoria' : 'Carisma';
  const attrMod = getMod((char as any)[spellAttr] || 10);
  const saveDc = 8 + prof + attrMod;
  const attackBonus = prof + attrMod;

  const toggleLevel = (lvl: number) => {
    setExpandedLevels((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  // Níveis disponíveis
  const charSpells = char.spells || [];
  const availableLevelsSet = new Set<number>([0, 1]);
  charSpells.forEach((s) => availableLevelsSet.add(s.level));
  (char.spellSlots || []).forEach((s) => availableLevelsSet.add(s.level));

  const calculated = parseClassesAndCalculateSlots(char.class || '', char.level || 1);
  Object.keys(calculated.standard).forEach((lvl) => availableLevelsSet.add(Number(lvl)));
  if (calculated.warlock) availableLevelsSet.add(calculated.warlock.level);

  const sortedLevels = Array.from(availableLevelsSet).sort((a, b) => a - b);

  return (
    <View style={styles.container}>
      {/* 🔮 1. BANNER DE ESTATÍSTICAS MÁGICAS */}
      <View style={[styles.statsBanner, { borderColor: `${themeColor}44` }]}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>CONJURAÇÃO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} color={themeColor} />
            <Text style={[styles.statVal, { color: themeColor }]}>
              {attrName.slice(0, 3).toUpperCase()} ({attrMod >= 0 ? `+${attrMod}` : attrMod})
            </Text>
          </View>
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>CD DE RESISTÊNCIA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Shield size={13} color="#E6C280" />
            <Text style={[styles.statVal, { color: '#E6C280' }]}>{saveDc}</Text>
          </View>
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>ATAQUE MÁGICO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Crosshair size={13} color="#4E9C8E" />
            <Text style={[styles.statVal, { color: '#4E9C8E' }]}>
              {attackBonus >= 0 ? `+${attackBonus}` : attackBonus}
            </Text>
          </View>
        </View>
      </View>

      {/* 🔮 2. BARRA DE FERRAMENTAS (BUSCA SRD, NOVA MAGIA, FILTRO PREPARADAS) */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            filterPreparedOnly && { backgroundColor: themeColor, borderColor: themeColor },
          ]}
          onPress={() => setFilterPreparedOnly(!filterPreparedOnly)}
          activeOpacity={0.7}
        >
          <Eye size={12} color={filterPreparedOnly ? '#111' : '#BAAFA0'} />
          <Text
            style={[
              styles.filterPillText,
              filterPreparedOnly && { color: '#111', fontWeight: 'bold' },
            ]}
          >
            Apenas Preparadas
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
          <TouchableOpacity
            style={styles.srdBtn}
            onPress={onOpenSrdSearch}
            activeOpacity={0.7}
          >
            <Search size={12} color="#78C288" />
            <Text style={styles.srdBtnText}>Buscar SRD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addSpellBtn, { borderColor: themeColor }]}
            onPress={() => onOpenAddSpellModal()}
            activeOpacity={0.7}
          >
            <Plus size={12} color={themeColor} />
            <Text style={[styles.addSpellBtnText, { color: themeColor }]}>Nova Magia</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔮 3. ACORDEÃO DE CÍRCULOS DE MAGIA COM PIPS DE SLOTS */}
      <View style={{ gap: 12 }}>
        {sortedLevels.map((lvl) => {
          const slot = (char.spellSlots || []).find((s) => s.level === lvl);
          const totalSlots = slot ? slot.total : 0;
          const usedSlots = slot ? slot.used : 0;
          const availableSlots = Math.max(0, totalSlots - usedSlots);

          let levelSpells = charSpells.filter((s) => s.level === lvl);
          if (filterPreparedOnly && lvl > 0) {
            levelSpells = levelSpells.filter((s) => s.isPrepared);
          }

          const isExpanded = expandedLevels[lvl] ?? false;

          return (
            <View key={lvl} style={styles.levelCard}>
              {/* Header do Nível */}
              <TouchableOpacity
                style={styles.levelHeader}
                onPress={() => toggleLevel(lvl)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={styles.levelTitle}>
                    {lvl === 0 ? 'TRUQUES (CANTRIPS)' : `${lvl}º CÍRCULO`}
                  </Text>
                  <Text style={styles.spellCountBadge}>({levelSpells.length})</Text>
                </View>

                {/* Pips de Espaços de Magia (se lvl > 0) */}
                {lvl > 0 && totalSlots > 0 && (
                  <View style={styles.slotsPipsContainer}>
                    <Text style={styles.slotsLabel}>
                      Slots: {availableSlots}/{totalSlots}
                    </Text>
                    <View style={styles.pipsRow}>
                      {Array.from({ length: totalSlots }).map((_, idx) => {
                        const isSpent = idx < usedSlots;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.pipCircle,
                              isSpent
                                ? styles.pipSpent
                                : [styles.pipAvailable, { backgroundColor: themeColor, borderColor: themeColor }],
                            ]}
                            onPress={() => onToggleSpellSlot(lvl, idx)}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          />
                        );
                      })}
                    </View>

                    {usedSlots > 0 && (
                      <TouchableOpacity
                        onPress={() => onRestoreSlotsLevel(lvl)}
                        style={styles.restoreSlotBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <RotateCcw size={11} color="#C5A059" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {isExpanded ? (
                  <ChevronUp size={16} color="#80776C" />
                ) : (
                  <ChevronDown size={16} color="#80776C" />
                )}
              </TouchableOpacity>

              {/* Lista de Magias deste Círculo */}
              {isExpanded && (
                <View style={styles.spellsList}>
                  {levelSpells.length === 0 ? (
                    <Text style={styles.noSpellsText}>
                      Nenhuma magia registrada neste círculo.
                    </Text>
                  ) : (
                    levelSpells.map((spell) => {
                      const isConcentrating = activeConcentration === spell.name;

                      return (
                        <View
                          key={spell.id}
                          style={[
                            styles.spellItem,
                            isConcentrating && {
                              borderColor: '#9333EA',
                              backgroundColor: 'rgba(147, 51, 234, 0.1)',
                            },
                          ]}
                        >
                          {/* Linha Superior da Magia */}
                          <View style={styles.spellTopRow}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.spellName}>{spell.name}</Text>

                                {/* Indicador de Concentração */}
                                {isConcentrating && (
                                  <View style={styles.activeConcBadge}>
                                    <Sparkles size={9} color="#D8B4FE" />
                                    <Text style={styles.activeConcText}>CONCENTRANDO</Text>
                                  </View>
                                )}
                              </View>

                              {/* Metadados rápidos */}
                              <Text style={styles.spellMetaDetails}>
                                {spell.castingTime || '1 Ação'} • {spell.range || '9m'} •{' '}
                                {spell.duration || 'Instantânea'}
                              </Text>
                            </View>

                            {/* Botões de Ação na Magia */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {/* Botão Preparar (se nível > 0) */}
                              {lvl > 0 && (
                                <TouchableOpacity
                                  style={[
                                    styles.actionIconBtn,
                                    spell.isPrepared && {
                                      backgroundColor: 'rgba(78, 156, 142, 0.2)',
                                      borderColor: '#4E9C8E',
                                    },
                                  ]}
                                  onPress={() => onToggleSpellPrepared(spell.id)}
                                >
                                  {spell.isPrepared ? (
                                    <Eye size={13} color="#4E9C8E" />
                                  ) : (
                                    <EyeOff size={13} color="#6B6257" />
                                  )}
                                </TouchableOpacity>
                              )}

                              {/* Botão Concentrar */}
                              <TouchableOpacity
                                style={[
                                  styles.actionIconBtn,
                                  isConcentrating && {
                                    backgroundColor: 'rgba(147, 51, 234, 0.25)',
                                    borderColor: '#9333EA',
                                  },
                                ]}
                                onPress={() => onSetConcentration(spell.name)}
                              >
                                <Zap size={13} color={isConcentrating ? '#C084FC' : '#80776C'} />
                              </TouchableOpacity>

                              {/* Editar */}
                              <TouchableOpacity
                                style={styles.actionIconBtn}
                                onPress={() => onEditSpell(spell)}
                              >
                                <Edit2 size={13} color="#80776C" />
                              </TouchableOpacity>

                              {/* Excluir */}
                              <TouchableOpacity
                                style={styles.actionIconBtn}
                                onPress={() => onDeleteSpell(spell.id)}
                              >
                                <Trash2 size={13} color="#B82828" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Descrição da Magia */}
                          {spell.description ? (
                            <Text style={styles.spellDesc}>{spell.description}</Text>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#191613',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2D251E',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  filterPillText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  srdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(120, 194, 136, 0.12)',
    borderWidth: 1,
    borderColor: '#4A8C59',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  srdBtnText: {
    color: '#78C288',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addSpellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addSpellBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  levelCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    overflow: 'hidden',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1D1915',
    gap: 8,
  },
  levelTitle: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spellCountBadge: {
    color: '#80776C',
    fontSize: 11,
  },
  slotsPipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotsLabel: {
    color: '#BAAFA0',
    fontSize: 10.5,
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  pipCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pipAvailable: {
    borderWidth: 1.5,
  },
  pipSpent: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4A4137',
  },
  restoreSlotBtn: {
    padding: 2,
  },
  spellsList: {
    padding: 10,
    gap: 8,
  },
  noSpellsText: {
    color: '#6B6257',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  spellItem: {
    backgroundColor: '#151310',
    borderWidth: 1,
    borderColor: '#2A241E',
    borderRadius: 6,
    padding: 10,
    gap: 6,
  },
  spellTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  spellName: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeConcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(147, 51, 234, 0.25)',
    borderWidth: 1,
    borderColor: '#9333EA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeConcText: {
    color: '#D8B4FE',
    fontSize: 9,
    fontWeight: 'bold',
  },
  spellMetaDetails: {
    color: '#80776C',
    fontSize: 10.5,
    marginTop: 2,
  },
  actionIconBtn: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#332B23',
    backgroundColor: '#1E1A16',
    borderRadius: 4,
  },
  spellDesc: {
    color: '#BAAFA0',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
