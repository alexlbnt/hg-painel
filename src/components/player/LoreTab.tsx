import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { BookOpen, Edit2, Save } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

interface LoreTabProps {
  char: CharacterData;
  onSaveLore: (newLore: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const LoreTab: React.FC<LoreTabProps> = ({
  char,
  onSaveLore,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loreText, setLoreText] = useState(char.lore || '');

  const handleSave = () => {
    onSaveLore(loreText);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {/* Informações Gerais do Aventureiro */}
      <View style={styles.charInfoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>TENDÊNCIA</Text>
          <Text style={styles.infoVal}>{char.alignment || 'Neutro'}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>ANTECEDENTE</Text>
          <Text style={styles.infoVal}>{char.background || 'Herói do Povo'}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>DIVINDADE</Text>
          <Text style={styles.infoVal}>{char.deity || 'Nenhum'}</Text>
        </View>
      </View>

      {/* Diário de Lore / História com Markdown */}
      <View style={styles.loreCard}>
        <View style={styles.loreHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BookOpen size={15} color={themeColor} />
            <Text style={styles.loreTitle}>HISTÓRIA & ANOTAÇÕES DA CAMPANHA</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.editToggleBtn,
              isEditing && { backgroundColor: themeColor, borderColor: themeColor },
            ]}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setLoreText(char.lore || '');
                setIsEditing(true);
              }
            }}
            activeOpacity={0.7}
          >
            {isEditing ? (
              <>
                <Save size={12} color="#110F0D" />
                <Text style={[styles.editToggleText, { color: '#110F0D' }]}>Salvar Lore</Text>
              </>
            ) : (
              <>
                <Edit2 size={12} color="#BAAFA0" />
                <Text style={styles.editToggleText}>Editar História</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <TextInput
            style={styles.loreInput}
            multiline
            value={loreText}
            onChangeText={setLoreText}
            placeholder="Escreva a história do seu personagem, laços, defeitos e anotações de sessão (suporta Markdown)..."
            placeholderTextColor="#6B6257"
          />
        ) : char.lore ? (
          <View style={styles.markdownWrap}>
            <Markdown style={markdownStyles}>{char.lore}</Markdown>
          </View>
        ) : (
          <View style={styles.emptyLoreBox}>
            <Text style={styles.emptyLoreText}>
              Nenhum registro de história ou lore redigido. Clique em &quot;Editar História&quot; para escrever!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  charInfoGrid: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 10,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#80776C',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoVal: {
    color: '#E2D8C3',
    fontSize: 12.5,
    fontWeight: '600',
  },
  loreCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  loreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A241E',
    paddingBottom: 8,
  },
  loreTitle: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },
  editToggleText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loreInput: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 12,
    minHeight: 180,
    fontSize: 13,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  markdownWrap: {
    paddingVertical: 4,
  },
  emptyLoreBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyLoreText: {
    color: '#6B6257',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

const markdownStyles = {
  body: {
    color: '#BAAFA0',
    fontSize: 12.5,
    lineHeight: 18,
  },
  heading1: {
    color: '#E6C280',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginVertical: 4,
  },
  heading2: {
    color: '#E6C280',
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  strong: {
    color: '#FFF',
    fontWeight: 'bold' as const,
  },
  code_inline: {
    backgroundColor: '#14120F',
    color: '#E6C280',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
};
