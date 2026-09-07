import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {
  CharacterData,
  ItemData,
  SpellItemData,
} from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { ExportService } from '@/services/exportService';
import { confirmAction } from '@/utils/confirm';
import { getMod, getProfBonus } from '@/utils/dnd5e';

// Subcomponentes Especializados de Alta Performance
import { CharacterHeader } from '@/components/player/CharacterHeader';
import { VitalsCombatPanel } from '@/components/player/VitalsCombatPanel';
import { AttributesGrid } from '@/components/player/AttributesGrid';
import { CombatAttacksTab } from '@/components/player/CombatAttacksTab';
import { SpellsManagerTab } from '@/components/player/SpellsManagerTab';
import { AbilitiesTab } from '@/components/player/AbilitiesTab';
import { SkillsTab } from '@/components/player/SkillsTab';
import { InventoryTab } from '@/components/player/InventoryTab';
import { LoreTab } from '@/components/player/LoreTab';

// Modais
import CharacterModal from '@/components/player/CharacterModal';
import { EditAbilitySpellModal } from '@/components/player/EditAbilitySpellModal';
import { EditItemModal } from '@/components/player/EditItemModal';
import { SrdSearchModal } from '@/components/player/SrdSearchModal';

// Ícones
import {
  Award,
  BookOpen,
  Crown,
  Download,
  FastForward,
  Package,
  Plus,
  Scroll,
  Shield,
  Sparkles,
  Sword,
  Upload,
  Zap,
} from 'lucide-react-native';

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function PlayerModule() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Aba ativa: inicia em 'combat' para acesso instantâneo na mesa
  const [activeTab, setActiveTab] = useState<
    'combat' | 'spells' | 'abilities' | 'skills' | 'inventory' | 'lore'
  >('combat');

  // Estado de Concentração da Magia Ativa
  const [concentratingSpell, setConcentratingSpell] = useState<string | null>(null);

  // Modais de Criação e Edição Geral
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);

  // Modal de Deslocamento
  const [speedModalVisible, setSpeedModalVisible] = useState(false);
  const [quickSpeed, setQuickSpeed] = useState('9m');

  // Modal de Backup / Importação
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Modais de SRD e Edição de Entidades
  const [srdModalVisible, setSrdModalVisible] = useState(false);
  const [srdModalType, setSrdModalType] = useState<'spell' | 'ability'>('spell');
  const [editEntityVisible, setEditEntityVisible] = useState(false);
  const [editEntityType, setEditEntityType] = useState<'spell' | 'ability'>('spell');
  const [entityToEdit, setEntityToEdit] = useState<any>(null);
  const [editItemModalVisible, setEditItemModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItemData | null>(null);

  const lastDataHash = useRef<string>('');

  // Usuários com acesso total à mesa (Mestre e Mecânico)
  const isElevatedUser = user?.role === 'DM' || user?.role === 'MECHANIC';

  // Fichas visíveis: Mestre e Mecânico visualizam todas; Player Comum apenas as suas
  const visibleCharacters = useMemo(() => {
    if (!user) return [];
    if (isElevatedUser) {
      return characters;
    }
    const loggedUser = (user.username || '').trim().toLowerCase();
    const loggedName = (user.name || '').trim().toLowerCase();
    return characters.filter((c) => {
      const charUser = (c.username || '').trim().toLowerCase();
      const charPlayerName = (c.playerName || '').trim().toLowerCase();
      return (charUser && charUser === loggedUser) || (charPlayerName && charPlayerName === loggedName);
    });
  }, [characters, user, isElevatedUser]);

  // Carregamento de Personagens
  const loadCharacters = useCallback(async (silent = false) => {
    try {
      const data = await ApiService.getCharacters(
        user ? { role: user.role, username: user.username } : undefined
      );
      const currentHash = JSON.stringify(data);
      if (currentHash === lastDataHash.current) return;
      lastDataHash.current = currentHash;

      setCharacters(data);
    } catch (e) {
      console.error('Erro ao carregar personagens:', e);
    }
  }, [user]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // Seleciona automaticamente uma ficha válida permitida para o usuário
  useEffect(() => {
    if (visibleCharacters.length > 0) {
      if (!selectedId || !visibleCharacters.some((c) => c.id === selectedId)) {
        setSelectedId(visibleCharacters[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [visibleCharacters, selectedId]);

  // Sincronização em tempo real via SSE
  useRealtimeSync((event) => {
    if (
      event.type === 'CHARACTER_UPDATED' ||
      event.type === 'CHARACTER_CREATED' ||
      event.type === 'CHARACTER_DELETED' ||
      event.type === 'TABLE_REST' ||
      event.type === 'characters' ||
      event.type === 'character' ||
      event.type === 'data_changed'
    ) {
      loadCharacters(true);
    }
  });

  const selectedChar = useMemo(
    () => visibleCharacters.find((c) => c.id === selectedId) || null,
    [visibleCharacters, selectedId]
  );

  const themeColor = selectedChar?.themeColor || '#C5A059';

  // Percepção Passiva Canônica: 10 + Mod de SAB + (Prof se proficiente)
  const passivePerception = useMemo(() => {
    if (!selectedChar) return 10;
    const wisMod = getMod(selectedChar.wis);
    const prof = getProfBonus(selectedChar.level);
    const isProf = (selectedChar.proficientSkills || '').includes('Percepção');
    const isExp = (selectedChar.proficientSkills || '').includes('Percepção:EXP');
    const profToAdd = isExp ? prof * 2 : isProf ? prof : 0;
    return 10 + wisMod + profToAdd;
  }, [selectedChar]);

  // CA Total (Base + Bônus de Armaduras e Escudos Equipados)
  const totalAc = useMemo(() => {
    if (!selectedChar) return 10;
    const baseAc = Number(selectedChar.armorClass || 10);
    const armorBonus = (selectedChar.items || []).reduce(
      (acc, i) => acc + (i.isArmor && i.isEquipped ? Number(i.armorClassBonus || 0) : 0),
      0
    );
    return baseAc + armorBonus;
  }, [selectedChar]);

  // -------------------------------------------------------------
  // OPERAÇÕES DO PERSONAGEM
  // -------------------------------------------------------------

  const handleApplyHpDelta = async (delta: number) => {
    if (!selectedChar) return;
    let newHp = selectedChar.currentHp;
    let newTempHp = selectedChar.tempHp;

    if (delta < 0) {
      const dmg = Math.abs(delta);
      if (newTempHp >= dmg) {
        newTempHp -= dmg;
      } else {
        const remainingDmg = dmg - newTempHp;
        newTempHp = 0;
        newHp = Math.max(0, newHp - remainingDmg);
      }
    } else {
      newHp = Math.min(selectedChar.maxHp, newHp + delta);
    }

    // Atualização otimista
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, currentHp: newHp, tempHp: newTempHp } : c
      )
    );

    try {
      await ApiService.updateCharacter(selectedChar.id, { currentHp: newHp, tempHp: newTempHp });
    } catch (e) {
      console.error(e);
      loadCharacters();
    }
  };

  const handleToggleDeathSave = async (type: 'success' | 'fail', index: number) => {
    if (!selectedChar) return;
    let newSuccess = selectedChar.deathSaveSuccesses;
    let newFails = selectedChar.deathSaveFailures;

    if (type === 'success') {
      newSuccess = index + 1 === newSuccess ? index : index + 1;
    } else {
      newFails = index + 1 === newFails ? index : index + 1;
    }

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id
          ? { ...c, deathSaveSuccesses: newSuccess, deathSaveFailures: newFails }
          : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, {
      deathSaveSuccesses: newSuccess,
      deathSaveFailures: newFails,
    });
  };

  const handleTriggerShortRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      const healAmt = 8 + getMod(selectedChar.con);
      const updates: Partial<CharacterData> = {};
      if (selectedChar.maxKiPoints && selectedChar.maxKiPoints > 0) {
        updates.kiPoints = selectedChar.maxKiPoints;
      }
      await ApiService.takeShortRest(selectedChar.id, healAmt, 1);
      await loadCharacters();
      if (Platform.OS === 'web') {
        window.alert(
          `Ritual de Descanso Curto concluído! 1 Dado de Vida gasto, recuperou ${healAmt} HP e restaurou habilidades de descanso curto.`
        );
      }
    };

    confirmAction(
      'Realizar Ritual de Descanso Curto? (Gasta 1 Dado de Vida para curar e recarrega poderes marciais)',
      executeRest,
      'Descanso Curto'
    );
  };

  const handleTriggerLongRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      await ApiService.takeLongRest(selectedChar.id);
      setConcentratingSpell(null);
      await loadCharacters();
      if (Platform.OS === 'web') {
        window.alert('Ritual de Descanso Longo concluído! Sinais vitais, magias e habilidades 100% restaurados!');
      }
    };

    confirmAction(
      'Realizar Descanso Longo? (Restaura 100% dos pontos de vida, recupera metade dos dados de vida e recarrega todos os feitiços)',
      executeRest,
      'Descanso Longo'
    );
  };

  const handleToggleEquipItem = async (itemId: string) => {
    if (!selectedChar) return;
    const updatedItems = (selectedChar.items || []).map((i) =>
      i.id === itemId ? { ...i, isEquipped: !i.isEquipped } : i
    );

    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedChar.id ? { ...c, items: updatedItems } : c))
    );

    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
  };

  const handleUpdateProficientSkills = async (skillsStr: string) => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, proficientSkills: skillsStr } : c
      )
    );
    await ApiService.updateCharacter(selectedChar.id, { proficientSkills: skillsStr });
  };

  const handleToggleSpellSlot = async (level: number, slotIndex: number) => {
    if (!selectedChar) return;
    const slots = selectedChar.spellSlots || [];
    const currentSlot = slots.find((s) => s.level === level);
    if (!currentSlot) return;

    // Se slotIndex < used, diminui; se slotIndex >= used, gasta até slotIndex + 1
    const newUsed =
      slotIndex < currentSlot.used ? slotIndex : Math.min(currentSlot.total, slotIndex + 1);

    const updatedSlots = slots.map((s) =>
      s.level === level ? { ...s, used: newUsed } : s
    );

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, spellSlots: updatedSlots } : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
  };

  const handleRestoreSlotsLevel = async (level: number) => {
    if (!selectedChar) return;
    const updatedSlots = (selectedChar.spellSlots || []).map((s) =>
      s.level === level ? { ...s, used: 0 } : s
    );

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, spellSlots: updatedSlots } : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
  };

  const handleToggleSpellPrepared = async (spellId: string) => {
    if (!selectedChar) return;
    const updatedSpells = (selectedChar.spells || []).map((s) =>
      s.id === spellId ? { ...s, isPrepared: !s.isPrepared } : s
    );

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, spells: updatedSpells } : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, { spells: updatedSpells });
  };

  const handleSetConcentration = (spellName: string) => {
    setConcentratingSpell((prev) => (prev === spellName ? null : spellName));
  };

  const handleAdjustAbilityUses = async (abilityId: string, delta: number) => {
    if (!selectedChar) return;
    const updatedAbilities = (selectedChar.abilities || []).map((a) => {
      if (a.id !== abilityId) return a;
      const nextUses = Math.max(0, Math.min(a.maxUses, (a.currentUses ?? a.maxUses) + delta));
      return { ...a, currentUses: nextUses };
    });

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, abilities: updatedAbilities } : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, {
      abilities: updatedAbilities,
    });
  };

  const handleResetAbilityUses = async (abilityId: string) => {
    if (!selectedChar) return;
    const updatedAbilities = (selectedChar.abilities || []).map((a) =>
      a.id === abilityId ? { ...a, currentUses: a.maxUses } : a
    );

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, abilities: updatedAbilities } : c
      )
    );

    await ApiService.updateCharacter(selectedChar.id, {
      abilities: updatedAbilities,
    });
  };

  const handleUpdateKiPoints = async (val: number) => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedChar.id ? { ...c, kiPoints: val } : c))
    );
    await ApiService.updateCharacter(selectedChar.id, { kiPoints: val });
  };

  const handleUpdateSorceryPoints = async (val: number) => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, sorceryPoints: val } : c
      )
    );
    await ApiService.updateCharacter(selectedChar.id, { sorceryPoints: val });
  };

  const handleUpdateCoins = async (gold: number, silver: number, copper: number) => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, gold, silver, copper } : c
      )
    );
    await ApiService.updateCharacter(selectedChar.id, { gold, silver, copper });
  };

  const handleSaveLore = async (newLore: string) => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedChar.id ? { ...c, lore: newLore } : c))
    );
    await ApiService.updateCharacter(selectedChar.id, { lore: newLore });
  };

  const handleSaveEditedEntity = async (updatedData: any) => {
    if (!selectedChar) return;
    if (editEntityType === 'spell') {
      const updatedSpells = (selectedChar.spells || []).map((s) =>
        s.id === updatedData.id ? { ...s, ...updatedData } : s
      );
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === selectedChar.id ? { ...c, spells: updatedSpells } : c
        )
      );
      await ApiService.updateCharacter(selectedChar.id, { spells: updatedSpells });
    } else {
      const updatedAbilities = (selectedChar.abilities || []).map((a) =>
        a.id === updatedData.id ? { ...a, ...updatedData } : a
      );
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === selectedChar.id ? { ...c, abilities: updatedAbilities } : c
        )
      );
      await ApiService.updateCharacter(selectedChar.id, {
        abilities: updatedAbilities,
      });
    }
    setEditEntityVisible(false);
    setEntityToEdit(null);
  };

  const handleSaveEditedItem = async (updatedItem: ItemData) => {
    if (!selectedChar) return;
    const updatedItems = (selectedChar.items || []).map((i) =>
      i.id === updatedItem.id ? updatedItem : i
    );
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, items: updatedItems } : c
      )
    );
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    setEditItemModalVisible(false);
    setItemToEdit(null);
  };

  const handleSaveQuickSpeed = async () => {
    if (!selectedChar) return;
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === selectedChar.id ? { ...c, speed: quickSpeed } : c
      )
    );
    await ApiService.updateCharacter(selectedChar.id, { speed: quickSpeed });
    setSpeedModalVisible(false);
  };

  const handleDelete = async (charId: string) => {
    if (!isElevatedUser) {
      const target = characters.find((c) => c.id === charId);
      const loggedUser = (user?.username || '').trim().toLowerCase();
      const charUser = (target?.username || '').trim().toLowerCase();
      if (charUser && charUser !== loggedUser) {
        if (Platform.OS === 'web') window.alert('Você só tem autorização para excluir suas próprias fichas.');
        else Alert.alert('Acesso Negado', 'Você só tem autorização para excluir suas próprias fichas.');
        return;
      }
    }

    confirmAction(
      'Tem certeza que deseja apagar permanentemente este personagem? Essa ação não pode ser desfeita.',
      async () => {
        await ApiService.deleteCharacter(charId);
        const updated = characters.filter((c) => c.id !== charId);
        setCharacters(updated);
      },
      'Excluir Personagem'
    );
  };

  const handleExportJson = () => {
    if (!selectedChar) return;
    ExportService.exportCharacterToJson(selectedChar);
  };

  const handleExportAllJson = () => {
    ExportService.exportAllCharactersToJson(visibleCharacters);
  };

  const handleSelectJsonFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          setImportJsonText(event.target.result);
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  const handleConfirmImport = async () => {
    if (!importJsonText.trim()) return;
    const res = ExportService.parseImportJson(importJsonText);
    if (!res.success || !res.characters || res.characters.length === 0) {
      if (Platform.OS === 'web') window.alert(res.error || 'Arquivo JSON inválido ou corrompido.');
      return;
    }

    for (const char of res.characters) {
      const { id, ...dataWithoutId } = char;
      // Garante que jogador comum só possa importar associando a si mesmo
      if (!isElevatedUser && user) {
        dataWithoutId.username = user.username.trim().toLowerCase();
        dataWithoutId.playerName = user.name || dataWithoutId.playerName;
      }
      await ApiService.createCharacter(dataWithoutId);
    }
    await loadCharacters();
    setImportModalVisible(false);
    setImportJsonText('');
    if (Platform.OS === 'web') window.alert('Personagens importados com sucesso!');
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#110F0D', minHeight: 400 }}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={[
        styles.scrollContent,
        isDesktop && styles.scrollContentDesktop,
        isTablet && styles.scrollContentTablet,
        isMobile && styles.scrollContentMobile,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.container,
          isDesktop && styles.containerDesktop,
          isTablet && styles.containerTablet,
          isMobile && styles.containerMobile,
        ]}
      >
        {/* CARROSSEL SELETOR DE PERSONAGENS */}
        <View style={styles.selectorBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScroll}
          >
            {/* Tag informativa de permissão especial (Mestre / Mecânico) */}
            {isElevatedUser && (
              <View
                style={[
                  styles.roleAccessTag,
                  user?.role === 'DM' ? styles.dmAccessTag : styles.mechanicAccessTag,
                ]}
              >
                {user?.role === 'DM' ? (
                  <Crown size={14} color="#C5A059" />
                ) : (
                  <Sparkles size={14} color="#4E9C8E" />
                )}
                <Text
                  style={[
                    styles.roleAccessText,
                    { color: user?.role === 'DM' ? '#C5A059' : '#4E9C8E' },
                  ]}
                >
                  {user?.role === 'DM' ? 'MESTRE • TODAS AS FICHAS' : 'MECÂNICO • TODAS AS FICHAS'}
                </Text>
              </View>
            )}

            {visibleCharacters.map((char) => {
              const isSelected = char.id === selectedId;
              const chipColor = char.themeColor || '#C5A059';

              return (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.charChip,
                    isSelected && [
                      styles.charChipSelected,
                      { borderColor: chipColor, backgroundColor: `${chipColor}18` },
                    ],
                  ]}
                  onPress={() => setSelectedId(char.id)}
                  activeOpacity={0.7}
                >
                  <Shield color={isSelected ? chipColor : '#80776C'} size={15} />
                  <View>
                    <Text
                      style={[
                        styles.chipName,
                        isSelected && [styles.chipNameSelected, { color: chipColor }],
                      ]}
                    >
                      {char.name}
                    </Text>
                    <Text style={styles.chipClass}>
                      {char.class} • Nvl {char.level}
                      {isElevatedUser && char.playerName ? ` (${char.playerName})` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.newCharChip}
              onPress={() => {
                setEditingChar(null);
                setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Plus color="#C5A059" size={16} />
              <Text style={styles.newCharText}>Criar Personagem</Text>
            </TouchableOpacity>

            {isElevatedUser && (
              <TouchableOpacity
                style={[
                  styles.newCharChip,
                  { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' },
                ]}
                onPress={() => setImportModalVisible(true)}
                activeOpacity={0.7}
              >
                <Upload color="#4A8C59" size={16} />
                <Text style={[styles.newCharText, { color: '#4A8C59' }]}>
                  Importar / Backup
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* FICHA DO PERSONAGEM SELECIONADO */}
        {selectedChar ? (
          <View
            style={[
              styles.mainSheet,
              isMobile && { padding: 12, gap: 14 },
              {
                borderColor: themeColor,
                borderWidth: 1.5,
              },
            ]}
          >
            {/* 1. Cabeçalho com dados canônicos e CA recalculada com armaduras */}
            <CharacterHeader
              char={selectedChar}
              passivePerception={passivePerception}
              totalAc={totalAc}
              themeColor={themeColor}
              isMobile={isMobile}
              onOpenSpeedModal={() => {
                setQuickSpeed(selectedChar.speed || '9m');
                setSpeedModalVisible(true);
              }}
              onExportJson={handleExportJson}
              onEditChar={() => {
                setEditingChar(selectedChar);
                setModalVisible(true);
              }}
              onDeleteChar={() => handleDelete(selectedChar.id)}
            />

            {/* 2. Sinais Vitais, Barra de Vida, Descansos e Concentração */}
            <VitalsCombatPanel
              char={selectedChar}
              themeColor={themeColor}
              isMobile={isMobile}
              concentratingSpell={concentratingSpell}
              onClearConcentration={() => setConcentratingSpell(null)}
              onApplyHpDelta={handleApplyHpDelta}
              onTriggerShortRest={handleTriggerShortRest}
              onTriggerLongRest={handleTriggerLongRest}
              onToggleDeathSave={handleToggleDeathSave}
            />

            {/* 4. Grid de Atributos com Modificador Canônico Correto e Saves */}
            <AttributesGrid
              char={selectedChar}
              themeColor={themeColor}
              isMobile={isMobile}
            />

            {/* 5. Navegador de Abas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsNav}
            >
              {[
                { id: 'combat', label: 'Combate & Ataques', icon: Sword },
                { id: 'spells', label: 'Magias', icon: Scroll },
                { id: 'abilities', label: 'Habilidades', icon: Zap },
                { id: 'skills', label: 'Perícias', icon: Award },
                { id: 'inventory', label: 'Mochila', icon: Package },
                { id: 'lore', label: 'História', icon: BookOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tabBtn,
                      isActive && [
                        styles.tabBtnActive,
                        { borderColor: themeColor, backgroundColor: `${themeColor}18` },
                      ],
                    ]}
                    onPress={() => setActiveTab(tab.id as any)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      color={isActive ? themeColor : '#80776C'}
                      size={16}
                    />
                    <Text
                      style={[
                        styles.tabBtnText,
                        isActive && [styles.tabBtnTextActive, { color: '#FFF' }],
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 6. Conteúdo da Aba Selecionada */}
            <View style={styles.tabContent}>
              {activeTab === 'combat' && (
                <CombatAttacksTab
                  char={selectedChar}
                  onToggleEquipWeapon={handleToggleEquipItem}
                  onGoToInventory={() => setActiveTab('inventory')}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'spells' && (
                <SpellsManagerTab
                  char={selectedChar}
                  onToggleSpellSlot={handleToggleSpellSlot}
                  onRestoreSlotsLevel={handleRestoreSlotsLevel}
                  onToggleSpellPrepared={handleToggleSpellPrepared}
                  onSetConcentration={handleSetConcentration}
                  activeConcentration={concentratingSpell}
                  onOpenAddSpellModal={(lvl) => {
                    setSrdModalType('spell');
                    setEntityToEdit({ level: lvl || 1 });
                    setEditEntityType('spell');
                    setEditEntityVisible(true);
                  }}
                  onOpenSrdSearch={() => {
                    setSrdModalType('spell');
                    setSrdModalVisible(true);
                  }}
                  onEditSpell={(spell) => {
                    setEntityToEdit(spell);
                    setEditEntityType('spell');
                    setEditEntityVisible(true);
                  }}
                  onDeleteSpell={async (spellId) => {
                    const updated = (selectedChar.spells || []).filter((s) => s.id !== spellId);
                    setCharacters((prev) =>
                      prev.map((c) =>
                        c.id === selectedChar.id ? { ...c, spells: updated } : c
                      )
                    );
                    await ApiService.updateCharacter(selectedChar.id, { spells: updated });
                  }}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'abilities' && (
                <AbilitiesTab
                  char={selectedChar}
                  onAdjustAbilityUses={handleAdjustAbilityUses}
                  onResetAbilityUses={handleResetAbilityUses}
                  onOpenAddAbilityModal={() => {
                    setEntityToEdit({ maxUses: 1, currentUses: 1, resetType: 'SHORT_REST' });
                    setEditEntityType('ability');
                    setEditEntityVisible(true);
                  }}
                  onEditAbility={(ab) => {
                    setEntityToEdit(ab);
                    setEditEntityType('ability');
                    setEditEntityVisible(true);
                  }}
                  onDeleteAbility={async (abilityId) => {
                    const updated = (selectedChar.abilities || []).filter(
                      (a) => a.id !== abilityId
                    );
                    setCharacters((prev) =>
                      prev.map((c) =>
                        c.id === selectedChar.id ? { ...c, abilities: updated } : c
                      )
                    );
                    await ApiService.updateCharacter(selectedChar.id, {
                      abilities: updated,
                    });
                  }}
                  onUpdateKiPoints={handleUpdateKiPoints}
                  onUpdateSorceryPoints={handleUpdateSorceryPoints}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'skills' && (
                <SkillsTab
                  char={selectedChar}
                  onUpdateProficientSkills={handleUpdateProficientSkills}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryTab
                  char={selectedChar}
                  onUpdateCoins={handleUpdateCoins}
                  onToggleEquipItem={handleToggleEquipItem}
                  onOpenAddItemModal={() => {
                    setItemToEdit({
                      id: generateId(),
                      name: '',
                      description: '',
                      weight: 1.0,
                      quantity: 1,
                      isWeapon: false,
                    });
                    setEditItemModalVisible(true);
                  }}
                  onEditItem={(item) => {
                    setItemToEdit(item);
                    setEditItemModalVisible(true);
                  }}
                  onDeleteItem={async (itemId) => {
                    const updated = (selectedChar.items || []).filter((i) => i.id !== itemId);
                    setCharacters((prev) =>
                      prev.map((c) =>
                        c.id === selectedChar.id ? { ...c, items: updated } : c
                      )
                    );
                    await ApiService.updateCharacter(selectedChar.id, { items: updated });
                  }}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}

              {activeTab === 'lore' && (
                <LoreTab
                  char={selectedChar}
                  onSaveLore={handleSaveLore}
                  themeColor={themeColor}
                  isMobile={isMobile}
                />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Shield color="#C5A059" size={48} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              {visibleCharacters.length === 0 && !isElevatedUser
                ? 'Nenhuma ficha vinculada ao seu usuário'
                : 'Nenhum personagem selecionado'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {visibleCharacters.length === 0 && !isElevatedUser
                ? `Você está identificado como @${user?.username}. Você não possui fichas de personagem associadas ao seu perfil ainda. Crie a sua ficha agora ou solicite ao Mestre para vincular uma ficha existente a você.`
                : 'Crie seu primeiro aventureiro ou selecione uma ficha na barra superior para começar.'}
            </Text>
            <TouchableOpacity
              style={styles.createFirstCharBtn}
              onPress={() => {
                setEditingChar(null);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Plus color="#110F0D" size={16} />
              <Text style={styles.createFirstCharBtnText}>
                {visibleCharacters.length === 0 && !isElevatedUser ? 'Criar Minha Ficha' : 'Criar Personagem'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MODAL DE CRIAÇÃO / EDIÇÃO BÁSICA DO PERSONAGEM */}
        {modalVisible && (
          <CharacterModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            initialData={editingChar}
            onSave={async (data) => {
              if (editingChar) {
                const updated = await ApiService.updateCharacter(editingChar.id, data);
                setCharacters((prev) =>
                  prev.map((c) => (c.id === editingChar.id ? updated : c))
                );
              } else {
                const created = await ApiService.createCharacter(data);
                setCharacters((prev) => [...prev, created]);
                setSelectedId(created.id);
              }
              setModalVisible(false);
              loadCharacters();
            }}
          />
        )}

        {/* MODAL DE EDIÇÃO DE HABILIDADE / MAGIA */}
        {editEntityVisible && selectedChar && (
          <EditAbilitySpellModal
            visible={editEntityVisible}
            type={editEntityType}
            initialData={entityToEdit}
            onClose={() => {
              setEditEntityVisible(false);
              setEntityToEdit(null);
            }}
            onSave={handleSaveEditedEntity}
            themeColor={selectedChar.themeColor}
          />
        )}

        {/* MODAL DE EDIÇÃO DE ITEM */}
        {editItemModalVisible && selectedChar && itemToEdit && (
          <EditItemModal
            visible={editItemModalVisible}
            item={itemToEdit}
            onClose={() => {
              setEditItemModalVisible(false);
              setItemToEdit(null);
            }}
            onSave={handleSaveEditedItem}
            themeColor={selectedChar.themeColor}
          />
        )}

        {/* MODAL DE BUSCA SRD */}
        {srdModalVisible && selectedChar && (
          <SrdSearchModal
            visible={srdModalVisible}
            type={srdModalType}
            onClose={() => setSrdModalVisible(false)}
            onSelect={async (data) => {
              if (srdModalType === 'spell') {
                const newSpell: SpellItemData = {
                  id: generateId(),
                  name: data.name,
                  level: data.level || 0,
                  castingTime: data.casting_time || '1 Ação',
                  range: data.range || '9m',
                  duration: data.duration || 'Instantânea',
                  components: data.components ? data.components.join(', ') : '',
                  isPrepared: false,
                  description: data.desc ? data.desc.join('\n\n') : '',
                };
                const updatedSpells = [...(selectedChar.spells || []), newSpell];
                setCharacters((prev) =>
                  prev.map((c) =>
                    c.id === selectedChar.id ? { ...c, spells: updatedSpells } : c
                  )
                );
                await ApiService.updateCharacter(selectedChar.id, { spells: updatedSpells });
              }
              setSrdModalVisible(false);
            }}
            themeColor={selectedChar.themeColor}
          />
        )}

        {/* MODAL RÁPIDO DE ALTERAR DESLOCAMENTO */}
        {speedModalVisible && selectedChar && (
          <Modal
            visible={speedModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSpeedModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { maxWidth: 440 }]}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <FastForward color={themeColor} size={18} />
                    <Text style={styles.modalTitle}>ALTERAR DESLOCAMENTO</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSpeedModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalSectionDesc}>
                    Defina o deslocamento por turno ou adicione tipos especiais (ex: 7.5m, 9m, 12m, Voo 18m).
                  </Text>

                  {/* Atalhos Comuns */}
                  <Text style={[styles.modalLabel, { marginTop: 4 }]}>
                    Atalhos Comuns (D&D 5e):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {[
                      { label: '7.5m (Anão / Halfling)', val: '7.5m' },
                      { label: '9m (Padrão 30ft)', val: '9m' },
                      { label: '10.5m (Elfo)', val: '10.5m' },
                      { label: '12m (Monge / Bárbaro)', val: '12m' },
                      { label: '15m (Cavalaria)', val: '15m' },
                    ].map((preset) => (
                      <TouchableOpacity
                        key={preset.val}
                        onPress={() => setQuickSpeed(preset.val)}
                        style={[
                          styles.speedPresetChip,
                          quickSpeed === preset.val && styles.speedPresetChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.speedPresetText,
                            quickSpeed === preset.val && styles.speedPresetTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.modalLabel}>Deslocamento Atual:</Text>
                  <TextInput
                    style={[styles.modalInput, { fontSize: 15, color: '#E6C280', marginBottom: 6 }]}
                    value={quickSpeed}
                    onChangeText={setQuickSpeed}
                    placeholder="Ex: 9m, 10.5m, 9m (Voo 18m)"
                    placeholderTextColor="#80776C"
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setSpeedModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: themeColor }]}
                    onPress={handleSaveQuickSpeed}
                  >
                    <Text style={[styles.saveBtnText, { color: '#110F0D', fontWeight: 'bold' }]}>
                      Salvar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* MODAL DE IMPORTAÇÃO E BACKUP */}
        <Modal
          visible={importModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 580 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📤 Backup & Importação de Fichas</Text>
                <TouchableOpacity
                  onPress={() => setImportModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSectionDesc}>
                  Guarde suas fichas de D&D 5e com segurança no seu dispositivo ou importe aventureiros salvos anteriormente em formato JSON.
                </Text>
                <View style={styles.backupActionsBox}>
                  <TouchableOpacity style={styles.backupBtn} onPress={handleExportAllJson}>
                    <Download color="#C5A059" size={18} />
                    <Text style={styles.backupBtnText}>
                      Baixar Backup Completo (Todas as Fichas)
                    </Text>
                  </TouchableOpacity>
                  {Platform.OS === 'web' && (
                    <TouchableOpacity
                      style={[styles.backupBtn, { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' }]}
                      onPress={handleSelectJsonFile}
                    >
                      <Upload color="#4A8C59" size={18} />
                      <Text style={[styles.backupBtnText, { color: '#4A8C59' }]}>
                        Carregar Arquivo .JSON do Computador
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                  Ou cole o código JSON abaixo:
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      height: 160,
                      textAlignVertical: 'top',
                      fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                    },
                  ]}
                  multiline
                  placeholder="Colar conteúdo JSON da ficha aqui..."
                  placeholderTextColor="#80776C"
                  value={importJsonText}
                  onChangeText={setImportJsonText}
                />
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setImportModalVisible(false);
                    setImportJsonText('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmImport}>
                  <Upload color="#110F0D" size={18} />
                  <Text style={styles.saveBtnText}>Importar para Taverna</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    width: '100%',
  },
  scrollContentDesktop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  scrollContentTablet: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContentMobile: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  container: {
    width: '100%',
    gap: 16,
  },
  containerDesktop: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    alignSelf: 'center',
  },
  containerTablet: {
    width: '100%',
  },
  containerMobile: {
    width: '100%',
    gap: 12,
  },
  selectorBar: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 8,
  },
  roleAccessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  dmAccessTag: {
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderColor: '#C5A059',
  },
  mechanicAccessTag: {
    backgroundColor: 'rgba(78, 156, 142, 0.12)',
    borderColor: '#4E9C8E',
  },
  roleAccessText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectorScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  charChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#151310',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  charChipSelected: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  chipName: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  chipNameSelected: {
    color: '#E6C280',
  },
  chipClass: {
    color: '#80776C',
    fontSize: 11,
  },
  newCharChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newCharText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainSheet: {
    backgroundColor: '#161311',
    borderRadius: 12,
    padding: 18,
    gap: 16,
  },
  tabsNav: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#191613',
    borderWidth: 1,
    borderColor: '#332B23',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.18)',
    borderColor: '#C5A059',
  },
  tabBtnText: {
    color: '#80776C',
    fontSize: 12.5,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: 'bold',
  },
  tabContent: {
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161311',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D342C',
    gap: 8,
  },
  emptyTitle: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#80776C',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
  },
  createFirstCharBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  createFirstCharBtnText: {
    color: '#110F0D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#181512',
    borderWidth: 1.5,
    borderColor: '#3D342C',
    borderRadius: 12,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    color: '#E2D8C3',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#80776C',
    fontSize: 16,
  },
  modalBody: {
    maxHeight: 380,
  },
  modalSectionDesc: {
    color: '#BAAFA0',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalLabel: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    padding: 10,
    fontSize: 13,
  },
  speedPresetChip: {
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  speedPresetChipActive: {
    borderColor: '#C5A059',
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  speedPresetText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  speedPresetTextActive: {
    color: '#E6C280',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2D251E',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1E1A16',
  },
  cancelBtnText: {
    color: '#BAAFA0',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#C5A059',
  },
  saveBtnText: {
    color: '#110F0D',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  backupActionsBox: {
    gap: 8,
    marginVertical: 8,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1A16',
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 12,
    borderRadius: 8,
  },
  backupBtnText: {
    color: '#E2D8C3',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
