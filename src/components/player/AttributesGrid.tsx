import { CharacterData } from '@/lib/mockData';
import { formatMod, getMod, getProfBonus } from '@/utils/dnd5e';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AttributesGridProps {
  char: CharacterData;
  themeColor?: string;
  /** Celular: 6 cards compactos em uma única linha. Demais telas: 2 fileiras de 3. */
  isMobile?: boolean;
}

/**
 * Atributos da ficha. Atributos com salvaguarda proficiente ganham a cor do tema
 * e o modificador já inclui o bônus de proficiência.
 */
export const AttributesGrid: React.FC<AttributesGridProps> = React.memo(({
  char,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const prof = React.useMemo(() => getProfBonus(char.level), [char.level]);

  const attributes = React.useMemo(() => [
    { name: 'FORÇA', abbr: 'FOR', score: char.str, prof: char.strProf },
    { name: 'DESTREZA', abbr: 'DES', score: char.dex, prof: char.dexProf },
    { name: 'CONSTITUIÇÃO', abbr: 'CON', score: char.con, prof: char.conProf },
    { name: 'INTELIGÊNCIA', abbr: 'INT', score: char.int, prof: char.intProf },
    { name: 'SABEDORIA', abbr: 'SAB', score: char.wis, prof: char.wisProf },
    { name: 'CARISMA', abbr: 'CAR', score: char.cha, prof: char.chaProf },
  ], [char.str, char.strProf, char.dex, char.dexProf, char.con, char.conProf, char.int, char.intProf, char.wis, char.wisProf, char.cha, char.chaProf]);

  return (
    <View style={isMobile ? styles.containerCompact : styles.container}>
      <Text style={styles.sectionHeader}>ATRIBUTOS</Text>

      <View style={isMobile ? styles.rowCompact : styles.grid}>
        {attributes.map((attr) => {
          const baseMod = getMod(attr.score);
          const effectiveMod = attr.prof ? baseMod + prof : baseMod;
          const a11y = `${attr.name.charAt(0)}${attr.name.slice(1).toLowerCase()}: valor ${attr.score}, modificador ${formatMod(effectiveMod)}${
            attr.prof ? ', salvaguarda proficiente' : ''
          }`;
          const profStyle = attr.prof && { borderColor: themeColor, backgroundColor: `${themeColor}12` };

          // Celular: card compacto (sigla, modificador e valor base)
          if (isMobile) {
            return (
              <View key={attr.name} accessible accessibilityLabel={a11y} style={[styles.cardCompact, profStyle]}>
                <Text
                  style={[styles.nameCompact, attr.prof && { color: themeColor, fontWeight: 'bold' }]}
                  numberOfLines={1}
                >
                  {attr.abbr}
                </Text>
                <Text style={styles.modCompact}>{formatMod(effectiveMod)}</Text>
                <Text style={[styles.scoreCompact, attr.prof && { color: '#E2D8C3' }]}>{attr.score}</Text>
              </View>
            );
          }

          // Desktop/tablet: 2 fileiras de 3
          return (
            <View
              key={attr.name}
              accessible
              accessibilityLabel={a11y}
              style={[styles.card, attr.prof && { borderColor: themeColor, backgroundColor: `${themeColor}0E` }]}
            >
              <View style={styles.nameRow}>
                <Text style={[styles.name, attr.prof && { color: themeColor, fontWeight: 'bold' }]} numberOfLines={1}>
                  {attr.name}
                </Text>
                {attr.prof && <Sparkles size={11} color={themeColor} />}
              </View>
              <Text style={styles.mod}>{formatMod(effectiveMod)}</Text>
              <View style={[styles.scorePill, attr.prof && { backgroundColor: `${themeColor}1E` }]}>
                <Text style={[styles.score, attr.prof && { color: '#E2D8C3', fontWeight: 'bold' }]}>
                  Score {attr.score}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionHeader: {
    color: '#9A8F82',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },

  // ---- Desktop / tablet: 2 fileiras de 3 ----
  container: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: {
    color: '#A89F91',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  mod: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  scorePill: {
    backgroundColor: '#1E1A16',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  score: {
    color: '#9A8F82',
    fontSize: 11,
    fontWeight: '500',
  },

  // ---- Celular: 6 cards compactos em uma linha ----
  containerCompact: {
    gap: 6,
  },
  rowCompact: {
    flexDirection: 'row',
    gap: 4,
  },
  cardCompact: {
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
  nameCompact: {
    color: '#A89F91',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  modCompact: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  scoreCompact: {
    color: '#9A8F82',
    fontSize: 11,
    fontWeight: '500',
  },
});
