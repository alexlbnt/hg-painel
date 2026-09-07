import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { getProfBonus } from '@/utils/dnd5e';
import {
  Download,
  Edit,
  Scale,
  Scroll,
  Skull,
  Sun,
  Trash2,
} from 'lucide-react-native';

interface CharacterHeaderProps {
  char: CharacterData;
  passivePerception: number;
  totalAc: number;
  themeColor?: string;
  isMobile?: boolean;
  onOpenSpeedModal: () => void;
  onExportJson: () => void;
  onEditChar: () => void;
  onDeleteChar: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
  char,
  passivePerception,
  totalAc,
  themeColor = '#C5A059',
  isMobile = false,
  onOpenSpeedModal,
  onExportJson,
  onEditChar,
  onDeleteChar,
}) => {
  const prof = getProfBonus(char.level);

  return (
    <View style={[styles.headerContainer, isMobile && { gap: 12, paddingBottom: 14 }]}>
      {/* Informações Básicas do Aventureiro */}
      <View style={{ flexShrink: 1, minWidth: isMobile ? '100%' : 180 }}>
        <View
          style={[
            styles.levelBadge,
            { borderColor: `${themeColor}66`, backgroundColor: `${themeColor}15` },
          ]}
        >
          <Scroll color={themeColor} size={13} />
          <Text style={[styles.levelText, { color: themeColor }]}>
            NÍVEL {char.level} • {char.race.toUpperCase()}
          </Text>
        </View>

        <Text
          style={[
            styles.charName,
            isMobile && { fontSize: 24 },
            { color: themeColor },
          ]}
        >
          {char.name}
        </Text>

        <Text style={styles.charMeta}>
          {char.class} • Jogador:{' '}
          <Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{char.playerName}</Text>
        </Text>

        {char.deity && char.deity !== 'Nenhum' && (
          <View
            style={[
              styles.deityBadge,
              char.deity === 'Arcké'
                ? { borderColor: '#B82828', backgroundColor: 'rgba(184, 40, 40, 0.12)' }
                : char.deity === 'Vitta'
                ? { borderColor: '#C5A059', backgroundColor: 'rgba(197, 160, 89, 0.12)' }
                : { borderColor: '#1B3B6F', backgroundColor: 'rgba(27, 59, 111, 0.12)' },
            ]}
          >
            {char.deity === 'Arcké' && <Scale color="#B82828" size={13} />}
            {char.deity === 'Vitta' && <Sun color="#C5A059" size={13} />}
            {char.deity === 'Thanatos' && <Skull color="#4A75B5" size={13} />}
            <Text
              style={[
                styles.deityText,
                {
                  color:
                    char.deity === 'Arcké'
                      ? '#E57373'
                      : char.deity === 'Vitta'
                      ? '#E6C280'
                      : '#7895C2',
                },
              ]}
            >
              DEVOTO DE {char.deity.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Ribbon de Estatísticas Vitais de Combate */}
      <View
        style={[
          styles.headerStatsRibbon,
          isMobile && {
            width: '100%',
            maxWidth: '100%',
            justifyContent: 'space-around',
            gap: 4,
            paddingVertical: 6,
          },
          { borderColor: `${themeColor}44` },
        ]}
      >
        <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
          <Text style={styles.headerStatLabel}>PROF.</Text>
          <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: themeColor }]}>
            +{prof}
          </Text>
        </View>

        <View style={styles.headerStatDivider} />

        <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
          <Text style={styles.headerStatLabel}>CA</Text>
          <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#7895C2' }]}>
            {totalAc}
          </Text>
        </View>

        <View style={styles.headerStatDivider} />

        <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
          <Text style={styles.headerStatLabel}>INIC.</Text>
          <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }]}>
            {char.initiativeBonus >= 0 ? `+${char.initiativeBonus}` : char.initiativeBonus}
          </Text>
        </View>

        <View style={styles.headerStatDivider} />

        <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
          <Text style={styles.headerStatLabel}>PERC.</Text>
          <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#78C288' }]}>
            {passivePerception}
          </Text>
        </View>

        <View style={styles.headerStatDivider} />

        <TouchableOpacity
          style={[
            styles.headerStatItem,
            isMobile && { minWidth: 28 },
            Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
          ]}
          onPress={onOpenSpeedModal}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={styles.headerStatLabel}>DESL.</Text>
            <Edit size={9} color={themeColor} />
          </View>
          <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#E6C280' }]}>
            {char.speed || '9m'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botões de Ação do Header */}
      <View
        style={[
          styles.headerActions,
          isMobile && {
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 6,
            marginTop: 4,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' }]}
          onPress={onExportJson}
          accessibilityLabel="Exportar Ficha em JSON"
        >
          <Download color="#78C288" size={14} />
          <Text style={[styles.actionBtnText, { color: '#78C288' }]}>JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            isMobile && { flex: 1, justifyContent: 'center' },
            { borderColor: `${themeColor}66` },
          ]}
          onPress={onEditChar}
        >
          <Edit color={themeColor} size={14} />
          <Text style={[styles.actionBtnText, { color: themeColor }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={onDeleteChar}
          accessibilityLabel="Excluir Ficha"
        >
          <Trash2 color="#B82828" size={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  levelText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  charName: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  charMeta: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 2,
  },
  deityBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  deityText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerStatsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161311',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  headerStatItem: {
    alignItems: 'center',
    minWidth: 42,
  },
  headerStatLabel: {
    color: '#80776C',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerStatVal: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2D251E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: '#B82828',
    paddingHorizontal: 8,
  },
});
