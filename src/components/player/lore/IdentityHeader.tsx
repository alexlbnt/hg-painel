import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Compass, Book, Sparkles, Edit2, Check, X } from 'lucide-react-native';

interface IdentityHeaderProps {
  alignment?: string;
  background?: string;
  deity?: string;
  themeColor?: string;
  onSaveIdentity: (data: { alignment: string; background: string; deity: string }) => void;
}

export const IdentityHeader: React.FC<IdentityHeaderProps> = ({
  alignment = 'Neutro',
  background = 'Herói do Povo',
  deity = 'Nenhuma',
  themeColor = '#C5A059',
  onSaveIdentity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAlignment, setTempAlignment] = useState(alignment);
  const [tempBackground, setTempBackground] = useState(background);
  const [tempDeity, setTempDeity] = useState(deity);

  const handleStartEdit = () => {
    setTempAlignment(alignment);
    setTempBackground(background);
    setTempDeity(deity);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    onSaveIdentity({
      alignment: tempAlignment.trim() || 'Neutro',
      background: tempBackground.trim() || 'Herói do Povo',
      deity: tempDeity.trim() || 'Nenhuma',
    });
    setIsEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Sparkles size={14} color={themeColor} />
          <Text style={styles.headerTitle}>IDENTIDADE & CRENÇAS</Text>
        </View>

        {!isEditing ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleStartEdit}
            activeOpacity={0.7}
          >
            <Edit2 size={11} color="#BAAFA0" />
            <Text style={styles.actionBtnText}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <X size={12} color="#D97777" />
              <Text style={[styles.actionBtnText, { color: '#D97777' }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: themeColor, borderColor: themeColor }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Check size={12} color="#110F0D" />
              <Text style={[styles.actionBtnText, { color: '#110F0D' }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isEditing ? (
        <View style={styles.grid}>
          <View style={styles.item}>
            <View style={styles.itemIconRow}>
              <Compass size={12} color={themeColor} />
              <Text style={styles.label}>TENDÊNCIA</Text>
            </View>
            <Text style={styles.val} numberOfLines={1}>
              {alignment || 'Neutro'}
            </Text>
          </View>

          <View style={styles.itemDivider} />

          <View style={styles.item}>
            <View style={styles.itemIconRow}>
              <Book size={12} color={themeColor} />
              <Text style={styles.label}>ANTECEDENTE</Text>
            </View>
            <Text style={styles.val} numberOfLines={1}>
              {background || 'Herói do Povo'}
            </Text>
          </View>

          <View style={styles.itemDivider} />

          <View style={styles.item}>
            <View style={styles.itemIconRow}>
              <Sparkles size={12} color={themeColor} />
              <Text style={styles.label}>DIVINDADE / CRENÇA</Text>
            </View>
            <Text style={styles.val} numberOfLines={1}>
              {deity || 'Nenhuma'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.editGrid}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TENDÊNCIA</Text>
            <TextInput
              style={styles.input}
              value={tempAlignment}
              onChangeText={setTempAlignment}
              placeholder="Ex: Leal e Bom"
              placeholderTextColor="#6B6257"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ANTECEDENTE</Text>
            <TextInput
              style={styles.input}
              value={tempBackground}
              onChangeText={setTempBackground}
              placeholder="Ex: Acólito, Soldado"
              placeholderTextColor="#6B6257"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DIVINDADE / PATRONO</Text>
            <TextInput
              style={styles.input}
              value={tempDeity}
              onChangeText={setTempDeity}
              placeholder="Ex: Selûne, Bahamut"
              placeholderTextColor="#6B6257"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#25201A',
    paddingBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    flexShrink: 0,
  },
  actionBtnText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  cancelBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#2A1818',
  },
  editActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  itemDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2A241E',
  },
  label: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  val: {
    color: '#E2D8C3',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  editGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  inputGroup: {
    flex: 1,
    minWidth: 140,
    gap: 4,
  },
  inputLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    minWidth: 0,
  },
});
