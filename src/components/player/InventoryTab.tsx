import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterData, ItemData } from '@/lib/mockData';
import {
  AlertTriangle,
  Coins,
  Edit2,
  Minus,
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

export const InventoryTab: React.FC<InventoryTabProps> = React.memo(({
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

  const items = useMemo(() => char.items || [], [char.items]);
  const maxWeight = useMemo(() => (char.str || 10) * 7.5, [char.str]); // D&D 5e: 15 lbs por ponto de FOR (~7.5 kg)
  const totalWeight = useMemo(
    () => items.reduce((acc, i) => acc + (Number(i.weight) || 0) * (Number(i.quantity) || 1), 0),
    [items]
  );
  const isOverloaded = totalWeight > maxWeight;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType === 'WEAPONS') return item.isWeapon;
      if (filterType === 'ARMOR') return item.isArmor;
      if (filterType === 'ITEMS') return !item.isWeapon && !item.isArmor;
      return true;
    });
  }, [items, filterType]);

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
      {/* 💰 TESOURO DA GUILDA / BOLSA DE MOEDAS COMPACTA */}
      <View style={[styles.coinsBar, isMobile && styles.coinsBarMobile]}>
        <View style={styles.coinsTitleRow}>
          <Coins size={13} color="#C5A059" />
          <Text style={styles.coinsTitle}>MOEDAS</Text>
        </View>

        <View style={styles.coinsPillsContainer}>
          {/* Peças de Ouro (PO) */}
          <View style={[styles.coinPill, { borderColor: 'rgba(230, 194, 128, 0.25)' }]}>
            <View style={[styles.coinDot, { backgroundColor: '#E6C280' }]} />
            <Text style={[styles.coinVal, { color: '#E6C280' }]}>{char.gold || 0}</Text>
            <Text style={[styles.coinUnit, { color: '#C5A059' }]}>PO</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    Math.max(0, (char.gold || 0) - 1),
                    char.silver || 0,
                    char.copper || 0
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Minus size={9} color="#BAAFA0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    (char.gold || 0) + 1,
                    char.silver || 0,
                    char.copper || 0
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Plus size={9} color="#BAAFA0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Peças de Prata (PP) */}
          <View style={[styles.coinPill, { borderColor: 'rgba(186, 175, 160, 0.25)' }]}>
            <View style={[styles.coinDot, { backgroundColor: '#BAAFA0' }]} />
            <Text style={[styles.coinVal, { color: '#BAAFA0' }]}>{char.silver || 0}</Text>
            <Text style={[styles.coinUnit, { color: '#80776C' }]}>PP</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    Math.max(0, (char.silver || 0) - 1),
                    char.copper || 0
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Minus size={9} color="#BAAFA0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    (char.silver || 0) + 1,
                    char.copper || 0
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Plus size={9} color="#BAAFA0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Peças de Cobre (PC) */}
          <View style={[styles.coinPill, { borderColor: 'rgba(212, 136, 58, 0.25)' }]}>
            <View style={[styles.coinDot, { backgroundColor: '#D4883A' }]} />
            <Text style={[styles.coinVal, { color: '#D4883A' }]}>{char.copper || 0}</Text>
            <Text style={[styles.coinUnit, { color: '#A06428' }]}>PC</Text>
            <View style={styles.coinStepper}>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    char.silver || 0,
                    Math.max(0, (char.copper || 0) - 1)
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Minus size={9} color="#BAAFA0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coinStepBtn}
                onPress={() =>
                  onUpdateCoins(
                    char.gold || 0,
                    char.silver || 0,
                    (char.copper || 0) + 1
                  )
                }
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Plus size={9} color="#BAAFA0" />
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
});

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
  coinsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181512',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 10,
  },
  coinsBarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  coinsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsTitle: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  coinsPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#13110E',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  coinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coinVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  coinUnit: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  coinStepper: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 3,
  },
  coinStepBtn: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#332B23',
    alignItems: 'center',
    justifyContent: 'center',
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
