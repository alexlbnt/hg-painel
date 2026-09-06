import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { formatMod, getMod, getProfBonus } from '@/utils/dnd5e';
import { Shield, Sparkles } from 'lucide-react-native';

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
        <Text style={styles.headerHint}>Modificador de atributo / Teste de Resistência</Text>
      </View>

      <View style={[styles.grid, isMobile && { gap: 8 }]}>
        {attributes.map((attr) => {
          const mod = getMod(attr.score);
          const saveVal = mod + (attr.prof ? prof : 0);

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

              {/* Modificador Canônico de Atributo (Número Principal) */}
              <Text
                style={[
                  styles.attrMod,
                  isMobile && { fontSize: 26, marginVertical: 1 },
                ]}
              >
                {formatMod(mod)}
              </Text>

              {/* Valor Bruto / Score */}
              <View style={styles.scorePill}>
                <Text style={styles.attrScore}>Score {attr.score}</Text>
              </View>

              {/* Pill de Teste de Resistência (Save) */}
              <View
                style={[
                  styles.savePill,
                  attr.prof
                    ? {
                        backgroundColor: `${themeColor}22`,
                        borderColor: `${themeColor}88`,
                      }
                    : {
                        backgroundColor: '#1C1916',
                        borderColor: '#2D251E',
                      },
                ]}
              >
                <Shield
                  size={10}
                  color={attr.prof ? themeColor : '#7A7064'}
                />
                <Text
                  style={[
                    styles.saveText,
                    attr.prof && { color: '#E2D8C3', fontWeight: 'bold' },
                  ]}
                >
                  Save: {formatMod(saveVal)}
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
    padding: 10,
    alignItems: 'center',
  },
  attrCardMobile: {
    minWidth: '30%',
    padding: 8,
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
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 6,
  },
  attrScore: {
    color: '#80776C',
    fontSize: 10.5,
    fontWeight: '500',
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: '100%',
    justifyContent: 'center',
  },
  saveText: {
    color: '#8A8175',
    fontSize: 10,
  },
});
