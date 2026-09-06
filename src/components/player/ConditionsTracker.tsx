import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConditionData } from '@/lib/mockData';
import { STANDARD_CONDITIONS } from '@/utils/dnd5e';
import { AlertCircle, Plus, X } from 'lucide-react-native';
import { ConditionsModal } from './ConditionsModal';

interface ConditionsTrackerProps {
  conditions: ConditionData[];
  onToggleCondition: (conditionName: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const ConditionsTracker: React.FC<ConditionsTrackerProps> = ({
  conditions,
  onToggleCondition,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} color={conditions.length > 0 ? '#FF6B6B' : '#80776C'} />
          <Text style={styles.label}>
            CONDIÇÕES & STATUS {conditions.length > 0 ? `(${conditions.length})` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { borderColor: `${themeColor}66` }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={12} color={themeColor} />
          <Text style={[styles.addBtnText, { color: themeColor }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Badges de Condições Ativas */}
      {conditions.length === 0 ? (
        <View style={styles.normalStateBox}>
          <Text style={styles.normalStateText}>Nenhuma condição ativa (Em condições normais)</Text>
        </View>
      ) : (
        <View style={styles.chipsWrap}>
          {conditions.map((cond) => {
            const def = STANDARD_CONDITIONS[cond.name] || {
              name: cond.name,
              color: '#C5A059',
              badgeBg: 'rgba(197, 160, 89, 0.18)',
              shortDesc: cond.description || '',
            };

            const isSelected = selectedCondition === cond.name;

            return (
              <View key={cond.id || cond.name} style={{ flexDirection: 'column' }}>
                <TouchableOpacity
                  style={[
                    styles.conditionChip,
                    {
                      borderColor: def.color,
                      backgroundColor: def.badgeBg,
                    },
                  ]}
                  onPress={() => setSelectedCondition(isSelected ? null : cond.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dot, { backgroundColor: def.color }]} />
                  <Text style={[styles.chipText, { color: def.color }]}>{cond.name}</Text>
                  <TouchableOpacity
                    onPress={() => onToggleCondition(cond.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={def.color} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Descrição expandida rápida ao clicar */}
                {isSelected && (
                  <View style={[styles.tooltipBox, { borderColor: `${def.color}66` }]}>
                    <Text style={styles.tooltipText}>{def.shortDesc}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modal Completo de Condições */}
      <ConditionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        activeConditions={conditions}
        onToggleCondition={onToggleCondition}
        themeColor={themeColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  normalStateBox: {
    paddingVertical: 4,
  },
  normalStateText: {
    color: '#6B6257',
    fontSize: 11,
    fontStyle: 'italic',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  tooltipBox: {
    marginTop: 4,
    padding: 6,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderRadius: 6,
    maxWidth: 260,
  },
  tooltipText: {
    color: '#D4C9BA',
    fontSize: 10.5,
    lineHeight: 14,
  },
});
