import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { STANDARD_CONDITIONS } from '@/utils/dnd5e';
import { ConditionData } from '@/lib/mockData';
import { AlertCircle, Check, X } from 'lucide-react-native';

interface ConditionsModalProps {
  visible: boolean;
  onClose: () => void;
  activeConditions: ConditionData[];
  onToggleCondition: (conditionName: string) => void;
  themeColor?: string;
}

export const ConditionsModal: React.FC<ConditionsModalProps> = ({
  visible,
  onClose,
  activeConditions,
  onToggleCondition,
  themeColor = '#C5A059',
}) => {
  const activeSet = new Set(activeConditions.map((c) => c.name));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color={themeColor} />
              <Text style={styles.title}>Condições da 5ª Edição</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#BAAFA0" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Toque para ativar ou desativar os estados físicos e mentais do personagem:
          </Text>

          {/* Lista de Condições */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {Object.values(STANDARD_CONDITIONS).map((cond) => {
              const isActive = activeSet.has(cond.name);
              return (
                <TouchableOpacity
                  key={cond.name}
                  style={[
                    styles.conditionItem,
                    isActive && {
                      borderColor: cond.color,
                      backgroundColor: cond.badgeBg,
                    },
                  ]}
                  onPress={() => onToggleCondition(cond.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.condHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: cond.color },
                          isActive && { transform: [{ scale: 1.2 }] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.condName,
                          isActive && { color: '#FFF', fontWeight: '700' },
                        ]}
                      >
                        {cond.name}
                      </Text>
                    </View>

                    {isActive && (
                      <View style={[styles.activePill, { backgroundColor: cond.color }]}>
                        <Check size={12} color="#111" strokeWidth={3} />
                        <Text style={styles.activeText}>ATIVO</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.condDesc}>{cond.fullDesc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rodapé */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    backgroundColor: '#161311',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3D342C',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 12,
    marginBottom: 10,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#BAAFA0',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  list: {
    maxHeight: 440,
  },
  conditionItem: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  condHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  condName: {
    color: '#E2D8C3',
    fontSize: 14,
    fontWeight: '600',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeText: {
    color: '#111',
    fontSize: 10,
    fontWeight: 'bold',
  },
  condDesc: {
    color: '#9C9184',
    fontSize: 11.5,
    lineHeight: 16,
  },
  footer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2D251E',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  doneBtnText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
