import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CompanionAttack,
  CompanionData,
  CompanionTrait,
} from '@/types/companion';
import {
  Flame,
  Plus,
  Sparkles,
  Sword,
  Trash2,
} from 'lucide-react-native';

interface CompanionActionsSectionProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdate: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionActionsSection: React.FC<CompanionActionsSectionProps> = ({
  companion,
  isEditing,
  onUpdate,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  // Novo ataque formulário
  const [newAttackName, setNewAttackName] = useState('');
  const [newAttackBonus, setNewAttackBonus] = useState('+4');
  const [newAttackDamage, setNewAttackDamage] = useState('1d6+2');
  const [newAttackType, setNewAttackType] = useState('Corpo a corpo');
  const [isAddingAttack, setIsAddingAttack] = useState(false);

  // Novo traço formulário
  const [newTraitName, setNewTraitName] = useState('');
  const [newTraitDesc, setNewTraitDesc] = useState('');
  const [isAddingTrait, setIsAddingTrait] = useState(false);

  // Adiciona ataque
  const handleAddAttack = () => {
    if (!newAttackName.trim()) return;
    const newAttack: CompanionAttack = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newAttackName.trim(),
      attackBonus: newAttackBonus.trim() || '+0',
      damage: newAttackDamage.trim() || '1d4',
      type: newAttackType.trim() || 'Corpo a corpo',
    };

    const updated = [...(companion.attacks || []), newAttack];
    onUpdate({ attacks: updated });
    setNewAttackName('');
    setIsAddingAttack(false);
  };

  const handleDeleteAttack = (id: string) => {
    const updated = (companion.attacks || []).filter((a) => a.id !== id);
    onUpdate({ attacks: updated });
  };

  // Adiciona traço / habilidade
  const handleAddTrait = () => {
    if (!newTraitName.trim()) return;
    const newTrait: CompanionTrait = {
      id: `trt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newTraitName.trim(),
      description: newTraitDesc.trim(),
    };

    const updated = [...(companion.traits || []), newTrait];
    onUpdate({ traits: updated });
    setNewTraitName('');
    setNewTraitDesc('');
    setIsAddingTrait(false);
  };

  const handleDeleteTrait = (id: string) => {
    const updated = (companion.traits || []).filter((t) => t.id !== id);
    onUpdate({ traits: updated });
  };

  return (
    <View style={styles.container}>
      {/* 1. SEÇÃO DE ATAQUES & COMBATE */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrap}>
            <Sword size={14} color="#E57373" />
            <Text style={styles.sectionTitle}>
              {isMobile ? 'ATAQUES & AÇÕES' : 'ATAQUES & AÇÕES OFENSIVAS'}
            </Text>
          </View>

          {isEditing && !isAddingAttack && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddingAttack(true)}
              activeOpacity={0.7}
            >
              <Plus size={11} color={themeColor} />
              <Text style={[styles.addBtnText, { color: themeColor }]}>Adicionar Ataque</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulário para novo ataque */}
        {isEditing && isAddingAttack && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Cadastrar Novo Ataque</Text>
            <View style={styles.formRow}>
              <View
                style={[
                  styles.inputGroup,
                  { flex: isMobile ? undefined : 2, width: isMobile ? '100%' : undefined },
                ]}
              >
                <Text style={styles.inputLabel}>NOME DO ATAQUE</Text>
                <TextInput
                  style={styles.input}
                  value={newAttackName}
                  onChangeText={setNewAttackName}
                  placeholder="Ex: Mordida, Garras, Bico"
                  placeholderTextColor="#60574D"
                />
              </View>

              {!isMobile && (
                <>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>ACERTO</Text>
                    <TextInput
                      style={styles.input}
                      value={newAttackBonus}
                      onChangeText={setNewAttackBonus}
                      placeholder="+4"
                      placeholderTextColor="#60574D"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={styles.inputLabel}>DANO & TIPO</Text>
                    <TextInput
                      style={styles.input}
                      value={newAttackDamage}
                      onChangeText={setNewAttackDamage}
                      placeholder="2d4+2 Perfurante"
                      placeholderTextColor="#60574D"
                    />
                  </View>
                </>
              )}
            </View>

            {isMobile && (
              <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1, minWidth: '45%' }]}>
                  <Text style={styles.inputLabel}>ACERTO</Text>
                  <TextInput
                    style={styles.input}
                    value={newAttackBonus}
                    onChangeText={setNewAttackBonus}
                    placeholder="+4"
                    placeholderTextColor="#60574D"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, minWidth: '45%' }]}>
                  <Text style={styles.inputLabel}>DANO & TIPO</Text>
                  <TextInput
                    style={styles.input}
                    value={newAttackDamage}
                    onChangeText={setNewAttackDamage}
                    placeholder="2d4+2 Perf."
                    placeholderTextColor="#60574D"
                  />
                </View>
              </View>
            )}

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>ALCANCE / TIPO</Text>
                <TextInput
                  style={styles.input}
                  value={newAttackType}
                  onChangeText={setNewAttackType}
                  placeholder="Ex: Corpo a corpo (1,5m)"
                  placeholderTextColor="#60574D"
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsAddingAttack(false)}
              >
                <Text style={styles.formCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSaveBtn, { backgroundColor: themeColor }]}
                onPress={handleAddAttack}
              >
                <Text style={styles.formSaveText}>Salvar Ataque</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de Ataques */}
        <View style={styles.listWrap}>
          {(companion.attacks || []).length > 0 ? (
            companion.attacks.map((att) => (
              <View key={att.id} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{att.name}</Text>
                    {att.type ? <Text style={styles.itemMeta}>• {att.type}</Text> : null}
                  </View>
                  <View style={styles.attackStatsRow}>
                    <View style={styles.attackPill}>
                      <Text style={styles.attackPillLabel}>Acerto:</Text>
                      <Text style={styles.attackPillVal}>{att.attackBonus}</Text>
                    </View>
                    <View style={styles.attackPill}>
                      <Text style={styles.attackPillLabel}>Dano:</Text>
                      <Text style={[styles.attackPillVal, { color: '#E57373' }]}>
                        {att.damage}
                      </Text>
                    </View>
                  </View>
                  {att.description ? (
                    <Text style={styles.itemDesc}>{att.description}</Text>
                  ) : null}
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={styles.itemDeleteBtn}
                    onPress={() => handleDeleteAttack(att.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color="#E06A6A" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum ataque registrado para esta criatura.</Text>
          )}
        </View>
      </View>

      {/* 2. SEÇÃO DE TRAÇOS & HABILIDADES ESPECIAIS */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrap}>
            <Sparkles size={14} color="#D4AF37" />
            <Text style={styles.sectionTitle}>
              {isMobile ? 'TRAÇOS & HABILIDADES' : 'TRAÇOS & HABILIDADES ESPECIAIS'}
            </Text>
          </View>

          {isEditing && !isAddingTrait && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddingTrait(true)}
              activeOpacity={0.7}
            >
              <Plus size={11} color={themeColor} />
              <Text style={[styles.addBtnText, { color: themeColor }]}>Adicionar Traço</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulário para novo traço */}
        {isEditing && isAddingTrait && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Cadastrar Novo Traço / Habilidade</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>NOME DA HABILIDADE</Text>
              <TextInput
                style={styles.input}
                value={newTraitName}
                onChangeText={setNewTraitName}
                placeholder="Ex: Sobrevoo, Ataque em Matilha, Faro Aguçado"
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>DESCRIÇÃO / EFEITO</Text>
              <TextInput
                style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
                multiline
                value={newTraitDesc}
                onChangeText={setNewTraitDesc}
                placeholder="Descreva o benefício mecânico..."
                placeholderTextColor="#60574D"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsAddingTrait(false)}
              >
                <Text style={styles.formCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSaveBtn, { backgroundColor: themeColor }]}
                onPress={handleAddTrait}
              >
                <Text style={styles.formSaveText}>Salvar Traço</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de Traços */}
        <View style={styles.listWrap}>
          {(companion.traits || []).length > 0 ? (
            companion.traits.map((trt) => (
              <View key={trt.id} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={12} color="#D4AF37" />
                    <Text style={styles.traitName}>{trt.name}</Text>
                  </View>
                  <Text style={styles.traitDesc}>{trt.description}</Text>
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={styles.itemDeleteBtn}
                    onPress={() => handleDeleteTrait(trt.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color="#E06A6A" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Nenhum traço ou habilidade especial cadastrada.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#25201A',
    paddingBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: '#E2D8C3',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1C1814',
    borderWidth: 1,
    borderColor: '#383028',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderColor: '#2D2620',
    borderRadius: 6,
    padding: 10,
    gap: 8,
  },
  formTitle: {
    color: '#C5A059',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  formRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  fieldGroup: {
    gap: 3,
  },
  inputGroup: {
    minWidth: 80,
    gap: 3,
  },
  inputLabel: {
    color: '#756C60',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#100E0C',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 5,
    color: '#E2D8C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11.5,
    minWidth: 0,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  formCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formCancelText: {
    color: '#9E9182',
    fontSize: 10.5,
  },
  formSaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formSaveText: {
    color: '#110F0D',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  listWrap: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#26201A',
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemMeta: {
    color: '#8A8073',
    fontSize: 10.5,
  },
  attackStatsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  attackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1C1814',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  attackPillLabel: {
    color: '#756C60',
    fontSize: 9.5,
  },
  attackPillVal: {
    color: '#E2D8C3',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  itemDesc: {
    color: '#A89E8D',
    fontSize: 11,
    lineHeight: 15,
  },
  traitName: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  traitDesc: {
    color: '#BAAFA0',
    fontSize: 11.5,
    lineHeight: 16,
  },
  itemDeleteBtn: {
    padding: 5,
    borderRadius: 4,
    backgroundColor: '#261414',
  },
  emptyText: {
    color: '#60574D',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});
