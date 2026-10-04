import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  calcPassivePerception,
  CompanionData,
} from '@/types/companion';
import { Award, Eye } from 'lucide-react-native';

interface CompanionSkillsSensesProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdate: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionSkillsSenses: React.FC<CompanionSkillsSensesProps> = ({
  companion,
  isEditing,
  onUpdate,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [skills, setSkills] = useState(companion.skills || '');
  const [senses, setSenses] = useState(companion.senses || '');

  React.useEffect(() => {
    setSkills(companion.skills || '');
    setSenses(companion.senses || '');
  }, [companion.id, isEditing]);

  // Cálculo da Percepção Passiva Base sugerida
  const passivePercSuggested = calcPassivePerception(
    companion.wis,
    companion.proficiencyBonus
  );

  return (
    <View style={styles.card}>
      {/* 1. PERÍCIAS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={13} color="#D8B4FE" />
          <Text style={styles.sectionTitle}>PERÍCIAS DA CRIATURA</Text>
        </View>

        {!isEditing ? (
          <Text style={styles.textContent}>
            {companion.skills || 'Nenhuma perícia específica registrada.'}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={skills}
            onChangeText={(v) => {
              setSkills(v);
              onUpdate({ skills: v });
            }}
            placeholder="Ex: Furtividade +4, Percepção +5, Atletismo +3"
            placeholderTextColor="#60574D"
          />
        )}
      </View>

      <View style={styles.divider} />

      {/* 2. SENTIDOS & PERCEPÇÃO PASSIVA */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Eye size={13} color="#78C288" />
          <Text style={styles.sectionTitle}>
            {isMobile ? 'SENTIDOS & PERCEPÇÃO' : 'SENTIDOS & PERCEPÇÃO PASSIVA'}
          </Text>
          <View style={styles.passivePill}>
            <Text style={styles.passivePillText}>Passiva: {passivePercSuggested}</Text>
          </View>
        </View>

        {!isEditing ? (
          <Text style={styles.textContent}>
            {companion.senses || `Percepção Passiva ${passivePercSuggested}.`}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={senses}
            onChangeText={(v) => {
              setSenses(v);
              onUpdate({ senses: v });
            }}
            placeholder="Ex: Visão no Escuro 18m, Percepção Passiva 13, Faro Aguçado"
            placeholderTextColor="#60574D"
          />
        )}
      </View>
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
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    color: '#E2D8C3',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  passivePill: {
    backgroundColor: '#162418',
    borderWidth: 1,
    borderColor: '#2F6A35',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  passivePillText: {
    color: '#78C288',
    fontSize: 9.5,
    fontWeight: '700',
  },
  textContent: {
    color: '#CCC0AD',
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    minWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#25201A',
  },
});
