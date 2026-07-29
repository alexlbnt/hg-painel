import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform, ScrollView } from 'react-native';
import { SpellItemData, AbilityData } from '@/lib/mockData';
import { X, Save, Edit3 } from 'lucide-react-native';

interface EditAbilitySpellModalProps {
  visible: boolean;
  type: 'spell' | 'ability';
  initialData: any; // SpellItemData | AbilityData
  onClose: () => void;
  onSave: (updatedData: any) => void;
  themeColor?: string;
}

export function EditAbilitySpellModal({ visible, type, initialData, onClose, onSave, themeColor = '#C5A059' }: EditAbilitySpellModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Spell specific
  const [level, setLevel] = useState('0');
  const [castingTime, setCastingTime] = useState('');
  const [range, setRange] = useState('');
  const [duration, setDuration] = useState('');

  // Ability specific
  const [maxUses, setMaxUses] = useState('1');
  const [resetType, setResetType] = useState<'SHORT_REST' | 'LONG_REST' | 'NONE'>('SHORT_REST');

  useEffect(() => {
    if (initialData && visible) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');

      if (type === 'spell') {
        setLevel(String(initialData.level || 0));
        setCastingTime(initialData.castingTime || '');
        setRange(initialData.range || '');
        setDuration(initialData.duration || '');
      } else {
        setMaxUses(String(initialData.maxUses || 1));
        setResetType(initialData.resetType || 'SHORT_REST');
      }
    }
  }, [initialData, visible, type]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (type === 'spell') {
      const updated: SpellItemData = {
        ...initialData,
        name: name.trim(),
        level: Number(level) || 0,
        castingTime: castingTime.trim(),
        range: range.trim(),
        duration: duration.trim(),
        description: description.trim(),
      };
      onSave(updated);
    } else {
      const updated: AbilityData = {
        ...initialData,
        name: name.trim(),
        description: description.trim(),
        maxUses: Number(maxUses) || 1,
        resetType,
      };
      onSave(updated);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Edit3 color={themeColor} size={22} />
              <Text style={styles.title}>
                Editar {type === 'spell' ? 'Magia' : 'Habilidade'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#BAAFA0" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#80776C"
            />

            {type === 'spell' && (
              <>
                <Text style={styles.label}>Nível</Text>
                <TextInput
                  style={styles.input}
                  value={level}
                  onChangeText={setLevel}
                  keyboardType="numeric"
                  placeholderTextColor="#80776C"
                />
                
                <Text style={styles.label}>Tempo de Conjuração</Text>
                <TextInput
                  style={styles.input}
                  value={castingTime}
                  onChangeText={setCastingTime}
                  placeholderTextColor="#80776C"
                />

                <Text style={styles.label}>Alcance</Text>
                <TextInput
                  style={styles.input}
                  value={range}
                  onChangeText={setRange}
                  placeholderTextColor="#80776C"
                />

                <Text style={styles.label}>Duração</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholderTextColor="#80776C"
                />
              </>
            )}

            {type === 'ability' && (
              <>
                <Text style={styles.label}>Usos Máximos</Text>
                <TextInput
                  style={styles.input}
                  value={maxUses}
                  onChangeText={setMaxUses}
                  keyboardType="numeric"
                  placeholderTextColor="#80776C"
                />

                <Text style={styles.label}>Recuperação</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioBtn, resetType === 'SHORT_REST' && { borderColor: themeColor, backgroundColor: `${themeColor}22` }]}
                    onPress={() => setResetType('SHORT_REST')}
                  >
                    <Text style={[styles.radioText, resetType === 'SHORT_REST' && { color: themeColor }]}>Descanso Curto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioBtn, resetType === 'LONG_REST' && { borderColor: themeColor, backgroundColor: `${themeColor}22` }]}
                    onPress={() => setResetType('LONG_REST')}
                  >
                    <Text style={[styles.radioText, resetType === 'LONG_REST' && { color: themeColor }]}>Descanso Longo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioBtn, resetType === 'NONE' && { borderColor: themeColor, backgroundColor: `${themeColor}22` }]}
                    onPress={() => setResetType('NONE')}
                  >
                    <Text style={[styles.radioText, resetType === 'NONE' && { color: themeColor }]}>Nunca</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#80776C"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: themeColor }]} onPress={handleSave}>
              <Save color="#110F0D" size={18} />
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 15, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  closeBtn: {
    padding: 4,
  },
  formContent: {
    padding: 20,
  },
  label: {
    color: '#BAAFA0',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 12,
    fontSize: 16,
    outlineStyle: 'none' as any, // Web fix
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radioBtn: {
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#110F0D',
  },
  radioText: {
    color: '#80776C',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#BAAFA0',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#110F0D',
    fontWeight: '700',
  },
});
