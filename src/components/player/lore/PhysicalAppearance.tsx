import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { User, Eye, Edit2, Check, X } from 'lucide-react-native';
import { CharacterAppearance } from '@/types/lore';

interface PhysicalAppearanceProps {
  appearance: CharacterAppearance;
  themeColor?: string;
  onSaveAppearance: (appearance: CharacterAppearance) => void;
}

export const PhysicalAppearance: React.FC<PhysicalAppearanceProps> = ({
  appearance,
  themeColor = '#C5A059',
  onSaveAppearance,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CharacterAppearance>({
    age: appearance.age || '',
    height: appearance.height || '',
    weight: appearance.weight || '',
    eyes: appearance.eyes || '',
    skin: appearance.skin || '',
    hair: appearance.hair || '',
    distinguishingMarks: appearance.distinguishingMarks || '',
  });

  const handleStartEdit = () => {
    setForm({
      age: appearance.age || '',
      height: appearance.height || '',
      weight: appearance.weight || '',
      eyes: appearance.eyes || '',
      skin: appearance.skin || '',
      hair: appearance.hair || '',
      distinguishingMarks: appearance.distinguishingMarks || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    onSaveAppearance(form);
    setIsEditing(false);
  };

  const hasAnyData =
    appearance.age ||
    appearance.height ||
    appearance.weight ||
    appearance.eyes ||
    appearance.skin ||
    appearance.hair ||
    appearance.distinguishingMarks;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <User size={14} color={themeColor} />
          <Text style={styles.headerTitle}>APARÊNCIA & CARACTERÍSTICAS FÍSICAS</Text>
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
              <X size={11} color="#D97777" />
              <Text style={[styles.actionBtnText, { color: '#D97777' }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: themeColor, borderColor: themeColor }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Check size={11} color="#110F0D" />
              <Text style={[styles.actionBtnText, { color: '#110F0D' }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isEditing ? (
        hasAnyData ? (
          <View style={styles.contentWrap}>
            {/* Linha de pílulas com traços físicos */}
            <View style={styles.traitsGrid}>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>IDADE</Text>
                <Text style={styles.traitValue}>{appearance.age || '—'}</Text>
              </View>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>ALTURA</Text>
                <Text style={styles.traitValue}>{appearance.height || '—'}</Text>
              </View>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>PESO</Text>
                <Text style={styles.traitValue}>{appearance.weight || '—'}</Text>
              </View>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>OLHOS</Text>
                <Text style={styles.traitValue}>{appearance.eyes || '—'}</Text>
              </View>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>PELE</Text>
                <Text style={styles.traitValue}>{appearance.skin || '—'}</Text>
              </View>
              <View style={styles.traitPill}>
                <Text style={styles.traitLabel}>CABELOS</Text>
                <Text style={styles.traitValue}>{appearance.hair || '—'}</Text>
              </View>
            </View>

            {/* Cicatrizes e marcas */}
            {appearance.distinguishingMarks ? (
              <View style={styles.marksBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Eye size={12} color="#D4AF37" />
                  <Text style={styles.marksLabel}>MARCAS NOTÁVEIS & CICATRIZES</Text>
                </View>
                <Text style={styles.marksText}>{appearance.distinguishingMarks}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyBox}
            onPress={handleStartEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyText}>
              Nenhuma descrição física registrada. Toque aqui para definir idade, altura, olhos, etc.
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.editWrap}>
          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IDADE</Text>
              <TextInput
                style={styles.input}
                value={form.age}
                onChangeText={(v) => setForm((p) => ({ ...p, age: v }))}
                placeholder="Ex: 28 anos"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ALTURA</Text>
              <TextInput
                style={styles.input}
                value={form.height}
                onChangeText={(v) => setForm((p) => ({ ...p, height: v }))}
                placeholder="Ex: 1,82m"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PESO</Text>
              <TextInput
                style={styles.input}
                value={form.weight}
                onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))}
                placeholder="Ex: 85kg"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OLHOS</Text>
              <TextInput
                style={styles.input}
                value={form.eyes}
                onChangeText={(v) => setForm((p) => ({ ...p, eyes: v }))}
                placeholder="Ex: Âmbar brilhante"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PELE</Text>
              <TextInput
                style={styles.input}
                value={form.skin}
                onChangeText={(v) => setForm((p) => ({ ...p, skin: v }))}
                placeholder="Ex: Bronzeada pelo sol"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CABELOS</Text>
              <TextInput
                style={styles.input}
                value={form.hair}
                onChangeText={(v) => setForm((p) => ({ ...p, hair: v }))}
                placeholder="Ex: Negros e trançados"
                placeholderTextColor="#60574D"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, { marginTop: 4 }]}>
            <Text style={styles.inputLabel}>CICATRIZES, TATUAGENS & MARCAS NOTÁVEIS</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              multiline
              value={form.distinguishingMarks}
              onChangeText={(v) => setForm((p) => ({ ...p, distinguishingMarks: v }))}
              placeholder="Ex: Cicatriz de garras no ombro esquerdo; tatuagem tribal do clã dos lobos no antebraço..."
              placeholderTextColor="#60574D"
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
  contentWrap: {
    gap: 8,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitPill: {
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: '#2D2620',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 80,
    flex: 1,
  },
  traitLabel: {
    color: '#756C60',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  traitValue: {
    color: '#DDD2BE',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  marksBox: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#2F2720',
    borderRadius: 6,
    padding: 8,
    marginTop: 2,
  },
  marksLabel: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  marksText: {
    color: '#CCC0AD',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#5C5449',
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  editWrap: {
    gap: 8,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inputGroup: {
    flex: 1,
    minWidth: 90,
    gap: 3,
  },
  inputLabel: {
    color: '#756C60',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    minWidth: 0,
  },
});
