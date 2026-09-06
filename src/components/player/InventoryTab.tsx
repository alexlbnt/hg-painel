import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData, ItemData } from '@/lib/mockData';
import {
  AlertTriangle,
  Coins,
  Edit2,
  Package,
  Plus,
  Scale,
  Shield,
  Sword,
  Trash2,
} from 'lucide-react-native';

interface InventoryTabProps {
  char: CharacterData;
  onUpdateCoins: (gold: number, silver: number, copper: number) => void;
  onToggleEquipItem: (itemId: string) => void;
  onOpenAddItemModal: () => void;
  onEditItem: (item: ItemData) => void;
  onDeleteItem: (itemId: string) => void;
  themeColor?: string;
  isMobile?: boolean;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  char,
  onUpdateCoins,
  onToggleEquipItem,
  onOpenAddItemModal,
  onEditItem,
  onDeleteItem,
  themeColor = '#C5A059',
  isMobile = false,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WEAPONS' | 'ARMOR' | 'ITEMS'>('ALL');

  const items = char.items || [];
  const maxWeight = (char.str || 10) * 7.5; // D&D 5e: 15 lbs por ponto de FOR (~7.5 kg)
  const totalWeight = items.reduce(
    (acc, i) => acc + (Number(i.weight) || 0) * (Number(i.quantity) || 1),
    0
  );
  const isOverloaded = totalWeight > maxWeight;

  const filteredItems = items.filter((item) => {
    if (filterType === 'WEAPONS') return item.isWeapon;
    if (filterType === 'ARMOR') return item.isArmor;
    if (filterType === 'ITEMS') return !item.isWeapon && !item.isArmor;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* ⚠️ ALERTA DE SOBRECARGA SE APLICÁVEL */}
      {isOverloaded && (
        <View style={styles.overloadBanner}>
          <AlertTriangle color="#FF4545" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.overloadTitle}>
              SOBRECARGA ATIVA ({totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg)
            </Text>
            <Text style={styles.overloadDesc}>
              O aventureiro excede sua capacidade de carga máxima! O deslocamento é reduzido em 3 metros.
            </Text>
          </View>
        </View>
      )}

      {/* ⚖️ BARRA DE CAPACIDADE DE CARGA */}
      <View style={styles.weightCard}>
        <View style={styles.weightHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Scale size={14} color="#C5A059" />
            <Text style={styles.weightLabel}>CAPACIDADE DE CARGA</Text>
          </View>
          <Text
            style={[
              styles.weightNumbers,
              isOverloaded && { color: '#FF4545', fontWeight: 'bold' },
            ]}
          >
            {totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg
          </Text>
        </View>

        <View style={styles.weightTrack}>
          <View
            style={[
              styles.weightFill,
              {
                width: `${Math.min(100, (totalWeight / (maxWeight || 1)) * 100)}%`,
                backgroundColor: isOverloaded
                  ? '#FF4545'
                  : totalWeight / maxWeight > 0.8
                  ? '#C5A059'
                  : '#38783C',
              },
            ]}
          />
        </View>
      </View>

      {/* 💰 TESOURO DA GUILDA / MOEDAS */}
      <View style={styles.coinsCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Coins size={14} color="#E6C280" />
          <Text style={styles.coinsCardTitle}>BOLSA DE MOEDAS</Text>
        </View>

        <View style={[styles.coinsGrid, isMobile && { flexDirection: 'column', gap: 8 }]}>
          {/* Peças de Ouro (PO) */}
          <View style={[styles.coinCol, { borderColor: '#E6C280' }]}>
            <Text style={[styles.coinColLabel, { color: '#E6C280' }]}>OURO (PO)</Text>
            <Text style={[styles.coinAmount, { color: '#E6C280' }]}>{char.gold || 0}</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    Math.max(0, (char.gold || 0) - 1),
                    char.silver || 0,
                    char.copper || 0
                  )
                }
              >
                <Text style={styles.coinBtnText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    (char.gold || 0) + 1,
                    char.silver || 0,
                    char.copper || 0
                  )
                }
              >
                <Text style={styles.coinBtnText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Peças de Prata (PP) */}
          <View style={[styles.coinCol, { borderColor: '#BAAFA0' }]}>
            <Text style={[styles.coinColLabel, { color: '#BAAFA0' }]}>PRATA (PP)</Text>
            <Text style={[styles.coinAmount, { color: '#BAAFA0' }]}>{char.silver || 0}</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    Math.max(0, (char.silver || 0) - 1),
                    char.copper || 0
                  )
                }
              >
                <Text style={styles.coinBtnText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    (char.silver || 0) + 1,
                    char.copper || 0
                  )
                }
              >
                <Text style={styles.coinBtnText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Peças de Cobre (PC) */}
          <View style={[styles.coinCol, { borderColor: '#B87333' }]}>
            <Text style={[styles.coinColLabel, { color: '#D4883A' }]}>COBRE (PC)</Text>
            <Text style={[styles.coinAmount, { color: '#D4883A' }]}>{char.copper || 0}</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    char.silver || 0,
                    Math.max(0, (char.copper || 0) - 1)
                  )
                }
              >
                <Text style={styles.coinBtnText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    char.silver || 0,
                    (char.copper || 0) + 1
                  )
                }
              >
                <Text style={styles.coinBtnText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 🎒 BARRA DE FERRAMENTAS DO INVENTÁRIO */}
      <View style={styles.toolbar}>
        <View style={styles.filterScroll}>
          {[
            { id: 'ALL', label: 'Tudo' },
            { id: 'WEAPONS', label: 'Armas' },
            { id: 'ARMOR', label: 'Armaduras' },
            { id: 'ITEMS', label: 'Geral' },
          ].map((cat) => {
            const isSelected = filterType === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  isSelected && { backgroundColor: themeColor, borderColor: themeColor },
                ]}
                onPress={() => setFilterType(cat.id as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && { color: '#110F0D', fontWeight: 'bold' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.addItemBtn, { borderColor: themeColor }]}
          onPress={onOpenAddItemModal}
          activeOpacity={0.7}
        >
          <Plus size={12} color={themeColor} />
          <Text style={[styles.addItemBtnText, { color: themeColor }]}>Adicionar Item</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE ITENS */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum item nesta categoria.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                item.isEquipped && {
                  borderColor: themeColor,
                  backgroundColor: `${themeColor}0A`,
                },
              ]}
            >
              <View style={styles.itemTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  {item.isWeapon ? (
                    <Sword size={15} color="#E6C280" />
                  ) : item.isArmor ? (
                    <Shield size={15} color="#7895C2" />
                  ) : (
                    <Package size={15} color="#80776C" />
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity > 1 && (
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>x{item.quantity}</Text>
                    </View>
                  )}
                </View>

                {/* Ações */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Botão Equipar se Arma ou Armadura */}
                  {(item.isWeapon || item.isArmor) && (
                    <TouchableOpacity
                      style={[
                        styles.equipBtn,
                        item.isEquipped
                          ? { backgroundColor: 'rgba(78, 156, 142, 0.2)', borderColor: '#4E9C8E' }
                          : { backgroundColor: '#1C1916', borderColor: '#332B23' },
                      ]}
                      onPress={() => onToggleEquipItem(item.id)}
                    >
                      <Text
                        style={[
                          styles.equipBtnText,
                          item.isEquipped && { color: '#78C288', fontWeight: 'bold' },
                        ]}
                      >
                        {item.isEquipped ? 'Equipado' : 'Equipar'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => onEditItem(item)}
                  >
                    <Edit2 size={12} color="#80776C" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => onDeleteItem(item.id)}
                  >
                    <Trash2 size={12} color="#B82828" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Metadados: Peso, Dano, Bônus CA */}
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemMetaText}>
                  ⚖️ {item.weight ? `${item.weight} kg` : '0 kg'}
                  {item.quantity > 1 ? ` (${(item.weight * item.quantity).toFixed(1)} kg tot)` : ''}
                </Text>
                {item.damage ? (
                  <Text style={[styles.itemMetaText, { color: '#E6C280' }]}>
                    ⚔️ Dano: {item.damage}
                  </Text>
                ) : null}
                {item.isArmor && item.armorClassBonus ? (
                  <Text style={[styles.itemMetaText, { color: '#7895C2' }]}>
                    🛡️ Bônus CA: +{item.armorClassBonus}
                  </Text>
                ) : null}
              </View>

              {item.description ? (
                <Text style={styles.itemDesc}>{item.description}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  overloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(184, 40, 40, 0.18)',
    borderWidth: 1,
    borderColor: '#B82828',
    borderRadius: 8,
    padding: 10,
  },
  overloadTitle: {
    color: '#FF6B6B',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  overloadDesc: {
    color: '#BAAFA0',
    fontSize: 10.5,
    marginTop: 2,
  },
  weightCard: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightLabel: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  weightNumbers: {
    color: '#E2D8C3',
    fontSize: 11.5,
    fontWeight: '600',
  },
  weightTrack: {
    height: 6,
    backgroundColor: '#26201B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    borderRadius: 3,
  },
  coinsCard: {
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#302821',
    borderRadius: 8,
    padding: 10,
  },
  coinsCardTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  coinsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  coinCol: {
    flex: 1,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  coinColLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coinAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  coinStepper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  coinBtn: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coinBtnText: {
    color: '#BAAFA0',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  filterPillText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addItemBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#80776C',
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  qtyBadge: {
    backgroundColor: '#2A241E',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  qtyText: {
    color: '#BAAFA0',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  equipBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  equipBtnText: {
    color: '#BAAFA0',
    fontSize: 10.5,
  },
  iconBtn: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#332B23',
    borderRadius: 4,
    backgroundColor: '#1E1A16',
  },
  itemMetaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemMetaText: {
    color: '#80776C',
    fontSize: 11,
  },
  itemDesc: {
    color: '#BAAFA0',
    fontSize: 11,
    lineHeight: 15,
  },
});
