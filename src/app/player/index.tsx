import CharacterModal from '@/components/player/CharacterModal';
import { EditAbilitySpellModal } from '@/components/player/EditAbilitySpellModal';
import { SrdSearchModal } from '@/components/player/SrdSearchModal';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { CharacterData, SpellItemData } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { ExportService } from '@/services/exportService';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { AlertTriangle, Award, BookOpen, ChevronDown, ChevronUp, Clock, Crosshair, Download, Edit, Eye, EyeOff, FastForward, Heart, Minus, Package, Plus, Scale, Scroll, Shield, Skull, Sparkles, Sun, Sword, Trash2, Upload, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SKILLS_LIST = [
  { name: 'Acrobacia', attr: 'dex', label: 'DES' },
  { name: 'Arcanismo', attr: 'int', label: 'INT' },
  { name: 'Atletismo', attr: 'str', label: 'FOR' },
  { name: 'Atuação', attr: 'cha', label: 'CAR' },
  { name: 'Enganação', attr: 'cha', label: 'CAR' },
  { name: 'Furtividade', attr: 'dex', label: 'DES' },
  { name: 'História', attr: 'int', label: 'INT' },
  { name: 'Intimidação', attr: 'cha', label: 'CAR' },
  { name: 'Intuição', attr: 'wis', label: 'SAB' },
  { name: 'Investigação', attr: 'int', label: 'INT' },
  { name: 'Lidar com Animais', attr: 'wis', label: 'SAB' },
  { name: 'Medicina', attr: 'wis', label: 'SAB' },
  { name: 'Natureza', attr: 'int', label: 'INT' },
  { name: 'Percepção', attr: 'wis', label: 'SAB' },
  { name: 'Persuasão', attr: 'cha', label: 'CAR' },
  { name: 'Prestidigitação', attr: 'dex', label: 'DES' },
  { name: 'Religião', attr: 'int', label: 'INT' },
  { name: 'Sobrevivência', attr: 'wis', label: 'SAB' },
];

export default function PlayerModule() {
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

  const { isMobile } = useResponsive();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<'spells' | 'abilities' | 'skills' | 'inventory' | 'lore'>('spells');
  const [loreText, setLoreText] = useState('');
  const [customHp, setCustomHp] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemIsWeapon, setNewItemIsWeapon] = useState(false);
  const [newItemIsArmor, setNewItemIsArmor] = useState(false);
  const [newItemArmorBonus, setNewItemArmorBonus] = useState('');
  const [newItemDamage, setNewItemDamage] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState('1');
  const [newSpellTotal, setNewSpellTotal] = useState('2');
  const [newAbName, setNewAbName] = useState('');
  const [newAbDesc, setNewAbDesc] = useState('');
  const [newAbUses, setNewAbUses] = useState('1');
  const [newAbReset, setNewAbReset] = useState<'SHORT_REST' | 'LONG_REST' | 'NONE'>('SHORT_REST');
  const [newAbActionType, setNewAbActionType] = useState('LIVRE');
  const [abilityFilter, setAbilityFilter] = useState('ALL');
  const [expandedAbilities, setExpandedAbilities] = useState<Record<string, boolean>>({});

  const toggleAbilityExpanded = (id: string) => {
    setExpandedAbilities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const adjustAbilityUses = async (abId: string, amount: number) => {
    if (!selectedChar) return;
    const ability = selectedChar.abilities.find(a => a.id === abId);
    if (!ability) return;
    
    let newUses = ability.currentUses + amount;
    if (newUses < 0) newUses = 0;
    if (newUses > ability.maxUses) newUses = ability.maxUses;
    
    const updatedAbilities = selectedChar.abilities.map(a => a.id === abId ? { ...a, currentUses: newUses } : a);
    setCharacters(prev => prev.map(c => c.id === selectedChar.id ? { ...c, abilities: updatedAbilities } : c));
    await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
  };

  const [srdModalVisible, setSrdModalVisible] = useState(false);
  const [srdModalType, setSrdModalType] = useState<'spell'|'ability'>('spell');
  
  const [editEntityVisible, setEditEntityVisible] = useState(false);
  const [editEntityType, setEditEntityType] = useState<'spell'|'ability'>('spell');
  const [entityToEdit, setEntityToEdit] = useState<any>(null);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [addingSpellForLevel, setAddingSpellForLevel] = useState<number | null>(null);
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellCastTime, setNewSpellCastTime] = useState('1 Ação');
  const [newSpellRange, setNewSpellRange] = useState('9m');
  const [newSpellDuration, setNewSpellDuration] = useState('Instantânea');
  const [newSpellDesc, setNewSpellDesc] = useState('');
  const [showManageSlots, setShowManageSlots] = useState(false);

  const loadCharacters = async (silent = false) => {
    try {
      const data = await ApiService.getCharacters();
      // Filtra apenas as fichas que pertencem a este usuário
      const myChars = user?.role === 'DM' ? data : data.filter((c: CharacterData) => c.username === user?.username);
      setCharacters(myChars);
      if (myChars.length > 0 && !selectedId && !silent) {
        setSelectedId(myChars[0].id);
      }
    } catch (e) {
      console.error('Erro ao carregar fichas medievais', e);
    }
  };

  useEffect(() => {
    if (characters.length > 0) {
      const exists = characters.some(c => c.id === selectedId);
      if (!selectedId || !exists) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedId(characters[0].id);
      }
    } else if (characters.length === 0 && selectedId !== null) {
      setSelectedId(null);
    }
  }, [characters, selectedId]);

  const selectedChar = characters.find(c => c.id === selectedId) || null;

  useEffect(() => {
    if (selectedChar) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoreText(selectedChar.lore || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChar?.id]); // Only reset when changing character

  const handleSaveLore = async () => {
    if (!selectedChar) return;
    try {
      await ApiService.updateCharacter(selectedChar.id, { lore: loreText });
      loadCharacters(true);
      Alert.alert('Lore Salva!', 'A história do seu personagem foi registrada nos pergaminhos.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar a lore.');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCharacters();
    const interval = setInterval(() => {
      loadCharacters(true);
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const themeColor = selectedChar?.themeColor || '#C5A059';

  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const profBonus = selectedChar ? Math.floor((selectedChar.level - 1) / 4) + 2 : 2;
  const passivePerception = selectedChar
    ? 10 + getMod(selectedChar.wis) + (selectedChar.proficientSkills.includes('Percepção') ? profBonus : 0)
    : 10;

  const totalWeight = selectedChar ? (selectedChar.items || []).reduce((acc, i) => acc + ((Number(i.weight) || 0) * (Number(i.quantity) || 1)), 0) : 0;
  const maxWeight = selectedChar ? (Number(selectedChar.str) || 10) * 7.5 : 75;
  const isOverloaded = totalWeight > maxWeight;

  const handleCreateOrUpdate = async (data: Partial<CharacterData>) => {
    try {
      if (editingChar) {
        await ApiService.updateCharacter(editingChar.id, data);
        Alert.alert('Sucesso', 'Ficha atualizada!');
      } else {
        const newChar = await ApiService.createCharacter({
          ...data,
          username: user?.username || ''
        });
        setSelectedId(newChar.id);
        Alert.alert('Sucesso', 'Ficha criada!');
      }
      setModalVisible(false);
      loadCharacters();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Falha ao salvar ficha.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = () => {
      ApiService.deleteCharacter(id).then(() => {
        loadCharacters();
        if (selectedId === id) setSelectedId(null);
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja selar e excluir este grimório de personagem para sempre?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Excluir Grimório', 'Deseja excluir este personagem para sempre?', [
        { text: 'Manter', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const handleExportJson = () => {
    if (selectedChar) {
      ExportService.exportCharacterToJson(selectedChar);
    }
  };

  const handleExportAllJson = () => {
    if (characters && characters.length > 0) {
      ExportService.exportAllCharactersToJson(characters);
    } else {
      Alert.alert('Aviso', 'Não há fichas na Taverna para exportar.');
    }
  };

  const handleSelectJsonFile = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) setImportJsonText(content);
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Dica', 'No celular ou aplicativo, copie o código JSON da ficha e cole na caixa de texto abaixo.');
    }
  };

  const handleConfirmImport = async () => {
    if (!importJsonText.trim()) {
      Alert.alert('Aviso', 'Cole o código JSON ou selecione um arquivo primeiro.');
      return;
    }
    const res = ExportService.parseImportJson(importJsonText);
    if (!res.success || !res.characters) {
      Alert.alert('Erro na Importação', res.error || 'JSON inválido');
      return;
    }
    try {
      let count = 0;
      for (const charData of res.characters) {
        await ApiService.createCharacter(charData);
        count++;
      }
      await loadCharacters();
      setImportModalVisible(false);
      setImportJsonText('');
      Alert.alert('Sucesso!', `${count} ficha(s) importada(s) com sucesso para a Taverna!`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as fichas importadas.');
    }
  };

  const modifyHp = async (delta: number) => {
    if (!selectedChar) return;
    if (delta < 0) {
      await ApiService.dmIntervene(selectedChar.id, { type: 'DAMAGE', value: Math.abs(delta) });
    } else {
      await ApiService.dmIntervene(selectedChar.id, { type: 'HEAL', value: delta });
    }
    loadCharacters(true);
  };

  const handleCustomHpAction = async (isDamage: boolean) => {
    const val = parseInt(customHp, 10);
    if (!val || !selectedChar) return;
    await modifyHp(isDamage ? -val : val);
    setCustomHp('');
  };

  const triggerShortRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      const healAmt = 8 + getMod(selectedChar.con);
      await ApiService.takeShortRest(selectedChar.id, healAmt, 1);
      loadCharacters();
      if (Platform.OS === 'web') {
        window.alert(`Ritual de Descanso Curto concluído! 1 Dado de Vida gasto, recuperou ${healAmt} HP e restaurou habilidades marciais.`);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Realizar Ritual de Descanso Curto? (Gasta 1 Dado de Vida para curar e recarrega poderes marciais)')) {
        executeRest();
      }
    } else {
      Alert.alert('Descanso Curto', 'Gastar 1 Dado de Vida para curar e recarregar poderes?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descansar na Taverna', onPress: executeRest },
      ]);
    }
  };

  const triggerLongRest = async () => {
    if (!selectedChar) return;
    const executeRest = async () => {
      await ApiService.takeLongRest(selectedChar.id);
      loadCharacters();
      if (Platform.OS === 'web') {
        window.alert('Ritual de Descanso Longo concluído! Sinais vitais e pergaminhos arcano 100% restaurados!');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Realizar Descanso Longo? (Restaura 100% dos pontos de vida, limpa maldições temporárias e recarrega todos os feitiços)')) {
        executeRest();
      }
    } else {
      Alert.alert('Descanso Longo', 'Restaura 100% do HP, todos os feitiços e poderes marciais.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dormir em Paz', onPress: executeRest },
      ]);
    }
  };

  const toggleSpellSlot = async (slotId: string, currentUsed: number, total: number) => {
    if (!selectedChar) return;
    const newUsed = currentUsed >= total ? 0 : currentUsed + 1;
    const updatedSlots = selectedChar.spellSlots.map(s => s.id === slotId ? { ...s, used: newUsed } : s);
    await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    loadCharacters(true);
  };

  const consumeAbility = async (abId: string, currentUses: number) => {
    if (!selectedChar || currentUses <= 0) return;
    const updatedAbilities = selectedChar.abilities.map(a => a.id === abId ? { ...a, currentUses: currentUses - 1 } : a);
    await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
    loadCharacters(true);
  };

  const toggleDeathSave = async (type: 'success' | 'fail', index: number) => {
    if (!selectedChar) return;
    if (type === 'success') {
      const newSuccesses = selectedChar.deathSaveSuccesses === index + 1 ? index : index + 1;
      await ApiService.updateCharacter(selectedChar.id, { deathSaveSuccesses: newSuccesses });
    } else {
      const newFailures = selectedChar.deathSaveFailures === index + 1 ? index : index + 1;
      await ApiService.updateCharacter(selectedChar.id, { deathSaveFailures: newFailures });
    }
    loadCharacters(true);
  };

  const toggleEquip = async (itemId: string, currentState: boolean) => {
    if (!selectedChar) return;
    const updatedItems = (selectedChar.items || []).map(i => i.id === itemId ? { ...i, isEquipped: !currentState } : i);
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    loadCharacters(true);
  };

  const addItem = async (newItem: { name: string; description: string; weight: number; quantity: number; isWeapon: boolean; damage?: string; isArmor?: boolean; isEquipped?: boolean; armorClassBonus?: number }) => {
    if (!selectedChar) return;
    const itemObj = {
      // eslint-disable-next-line react-hooks/purity
      id: `item-${Date.now()}`,
      ...newItem,
    };
    const updatedItems = [...(selectedChar.items || []), itemObj];
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    loadCharacters(true);
  };

  const removeItem = async (itemId: string) => {
    if (!selectedChar) return;
    const updatedItems = (selectedChar.items || []).filter(i => i.id !== itemId);
    await ApiService.updateCharacter(selectedChar.id, { items: updatedItems });
    loadCharacters(true);
  };

  const updateCoins = async (gold: number, silver: number, copper: number) => {
    if (!selectedChar) return;
    await ApiService.updateCharacter(selectedChar.id, { gold, silver, copper });
    loadCharacters(true);
  };

  const toggleSkillProficiency = async (skillName: string) => {
    if (!selectedChar) return;
    const currentList = selectedChar.proficientSkills ? selectedChar.proficientSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const exists = currentList.includes(skillName);
    const newList = exists ? currentList.filter(s => s !== skillName) : [...currentList, skillName];
    const newProfString = newList.join(',');
    
    const updated = { ...selectedChar, proficientSkills: newProfString };
    setCharacters(chars => chars.map(c => c.id === selectedChar.id ? updated : c));
    
    await ApiService.updateCharacter(selectedChar.id, { proficientSkills: newProfString });
    loadCharacters(true);
  };

  const addSpellSlot = async () => {
    if (!selectedChar || !newSpellLevel || !newSpellTotal) return;
    const levelNum = parseInt(newSpellLevel, 10) || 1;
    const totalNum = parseInt(newSpellTotal, 10) || 1;
    const newSlot = {
      // eslint-disable-next-line react-hooks/purity
      id: `slot-${Date.now()}`,
      level: levelNum,
      total: totalNum,
      used: 0,
    };
    const updatedSlots = [...selectedChar.spellSlots, newSlot].sort((a, b) => a.level - b.level);
    const updated = await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
    setNewSpellLevel('1');
    setNewSpellTotal('2');
  };

  const removeSpellSlot = async (slotId: string) => {
    if (!selectedChar) return;
    const updatedSlots = selectedChar.spellSlots.filter(s => s.id !== slotId);
    const updated = await ApiService.updateCharacter(selectedChar.id, { spellSlots: updatedSlots });
    setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
  };

  // --- GRIMÓRIO INTERATIVO: FUNÇÕES AUXILIARES ---
  const getSpellcastingStats = (char: CharacterData) => {
    const cls = (char.class || '').toLowerCase();
    let attrName = 'INTELIGÊNCIA';
    let attrScore = char.int;
    if (cls.includes('clérigo') || cls.includes('clerigo') || cls.includes('druida') || cls.includes('patrulheiro') || cls.includes('monge')) {
      attrName = 'SABEDORIA';
      attrScore = char.wis;
    } else if (cls.includes('bardo') || cls.includes('bruxo') || cls.includes('feiticeiro') || cls.includes('paladino')) {
      attrName = 'CARISMA';
      attrScore = char.cha;
    } else if (cls.includes('mago') || cls.includes('artífice') || cls.includes('artifice')) {
      attrName = 'INTELIGÊNCIA';
      attrScore = char.int;
    } else {
      if (char.wis >= char.int && char.wis >= char.cha) {
        attrName = 'SABEDORIA';
        attrScore = char.wis;
      } else if (char.cha >= char.int && char.cha >= char.wis) {
        attrName = 'CARISMA';
        attrScore = char.cha;
      }
    }
    const mod = Math.floor((attrScore - 10) / 2);
    const prof = Math.floor(((char.level || 1) - 1) / 4) + 2;
    const saveDc = 8 + prof + mod;
    const attackBonus = mod + prof >= 0 ? `+${mod + prof}` : `${mod + prof}`;
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    return { attrName, attrScore, modStr, saveDc, attackBonus };
  };

  const toggleLevelAccordion = (lvl: number) => {
    setExpandedLevels(prev => prev.includes(lvl) ? prev.filter(x => x !== lvl) : [...prev, lvl]);
  };

  const updateSpellsForChar = async (charId: string, newSpells: SpellItemData[]) => {
    try {
      const updated = await ApiService.updateCharacter(charId, { spells: newSpells });
      setCharacters(prev => prev.map(c => c.id === charId ? updated : c));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSpellPrepared = (charId: string, spellId: string) => {
    if (!selectedChar) return;
    const current = selectedChar.spells || [];
    const updated = current.map(sp => sp.id === spellId ? { ...sp, isPrepared: !sp.isPrepared } : sp);
    updateSpellsForChar(charId, updated);
  };

  const removeSpellItem = (charId: string, spellId: string) => {
    if (!selectedChar) return;
    const current = selectedChar.spells || [];
    const updated = current.filter(sp => sp.id !== spellId);
    updateSpellsForChar(charId, updated);
  };

  const addSpellItem = (charId: string, level: number) => {
    if (!newSpellName.trim() || !selectedChar) return;
    const newSp: SpellItemData = {
      // eslint-disable-next-line react-hooks/purity
      id: `sp-${Date.now()}`,
      name: newSpellName.trim(),
      level: level,
      castingTime: newSpellCastTime.trim() || '1 Ação',
      range: newSpellRange.trim() || '9m',
      duration: newSpellDuration.trim() || 'Instantânea',
      components: 'V, S',
      isPrepared: true,
      description: newSpellDesc.trim() || undefined,
    };
    const current = selectedChar.spells || [];
    updateSpellsForChar(charId, [...current, newSp]);
    setNewSpellName('');
    setNewSpellDesc('');
    setAddingSpellForLevel(null);
  };

  const handleSrdSelect = (data: any) => {
    if (!selectedChar) return;
    if (srdModalType === 'spell') {
      const newSp: SpellItemData = {
        // eslint-disable-next-line react-hooks/purity
        id: `sp-${Date.now()}`,
        name: data.name,
        level: data.level || (addingSpellForLevel || 0),
        castingTime: data.castingTime,
        range: data.range,
        duration: data.duration,
        components: data.components,
        isPrepared: true,
        description: data.description,
      };
      const current = selectedChar.spells || [];
      updateSpellsForChar(selectedChar.id, [...current, newSp]);
    } else {
      addAbilityFromSrd(selectedChar.id, data);
    }
    setSrdModalVisible(false);
  };

  const addAbilityFromSrd = async (charId: string, data: any) => {
    if (!selectedChar) return;
    const newAb = {
      // eslint-disable-next-line react-hooks/purity
      id: `ab-${Date.now()}`,
      name: data.name,
      description: data.description,
      maxUses: data.maxUses,
      currentUses: data.currentUses,
      resetType: data.resetType as any,
    };
    try {
      const updated = await ApiService.updateCharacter(charId, {
        abilities: [...selectedChar.abilities, newAb]
      });
      setCharacters(prev => prev.map(c => c.id === charId ? updated : c));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEditedEntity = async (updatedData: any) => {
    if (!selectedChar) return;
    try {
      if (editEntityType === 'spell') {
        const currentSpells = selectedChar.spells || [];
        const newSpells = currentSpells.map(s => s.id === updatedData.id ? updatedData : s);
        const updated = await ApiService.updateCharacter(selectedChar.id, { spells: newSpells });
        setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
      } else {
        const currentAbs = selectedChar.abilities || [];
        const newAbs = currentAbs.map(a => a.id === updatedData.id ? updatedData : a);
        const updated = await ApiService.updateCharacter(selectedChar.id, { abilities: newAbs });
        setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
      }
      setEditEntityVisible(false);
      setEntityToEdit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const castSpellItem = (char: CharacterData, spell: SpellItemData) => {
    if (spell.level === 0) {
      Alert.alert('⚡ Truque Conjurado!', `${char.name} conjurou ${spell.name}!\n(Truques são ilimitados e não consomem espaços de magia)`);
      return;
    }
    const targetSlot = char.spellSlots.find(s => s.level === spell.level);
    if (!targetSlot) {
      Alert.alert('⚠️ Espaço de Magia Inexistente', `Seu personagem não possui espaços de ${spell.level}º Nível cadastrados!`);
      return;
    }
    if (targetSlot.used >= targetSlot.total) {
      Alert.alert(
        '⚠️ Sem Espaços de Magia',
        `Você gastou todos os espaços de ${spell.level}º Nível!\nRealize um descanso para recuperar ou utilize um espaço de nível superior.`
      );
      return;
    }
    toggleSpellSlot(targetSlot.id, targetSlot.used + 1, targetSlot.total);
    Alert.alert('⚡ Magia Conjurada!', `${char.name} conjurou ${spell.name}!\n(1 espaço de ${spell.level}º Nível foi consumido automaticamente)`);
  };

  const addAbility = async () => {
    if (!selectedChar || !newAbName.trim()) return;
    const newAb = {
      // eslint-disable-next-line react-hooks/purity
      id: `ab-${Date.now()}`,
      name: newAbName.trim(),
      description: newAbDesc.trim(),
      maxUses: parseInt(newAbUses, 10) || 1,
      currentUses: parseInt(newAbUses, 10) || 1,
      resetType: newAbReset,
      actionType: newAbActionType,
    };
    const updatedAbilities = [...selectedChar.abilities, newAb];
    const updated = await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
    setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
    setNewAbName('');
    setNewAbDesc('');
    setNewAbUses('1');
    setNewAbReset('SHORT_REST');
    setNewAbActionType('LIVRE');
  };

  const removeAbility = async (abId: string) => {
    if (!selectedChar) return;
    const updatedAbilities = selectedChar.abilities.filter(a => a.id !== abId);
    const updated = await ApiService.updateCharacter(selectedChar.id, { abilities: updatedAbilities });
    setCharacters(prev => prev.map(c => c.id === selectedChar.id ? updated : c));
  };

  return (
    <View style={styles.container}>
      {/* Seletor de Personagens (Carrossel de Couro e Bronze) */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {characters.map(char => {
            const isSelected = char.id === selectedId;
            const chipColor = char.themeColor || '#C5A059';
            return (
              <TouchableOpacity
                key={char.id}
                style={[styles.charChip, isSelected && [styles.charChipSelected, { borderColor: chipColor, backgroundColor: `${chipColor}18` }]]}
                onPress={() => setSelectedId(char.id)}
              >
                <Shield color={isSelected ? chipColor : '#80776C'} size={16} />
                <View>
                  <Text style={[styles.chipName, isSelected && [styles.chipNameSelected, { color: chipColor }]]}>{char.name}</Text>
                  <Text style={styles.chipClass}>{char.class} • Nvl {char.level}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.newCharChip}
            onPress={() => { setEditingChar(null); setModalVisible(true); }}
          >
            <Plus color="#C5A059" size={18} />
            <Text style={styles.newCharText}>Criar Personagem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newCharChip, { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' }]}
            onPress={() => setImportModalVisible(true)}
          >
            <Upload color="#4A8C59" size={18} />
            <Text style={[styles.newCharText, { color: '#4A8C59' }]}>Importar / Backup</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Conteúdo Principal do Grimório do Aventureiro */}
      {selectedChar ? (
        <View style={[styles.mainSheet, isMobile && { padding: 14, gap: 16 }, { borderColor: themeColor, borderWidth: 1.5, shadowColor: themeColor, shadowOpacity: 0.2, shadowRadius: 15 }]}>
          {/* Header Medieval da Ficha */}
          <View style={[styles.sheetHeader, isMobile && { gap: 12, paddingBottom: 14 }]}>
            <View style={{ flexShrink: 1, minWidth: isMobile ? '100%' : 180 }}>
              <View style={[styles.levelBadge, { borderColor: `${themeColor}66`, backgroundColor: `${themeColor}15` }]}>
                <Scroll color={themeColor} size={14} />
                <Text style={[styles.levelText, { color: themeColor }]}>NÍVEL {selectedChar.level} • {selectedChar.race.toUpperCase()}</Text>
              </View>
              <Text style={[styles.charName, isMobile && { fontSize: 24 }, { color: themeColor }]}>{selectedChar.name}</Text>
              <Text style={styles.charMeta}>
                {selectedChar.class} • Jogador: <Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{selectedChar.playerName}</Text>
              </Text>
              {selectedChar.deity && selectedChar.deity !== 'Nenhum' && (
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: selectedChar.deity === 'Arcké' ? '#B82828' : selectedChar.deity === 'Vitta' ? '#C5A059' : '#1B3B6F', backgroundColor: selectedChar.deity === 'Arcké' ? '#B8282815' : selectedChar.deity === 'Vitta' ? '#C5A05915' : '#1B3B6F15' }}>
                  {selectedChar.deity === 'Arcké' && <Scale color="#B82828" size={14} />}
                  {selectedChar.deity === 'Vitta' && <Sun color="#C5A059" size={14} />}
                  {selectedChar.deity === 'Thanatos' && <Skull color="#1B3B6F" size={14} />}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: selectedChar.deity === 'Arcké' ? '#B82828' : selectedChar.deity === 'Vitta' ? '#C5A059' : '#1B3B6F', textTransform: 'uppercase' }}>
                    DEVOTO DE {selectedChar.deity}
                  </Text>
                </View>
              )}
            </View>

            {/* Estatísticas resumidas e compactas no centro do Header */}
            <View style={[
              styles.headerStatsRibbon,
              isMobile && {
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'space-around',
                gap: 4,
                paddingVertical: 6,
              },
              { borderColor: `${themeColor}44` }
            ]}>
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>PROF.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: themeColor }]}>+{profBonus}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>CA</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#8C6C90' }]}>
                  {Number(selectedChar.armorClass || 10) + (selectedChar.items || []).reduce((acc, i) => acc + (i.isArmor && i.isEquipped ? Number(i.armorClassBonus || 0) : 0), 0)}
                </Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>INIC.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }]}>
                  {selectedChar.initiativeBonus >= 0 ? `+${selectedChar.initiativeBonus}` : selectedChar.initiativeBonus}
                </Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>PERC.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }, { color: '#38783C' }]}>{passivePerception}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={[styles.headerStatItem, isMobile && { minWidth: 28 }]}>
                <Text style={styles.headerStatLabel}>DESL.</Text>
                <Text style={[styles.headerStatVal, isMobile && { fontSize: 16 }]}>{selectedChar.speed}</Text>
              </View>
            </View>

            <View style={[styles.headerActions, isMobile && { width: '100%', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, marginTop: 6 }]}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' }]}
                onPress={handleExportJson}
                accessibilityLabel="Exportar Ficha em JSON"
              >
                <Download color="#78C288" size={15} />
                <Text style={[styles.actionBtnText, { color: '#78C288' }]}>JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, isMobile && { flex: 1, justifyContent: 'center' }, { borderColor: `${themeColor}66` }]}
                onPress={() => { setEditingChar(selectedChar); setModalVisible(true); }}
              >
                <Edit color={themeColor} size={15} />
                <Text style={[styles.actionBtnText, { color: themeColor }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(selectedChar.id)}
              >
                <Trash2 color="#B82828" size={15} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Painel de Sinais Vitais (HP) e Combate Medieval */}
          <View style={[styles.combatPanel, isMobile && { gap: 12 }]}>
            <View style={[styles.hpSection, isMobile && { padding: 14, minWidth: '100%' }]}>
              {/* Header Compacto com HP Inline */}
              <View style={styles.hpHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <Heart color="#B82828" size={18} />
                  <Text style={styles.hpTitle}>PONTOS DE VIDA</Text>
                  {selectedChar.tempHp > 0 && (
                    <View style={styles.tempHpBadge}>
                      <Shield color="#C5A059" size={12} />
                      <Text style={styles.tempHpText}>+{selectedChar.tempHp} TEMP</Text>
                    </View>
                  )}
                </View>

                {/* Números de HP Direto no Header */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.hpCurrent, isMobile && { fontSize: 24 }]}>
                    {selectedChar.currentHp} <Text style={[styles.hpMax, isMobile && { fontSize: 15 }]}>/ {selectedChar.maxHp}</Text>
                  </Text>
                </View>
              </View>

              {/* Barra de Vida Medieval Compacta */}
              <View style={styles.hpBarBg}>
                <View
                  style={[
                    styles.hpBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, (selectedChar.currentHp / selectedChar.maxHp) * 100))}%`,
                      backgroundColor:
                        selectedChar.currentHp / selectedChar.maxHp > 0.5
                          ? '#38783C'
                          : selectedChar.currentHp / selectedChar.maxHp > 0.25
                          ? '#C5A059'
                          : '#B82828',
                    },
                  ]}
                />
              </View>
              
              <View style={[styles.hpNumbers, { marginBottom: 12 }]}>
                <Text style={styles.hitDiceText}>
                  Dados de Vida: <Text style={{ color: themeColor, fontWeight: '700' }}>{selectedChar.hitDiceTotal - selectedChar.hitDiceSpent}/{selectedChar.hitDiceTotal}</Text> ({selectedChar.hitDiceType})
                </Text>
              </View>

              {/* Input Customizado de Dano / Poção mais elegante e compacto */}
              <View style={styles.customHpRow}>
                <TextInput
                  style={[styles.customHpInput, isMobile && { paddingVertical: 6, fontSize: 12 }]}
                  value={customHp}
                  onChangeText={setCustomHp}
                  placeholder="Qtd Dano / Cura"
                  placeholderTextColor="#80776C"
                  keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.customBtn, styles.dmgBtn, isMobile && { paddingVertical: 6 }]} onPress={() => handleCustomHpAction(true)}>
                  <Text style={styles.dmgBtnText}>- Ferir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.customBtn, styles.healBtn, isMobile && { paddingVertical: 6 }]} onPress={() => handleCustomHpAction(false)}>
                  <Text style={styles.healBtnText}>+ Curar</Text>
                </TouchableOpacity>
              </View>
            </View>


          </View>

          {/* Grid de Atributos Ancestrais (FOR, DES, CON, INT, SAB, CAR) */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>ATRIBUTOS</Text>
          </View>
          <View style={[styles.attributesGrid, isMobile && { gap: 8 }]}>
            {[
              { name: 'FORÇA', score: selectedChar.str, prof: selectedChar.strProf },
              { name: 'DESTREZA', score: selectedChar.dex, prof: selectedChar.dexProf },
              { name: 'CONSTITUIÇÃO', score: selectedChar.con, prof: selectedChar.conProf },
              { name: 'INTELIGÊNCIA', score: selectedChar.int, prof: selectedChar.intProf },
              { name: 'SABEDORIA', score: selectedChar.wis, prof: selectedChar.wisProf },
              { name: 'CARISMA', score: selectedChar.cha, prof: selectedChar.chaProf },
            ].map((attr) => {
              const modVal = getMod(attr.score);
              const saveVal = modVal + (attr.prof ? profBonus : 0);
              return (
                <View
                  key={attr.name}
                  style={[
                    styles.attrCard,
                    isMobile && { minWidth: '30%', padding: 10, paddingVertical: 12 },
                    attr.prof && { borderColor: themeColor, backgroundColor: `${themeColor}12` }
                  ]}
                >
                  <Text
                    style={[
                      styles.attrName,
                      isMobile && { fontSize: 9.5, letterSpacing: 0.5, marginBottom: 4 },
                      attr.prof && { color: '#E2D8C3', fontWeight: '700' }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {attr.name}
                  </Text>
                  <Text style={[styles.attrMod, isMobile && { fontSize: 24, marginBottom: 2 }]}>{saveVal >= 0 ? `+${saveVal}` : saveVal}</Text>
                  <Text style={[styles.attrScore, isMobile && { fontSize: 11, marginBottom: 6 }]}>Score: {attr.score}</Text>
                </View>
              );
            })}
          </View>

          {/* Abas de Recursos (Pergaminhos, Poderes, Perícias) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={[styles.tabsNav, isMobile && { flexWrap: 'nowrap' }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'spells' && [styles.tabBtnActive, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]]}
              onPress={() => setActiveTab('spells')}
            >
              <Scroll color={activeTab === 'spells' ? themeColor : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'spells' && [styles.tabBtnTextActive, { color: '#FFF' }]]}>
                Magias
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'abilities' && [styles.tabBtnActive, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]]}
              onPress={() => setActiveTab('abilities')}
            >
              <Sword color={activeTab === 'abilities' ? themeColor : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'abilities' && [styles.tabBtnTextActive, { color: '#FFF' }]]}>
                Habilidades
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'skills' && [styles.tabBtnActive, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]]}
              onPress={() => setActiveTab('skills')}
            >
              <Award color={activeTab === 'skills' ? themeColor : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'skills' && [styles.tabBtnTextActive, { color: '#FFF' }]]}>
                Perícias
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'inventory' && [styles.tabBtnActive, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]]}
              onPress={() => setActiveTab('inventory')}
            >
              <Package color={activeTab === 'inventory' ? themeColor : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'inventory' && [styles.tabBtnTextActive, { color: '#FFF' }]]}>
                Mochila
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'lore' && [styles.tabBtnActive, { borderColor: themeColor, backgroundColor: `${themeColor}15` }]]}
              onPress={() => setActiveTab('lore')}
            >
              <BookOpen color={activeTab === 'lore' ? themeColor : '#80776C'} size={18} />
              <Text style={[styles.tabBtnText, activeTab === 'lore' && [styles.tabBtnTextActive, { color: '#FFF' }]]}>
                Lore
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Conteúdo das Abas */}
          <View style={styles.tabContent}>
            {/* ABA: Pergaminhos de Magia */}
            {/* ABA: Pergaminhos de Magia */}
            {activeTab === 'spells' && (() => {
              const spellStats = getSpellcastingStats(selectedChar);
              const charSpells = selectedChar.spells || [];
              const availableLevelsSet = new Set<number>();
              charSpells.forEach(s => availableLevelsSet.add(s.level));
              selectedChar.spellSlots.forEach(s => availableLevelsSet.add(s.level));
              availableLevelsSet.add(0);
              availableLevelsSet.add(1);
              const sortedLevels = Array.from(availableLevelsSet).sort((a, b) => a - b);

              return (
                <View style={{ gap: 16 }}>
                  {/* 🔮 1. Painel Mágico no Topo */}
                  <View style={[styles.spellStatsBanner, isMobile && { padding: 10, gap: 8 }, { borderColor: themeColor, backgroundColor: `${themeColor}0A` }]}>
                    <View style={styles.spellStatItem}>
                      <Text style={styles.spellStatLabel}>ATRIBUTO DE CONJURAÇÃO</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Sparkles color={themeColor} size={18} />
                        <Text style={[styles.spellStatValue, { color: themeColor }, isMobile && { fontSize: 14 }]}>{spellStats.attrName} ({spellStats.modStr})</Text>
                      </View>
                    </View>
                    {!isMobile && <View style={styles.spellStatDivider} />}
                    <View style={styles.spellStatItem}>
                      <Text style={styles.spellStatLabel}>CD DE RESISTÊNCIA</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Shield color="#E6C280" size={18} />
                        <Text style={[styles.spellStatValue, { color: '#E6C280', fontSize: isMobile ? 18 : 22 }]}>{spellStats.saveDc}</Text>
                      </View>
                    </View>
                    {!isMobile && <View style={styles.spellStatDivider} />}
                    <View style={styles.spellStatItem}>
                      <Text style={styles.spellStatLabel}>BÔNUS DE ATAQUE</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Crosshair color="#4E9C8E" size={18} />
                        <Text style={[styles.spellStatValue, { color: '#4E9C8E', fontSize: isMobile ? 18 : 22 }]}>{spellStats.attackBonus}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 📜 2. Acordeões de Níveis de Magia */}
                  <View style={{ gap: 12 }}>
                    {sortedLevels.map(levelNum => {
                      const isExpanded = expandedLevels.includes(levelNum);
                      const spellsInThisLevel = charSpells.filter(sp => sp.level === levelNum);
                      const slotForLevel = selectedChar.spellSlots.find(s => s.level === levelNum);

                      return (
                        <View key={`spell-lvl-${levelNum}`} style={[styles.spellAccordionCard, isExpanded && { borderColor: themeColor }]}>
                          {/* Header do Acordeão */}
                          <TouchableOpacity
                            style={styles.spellAccordionHeader}
                            onPress={() => toggleLevelAccordion(levelNum)}
                            activeOpacity={0.8}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                              <View style={[styles.levelBadgeIcon, levelNum === 0 ? { backgroundColor: 'rgba(78, 156, 142, 0.2)', borderColor: '#4E9C8E' } : { backgroundColor: `${themeColor}15`, borderColor: themeColor }]}>
                                <BookOpen color={levelNum === 0 ? '#4E9C8E' : themeColor} size={18} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.spellAccordionTitle, isMobile && { fontSize: 13 }]} numberOfLines={1}>
                                  {levelNum === 0 ? (isMobile ? '✨ TRUQUES' : '✨ TRUQUES') : (isMobile ? `📜 ${levelNum}º NÍVEL` : `📜 ${levelNum}º NÍVEL`)}
                                </Text>
                                <Text style={styles.spellAccordionSub}>
                                  {spellsInThisLevel.length} {isMobile ? 'cadastrada(s)' : (spellsInThisLevel.length === 1 ? 'magia cadastrada' : 'magias cadastradas')}
                                </Text>
                              </View>
                            </View>

                            {/* Tokens de Espaço no Header (se for nível 1+) */}
                            {levelNum > 0 && slotForLevel && (
                              <View style={[styles.accordionSlotsBox, isMobile && { paddingHorizontal: 6, paddingVertical: 4, gap: 4 }]} onStartShouldSetResponder={() => true}>
                                <Text style={[styles.accordionSlotsText, isMobile && { fontSize: 10 }]}>
                                  {isMobile ? '' : 'Usados: '}<Text style={{ color: '#E2D8C3', fontWeight: '700' }}>{slotForLevel.used}</Text> / {slotForLevel.total}
                                </Text>
                                <View style={[styles.accordionTokensRow, isMobile && { gap: 2 }]}>
                                  {Array.from({ length: slotForLevel.total }).map((_, idx) => {
                                    const isUsed = idx < slotForLevel.used;
                                    return (
                                      <TouchableOpacity
                                        key={`accordion-token-${slotForLevel.id}-${idx}`}
                                        style={[styles.accordionTokenBtn, isUsed ? styles.accordionTokenUsed : { borderColor: themeColor, backgroundColor: `${themeColor}22` }]}
                                        onPress={() => toggleSpellSlot(slotForLevel.id, slotForLevel.used, slotForLevel.total)}
                                      >
                                        <Scroll color={isUsed ? '#3D342C' : themeColor} size={isMobile ? 12 : 14} />
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}

                            <View style={styles.accordionChevronBox}>
                              {isExpanded ? <ChevronUp color={themeColor} size={22} /> : <ChevronDown color="#80776C" size={22} />}
                            </View>
                          </TouchableOpacity>

                          {/* Corpo do Acordeão */}
                          {isExpanded && (
                            <View style={styles.spellAccordionBody}>
                              {spellsInThisLevel.length === 0 ? (
                                <View style={styles.emptyLevelBox}>
                                  <Text style={styles.emptyLevelText}>Nenhuma magia cadastrada neste nível.</Text>
                                </View>
                              ) : (
                                <View style={{ gap: 10 }}>
                                  {spellsInThisLevel.map(sp => (
                                    <View key={sp.id} style={[styles.spellItemCard, !sp.isPrepared && sp.level > 0 && styles.spellItemUnprepared]}>
                                      <View style={[styles.spellItemTop, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                          {sp.level > 0 && (
                                            <TouchableOpacity
                                              style={[styles.prepBtn, sp.isPrepared ? styles.prepBtnActive : styles.prepBtnInactive]}
                                              onPress={() => toggleSpellPrepared(selectedChar.id, sp.id)}
                                            >
                                              {sp.isPrepared ? <Eye color="#110F0D" size={15} /> : <EyeOff color="#80776C" size={15} />}
                                            </TouchableOpacity>
                                          )}
                                          <Text style={[styles.spellItemName, !sp.isPrepared && sp.level > 0 && { color: '#80776C' }]}>
                                            {sp.name}
                                          </Text>
                                        </View>

                                        <View style={styles.spellActionsRow}>
                                          <TouchableOpacity
                                            style={[styles.castSpellBtn, (!sp.isPrepared && sp.level > 0) && { opacity: 0.5 }]}
                                            onPress={() => castSpellItem(selectedChar, sp)}
                                          >
                                            <Zap color="#110F0D" size={14} />
                                            <Text style={styles.castSpellBtnText}>
                                              {sp.level === 0 ? '⚡ Conjurar Truque' : '⚡ Conjurar (1 Espaço)'}
                                            </Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={[styles.delSpellBtn, { backgroundColor: 'transparent', borderColor: '#4E9C8E' }]}
                                            onPress={() => {
                                              setEditEntityType('spell');
                                              setEntityToEdit(sp);
                                              setEditEntityVisible(true);
                                            }}
                                          >
                                            <Edit color="#4E9C8E" size={15} />
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={styles.delSpellBtn}
                                            onPress={() => removeSpellItem(selectedChar.id, sp.id)}
                                          >
                                            <Trash2 color="#C95B5B" size={15} />
                                          </TouchableOpacity>
                                        </View>
                                      </View>

                                      <View style={[styles.spellBadgesRow, isMobile && { flexWrap: 'wrap', gap: 6 }]}>
                                        <View style={styles.spellBadge}>
                                          <Clock color="#C5A059" size={12} />
                                          <Text style={styles.spellBadgeText}>Tempo: {sp.castingTime}</Text>
                                        </View>
                                        <View style={styles.spellBadge}>
                                          <Crosshair color="#4E9C8E" size={12} />
                                          <Text style={styles.spellBadgeText}>Alcance: {sp.range}</Text>
                                        </View>
                                        <View style={styles.spellBadge}>
                                          <Sparkles color="#B280E6" size={12} />
                                          <Text style={styles.spellBadgeText}>Duração: {sp.duration}</Text>
                                        </View>
                                        {sp.components && (
                                          <View style={styles.spellBadge}>
                                            <Text style={styles.spellBadgeText}>Comp: {sp.components}</Text>
                                          </View>
                                        )}
                                      </View>

                                      {sp.description ? (
                                        <Text style={styles.spellItemDesc}>{sp.description}</Text>
                                      ) : null}
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Botão / Formulário para Adicionar Magia Neste Nível */}
                              {addingSpellForLevel === levelNum ? (
                                <View style={styles.addSpellInlineForm}>
                                  <Text style={styles.addSpellFormHeading}>➕ Cadastrar Magia de {levelNum === 0 ? 'Truque (Nível 0)' : `${levelNum}º Nível`}</Text>
                                  <TextInput
                                    style={styles.addInput}
                                    placeholder="Nome da Magia (ex: Bola de Fogo)"
                                    placeholderTextColor="#80776C"
                                    value={newSpellName}
                                    onChangeText={setNewSpellName}
                                  />
                                  <View style={[styles.addInputRow, isMobile && { flexDirection: 'column', gap: 8 }]}>
                                    <TextInput
                                      style={[styles.addInput, { flex: 1 }]}
                                      placeholder="Tempo (ex: 1 Ação, Bônus)"
                                      placeholderTextColor="#80776C"
                                      value={newSpellCastTime}
                                      onChangeText={setNewSpellCastTime}
                                    />
                                    <TextInput
                                      style={[styles.addInput, { flex: 1 }]}
                                      placeholder="Alcance (ex: 9m, Toque)"
                                      placeholderTextColor="#80776C"
                                      value={newSpellRange}
                                      onChangeText={setNewSpellRange}
                                    />
                                    <TextInput
                                      style={[styles.addInput, { flex: 1 }]}
                                      placeholder="Duração (ex: Instantânea, 1h)"
                                      placeholderTextColor="#80776C"
                                      value={newSpellDuration}
                                      onChangeText={setNewSpellDuration}
                                    />
                                  </View>
                                  <TextInput
                                    style={[styles.addInput, { height: 60, textAlignVertical: 'top' }]}
                                    placeholder="Descrição ou efeito da magia..."
                                    placeholderTextColor="#80776C"
                                    multiline
                                    value={newSpellDesc}
                                    onChangeText={setNewSpellDesc}
                                  />
                                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                                    <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setAddingSpellForLevel(null)}>
                                      <Text style={styles.cancelFormBtnText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.addItemSubmitBtn} onPress={() => addSpellItem(selectedChar.id, levelNum)}>
                                      <Plus color="#110F0D" size={16} />
                                      <Text style={styles.addItemSubmitText}>Salvar</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <TouchableOpacity
                                    style={styles.openAddSpellBtn}
                                    onPress={() => {
                                      setAddingSpellForLevel(levelNum);
                                      setNewSpellCastTime('1 Ação');
                                      setNewSpellRange('9m');
                                      setNewSpellDuration('Instantânea');
                                    }}
                                  >
                                    <Plus color="#C5A059" size={16} />
                                    <Text style={styles.openAddSpellBtnText}>
                                      Manual
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[styles.openAddSpellBtn, { borderColor: '#4E9C8E', marginLeft: 10 }]}
                                    onPress={() => {
                                      setAddingSpellForLevel(levelNum);
                                      setSrdModalType('spell');
                                      setSrdModalVisible(true);
                                    }}
                                  >
                                    <BookOpen color="#4E9C8E" size={16} />
                                    <Text style={[styles.openAddSpellBtnText, { color: '#4E9C8E' }]}>
                                      Buscar
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* ⚙️ Gerenciar Quantidade de Espaços de Magia por Nível */}
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.manageSlotsToggleBtn}
                      onPress={() => setShowManageSlots(!showManageSlots)}
                    >
                      <Text style={styles.manageSlotsToggleText}>
                        {showManageSlots ? '▲ Ocultar Gerenciador de Espaços' : '⚙️ Gerenciar Quantidade Total de Espaços por Nível ▼'}
                      </Text>
                    </TouchableOpacity>

                    {showManageSlots && (
                      <View style={[styles.addItemBox, { marginTop: 12 }]}>
                        <Text style={styles.addItemHeading}>➕ CADASTRAR ESPAÇOS DE MAGIA</Text>
                        <View style={styles.addItemForm}>
                          <View style={styles.addInputRow}>
                            <TextInput
                              style={[styles.addInput, { flex: 1 }]}
                              placeholder="Nível da Magia (1 a 9)"
                              placeholderTextColor="#80776C"
                              keyboardType="numeric"
                              value={newSpellLevel}
                              onChangeText={setNewSpellLevel}
                            />
                            <TextInput
                              style={[styles.addInput, { flex: 1 }]}
                              placeholder="Qtd de Espaços (ex: 2, 4)"
                              placeholderTextColor="#80776C"
                              keyboardType="numeric"
                              value={newSpellTotal}
                              onChangeText={setNewSpellTotal}
                            />
                          </View>
                          <TouchableOpacity style={styles.addItemSubmitBtn} onPress={addSpellSlot}>
                            <Plus color="#110F0D" size={18} />
                            <Text style={styles.addItemSubmitText}>Cadastrar Espaços</Text>
                          </TouchableOpacity>
                        </View>

                        {selectedChar.spellSlots.length > 0 && (
                          <View style={{ marginTop: 16 }}>
                            <Text style={[styles.addItemHeading, { fontSize: 13, marginBottom: 8 }]}>Espaços Cadastrados:</Text>
                            <View style={{ gap: 8 }}>
                              {selectedChar.spellSlots.map(slot => (
                                <View key={`manage-slot-${slot.id}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(26, 22, 19, 0.6)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#3D342C' }}>
                                  <Text style={{ color: '#E6C280', fontWeight: '600' }}>{slot.level}º Nível ({slot.total} espaços totais)</Text>
                                  <TouchableOpacity style={styles.delItemBtn} onPress={() => removeSpellSlot(slot.id)}>
                                    <Trash2 color="#C95B5B" size={16} />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* ABA: Habilidades e Poderes */}
            {activeTab === 'abilities' && (
              <View>
                {/* Filtros de Habilidade */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <TouchableOpacity onPress={() => setAbilityFilter('ALL')} style={[styles.coinBtn, abilityFilter === 'ALL' && { backgroundColor: themeColor, borderColor: '#FFF' }]}>
                    <Text style={[styles.coinBtnText, abilityFilter === 'ALL' && { color: '#110F0D' }]}>Todas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAbilityFilter('ACTIVE')} style={[styles.coinBtn, abilityFilter === 'ACTIVE' && { backgroundColor: themeColor, borderColor: '#FFF' }]}>
                    <Text style={[styles.coinBtnText, abilityFilter === 'ACTIVE' && { color: '#110F0D' }]}>Ativas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAbilityFilter('PASSIVE')} style={[styles.coinBtn, abilityFilter === 'PASSIVE' && { backgroundColor: themeColor, borderColor: '#FFF' }]}>
                    <Text style={[styles.coinBtnText, abilityFilter === 'PASSIVE' && { color: '#110F0D' }]}>Passivas</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.abilitiesList}>
                  {selectedChar.abilities.length === 0 ? (
                    <Text style={styles.emptyText}>Este herói não possui habilidades ou poderes cadastrados.</Text>
                  ) : (
                    selectedChar.abilities
                      .filter(ab => {
                        if (abilityFilter === 'ACTIVE') return ab.actionType !== 'LIVRE';
                        if (abilityFilter === 'PASSIVE') return ab.actionType === 'LIVRE';
                        return true;
                      })
                      .map(ab => {
                      const isActive = ab.actionType !== 'LIVRE';
                      const isExpanded = expandedAbilities[ab.id];
                      return (
                      <View key={ab.id} style={[styles.abilityCard, isActive ? { borderColor: `${themeColor}66`, backgroundColor: '#1A1714' } : { borderColor: '#3D342C' }]}>
                        <View style={[styles.abilityHeader, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {ab.actionType === 'ACAO' && <Sword color={themeColor} size={16} />}
                            {ab.actionType === 'ACAO_BONUS' && <FastForward color={themeColor} size={16} />}
                            {ab.actionType === 'REACAO' && <Shield color={themeColor} size={16} />}
                            {ab.actionType === 'LIVRE' && <Zap color={themeColor} size={16} />}
                            <Text style={[styles.abilityName, isActive && { color: themeColor }]}>{ab.name}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <View style={[styles.resetBadge, ab.resetType === 'LONG_REST' && styles.resetLongBadge]}>
                              <Text style={styles.resetBadgeText}>
                                {ab.resetType === 'SHORT_REST' ? '⚡ Ritual Curto' : ab.resetType === 'LONG_REST' ? '💤 Ritual Longo' : 'Contínuo'}
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.delItemBtn} onPress={() => {
                              setEditEntityType('ability');
                              setEntityToEdit(ab);
                              setEditEntityVisible(true);
                            }}>
                              <Edit color="#4E9C8E" size={16} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.delItemBtn} onPress={() => removeAbility(ab.id)}>
                              <Trash2 color="#80776C" size={16} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        {ab.description ? (
                          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            <Markdown style={markdownStyles}>
                              {isExpanded ? ab.description : ab.description.split('\n').slice(0, 3).join('\n') + (ab.description.split('\n').length > 3 ? '...' : '')}
                            </Markdown>
                            {ab.description.split('\n').length > 3 && (
                              <TouchableOpacity onPress={() => toggleAbilityExpanded(ab.id)} style={{ marginTop: 8 }}>
                                <Text style={{ color: themeColor, fontSize: 12, fontWeight: '700' }}>{isExpanded ? 'Esconder...' : 'Ler Mais...'}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : null}

                        {ab.maxUses < 90 && (
                          <View style={[styles.abilityFooter, isMobile && { flexDirection: 'column', gap: 12, alignItems: 'flex-start' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <Text style={styles.abilityUses}>
                                Usos: <Text style={{ color: '#E6C280', fontWeight: '700' }}>{ab.currentUses} / {ab.maxUses}</Text>
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 4 }}>
                                <TouchableOpacity onPress={() => adjustAbilityUses(ab.id, -1)} style={styles.miniAdjustBtn}>
                                  <Minus color="#E6C280" size={12} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => adjustAbilityUses(ab.id, 1)} style={styles.miniAdjustBtn}>
                                  <Plus color="#E6C280" size={12} />
                                </TouchableOpacity>
                              </View>
                            </View>
                            {isActive && (
                              <TouchableOpacity
                                style={[styles.useBtn, ab.currentUses <= 0 && styles.useBtnDisabled, isMobile && { width: '100%' }]}
                                disabled={ab.currentUses <= 0}
                                onPress={() => consumeAbility(ab.id, ab.currentUses)}
                              >
                                <Text style={styles.useBtnText}>{ab.currentUses > 0 ? 'Invocar Poder' : 'Esgotado'}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    )})
                  )}
                </View>

                {/* Cadastrar Nova Habilidade */}
                <View style={[styles.addItemBox, { marginTop: 24 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.addItemHeading}>➕ CADASTRAR HABILIDADE</Text>
                    <TouchableOpacity
                      style={[styles.openAddSpellBtn, { borderColor: '#4E9C8E', paddingVertical: 6 }]}
                      onPress={() => {
                        setSrdModalType('ability');
                        setSrdModalVisible(true);
                      }}
                    >
                      <BookOpen color="#4E9C8E" size={14} />
                      <Text style={[styles.openAddSpellBtnText, { color: '#4E9C8E', fontSize: 12 }]}>
                        Buscar
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.addItemForm}>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Nome da Habilidade (ex: Fúria, Visão no Escuro...)"
                        placeholderTextColor="#80776C"
                        value={newAbName}
                        onChangeText={setNewAbName}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Usos Máx (ex: 3, ou 99 para Infinito)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newAbUses}
                        onChangeText={setNewAbUses}
                      />
                    </View>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 1, minHeight: 60 }]}
                        placeholder="Descrição do poder e efeitos (suporta Markdown, **negrito**)..."
                        placeholderTextColor="#80776C"
                        multiline
                        value={newAbDesc}
                        onChangeText={setNewAbDesc}
                      />
                    </View>
                    <View style={styles.addInputRow}>
                      <Text style={{ color: '#BAAFA0', fontSize: 12, width: '100%', marginBottom: 4 }}>Tipo de Ação</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>

                        <TouchableOpacity style={[styles.coinBtn, newAbActionType === 'ACAO' && { backgroundColor: themeColor, borderColor: '#FFF' }]} onPress={() => setNewAbActionType('ACAO')}>
                          <Text style={[styles.coinBtnText, newAbActionType === 'ACAO' && { color: '#110F0D' }]}>⚔️ Ação</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.coinBtn, newAbActionType === 'ACAO_BONUS' && { backgroundColor: themeColor, borderColor: '#FFF' }]} onPress={() => setNewAbActionType('ACAO_BONUS')}>
                          <Text style={[styles.coinBtnText, newAbActionType === 'ACAO_BONUS' && { color: '#110F0D' }]}>⚡ Bônus</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.coinBtn, newAbActionType === 'REACAO' && { backgroundColor: themeColor, borderColor: '#FFF' }]} onPress={() => setNewAbActionType('REACAO')}>
                          <Text style={[styles.coinBtnText, newAbActionType === 'REACAO' && { color: '#110F0D' }]}>🛡️ Reação</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.coinBtn, newAbActionType === 'LIVRE' && { backgroundColor: themeColor, borderColor: '#FFF' }]} onPress={() => setNewAbActionType('LIVRE')}>
                          <Text style={[styles.coinBtnText, newAbActionType === 'LIVRE' && { color: '#110F0D' }]}>💨 Livre / Passiva</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.addInputRow}>
                      <Text style={{ color: '#BAAFA0', fontSize: 12, width: '100%', marginBottom: 4 }}>Recuperação</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'SHORT_REST' && { backgroundColor: '#6B4A70', borderColor: '#E6C280' }]}
                          onPress={() => setNewAbReset('SHORT_REST')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'SHORT_REST' && { color: '#FFF' }]}>⚡ Curto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'LONG_REST' && { backgroundColor: '#C5A059', borderColor: '#FFF' }]}
                          onPress={() => setNewAbReset('LONG_REST')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'LONG_REST' && { color: '#FFF' }]}>💤 Longo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.coinBtn, newAbReset === 'NONE' && { backgroundColor: '#3D342C', borderColor: '#E6C280' }]}
                          onPress={() => setNewAbReset('NONE')}
                        >
                          <Text style={[styles.coinBtnText, newAbReset === 'NONE' && { color: '#FFF' }]}>✨ Contínuo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.addItemSubmitBtn} onPress={addAbility}>
                      <Plus color="#110F0D" size={18} />
                      <Text style={styles.addItemSubmitText}>Cadastrar Habilidade</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ABA: Perícias */}
            {activeTab === 'skills' && (
              <View>
                <View style={styles.skillsGrid}>
                  {SKILLS_LIST.map(skill => {
                    const score = (selectedChar as any)[skill.attr] || 10;
                    const mod = getMod(score);
                    const isProf = selectedChar.proficientSkills ? selectedChar.proficientSkills.includes(skill.name) : false;
                    const total = mod + (isProf ? profBonus : 0);
                    return (
                      <TouchableOpacity
                        key={skill.name}
                        style={[styles.skillItem, isProf && { borderColor: themeColor, backgroundColor: `${themeColor}15` }, isMobile && { paddingHorizontal: 6, paddingVertical: 8 }]}
                        onPress={() => toggleSkillProficiency(skill.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.skillLeft, { flex: 1, flexShrink: 1 }, isMobile && { gap: 4 }]}>
                          <View style={[styles.saveDot, isProf && [styles.saveDotProf, { backgroundColor: themeColor }]]} />
                          <Text style={[styles.skillName, { flexShrink: 1 }, isProf && { color: '#E2D8C3', fontWeight: '700' }, isMobile && { fontSize: 11 }]}>{skill.name}</Text>
                          <Text style={[styles.skillAttr, isMobile && { fontSize: 9 }]}>({skill.label})</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isProf && !isMobile && <Text style={{ color: themeColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>PROFICIENTE</Text>}
                          <Text style={[styles.skillTotal, isProf && { color: '#E6C280', fontWeight: '700' }]}>
                            {total >= 0 ? `+${total}` : total}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ABA: Mochila & Armamento */}
            {activeTab === 'inventory' && (
              <View style={styles.inventoryContainer}>
                {/* 1. Alerta de Sobrecarga Se Houver */}
                {isOverloaded && (
                  <View style={styles.overloadBanner}>
                    <AlertTriangle color="#FF4545" size={24} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.overloadBannerTitle}>⚠️ SOBRECARGA ({totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg max)</Text>
                      <Text style={styles.overloadBannerDesc}>
                        O aventureiro está carregando excesso de carga! O deslocamento é reduzido em 3m.
                      </Text>
                    </View>
                  </View>
                )}

                {/* 2. Barra de Peso / Capacidade de Carga */}
                <View style={styles.weightSection}>
                  <View style={styles.weightTopRow}>
                    <Text style={styles.weightTitle}>⚖️ CAPACIDADE</Text>
                    <Text style={[styles.weightVal, isOverloaded && { color: '#FF4545', fontWeight: '700' }]}>
                      {totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg
                    </Text>
                  </View>
                  <View style={styles.weightBg}>
                    <View
                      style={[
                        styles.weightFill,
                        {
                          width: `${Math.min(100, (totalWeight / maxWeight) * 100)}%`,
                          backgroundColor: isOverloaded ? '#FF4545' : (totalWeight / maxWeight) > 0.75 ? '#C5A059' : '#38783C',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* 3. Tesouro da Guilda / Moedas */}
                <View style={styles.coinsSection}>
                  <Text style={styles.sectionHeading}>💰 MOEDAS</Text>
                  <View style={styles.coinsGrid}>
                    {/* Ouro */}
                    <View style={[styles.coinCard, { borderColor: '#E6C280' }]}>
                      <Text style={[styles.coinLabel, { color: '#E6C280' }]}>🥇 PEÇAS DE OURO (PO)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(Math.max(0, (selectedChar.gold || 0) - 10), selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(Math.max(0, (selectedChar.gold || 0) - 1), selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#E6C280' }]}>{selectedChar.gold || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins((selectedChar.gold || 0) + 1, selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins((selectedChar.gold || 0) + 10, selectedChar.silver || 0, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Prata */}
                    <View style={[styles.coinCard, { borderColor: '#C0C0C0' }]}>
                      <Text style={[styles.coinLabel, { color: '#C0C0C0' }]}>🥈 PEÇAS DE PRATA (PP)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, Math.max(0, (selectedChar.silver || 0) - 10), selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, Math.max(0, (selectedChar.silver || 0) - 1), selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#C0C0C0' }]}>{selectedChar.silver || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, (selectedChar.silver || 0) + 1, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, (selectedChar.silver || 0) + 10, selectedChar.copper || 0)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Cobre */}
                    <View style={[styles.coinCard, { borderColor: '#B87333' }]}>
                      <Text style={[styles.coinLabel, { color: '#B87333' }]}>🥉 PEÇAS DE COBRE (PC)</Text>
                      <View style={styles.coinControls}>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, Math.max(0, (selectedChar.copper || 0) - 10))}>
                          <Text style={styles.coinBtnText}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, Math.max(0, (selectedChar.copper || 0) - 1))}>
                          <Text style={styles.coinBtnText}>-1</Text>
                        </TouchableOpacity>
                        <Text style={[styles.coinValue, { color: '#B87333' }]}>{selectedChar.copper || 0}</Text>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, (selectedChar.copper || 0) + 1)}>
                          <Text style={styles.coinBtnText}>+1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.coinBtn} onPress={() => updateCoins(selectedChar.gold || 0, selectedChar.silver || 0, (selectedChar.copper || 0) + 10)}>
                          <Text style={styles.coinBtnText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Lista de Itens & Armas */}
                <View style={styles.itemsListSection}>
                  <Text style={styles.sectionHeading}>⚔️ ITENS</Text>
                  {(selectedChar.items || []).length === 0 ? (
                    <View style={styles.emptyItems}>
                      <Text style={styles.emptyItemsText}>A mochila do herói está vazia.</Text>
                    </View>
                  ) : (
                    <View style={styles.itemsGrid}>
                      {(selectedChar.items || []).map((item) => (
                        <View key={item.id} style={[styles.itemCard, item.isWeapon && styles.weaponCard]}>
                          <View style={styles.itemHeader}>
                            <View style={styles.itemTitleRow}>
                              {item.isWeapon ? <Sword color="#E6C280" size={18} /> : item.isArmor ? <Shield color="#7895C2" size={18} /> : <Package color="#BAAFA0" size={18} />}
                              <Text style={[styles.itemName, item.isWeapon && { color: '#E6C280' }, item.isArmor && { color: '#7895C2' }]}>{item.name}</Text>
                              {item.isWeapon && (
                                <View style={styles.weaponBadge}>
                                  <Text style={styles.weaponBadgeText}>Arma • {item.damage || '1d6'}</Text>
                                </View>
                              )}
                              {item.isArmor && (
                                <View style={[styles.weaponBadge, { backgroundColor: '#2C3440', borderColor: '#4A5B75' }]}>
                                  <Text style={[styles.weaponBadgeText, { color: '#7895C2' }]}>Armadura • +{item.armorClassBonus || 0} CA</Text>
                                </View>
                              )}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              {item.isArmor && (
                                <TouchableOpacity 
                                  style={[styles.delItemBtn, { backgroundColor: item.isEquipped ? '#38783C' : '#24201C', paddingHorizontal: 8 }]} 
                                  onPress={() => toggleEquip(item.id, !!item.isEquipped)}
                                >
                                  <Text style={{ fontSize: 10, color: item.isEquipped ? '#FFF' : '#80776C', fontWeight: '700' }}>
                                    {item.isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity style={styles.delItemBtn} onPress={() => removeItem(item.id)}>
                                <Trash2 color="#80776C" size={16} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                          <View style={styles.itemFooter}>
                            <Text style={styles.itemMeta}>⚖️ Peso: {Number(item.weight || 0).toFixed(1)} kg ({Number(item.weight || 0) * (item.quantity || 1)} kg total)</Text>
                            <Text style={styles.itemMeta}>📦 Qtd: x{item.quantity || 1}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* 5. Adicionar Novo Item */}
                <View style={styles.addItemBox}>
                  <Text style={styles.addItemHeading}>➕ ADICIONAR</Text>
                  <View style={styles.addItemForm}>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Nome do Item"
                        placeholderTextColor="#80776C"
                        value={newItemName}
                        onChangeText={setNewItemName}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 1 }]}
                        placeholder="Peso (kg)"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newItemWeight}
                        onChangeText={setNewItemWeight}
                      />
                      <TextInput
                        style={[styles.addInput, { flex: 0.8 }]}
                        placeholder="Qtd"
                        placeholderTextColor="#80776C"
                        keyboardType="numeric"
                        value={newItemQty}
                        onChangeText={setNewItemQty}
                      />
                    </View>

                    <View style={styles.addInputRow}>
                      <TextInput
                        style={[styles.addInput, { flex: 2 }]}
                        placeholder="Descrição do item..."
                        placeholderTextColor="#80776C"
                        value={newItemDesc}
                        onChangeText={setNewItemDesc}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity
                        style={[styles.weaponToggleBtn, { flex: 1 }, !newItemIsWeapon && !newItemIsArmor && styles.weaponToggleBtnActive]}
                        onPress={() => { setNewItemIsWeapon(false); setNewItemIsArmor(false); }}
                      >
                        <Package color={!newItemIsWeapon && !newItemIsArmor ? '#110F0D' : '#BAAFA0'} size={14} />
                        <Text style={[styles.weaponToggleText, { fontSize: 11 }, !newItemIsWeapon && !newItemIsArmor && { color: '#110F0D' }]}>Normal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.weaponToggleBtn, { flex: 1 }, newItemIsWeapon && styles.weaponToggleBtnActive]}
                        onPress={() => { setNewItemIsWeapon(true); setNewItemIsArmor(false); }}
                      >
                        <Sword color={newItemIsWeapon ? '#110F0D' : '#BAAFA0'} size={14} />
                        <Text style={[styles.weaponToggleText, { fontSize: 11 }, newItemIsWeapon && { color: '#110F0D' }]}>Arma</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.weaponToggleBtn, { flex: 1 }, newItemIsArmor && [styles.weaponToggleBtnActive, { backgroundColor: '#7895C2', borderColor: '#4A5B75' }]]}
                        onPress={() => { setNewItemIsArmor(true); setNewItemIsWeapon(false); }}
                      >
                        <Shield color={newItemIsArmor ? '#110F0D' : '#BAAFA0'} size={14} />
                        <Text style={[styles.weaponToggleText, { fontSize: 11 }, newItemIsArmor && { color: '#110F0D' }]}>Armadura</Text>
                      </TouchableOpacity>
                    </View>

                    {newItemIsWeapon && (
                      <TextInput
                        style={styles.addInput}
                        placeholder="Dano da Arma (ex: 2d6+4 cortante)"
                        placeholderTextColor="#80776C"
                        value={newItemDamage}
                        onChangeText={setNewItemDamage}
                      />
                    )}
                    {newItemIsArmor && (
                      <TextInput
                        style={styles.addInput}
                        placeholder="Bônus de CA (ex: 2, 4)"
                        placeholderTextColor="#80776C"
                        value={newItemArmorBonus}
                        onChangeText={(text) => setNewItemArmorBonus(text.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                      />
                    )}

                    <TouchableOpacity
                      style={styles.addItemSubmitBtn}
                      onPress={() => {
                        if (!newItemName.trim()) {
                          if (Platform.OS === 'web') window.alert('Por favor, informe o nome do item!');
                          else Alert.alert('Erro', 'Por favor, informe o nome do item!');
                          return;
                        }
                        addItem({
                          name: newItemName.trim(),
                          description: newItemDesc.trim(),
                          weight: Number(newItemWeight) || 1.0,
                          quantity: Number(newItemQty) || 1,
                          isWeapon: newItemIsWeapon,
                          damage: newItemIsWeapon ? (newItemDamage.trim() || '1d6 cortante') : '',
                          isArmor: newItemIsArmor,
                          isEquipped: false,
                          armorClassBonus: newItemIsArmor ? (Number(newItemArmorBonus) || 0) : 0,
                        });
                        setNewItemName('');
                        setNewItemDesc('');
                        setNewItemWeight('');
                        setNewItemQty('1');
                        setNewItemIsWeapon(false);
                        setNewItemIsArmor(false);
                        setNewItemDamage('');
                        setNewItemArmorBonus('');
                      }}
                    >
                      <Plus color="#110F0D" size={18} />
                      <Text style={styles.addItemSubmitText}>Guardar na Mochila</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {/* ABA: Lore */}
            {activeTab === 'lore' && (
              <View style={styles.loreContainer}>
                <View style={styles.loreHeaderRow}>
                  <Text style={styles.loreHeaderTitle}>HISTÓRIA</Text>
                  <TouchableOpacity style={styles.loreSaveBtn} onPress={handleSaveLore}>
                    <Text style={styles.loreSaveBtnText}>Salvar História</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.loreDesc}>
                  Escreva aqui a história de origem, as cicatrizes e os segredos do seu personagem.
                </Text>
                <TextInput
                  style={[styles.loreInput, isMobile && { minHeight: 400 }]}
                  multiline
                  value={loreText}
                  onChangeText={setLoreText}
                  placeholder="..."
                  placeholderTextColor="#5A5043"
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {/* Status e Condições Sombrias Ativas */}
          {selectedChar.conditions && selectedChar.conditions.length > 0 && (
            <View style={styles.conditionsBox}>
              <Text style={styles.conditionsHeader}>MALDIÇÕES & CONDIÇÕES ATIVAS (ESCUDO DO MESTRE)</Text>
              <View style={styles.conditionsRow}>
                {selectedChar.conditions.map(cond => (
                  <View key={cond.id} style={styles.conditionChip}>
                    <Text style={styles.conditionName}>⚠️ {cond.name}</Text>
                    <Text style={styles.conditionDesc}>{cond.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noCharBox}>
          <Text style={styles.noCharText}>Nenhum personagem selecionado ou encontrado na taverna.</Text>
          <TouchableOpacity style={styles.createBtnLarge} onPress={() => { setEditingChar(null); setModalVisible(true); }}>
            <Plus color="#110F0D" size={20} />
            <Text style={styles.createBtnLargeText}>Criar Primeiro Personagem</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Criação / Edição */}
      <CharacterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingChar}
      />

      {srdModalVisible && selectedChar && (
        <SrdSearchModal
          visible={srdModalVisible}
          type={srdModalType}
          onClose={() => setSrdModalVisible(false)}
          onSelect={handleSrdSelect}
          themeColor={selectedChar.themeColor}
        />
      )}

      {editEntityVisible && selectedChar && entityToEdit && (
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

      {/* Modal de Importação e Backup */}
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
              <TouchableOpacity onPress={() => setImportModalVisible(false)} style={styles.closeBtn}>
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
                  <Text style={styles.backupBtnText}>Baixar Backup Completo (Todas as Fichas)</Text>
                </TouchableOpacity>
                {Platform.OS === 'web' && (
                  <TouchableOpacity style={[styles.backupBtn, { borderColor: '#4A8C59', backgroundColor: '#1A2E1D' }]} onPress={handleSelectJsonFile}>
                    <Upload color="#4A8C59" size={18} />
                    <Text style={[styles.backupBtnText, { color: '#4A8C59' }]}>Carregar Arquivo .JSON do Computador</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Ou cole o código JSON abaixo:</Text>
              <TextInput
                style={[styles.modalInput, { height: 160, textAlignVertical: 'top', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}
                multiline
                placeholder="Colar conteúdo JSON da ficha aqui..."
                placeholderTextColor="#80776C"
                value={importJsonText}
                onChangeText={setImportJsonText}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setImportModalVisible(false); setImportJsonText(''); }}>
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
  );
}

function XCircleIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#110F0D', fontSize: size * 0.6, fontWeight: '900' }}>✕</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 20,
  },
  selectorBar: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
    marginBottom: 24,
  },
  selectorScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  charChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#110F0D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  charChipSelected: {
    borderColor: '#C5A059',
    backgroundColor: '#24201C',
  },
  chipName: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  chipNameSelected: {
    color: '#E6C280',
  },
  chipClass: {
    color: '#80776C',
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  newCharChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
    borderStyle: 'dashed',
  },
  newCharText: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  mainSheet: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 28,
    gap: 26,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 20,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  levelText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  charName: {
    color: '#E2D8C3',
    fontSize: 28,
    fontWeight: '700',
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  charMeta: {
    color: '#BAAFA0',
    fontSize: 14,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#24201C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  actionBtnText: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deleteBtn: {
    borderColor: 'rgba(184, 40, 40, 0.4)',
    backgroundColor: 'rgba(184, 40, 40, 0.1)',
  },
  headerStatsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  headerStatItem: {
    alignItems: 'center',
    minWidth: 36,
    flexShrink: 1,
  },
  headerStatLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  headerStatVal: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  headerStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#2D251E',
  },
  combatPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  hpSection: {
    flex: 2,
    minWidth: 280,
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
  },
  hpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  hpTitle: {
    color: '#B82828',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tempHpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  tempHpText: {
    color: '#E6C280',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpBarBg: {
    height: 12,
    backgroundColor: '#24201C',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpNumbers: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hpCurrent: {
    color: '#E2D8C3',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  hpMax: {
    color: '#80776C',
    fontSize: 15,
    fontWeight: '600',
  },
  hitDiceText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },

  dmgBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: 'rgba(184, 40, 40, 0.5)',
  },
  dmgBtnText: {
    color: '#B82828',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.15)',
    borderColor: 'rgba(56, 120, 60, 0.5)',
  },
  healBtnText: {
    color: '#38783C',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  customHpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customHpInput: {
    flexGrow: 1,
    flexBasis: 100,
    minWidth: 100,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    color: '#E2D8C3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  customBtn: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deathAndRestSection: {
    flex: 1,
    minWidth: 260,
    gap: 12,
  },
  deathBox: {
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
  },
  deathTitle: {
    color: '#E2D8C3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deathLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginRight: 2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restBox: {
    backgroundColor: '#110F0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  restTitle: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortRestBtn: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(107, 74, 112, 0.15)',
    borderWidth: 1,
    borderColor: '#6B4A70',
    padding: 10,
    borderRadius: 6,
  },
  longRestBtn: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#8C704F',
    padding: 10,
    borderRadius: 6,
  },
  restBtnTitle: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  restBtnSub: {
    color: '#BAAFA0',
    fontSize: 9,
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  sectionHeader: {
    color: '#C5A059',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attrCard: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 12,
    alignItems: 'center',
  },
  attrName: {
    color: '#BAAFA0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  attrMod: {
    color: '#E2D8C3',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  attrScore: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  saveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D342C',
  },
  saveDotProf: {
    backgroundColor: '#E6C280',
  },
  saveText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tabsNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    gap: 12,
    marginTop: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#E6C280',
  },
  tabBtnText: {
    color: '#80776C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tabBtnTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  tabContent: {
    paddingTop: 18,
  },
  emptyText: {
    color: '#80776C',
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  slotCard: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
  },
  slotHeader: {
    marginBottom: 12,
  },
  slotLevel: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotCount: {
    color: '#BAAFA0',
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotTokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotToken: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTokenUsed: {
    backgroundColor: '#1A1714',
    borderColor: '#3D342C',
  },
  abilitiesList: {
    gap: 12,
  },
  abilityCard: {
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 18,
    gap: 12,
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  abilityName: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  abilityDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  resetBadge: {
    backgroundColor: 'rgba(107, 74, 112, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6B4A70',
  },
  resetLongBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#8C704F',
  },
  resetBadgeText: {
    color: '#E2D8C3',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  abilityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    paddingTop: 12,
  },
  abilityUses: {
    color: '#BAAFA0',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  useBtn: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#8C704F',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  useBtnDisabled: {
    backgroundColor: '#1A1714',
    borderColor: '#3D342C',
  },
  useBtnText: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillsBanner: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  skillsBannerTitle: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillsBannerSub: {
    color: '#BAAFA0',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillItem: {
    width: Platform.OS === 'web' ? '31%' : '47%',
    minWidth: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#110F0D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  skillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillName: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  skillAttr: {
    color: '#80776C',
    fontSize: 11,
  },
  skillTotal: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  conditionsBox: {
    backgroundColor: 'rgba(184, 40, 40, 0.1)',
    borderWidth: 1,
    borderColor: '#B82828',
    borderRadius: 8,
    padding: 18,
  },
  conditionsHeader: {
    color: '#B82828',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionChip: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#B82828',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  conditionName: {
    color: '#B82828',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionDesc: {
    color: '#E2D8C3',
    fontSize: 12,
    marginTop: 2,
  },
  noCharBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCharText: {
    color: '#BAAFA0',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  createBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  createBtnLargeText: {
    color: '#110F0D',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  inventoryContainer: {
    gap: 24,
  },
  overloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 69, 69, 0.15)',
    borderWidth: 1,
    borderColor: '#FF4545',
    padding: 16,
    borderRadius: 8,
  },
  overloadBannerTitle: {
    color: '#FF4545',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  overloadBannerDesc: {
    color: '#E2D8C3',
    fontSize: 13,
    marginTop: 4,
  },
  weightSection: {
    backgroundColor: '#161311',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D251E',
    gap: 10,
  },
  weightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightTitle: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  weightVal: {
    color: '#E6C280',
    fontSize: 15,
    fontWeight: '700',
  },
  weightBg: {
    height: 10,
    backgroundColor: '#0A0908',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  weightFill: {
    height: '100%',
    borderRadius: 5,
  },
  coinsSection: {
    gap: 12,
  },
  sectionHeading: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
    paddingBottom: 8,
  },
  coinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coinCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  coinLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  coinControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  coinBtn: {
    backgroundColor: '#26201B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  coinBtnText: {
    color: '#E2D8C3',
    fontSize: 12,
    fontWeight: '700',
  },
  coinValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  itemsListSection: {
    gap: 12,
  },
  emptyItems: {
    backgroundColor: '#161311',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  emptyItemsText: {
    color: '#80776C',
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    padding: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  weaponCard: {
    borderColor: '#5C4A32',
    backgroundColor: '#1A1612',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  itemName: {
    color: '#E2D8C3',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  weaponBadge: {
    backgroundColor: '#3D3020',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C704F',
  },
  weaponBadgeText: {
    color: '#E6C280',
    fontSize: 11,
    fontWeight: '700',
  },
  delItemBtn: {
    padding: 4,
  },
  itemDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#26201B',
    paddingTop: 8,
    marginTop: 4,
  },
  itemMeta: {
    color: '#80776C',
    fontSize: 12,
  },
  addItemBox: {
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  addItemHeading: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  addItemForm: {
    gap: 12,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  addInput: {
    backgroundColor: '#0A0908',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#E2D8C3',
    fontSize: 14,
    minWidth: 120,
  },
  weaponToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26201B',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  weaponToggleBtnActive: {
    backgroundColor: '#E6C280',
    borderColor: '#C5A059',
  },
  weaponToggleText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '700',
  },
  addItemSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  addItemSubmitText: {
    color: '#110F0D',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  spellStatsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(22, 19, 17, 0.85)',
    borderWidth: 1,
    borderColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  spellStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  spellStatLabel: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  spellStatValue: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  spellStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#3D342C',
  },
  spellAccordionCard: {
    backgroundColor: '#161311',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  spellAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1815',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D251E',
  },
  levelBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spellAccordionTitle: {
    color: '#E6C280',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  spellAccordionSub: {
    color: '#80776C',
    fontSize: 12,
    marginTop: 2,
  },
  accordionSlotsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 9, 8, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  accordionSlotsText: {
    color: '#E2D8C3',
    fontSize: 12,
  },
  accordionTokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accordionTokenBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(230, 194, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTokenUsed: {
    backgroundColor: 'rgba(20, 18, 16, 0.8)',
    borderColor: '#3D342C',
  },
  accordionChevronBox: {
    paddingLeft: 6,
  },
  spellAccordionBody: {
    padding: 14,
    backgroundColor: '#110F0D',
  },
  emptyLevelBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyLevelText: {
    color: '#80776C',
    fontSize: 13,
    fontStyle: 'italic',
  },
  spellItemCard: {
    backgroundColor: 'rgba(26, 22, 19, 0.7)',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  spellItemUnprepared: {
    opacity: 0.55,
    borderColor: '#2D251E',
    backgroundColor: 'rgba(15, 13, 11, 0.4)',
  },
  spellItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prepBtnActive: {
    backgroundColor: '#C5A059',
    borderColor: '#E6C280',
  },
  prepBtnInactive: {
    backgroundColor: 'transparent',
    borderColor: '#524B43',
  },
  spellItemName: {
    color: '#E2D8C3',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  spellActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  castSpellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  castSpellBtnText: {
    color: '#110F0D',
    fontSize: 12,
    fontWeight: '700',
  },
  delSpellBtn: {
    padding: 6,
  },
  spellBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 9, 8, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2D251E',
  },
  spellBadgeText: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  spellItemDesc: {
    color: '#D1C7B7',
    fontSize: 13,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 52, 44, 0.4)',
    paddingTop: 8,
    marginTop: 2,
  },
  addSpellInlineForm: {
    backgroundColor: '#191613',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C5A059',
    marginTop: 12,
    gap: 10,
  },
  addSpellFormHeading: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cancelFormBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#524B43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormBtnText: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '600',
  },
  openAddSpellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#C5A059',
    borderStyle: 'dashed',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  openAddSpellBtnText: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '600',
  },
  manageSlotsToggleBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 22, 19, 0.5)',
    borderWidth: 1,
    borderColor: '#2D251E',
    borderRadius: 6,
  },
  manageSlotsToggleText: {
    color: '#80776C',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 15, 13, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    backgroundColor: '#110F0D',
  },
  modalTitle: {
    color: '#C5A059',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#24201C',
  },
  closeBtnText: {
    color: '#BAAFA0',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBody: {
    padding: 24,
    maxHeight: Platform.OS === 'web' ? 550 : 400,
  },
  modalSectionDesc: {
    color: '#BAAFA0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  backupActionsBox: {
    gap: 12,
    marginBottom: 10,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  backupBtnText: {
    color: '#C5A059',
    fontWeight: '700',
    fontSize: 13,
  },
  modalLabel: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 12,
    color: '#F4ECE1',
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3D342C',
    backgroundColor: '#110F0D',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  cancelBtnText: {
    color: '#BAAFA0',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
    backgroundColor: '#C5A059',
  },
  saveBtnText: {
    color: '#110F0D',
    fontWeight: '700',
  },
  loreContainer: {
    backgroundColor: '#161311',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 16,
    gap: 12,
  },
  loreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  loreHeaderTitle: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loreSaveBtn: {
    backgroundColor: '#2A241F',
    borderWidth: 1,
    borderColor: '#524B43',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  loreSaveBtnText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
  },
  loreDesc: {
    color: '#80776C',
    fontSize: 13,
    marginBottom: 8,
  },
  loreInput: {
    backgroundColor: '#110F0D',
    color: '#D1C7B7',
    fontSize: 15,
    lineHeight: 24,
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D251E',
    minHeight: 250,
  },
  miniAdjustBtn: {
    padding: 4,
    backgroundColor: '#3D342C',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#5C4A3D',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

const markdownStyles = {
  body: { color: '#BAAFA0', fontSize: 13, lineHeight: 20 },
  strong: { color: '#E2D8C3', fontWeight: 'bold' as const },
  em: { fontStyle: 'italic' as const, color: '#D4C6AB' },
};
