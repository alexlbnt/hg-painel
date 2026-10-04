import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  calcCarryCapacityKg,
  CompanionData,
} from '@/types/companion';
import {
  Info,
  Package,
  Weight,
} from 'lucide-react-native';

interface CompanionInventorySectionProps {
  companion: CompanionData;
  isEditing: boolean;
  onUpdate: (updated: Partial<CompanionData>) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const CompanionInventorySection: React.FC<CompanionInventorySectionProps> = ({
  companion,
  isEditing,
  onUpdate,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [inventory, setInventory] = useState(companion.inventory || '');

  React.useEffect(() => {
    setInventory(companion.inventory || '');
  }, [companion]);

  // Cálculo automático da capacidade de carga baseada na Força e Porte da criatura (D&D 5e)
  const { maxKg, pushDragKg } = calcCarryCapacityKg(
    companion.str,
    companion.size
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Package size={14} color="#7895C2" />
          <Text style={styles.headerTitle}>
            {isMobile ? 'EQUIPAMENTO & ALFORJES' : 'EQUIPAMENTO & ALFORJES DA CRIATURA'}
          </Text>
        </View>

        {/* Badge de capacidade de carga calculada */}
        <View style={[styles.carryCapacityPill, isMobile && { alignSelf: 'flex-start' }]}>
          <Weight size={11} color="#7895C2" />
          <Text style={styles.carryCapacityText}>
            {isMobile
              ? `Carga: ${maxKg} kg (Arrasto: ${pushDragKg} kg)`
              : `Capacidade: ${maxKg} kg (Arrastar: ${pushDragKg} kg)`}
          </Text>
        </View>
      </View>

      <View style={styles.ruleNote}>
        <Info size={11} color="#6E6557" />
        <Text style={styles.ruleNoteText}>
          Carga máxima baseada em FOR {companion.str} e Porte {companion.size} (D&D 5e).
        </Text>
      </View>

      {!isEditing ? (
        <View style={styles.contentBox}>
          {companion.inventory ? (
            <Text style={styles.inventoryText}>{companion.inventory}</Text>
          ) : (
            <Text style={styles.emptyText}>
              Nenhum equipamento registrado (sela, alforjes, armadura barding, etc.).
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.editWrap}>
          <TextInput
            style={styles.textInput}
            multiline
            value={inventory}
            onChangeText={(v) => {
              setInventory(v);
              onUpdate({ inventory: v });
            }}
            placeholder="Ex: Sela Militar, Alforjes com rações para 10 dias, Barding de Cota de Malha (CA 16)..."
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
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  carryCapacityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141A22',
    borderWidth: 1,
    borderColor: '#26374D',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    flexShrink: 0,
  },
  carryCapacityText: {
    color: '#7895C2',
    fontSize: 9.5,
    fontWeight: '600',
  },
  ruleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  ruleNoteText: {
    color: '#6E6557',
    fontSize: 10,
    fontStyle: 'italic',
  },
  contentBox: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#26201A',
    borderRadius: 6,
    padding: 10,
  },
  inventoryText: {
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
    minHeight: 80,
    fontSize: 12.5,
    textAlignVertical: 'top',
    lineHeight: 18,
    minWidth: 0,
  },
});
