import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CompanionData } from '@/types/companion';
import { BookOpen } from 'lucide-react-native';

interface CompanionNotesSectionProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdate: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionNotesSection: React.FC<CompanionNotesSectionProps> = ({
  companion,
  isEditing,
  onUpdate,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [notes, setNotes] = useState(companion.notes || '');

  React.useEffect(() => {
    setNotes(companion.notes || '');
  }, [companion.id, isEditing]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <BookOpen size={14} color={themeColor} />
          <Text style={styles.headerTitle}>NOTAS, COMPORTAMENTO & HISTÓRIA DO VÍNCULO</Text>
        </View>
      </View>

      {!isEditing ? (
        <View style={styles.contentBox}>
          {companion.notes ? (
            <Text style={styles.notesText}>{companion.notes}</Text>
          ) : (
            <Text style={styles.emptyText}>
              Nenhuma anotação de comportamento, comandos ou histórico registrada.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.editWrap}>
          <TextInput
            style={styles.textInput}
            multiline
            value={notes}
            onChangeText={(v) => {
              setNotes(v);
              onUpdate({ notes: v });
            }}
            placeholder="Descreva a personalidade da criatura, truques ou comandos conhecidos (ex: 'Ficar', 'Buscar', 'Atacar') e a história de como se conheceram..."
            placeholderTextColor="#60574D"
          />
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
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  contentBox: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#26201A',
    borderRadius: 6,
    padding: 10,
    minHeight: 60,
  },
  notesText: {
    color: '#CCC0AD',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: '#5C5449',
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  editWrap: {
    marginTop: 2,
  },
  textInput: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 10,
    minHeight: 100,
    fontSize: 12.5,
    textAlignVertical: 'top',
    lineHeight: 18,
    minWidth: 0,
  },
});
