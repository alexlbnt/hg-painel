import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  calcPassivePerception,
  CompanionData,
} from '@/types/companion';
import {
  AlertTriangle,
  Award,
  Eye,
  Plus,
  X,
} from 'lucide-react-native';

interface CompanionSkillsSensesProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdate: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

const COMMON_CONDITIONS = [
  'Caído',
  'Envenenado',
  'Assustado',
  'Agarrado',
  'Incapacitado',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Atordoado',
  'Inconsciente',
];

export const CompanionSkillsSenses: React.FC<CompanionSkillsSensesProps> = ({
  companion,
  isEditing,
  onUpdate,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [skills, setSkills] = useState(companion.skills || '');
  const [senses, setSenses] = useState(companion.senses || '');
  const [conditions, setConditions] = useState(companion.conditions || '');
  const [newConditionInput, setNewConditionInput] = useState('');

  React.useEffect(() => {
    setSkills(companion.skills || '');
    setSenses(companion.senses || '');
    setConditions(companion.conditions || '');
  }, [companion]);

  // Lista de condições atuais
  const activeConditionsList = (companion.conditions || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const handleToggleCondition = (condName: string) => {
    let currentList = (companion.conditions || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (currentList.includes(condName)) {
      currentList = currentList.filter((c) => c !== condName);
    } else {
      currentList.push(condName);
    }

    const updated = currentList.join(', ');
    setConditions(updated);
    onUpdate({ conditions: updated });
  };

  const handleAddCustomCondition = () => {
    if (newConditionInput.trim()) {
      handleToggleCondition(newConditionInput.trim());
      setNewConditionInput('');
    }
  };

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

      <View style={styles.divider} />

      {/* 3. CONDIÇÕES ATUAIS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={13} color="#E57373" />
          <Text style={styles.sectionTitle}>CONDIÇÕES ATUAIS</Text>
        </View>

        {/* Badges de condições ativas */}
        <View style={styles.conditionsWrap}>
          {activeConditionsList.length > 0 ? (
            activeConditionsList.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={styles.activeConditionBadge}
                onPress={() => handleToggleCondition(cond)}
                activeOpacity={0.7}
              >
                <Text style={styles.activeConditionText}>{cond}</Text>
                <X size={10} color="#E57373" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noConditionsText}>
              Nenhuma condição ativa (a criatura está saudável e operante).
            </Text>
          )}
        </View>

        {/* Seleção rápida de condições no modo de edição */}
        {isEditing && (
          <View style={styles.editConditionsBox}>
            <Text style={styles.editConditionsLabel}>Alternar condição comum:</Text>
            <View style={styles.quickConditionsRow}>
              {COMMON_CONDITIONS.map((c) => {
                const isActive = activeConditionsList.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.quickCondBtn,
                      isActive && styles.quickCondBtnActive,
                    ]}
                    onPress={() => handleToggleCondition(c)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickCondText,
                        isActive && styles.quickCondTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Adicionar condição customizada */}
            <View style={styles.customCondRow}>
              <TextInput
                style={styles.customCondInput}
                value={newConditionInput}
                onChangeText={setNewConditionInput}
                placeholder="Outra condição..."
                placeholderTextColor="#60574D"
              />
              <TouchableOpacity
                style={styles.addCondBtn}
                onPress={handleAddCustomCondition}
                activeOpacity={0.7}
              >
                <Plus size={11} color="#FFF" />
                <Text style={styles.addCondBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  conditionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  activeConditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#261414',
    borderWidth: 1,
    borderColor: '#632525',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeConditionText: {
    color: '#E57373',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noConditionsText: {
    color: '#6E6557',
    fontSize: 11,
    fontStyle: 'italic',
  },
  editConditionsBox: {
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: '#29221B',
    padding: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 4,
  },
  editConditionsLabel: {
    color: '#756C60',
    fontSize: 9,
    fontWeight: 'bold',
  },
  quickConditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  quickCondBtn: {
    backgroundColor: '#1B1713',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  quickCondBtnActive: {
    backgroundColor: '#381616',
    borderColor: '#8A2A2A',
  },
  quickCondText: {
    color: '#8A8073',
    fontSize: 9.5,
  },
  quickCondTextActive: {
    color: '#E57373',
    fontWeight: 'bold',
  },
  customCondRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  customCondInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#100E0C',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#E2D8C3',
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 11,
  },
  addCondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#241E18',
    borderWidth: 1,
    borderColor: '#4A3D30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  addCondBtnText: {
    color: '#CCC0AD',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
