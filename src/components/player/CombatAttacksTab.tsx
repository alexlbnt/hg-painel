import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import {
  calculateWeaponAttack,
  getMod,
  getProfBonus,
  isCombatOffensiveSpell,
  getSpellDamageFormula,
} from '@/utils/dnd5e';
import { ActionCalculator } from './ActionCalculator';
import {
  Sword,
  Flame,
  CheckCircle,
  Package,
} from 'lucide-react-native';

interface CombatAttacksTabProps {
  char: CharacterData;
  onToggleEquipWeapon: (itemId: string) => void;
  onGoToInventory: () => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CombatAttacksTab: React.FC<CombatAttacksTabProps> = ({
  char,
  onToggleEquipWeapon,
  onGoToInventory,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const prof = getProfBonus(char.level);

  // Armas do inventário
  const weapons = (char.items || []).filter((i) => i.isWeapon);

  // Truques e magias de ataque
  const spellcastingAttr =
    char.class.toLowerCase().includes('mago')
      ? 'int'
      : char.class.toLowerCase().includes('clérigo') ||
        char.class.toLowerCase().includes('clerigo') ||
        char.class.toLowerCase().includes('druida') ||
        char.class.toLowerCase().includes('patrulheiro')
      ? 'wis'
      : 'cha';

  const spellMod = getMod((char as any)[spellcastingAttr] || 10);
  const spellAttackBonus = spellMod + prof;
  const spellSaveDc = 8 + prof + spellMod;

  // Filtra estritamente apenas truques e magias de ataque/dano (D&D 5e)
  const combatSpells = (char.spells || []).filter((s) => isCombatOffensiveSpell(s));

  return (
    <View style={styles.container}>
      {/* ⚔️ 0. CALCULADORA DE AÇÃO & COMBOS */}
      <ActionCalculator
        char={char}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* ⚔️ 1. SEÇÃO DE ARMAS & ATAQUES CORPO A CORPO / DISTÂNCIA */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sword size={16} color={themeColor} />
            <Text style={styles.sectionTitle}>ARMAS & ATAQUES</Text>
          </View>
          <TouchableOpacity onPress={onGoToInventory} style={styles.manageBtn}>
            <Package size={12} color="#BAAFA0" />
            <Text style={styles.manageBtnText}>Mochila de Armas</Text>
          </TouchableOpacity>
        </View>

        {weapons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Nenhuma arma cadastrada no inventário. Adicione armas na aba Mochila!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {weapons.map((w) => {
              const attack = calculateWeaponAttack(char, w);

              return (
                <View
                  key={w.id}
                  style={[
                    styles.attackCard,
                    w.isEquipped && {
                      borderColor: themeColor,
                      backgroundColor: `${themeColor}0D`,
                    },
                  ]}
                >
                  <View style={styles.attackMainInfo}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.weaponName}>{w.name}</Text>
                        {w.isEquipped && (
                          <View style={[styles.equippedBadge, { backgroundColor: `${themeColor}22` }]}>
                            <CheckCircle size={10} color={themeColor} />
                            <Text style={[styles.equippedText, { color: themeColor }]}>EM COMBATE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.weaponModHint}>
                        Usa Modificador de {attack.modUsed === 'dex' ? 'Destreza (Acuidade/Distância)' : 'Força'}
                      </Text>
                    </View>

                    {/* Botão de Empunhar / Desequipar */}
                    <TouchableOpacity
                      style={[
                        styles.toggleEquipBtn,
                        w.isEquipped
                          ? { backgroundColor: 'rgba(184, 40, 40, 0.15)', borderColor: '#B82828' }
                          : { backgroundColor: 'rgba(78, 156, 142, 0.15)', borderColor: '#4E9C8E' },
                      ]}
                      onPress={() => onToggleEquipWeapon(w.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.toggleEquipText,
                          { color: w.isEquipped ? '#E57373' : '#78C288' },
                        ]}
                      >
                        {w.isEquipped ? 'Desequipar' : 'Empunhar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Estatísticas de Ataque e Dano para Consulta na Mesa */}
                  <View style={styles.attackStatsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>ACERTO (D20)</Text>
                      <Text style={[styles.statValHit, { color: themeColor }]}>
                        {attack.attackBonusStr}
                      </Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={[styles.statBox, { flex: 1.5 }]}>
                      <Text style={styles.statLabel}>DANO DA ARMA</Text>
                      <Text style={styles.statValDmg}>{attack.damageFormula}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 🔮 2. TRUQUES & MAGIAS DE ATAQUE */}
      {combatSpells.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Flame size={16} color="#E57373" />
              <Text style={styles.sectionTitle}>TRUQUES & MAGIAS OFENSIVAS</Text>
            </View>
            <View style={styles.spellHeaderMeta}>
              <Text style={styles.spellMetaLabel}>
                Ataque Mágico: <Text style={{ color: '#4E9C8E', fontWeight: 'bold' }}>+{spellAttackBonus}</Text> | CD: <Text style={{ color: '#E6C280', fontWeight: 'bold' }}>{spellSaveDc}</Text>
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {combatSpells.map((spell) => {
              const dmgFormula = getSpellDamageFormula(spell);

              return (
                <View key={spell.id} style={styles.spellCombatCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.spellCombatName}>{spell.name}</Text>
                      <View style={styles.spellLevelBadge}>
                        <Text style={styles.spellLevelText}>
                          {spell.level === 0 ? 'TRUQUE' : `NVL ${spell.level}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.spellDetailsText} numberOfLines={2}>
                      {spell.range ? `Alcance: ${spell.range} • ` : ''}
                      {spell.castingTime ? `Tempo: ${spell.castingTime} • ` : ''}
                      {spell.duration || 'Instantânea'}
                    </Text>
                  </View>

                  <View
                    style={[
                      isMobile
                        ? { flexDirection: 'column', alignItems: 'flex-end', gap: 4 }
                        : { flexDirection: 'row', alignItems: 'center', gap: 6 },
                    ]}
                  >
                    {dmgFormula && (
                      <View
                        style={[
                          styles.spellRollPill,
                          {
                            backgroundColor: 'rgba(201, 91, 91, 0.12)',
                            borderColor: 'rgba(201, 91, 91, 0.3)',
                          },
                        ]}
                      >
                        <Text style={[styles.spellRollLabel, { color: '#E57373' }]}>DANO</Text>
                        <Text style={[styles.spellRollVal, { color: '#FFB4B4' }]}>
                          {dmgFormula}
                        </Text>
                      </View>
                    )}
                    <View style={styles.spellRollPill}>
                      <Text style={styles.spellRollLabel}>Ataque / CD</Text>
                      <Text style={styles.spellRollVal}>
                        +{spellAttackBonus} / CD {spellSaveDc}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A241E',
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#E2D8C3',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#241F1A',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  manageBtnText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#80776C',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  attackCard: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  attackMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  weaponName: {
    color: '#E2D8C3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  equippedText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  weaponModHint: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 2,
  },
  toggleEquipBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleEquipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  attackStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161310',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValHit: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statValDmg: {
    color: '#E6C280',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2D251E',
    marginHorizontal: 8,
  },
  spellHeaderMeta: {
    backgroundColor: '#14120F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  spellMetaLabel: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  spellCombatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  spellCombatName: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  spellLevelBadge: {
    backgroundColor: 'rgba(229, 115, 115, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  spellLevelText: {
    color: '#E57373',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  spellDetailsText: {
    color: '#80776C',
    fontSize: 11,
    marginTop: 2,
  },
  spellRollPill: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  spellRollLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: '600',
  },
  spellRollVal: {
    color: '#4E9C8E',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
