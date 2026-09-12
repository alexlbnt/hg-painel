import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { formatMod, getMod, getProfBonus } from '@/utils/dnd5e';
import { Sparkles } from 'lucide-react-native';

interface AttributesGridProps {
  char: CharacterData;
  themeColor?: string;
  isMobile?: boolean;
}

export const AttributesGrid: React.FC<AttributesGridProps> = ({
  char,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const prof = getProfBonus(char.level);

  const attributes = [
    { name: 'FORÇA', abbr: 'FOR', score: char.str, prof: char.strProf },
    { name: 'DESTREZA', abbr: 'DES', score: char.dex, prof: char.dexProf },
    { name: 'CONSTITUIÇÃO', abbr: 'CON', score: char.con, prof: char.conProf },
    { name: 'INTELIGÊNCIA', abbr: 'INT', score: char.int, prof: char.intProf },
    { name: 'SABEDORIA', abbr: 'SAB', score: char.wis, prof: char.wisProf },
    { name: 'CARISMA', abbr: 'CAR', score: char.cha, prof: char.chaProf },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>ATRIBUTOS & SALVAGUARDAS</Text>
        <Text style={styles.headerHint}>✦ Bônus de Salvaguarda incluído nos atributos proficientes</Text>
      </View>

      <View style={[styles.grid, isMobile && { gap: 8 }]}>
        {attributes.map((attr) => {
          const baseMod = getMod(attr.score);
          const effectiveMod = attr.prof ? baseMod + prof : baseMod;

          return (
            <View
              key={attr.name}
              style={[
                styles.attrCard,
                isMobile && styles.attrCardMobile,
                attr.prof && {
                  borderColor: themeColor,
                  backgroundColor: `${themeColor}0E`,
                },
              ]}
            >
              {/* Nome do Atributo */}
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.attrName,
                    attr.prof && { color: themeColor, fontWeight: 'bold' },
                  ]}
                  numberOfLines={1}
                >
                  {isMobile ? attr.abbr : attr.name}
                </Text>
                {attr.prof && <Sparkles size={11} color={themeColor} />}
              </View>

              {/* Modificador Principal (com Salvaguarda se proficiente) */}
              <Text
                style={[
                  styles.attrMod,
                  isMobile && { fontSize: 26, marginVertical: 1 },
                ]}
              >
                {formatMod(effectiveMod)}
              </Text>

              {/* Valor Bruto / Score */}
              <View
                style={[
                  styles.scorePill,
                  attr.prof && { backgroundColor: `${themeColor}1E` },
                ]}
              >
                <Text
                  style={[
                    styles.attrScore,
                    attr.prof && { color: '#E2D8C3', fontWeight: 'bold' },
                  ]}
                >
                  Score {attr.score}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionHeader: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerHint: {
    color: '#6B6257',
    fontSize: 10.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  attrCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attrCardMobile: {
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  attrName: {
    color: '#A89F91',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  attrMod: {
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
  attrScore: {
    color: '#80776C',
    fontSize: 10.5,
    fontWeight: '500',
  },
});
