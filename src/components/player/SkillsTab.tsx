import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { formatMod, getMod, getProfBonus, SKILLS_LIST } from '@/utils/dnd5e';
import { Award, Edit3, Sparkles, Star } from 'lucide-react-native';

interface SkillsTabProps {
  char: CharacterData;
  onUpdateProficientSkills: (skillsStr: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
  char,
  onUpdateProficientSkills,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const prof = getProfBonus(char.level);

  // Armazena proficiências como string (ex: "Acrobacia,Furtividade:EXP")
  const currentSkills = (char.proficientSkills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const getSkillStatus = (skillName: string): 'none' | 'prof' | 'exp' => {
    const found = currentSkills.find((s) => s.startsWith(skillName));
    if (!found) return 'none';
    if (found.endsWith(':EXP')) return 'exp';
    return 'prof';
  };

  const handleCycleSkill = (skillName: string) => {
    const current = getSkillStatus(skillName);
    let nextSkills: string[];

    if (current === 'none') {
      // Passa para Proficiente
      nextSkills = [...currentSkills.filter((s) => !s.startsWith(skillName)), skillName];
    } else if (current === 'prof') {
      // Passa para Expertise (Especialização / Proficiência Dobrada)
      nextSkills = [
        ...currentSkills.filter((s) => !s.startsWith(skillName)),
        `${skillName}:EXP`,
      ];
    } else {
      // Remove proficiência
      nextSkills = currentSkills.filter((s) => !s.startsWith(skillName));
    }

    onUpdateProficientSkills(nextSkills.join(','));
  };

  // Divisão equilibrada em duas colunas de 9 perícias cada (A-I e I-S)
  const midPoint = Math.ceil(SKILLS_LIST.length / 2);
  const leftColumnSkills = SKILLS_LIST.slice(0, midPoint);
  const rightColumnSkills = SKILLS_LIST.slice(midPoint);

  const renderSkillItem = (skill: (typeof SKILLS_LIST)[0]) => {
    const score = (char as any)[skill.attr] || 10;
    const attrMod = getMod(score);
    const status = getSkillStatus(skill.name);

    const bonus =
      status === 'exp'
        ? attrMod + prof * 2
        : status === 'prof'
        ? attrMod + prof
        : attrMod;

    return (
      <TouchableOpacity
        key={skill.name}
        style={[
          styles.skillRow,
          status === 'prof' && {
            borderColor: `${themeColor}66`,
            backgroundColor: `${themeColor}0D`,
          },
          status === 'exp' && {
            borderColor: '#E5A93C',
            backgroundColor: 'rgba(229, 169, 60, 0.12)',
          },
          isMobile && styles.skillRowMobile,
          Platform.OS === 'web' && isEditMode && ({ cursor: 'pointer' } as any),
        ]}
        onPress={() => isEditMode && handleCycleSkill(skill.name)}
        disabled={!isEditMode}
        activeOpacity={isEditMode ? 0.7 : 1}
      >
        {/* Esquerda: Marcador, Nome e Atributo */}
        <View style={styles.skillLeft}>
          {status === 'exp' ? (
            <Star size={isMobile ? 11 : 13} color="#E5A93C" fill="#E5A93C" />
          ) : (
            <View
              style={[
                styles.statusDot,
                isMobile && styles.statusDotMobile,
                status === 'prof' && { backgroundColor: themeColor, borderColor: themeColor },
              ]}
            />
          )}

          <Text
            style={[
              styles.skillName,
              status !== 'none' && { color: '#FFF', fontWeight: '700' },
              isMobile && styles.skillNameMobile,
            ]}
            numberOfLines={1}
          >
            {skill.name}
          </Text>

          <Text style={[styles.attrLabel, isMobile && styles.attrLabelMobile]}>
            ({skill.label})
          </Text>
        </View>

        {/* Direita: Modificador Total e Tags */}
        <View style={styles.skillRight}>
          {status === 'exp' && !isMobile && (
            <Text style={styles.expTag}>EXPERTISE</Text>
          )}
          {status === 'prof' && !isMobile && (
            <Text style={[styles.profTag, { color: themeColor }]}>PROF</Text>
          )}
          <Text
            style={[
              styles.skillBonus,
              status !== 'none' && { color: '#E6C280', fontWeight: 'bold' },
              isMobile && styles.skillBonusMobile,
            ]}
          >
            {formatMod(bonus)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de Topo com Alternância de Modo */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Award size={16} color={themeColor} />
          <Text style={styles.title}>PERÍCIAS (D&D 5E)</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            isEditMode
              ? { backgroundColor: themeColor, borderColor: themeColor }
              : { backgroundColor: '#1E1A16', borderColor: '#3D342C' },
          ]}
          onPress={() => setIsEditMode(!isEditMode)}
          activeOpacity={0.7}
        >
          <Edit3 size={12} color={isEditMode ? '#110F0D' : '#BAAFA0'} />
          <Text
            style={[
              styles.modeBtnText,
              { color: isEditMode ? '#110F0D' : '#BAAFA0' },
            ]}
          >
            {isEditMode ? 'Concluir Edição' : 'Editar Perícias'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditMode && (
        <View style={styles.editNotice}>
          <Sparkles size={13} color="#E6C280" />
          <Text style={styles.editNoticeText}>
            Toque nas perícias para alternar:{' '}
            <Text style={{ fontWeight: 'bold' }}>Normal (○)</Text> ➔{' '}
            <Text style={{ color: themeColor, fontWeight: 'bold' }}>Proficiente (●)</Text> ➔{' '}
            <Text style={{ color: '#E5A93C', fontWeight: 'bold' }}>Especialização (★)</Text>
          </Text>
        </View>
      )}

      {/* Grid de Perícias em 2 Colunas */}
      <View style={[styles.skillsColumnsContainer, isMobile && styles.skillsColumnsContainerMobile]}>
        <View style={styles.skillColumn}>
          {leftColumnSkills.map(renderSkillItem)}
        </View>
        <View style={styles.skillColumn}>
          {rightColumnSkills.map(renderSkillItem)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  editNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 8,
  },
  editNoticeText: {
    color: '#BAAFA0',
    fontSize: 11,
    flex: 1,
  },
  skillsColumnsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skillsColumnsContainerMobile: {
    gap: 8,
  },
  skillColumn: {
    flex: 1,
    gap: 6,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 38,
  },
  skillRowMobile: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 34,
  },
  skillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    overflow: 'hidden',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#544A3F',
  },
  statusDotMobile: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.2,
  },
  skillName: {
    color: '#C4B9A7',
    fontSize: 12.5,
    flexShrink: 1,
  },
  skillNameMobile: {
    fontSize: 11,
  },
  attrLabel: {
    color: '#73695D',
    fontSize: 10.5,
  },
  attrLabelMobile: {
    fontSize: 9.5,
  },
  skillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  skillBonus: {
    color: '#D4C9BA',
    fontSize: 13,
    fontWeight: '600',
    minWidth: 26,
    textAlign: 'right',
  },
  skillBonusMobile: {
    fontSize: 12,
    minWidth: 22,
  },
  profTag: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  expTag: {
    color: '#E5A93C',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
