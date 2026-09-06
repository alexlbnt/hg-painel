import { ItemData } from '@/lib/mockData';
import { Edit3, Package, Save, Shield, Sword, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface EditItemModalProps {
  visible: boolean;
  item: ItemData | null;
  onClose: () => void;
  onSave: (updatedItem: ItemData) => void;
  themeColor?: string;
}

export function EditItemModal({
  visible,
  item,
  onClose,
  onSave,
  themeColor = '#C5A059',
}: EditItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('1.0');
  const [quantity, setQuantity] = useState('1');
  const [itemType, setItemType] = useState<'normal' | 'weapon' | 'armor'>('normal');
  const [damage, setDamage] = useState('');
  const [armorClassBonus, setArmorClassBonus] = useState('');
  const [isEquipped, setIsEquipped] = useState(false);

  useEffect(() => {
    if (item && visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(item.name || '');
      setDescription(item.description || '');
      setWeight(String(item.weight != null ? item.weight : '1.0'));
      setQuantity(String(item.quantity != null ? item.quantity : '1'));

      if (item.isWeapon) {
        setItemType('weapon');
      } else if (item.isArmor) {
        setItemType('armor');
      } else {
        setItemType('normal');
      }

      setDamage(item.damage || '');
      setArmorClassBonus(String(item.armorClassBonus != null ? item.armorClassBonus : '0'));
      setIsEquipped(!!item.isEquipped);
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!name.trim() || !item) return;

    const isWeapon = itemType === 'weapon';
    const isArmor = itemType === 'armor';

    const updatedItem: ItemData = {
      ...item,
      name: name.trim(),
      description: description.trim(),
      weight: Math.max(0, parseFloat(weight) || 0),
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      isWeapon,
      damage: isWeapon ? (damage.trim() || '1d6 cortante') : undefined,
      isArmor,
      armorClassBonus: isArmor ? (parseInt(armorClassBonus, 10) || 0) : undefined,
      isEquipped: isArmor ? isEquipped : false,
    };

    onSave(updatedItem);
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Edit3 color={themeColor} size={22} />
              <Text style={styles.title}>Editar Equipamento</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar">
              <X color="#BAAFA0" size={24} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContent} contentContainerStyle={styles.scrollContent}>
            {/* Nome */}
            <Text style={styles.label}>Nome do Item *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Espada Longa, Cota de Malha, Tocha..."
              placeholderTextColor="#80776C"
            />

            {/* Tipo de Equipamento */}
            <Text style={styles.label}>Categoria do Equipamento</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  itemType === 'normal' && { borderColor: themeColor, backgroundColor: `${themeColor}22` },
                ]}
                onPress={() => setItemType('normal')}
              >
                <Package color={itemType === 'normal' ? themeColor : '#BAAFA0'} size={16} />
                <Text style={[styles.typeBtnText, itemType === 'normal' && { color: themeColor, fontWeight: '700' }]}>
                  Normal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  itemType === 'weapon' && { borderColor: '#E6C280', backgroundColor: 'rgba(230, 194, 128, 0.15)' },
                ]}
                onPress={() => setItemType('weapon')}
              >
                <Sword color={itemType === 'weapon' ? '#E6C280' : '#BAAFA0'} size={16} />
                <Text style={[styles.typeBtnText, itemType === 'weapon' && { color: '#E6C280', fontWeight: '700' }]}>
                  Arma
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  itemType === 'armor' && { borderColor: '#7895C2', backgroundColor: 'rgba(120, 149, 194, 0.15)' },
                ]}
                onPress={() => setItemType('armor')}
              >
                <Shield color={itemType === 'armor' ? '#7895C2' : '#BAAFA0'} size={16} />
                <Text style={[styles.typeBtnText, itemType === 'armor' && { color: '#7895C2', fontWeight: '700' }]}>
                  Armadura
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campos Condicionais: Arma */}
            {itemType === 'weapon' && (
              <View style={styles.conditionalBox}>
                <Text style={styles.label}>Dano da Arma</Text>
                <TextInput
                  style={styles.input}
                  value={damage}
                  onChangeText={setDamage}
                  placeholder="Ex: 1d8 cortante, 2d6 perfurante..."
                  placeholderTextColor="#80776C"
                />
              </View>
            )}

            {/* Campos Condicionais: Armadura */}
            {itemType === 'armor' && (
              <View style={styles.conditionalBox}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Bônus de CA</Text>
                    <TextInput
                      style={styles.input}
                      value={armorClassBonus}
                      onChangeText={(t) => setArmorClassBonus(t.replace(/[^0-9]/g, ''))}
                      placeholder="Ex: 2, 4..."
                      placeholderTextColor="#80776C"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 2 }}>
                    <TouchableOpacity
                      style={[
                        styles.equipToggleBtn,
                        isEquipped && { backgroundColor: '#38783C', borderColor: '#4A8C59' },
                      ]}
                      onPress={() => setIsEquipped(!isEquipped)}
                    >
                      <Shield color={isEquipped ? '#FFF' : '#80776C'} size={16} />
                      <Text style={[styles.equipToggleText, isEquipped && { color: '#FFF' }]}>
                        {isEquipped ? 'Equipado (+CA)' : 'Desequipado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Peso e Quantidade */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Peso Unitário (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="1.0"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Quantidade</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Descrição */}
            <Text style={styles.label}>Descrição / Propriedades</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Notas, propriedades mágicas, material, valor..."
              placeholderTextColor="#80776C"
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: themeColor }]} onPress={handleSave}>
              <Save color="#110F0D" size={18} />
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 15, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  closeBtn: {
    padding: 4,
  },
  formContent: {
    maxHeight: 480,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  descInput: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#110F0D',
  },
  typeBtnText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
  },
  conditionalBox: {
    marginBottom: 4,
  },
  equipToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  equipToggleText: {
    color: '#80776C',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    backgroundColor: '#151311',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#110F0D',
    fontSize: 14,
    fontWeight: '700',
  },
});
