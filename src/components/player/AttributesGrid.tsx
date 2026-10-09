import { CharacterData } from '@/lib/mockData';
import { formatMod, getMod, getProfBonus } from '@/utils/dnd5e';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AttributesGridProps {
  char: CharacterData;
  themeColor?: string;
  isMobile?: boolean;
}

/**
 * Atributos em uma única linha compacta (6 cards). O modificador é o destaque;
 * o valor base fica pequeno. Atributos com salvaguarda proficiente ganham a cor do tema
 * e o modificador já inclui o bônus de proficiência.
 */
export const AttributesGrid: React.FC<AttributesGridProps> = React.memo(({
  char,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const prof = React.useMemo(() => getProfBonus(char.level), [char.level]);

  const attributes = React.useMemo(() => [
    { name: 'Força', abbr: 'FOR', score: char.str, prof: char.strProf },
    { name: 'Destreza', abbr: 'DES', score: char.dex, prof: char.dexProf },
    { name: 'Constituição', abbr: 'CON', score: char.con, prof: char.conProf },
    { name: 'Inteligência', abbr: 'INT', score: char.int, prof: char.intProf },
    { name: 'Sabedoria', abbr: 'SAB', score: char.wis, prof: char.wisProf },
    { name: 'Carisma', abbr: 'CAR', score: char.cha, prof: char.chaProf },
  ], [char.str, char.strProf, char.dex, char.dexProf, char.con, char.conProf, char.int, char.intProf, char.wis, char.wisProf, char.cha, char.chaProf]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>ATRIBUTOS</Text>

      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {attributes.map((attr) => {
          const baseMod = getMod(attr.score);
          const effectiveMod = attr.prof ? baseMod + prof : baseMod;

          return (
            <View
              key={attr.name}
              accessible
              accessibilityLabel={`${attr.name}: valor ${attr.score}, modificador ${formatMod(effectiveMod)}${
                attr.prof ? ', salvaguarda proficiente' : ''
              }`}
              style={[
                styles.attrCard,
                attr.prof && {
                  borderColor: themeColor,
                  backgroundColor: `${themeColor}12`,
                },
              ]}
            >
              <Text
                style={[styles.attrName, attr.prof && { color: themeColor, fontWeight: 'bold' }]}
                numberOfLines={1}
              >
                {attr.abbr}
              </Text>
              <Text style={[styles.attrMod, isMobile && styles.attrModMobile]}>{formatMod(effectiveMod)}</Text>
              <Text style={[styles.attrScore, attr.prof && { color: '#E2D8C3' }]}>{attr.score}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  sectionHeader: {
    color: '#9A8F82',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    gap: 6,
  },
  gridMobile: {
    gap: 4,
  },
  attrCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  attrName: {
    color: '#A89F91',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  attrMod: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  attrModMobile: {
    fontSize: 18,
    lineHeight: 22,
  },
  attrScore: {
    color: '#9A8F82',
    fontSize: 11,
    fontWeight: '500',
  },
});
