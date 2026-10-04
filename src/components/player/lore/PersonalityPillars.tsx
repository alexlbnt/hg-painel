import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Sparkles, Target, Heart, Flame, Edit2, Check, X, HelpCircle } from 'lucide-react-native';

interface PersonalityPillarsProps {
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  themeColor?: string;
  onSavePillars: (pillars: {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  }) => void;
}

type PillarKey = 'traits' | 'ideals' | 'bonds' | 'flaws';

const PILLAR_CONFIG = [
  {
    key: 'traits' as PillarKey,
    title: 'TRAÇOS DE PERSONALIDADE',
    icon: Sparkles,
    color: '#D4AF37',
    placeholder: 'Descreva manias, tom de voz, hábitos e como seu herói se porta em tavernas e combates...',
    hint: 'Exemplo: "Sempre durmo de botas e de costas para a porta. Coleciono moedas de reinos esquecidos."',
  },
  {
    key: 'ideals' as PillarKey,
    title: 'OBJETIVOS',
    icon: Target,
    color: '#64B5F6',
    placeholder: 'Qual a grande meta do personagem? Vingar seu clã, recuperar um artefato ancestral, dominar segredos arcanos ou acumular riquezas?',
    hint: 'Exemplo: "Objetivo: Encontrar o assassino de seu antigo mestre e resgatar o grimório roubado de sua família."',
  },
  {
    key: 'bonds' as PillarKey,
    title: 'VÍNCULOS',
    icon: Heart,
    color: '#81C784',
    placeholder: 'Pessoas, locais sagrados, juramentos de lealdade ou relíquias que você protegeria com a vida...',
    hint: 'Exemplo: "Devo minha vida e minha espada à abadessa que me resgatou do orfanato."',
  },
  {
    key: 'flaws' as PillarKey,
    title: 'DEFEITOS & FRAQUEZAS',
    icon: Flame,
    color: '#E57373',
    placeholder: 'Vícios, medos incontroláveis, orgulho cego ou impulsos que colocam o grupo em perigo...',
    hint: 'Exemplo: "Não resisto a uma aposta perigosa e confio rápido demais em quem me elogia."',
  },
];

export const PersonalityPillars: React.FC<PersonalityPillarsProps> = ({
  traits,
  ideals,
  bonds,
  flaws,
  themeColor = '#C5A059',
  onSavePillars,
}) => {
  const [editingPillar, setEditingPillar] = useState<PillarKey | null>(null);
  const [showHints, setShowHints] = useState(false);

  const [formValues, setFormValues] = useState({
    traits: traits || '',
    ideals: ideals || '',
    bonds: bonds || '',
    flaws: flaws || '',
  });

  const handleStartEdit = (key: PillarKey) => {
    setFormValues({
      traits: traits || '',
      ideals: ideals || '',
      bonds: bonds || '',
      flaws: flaws || '',
    });
    setEditingPillar(key);
  };

  const handleSavePillar = (key: PillarKey) => {
    const updated = {
      personalityTraits: formValues.traits,
      ideals: formValues.ideals,
      bonds: formValues.bonds,
      flaws: formValues.flaws,
    };
    onSavePillars(updated);
    setEditingPillar(null);
  };

  const handleCancelEdit = () => {
    setFormValues({
      traits: traits || '',
      ideals: ideals || '',
      bonds: bonds || '',
      flaws: flaws || '',
    });
    setEditingPillar(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Sparkles size={14} color={themeColor} />
          <Text style={styles.sectionTitle}>PILARES DE INTERPRETAÇÃO (D&D 5e)</Text>
        </View>

        <TouchableOpacity
          style={styles.hintToggle}
          onPress={() => setShowHints(!showHints)}
          activeOpacity={0.7}
        >
          <HelpCircle size={12} color={showHints ? themeColor : '#7A7265'} />
          <Text style={[styles.hintToggleText, showHints && { color: themeColor }]}>
            {showHints ? 'Ocultar Dicas' : 'Dicas de Roleplay'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pillarsGrid}>
        {PILLAR_CONFIG.map((pillar) => {
          const isThisEditing = editingPillar === pillar.key;
          const Icon = pillar.icon;
          const currentText = formValues[pillar.key];
          const savedText =
            pillar.key === 'traits'
              ? traits
              : pillar.key === 'ideals'
              ? ideals
              : pillar.key === 'bonds'
              ? bonds
              : flaws;

          return (
            <View
              key={pillar.key}
              style={[
                styles.pillarCard,
                isThisEditing && { borderColor: pillar.color, backgroundColor: '#1C1814' },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Icon size={13} color={pillar.color} />
                  <Text style={[styles.cardTitle, { color: pillar.color }]}>{pillar.title}</Text>
                </View>

                {!isThisEditing ? (
                  <TouchableOpacity
                    style={styles.cardEditBtn}
                    onPress={() => handleStartEdit(pillar.key)}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={11} color="#BAAFA0" />
                    <Text style={styles.cardEditText}>Editar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity
                      style={[styles.cardEditBtn, styles.cancelBtn]}
                      onPress={handleCancelEdit}
                      activeOpacity={0.7}
                    >
                      <X size={11} color="#D97777" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardEditBtn, { backgroundColor: pillar.color, borderColor: pillar.color }]}
                      onPress={() => handleSavePillar(pillar.key)}
                      activeOpacity={0.7}
                    >
                      <Check size={11} color="#110F0D" />
                      <Text style={[styles.cardEditText, { color: '#110F0D' }]}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {showHints && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>{pillar.hint}</Text>
                </View>
              )}

              {isThisEditing ? (
                <TextInput
                  style={styles.input}
                  multiline
                  value={currentText}
                  onChangeText={(val) =>
                    setFormValues((prev) => ({ ...prev, [pillar.key]: val }))
                  }
                  placeholder={pillar.placeholder}
                  placeholderTextColor="#60574D"
                  autoFocus
                />
              ) : savedText ? (
                <Text style={styles.cardContent}>{savedText}</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => handleStartEdit(pillar.key)}
                  activeOpacity={0.7}
                  style={styles.emptyWrap}
                >
                  <Text style={styles.emptyPlaceholder}>
                    Toque para adicionar {pillar.title.toLowerCase()}...
                  </Text>
                </TouchableOpacity>
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
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 2,
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
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  hintToggleText: {
    color: '#7A7265',
    fontSize: 10.5,
    fontWeight: '600',
  },
  pillarsGrid: {
    gap: 10,
  },
  pillarCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#241F1A',
    paddingBottom: 6,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  cardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  cancelBtn: {
    borderColor: '#4A2A2A',
    backgroundColor: '#2A1818',
  },
  cardEditText: {
    color: '#BAAFA0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hintBox: {
    backgroundColor: '#1F1B16',
    borderLeftWidth: 2,
    borderLeftColor: '#C5A059',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  hintText: {
    color: '#A89E8D',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  input: {
    backgroundColor: '#12100E',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 8,
    minHeight: 65,
    fontSize: 12.5,
    textAlignVertical: 'top',
    lineHeight: 18,
    minWidth: 0,
  },
  cardContent: {
    color: '#DDD2BE',
    fontSize: 12.5,
    lineHeight: 19,
  },
  emptyWrap: {
    paddingVertical: 6,
  },
  emptyPlaceholder: {
    color: '#5C5449',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
