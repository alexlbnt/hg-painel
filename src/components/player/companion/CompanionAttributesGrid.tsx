import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CompanionData, formatCompanionMod } from '@/types/companion';
import { Sparkles } from 'lucide-react-native';

interface CompanionAttributesGridProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdateAttributes: (attrs: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionAttributesGrid: React.FC<CompanionAttributesGridProps> = ({
  companion,
  isEditing,
  onUpdateAttributes,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const attributes = [
    { key: 'str' as const, name: 'FORÇA', abbr: 'FOR', score: companion.str },
    { key: 'dex' as const, name: 'DESTREZA', abbr: 'DES', score: companion.dex },
    { key: 'con' as const, name: 'CONSTITUIÇÃO', abbr: 'CON', score: companion.con },
    { key: 'int' as const, name: 'INTELIGÊNCIA', abbr: 'INT', score: companion.int },
    { key: 'wis' as const, name: 'SABEDORIA', abbr: 'SAB', score: companion.wis },
    { key: 'cha' as const, name: 'CARISMA', abbr: 'CAR', score: companion.cha },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Sparkles size={13} color={themeColor} />
        <Text style={styles.sectionHeader}>ATRIBUTOS DA CRIATURA (D&D 5e)</Text>
      </View>

      <View style={[styles.grid, isMobile && { gap: 6 }]}>
        {attributes.map((attr) => {
          const modText = formatCompanionMod(attr.score);

          return (
            <View
              key={attr.key}
              style={[styles.attrCard, isMobile && styles.attrCardMobile]}
            >
              <Text style={styles.attrName}>{attr.abbr}</Text>

              {!isEditing ? (
                <>
                  <Text style={[styles.attrMod, isMobile && { fontSize: 20 }]}>{modText}</Text>
                  <View style={styles.scorePill}>
                    <Text style={styles.attrScore}>{attr.score}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.editWrap}>
                  <TextInput
                    style={styles.scoreInput}
                    value={String(attr.score || 10)}
                    onChangeText={(v) => {
                      const num = Math.max(1, Math.min(30, parseInt(v, 10) || 10));
                      onUpdateAttributes({ [attr.key]: num });
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={[styles.editModPreview, { color: themeColor }]}>
                    {modText}
                  </Text>
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
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    color: '#E2D8C3',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  attrCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attrCardMobile: {
    flex: 0,
    width: '31.5%',
    minWidth: '31.5%',
    maxWidth: '32%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  attrName: {
    color: '#A89F91',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  attrMod: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  scorePill: {
    backgroundColor: '#1E1A16',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  attrScore: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
  },
  editWrap: {
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  scoreInput: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    width: 36,
    height: 28,
  },
  editModPreview: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
});
