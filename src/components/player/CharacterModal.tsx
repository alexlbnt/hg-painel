import { CharacterData } from '@/lib/mockData';
import { Minus, Plus, Save, Sparkles, Sword, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { parseClassesAndCalculateSlots } from '@/utils/spellProgression';

interface CharacterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<CharacterData>) => void;
  initialData?: CharacterData | null;
}

export default function CharacterModal({ visible, onClose, onSave, initialData }: CharacterModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [race, setRace] = useState('');
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState('1');
  const [maxHp, setMaxHp] = useState('10');
  const [armorClass, setArmorClass] = useState('10');
  const [initiativeBonus, setInitiativeBonus] = useState('0');
  const [deity, setDeity] = useState('Nenhum');

  // Atributos
  const [str, setStr] = useState('10');
  const [dex, setDex] = useState('10');
  const [con, setCon] = useState('10');
  const [int, setInt] = useState('10');
  const [wis, setWis] = useState('10');
  const [cha, setCha] = useState('10');

  // Proficiências em Testes de Resistência
  const [strProf, setStrProf] = useState(false);
  const [dexProf, setDexProf] = useState(false);
  const [conProf, setConProf] = useState(false);
  const [intProf, setIntProf] = useState(false);
  const [wisProf, setWisProf] = useState(false);
  const [chaProf, setChaProf] = useState(false);

  // Cor de Tema da Ficha
  const [themeColor, setThemeColor] = useState('#C5A059');
  const [assignedUsername, setAssignedUsername] = useState('');

  // Espaços de Magia por Nível (1 a 9)
  const [slotsByLevel, setSlotsByLevel] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
  });

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialData.name);
      setPlayerName(initialData.playerName);
      setAssignedUsername(initialData.username || '');
      setRace(initialData.race);
      setClassName(initialData.class);
      setLevel(initialData.level.toString());
      setMaxHp(initialData.maxHp.toString());
      setArmorClass(initialData.armorClass.toString());
      setInitiativeBonus(initialData.initiativeBonus.toString());
      setStr(initialData.str.toString());
      setDex(initialData.dex.toString());
      setCon(initialData.con.toString());
      setInt(initialData.int.toString());
      setWis(initialData.wis.toString());
      setCha(initialData.cha.toString());
      setStrProf(!!initialData.strProf);
      setDexProf(!!initialData.dexProf);
      setConProf(!!initialData.conProf);
      setIntProf(!!initialData.intProf);
      setWisProf(!!initialData.wisProf);
      setChaProf(!!initialData.chaProf);
      setThemeColor(initialData.themeColor || '#C5A059');
      setDeity(initialData.deity || 'Nenhum');

      // Inicializa os espaços de magia da ficha existente
      const existingSlotsMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      if (initialData.spellSlots && initialData.spellSlots.length > 0) {
        initialData.spellSlots.forEach(s => {
          if (s.level >= 1 && s.level <= 9) {
            existingSlotsMap[s.level] = s.total;
          }
        });
      } else {
        // Se a ficha não tinha slots gravados, pré-calcula com base nas regras de D&D 5e
        const calculated = parseClassesAndCalculateSlots(initialData.class || 'Paladino', initialData.level || 1);
        for (let l = 1; l <= 9; l++) {
          const std = calculated.standard[l] || 0;
          const war = (calculated.warlock && calculated.warlock.level === l) ? calculated.warlock.count : 0;
          existingSlotsMap[l] = std + war;
        }
      }
      setSlotsByLevel(existingSlotsMap);
    } else {
      setName('');
      setPlayerName(user?.name || 'Alex');
      setAssignedUsername(user?.role === 'DM' ? '' : (user?.username || ''));
      setRace('Meio-Elfo');
      setClassName('Paladino');
      setLevel('1');
      setMaxHp('12');
      setArmorClass('16');
      setInitiativeBonus('1');
      setStr('16');
      setDex('12');
      setCon('14');
      setInt('10');
      setWis('12');
      setCha('15');
      setStrProf(false);
      setDexProf(false);
      setConProf(false);
      setIntProf(false);
      setWisProf(true);
      setChaProf(true);
      setThemeColor('#C5A059');
      setDeity('Nenhum');

      // Padrão de novo personagem: Paladino Nível 1 não tem slots no nível 1 (ganha no 2)
      const calculated = parseClassesAndCalculateSlots('Paladino', 1);
      const newSlotsMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      for (let l = 1; l <= 9; l++) {
        const std = calculated.standard[l] || 0;
        const war = (calculated.warlock && calculated.warlock.level === l) ? calculated.warlock.count : 0;
        newSlotsMap[l] = std + war;
      }
      setSlotsByLevel(newSlotsMap);
    }
  }, [initialData, visible, user?.name, user?.username, user?.role]);

  // Função para recalcular os espaços oficiais de D&D 5e sob demanda
  const handleAutoFillOfficialSlots = () => {
    const currentLvl = parseInt(level, 10) || 1;
    const calculated = parseClassesAndCalculateSlots(className, currentLvl);
    const newSlotsMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let l = 1; l <= 9; l++) {
      const std = calculated.standard[l] || 0;
      const war = (calculated.warlock && calculated.warlock.level === l) ? calculated.warlock.count : 0;
      newSlotsMap[l] = std + war;
    }
    setSlotsByLevel(newSlotsMap);
  };

  const updateSlotLevel = (lvl: number, total: number) => {
    setSlotsByLevel(prev => ({
      ...prev,
      [lvl]: Math.max(0, Math.min(20, total)),
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Formata os espaços de magia para persistência
    const formattedSlots = Object.entries(slotsByLevel)
      .map(([lvlStr, total]) => {
        const lvl = parseInt(lvlStr, 10);
        const existing = (initialData?.spellSlots || []).find(s => s.level === lvl);
        return {
          id: existing?.id || `slot-${lvl}-${Date.now()}`,
          level: lvl,
          total: Math.max(0, total),
          used: existing ? Math.min(existing.used, total) : 0,
        };
      })
      .filter(s => s.total > 0);

    onSave({
      name,
      playerName: (user?.role === 'DM' || user?.role === 'MECHANIC') ? playerName : (user?.name || playerName),
      username: (user?.role === 'DM' || user?.role === 'MECHANIC') ? assignedUsername.trim().toLowerCase() : (user?.username || ''),
      race,
      class: className,
      level: parseInt(level, 10) || 1,
      maxHp: parseInt(maxHp, 10) || 10,
      currentHp: initialData ? initialData.currentHp : (parseInt(maxHp, 10) || 10),
      armorClass: parseInt(armorClass, 10) || 10,
      initiativeBonus: parseInt(initiativeBonus, 10) || 0,
      str: parseInt(str, 10) || 10,
      dex: parseInt(dex, 10) || 10,
      con: parseInt(con, 10) || 10,
      int: parseInt(int, 10) || 10,
      wis: parseInt(wis, 10) || 10,
      cha: parseInt(cha, 10) || 10,
      strProf,
      dexProf,
      conProf,
      intProf,
      wisProf,
      chaProf,
      themeColor,
      deity,
      spellSlots: formattedSlots,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sword color="#C5A059" size={20} />
              <Text style={styles.title}>{initialData ? 'EDITAR FICHA DO PERSONAGEM' : 'CRIAR NOVO PERSONAGEM'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#BAAFA0" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Informações Básicas */}
            <Text style={styles.sectionTitle}>IDENTIDADE & ANTECEDENTES</Text>
            
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Personagem *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Thalor Vane"
                  placeholderTextColor="#80776C"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Jogador</Text>
                <TextInput
                  style={[styles.input, !(user?.role === 'DM' || user?.role === 'MECHANIC') && { backgroundColor: '#1A1714', color: '#666' }]}
                  value={playerName}
                  onChangeText={setPlayerName}
                  editable={user?.role === 'DM' || user?.role === 'MECHANIC'}
                  placeholder="Nome do Jogador"
                  placeholderTextColor="#80776C"
                />
              </View>
            </View>

            {(user?.role === 'DM' || user?.role === 'MECHANIC') && (
              <View style={[styles.inputGroup, { marginBottom: 16 }]}>
                <Text style={styles.label}>Login do Usuário (Username para vincular à ficha)</Text>
                <TextInput
                  style={styles.input}
                  value={assignedUsername}
                  onChangeText={setAssignedUsername}
                  placeholder="Ex: lobo.l, leo.a, joao.c..."
                  placeholderTextColor="#80776C"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Classe & Subclasse</Text>
                <TextInput
                  style={styles.input}
                  value={className}
                  onChangeText={setClassName}
                  placeholder="Ex: Paladino (Vingança)"
                  placeholderTextColor="#80776C"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Raça Medieval</Text>
                <TextInput
                  style={styles.input}
                  value={race}
                  onChangeText={setRace}
                  placeholder="Ex: Aasimar Caído"
                  placeholderTextColor="#80776C"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.5 }]}>
                <Text style={styles.label}>Nível</Text>
                <TextInput
                  style={styles.input}
                  value={level}
                  onChangeText={setLevel}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#80776C"
                />
              </View>
            </View>

            {/* Religião / Divindade */}
            <Text style={styles.label}>Devoção / Divindade</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                { name: 'Nenhum', color: '#80776C', label: 'Nenhum' },
                { name: 'Arcké', color: '#B82828', label: 'Arcké, o Justo' },
                { name: 'Vitta', color: '#C5A059', label: 'Vitta, a Bondade' },
                { name: 'Thanatos', color: '#1B3B6F', label: 'Thanatos, o Descanso' }
              ].map(d => (
                <TouchableOpacity
                  key={d.name}
                  onPress={() => setDeity(d.name)}
                  style={[
                    styles.deityChip,
                    deity === d.name && { borderColor: d.color, backgroundColor: `${d.color}22` }
                  ]}
                >
                  <Text style={[styles.deityChipText, deity === d.name && { color: d.color, fontWeight: 'bold' }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Estatísticas de Combate */}
            <Text style={styles.sectionTitle}>ESTATÍSTICAS VITAIS DE COMBATE</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>HP Máximo</Text>
                <TextInput
                  style={styles.input}
                  value={maxHp}
                  onChangeText={setMaxHp}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Classe Armadura (CA)</Text>
                <TextInput
                  style={styles.input}
                  value={armorClass}
                  onChangeText={setArmorClass}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bônus Iniciativa</Text>
                <TextInput
                  style={styles.input}
                  value={initiativeBonus}
                  onChangeText={setInitiativeBonus}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Atributos (FOR-CAR) & Proficiência em Testes de Resistência */}
            <Text style={styles.sectionTitle}>ATRIBUTOS ANCESTRAIS & RESISTÊNCIA</Text>
            <View style={styles.grid3}>
              {[
                { label: 'Força (FOR)', val: str, setVal: setStr, prof: strProf, setProf: setStrProf },
                { label: 'Destreza (DES)', val: dex, setVal: setDex, prof: dexProf, setProf: setDexProf },
                { label: 'Constituição (CON)', val: con, setVal: setCon, prof: conProf, setProf: setConProf },
                { label: 'Inteligência (INT)', val: int, setVal: setInt, prof: intProf, setProf: setIntProf },
                { label: 'Sabedoria (SAB)', val: wis, setVal: setWis, prof: wisProf, setProf: setWisProf },
                { label: 'Carisma (CAR)', val: cha, setVal: setCha, prof: chaProf, setProf: setChaProf },
              ].map((item) => (
                <View key={item.label} style={[styles.inputGroup, styles.attrInputCard, item.prof && { borderColor: '#C5A059' }]}>
                  <Text style={styles.label}>{item.label}</Text>
                  <TextInput style={styles.input} value={item.val} onChangeText={item.setVal} keyboardType="numeric" />
                  <TouchableOpacity
                    style={[styles.profBtn, item.prof && styles.profBtnActive]}
                    onPress={() => item.setProf(!item.prof)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.profDot, item.prof && styles.profDotActive]} />
                    <Text style={[styles.profBtnText, item.prof && styles.profBtnTextActive]}>
                      {item.prof ? '✓ Proficiente (Resist.)' : '+ Resistência'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Espaços de Magia (1º ao 9º Nível) */}
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>
                  ESPAÇOS DE MAGIA (D&D 5E / PERSONALIZADO)
                </Text>
                <TouchableOpacity
                  style={styles.autoFillBtn}
                  onPress={handleAutoFillOfficialSlots}
                  activeOpacity={0.8}
                >
                  <Sparkles color="#4E9C8E" size={14} />
                  <Text style={styles.autoFillBtnText}>✨ Preencher D&D 5e</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSubtitle}>
                Defina manualmente a quantidade total de espaços por nível. O botão acima calcula automaticamente com base na Classe ({className || 'Classe'}) e Nível ({level || '1'}).
              </Text>

              <View style={styles.slotGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                  const count = slotsByLevel[lvl] || 0;
                  const hasSlots = count > 0;
                  return (
                    <View
                      key={`modal-slot-card-${lvl}`}
                      style={[
                        styles.slotCard,
                        hasSlots && { borderColor: themeColor, backgroundColor: 'rgba(26, 22, 19, 0.95)' }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={[styles.slotBadgeText, hasSlots && { color: themeColor, fontWeight: '700' }]}>
                          {lvl}º Nível
                        </Text>
                        <View style={[styles.slotDot, hasSlots && { backgroundColor: themeColor }]} />
                      </View>

                      <View style={styles.slotCounterRow}>
                        <TouchableOpacity
                          style={[styles.slotStepBtn, count <= 0 && { opacity: 0.3 }]}
                          disabled={count <= 0}
                          onPress={() => updateSlotLevel(lvl, count - 1)}
                        >
                          <Minus color="#E2D8C3" size={14} />
                        </TouchableOpacity>

                        <TextInput
                          style={[styles.slotInput, hasSlots && { borderColor: themeColor, color: '#E6C280' }]}
                          value={count === 0 ? '' : String(count)}
                          placeholder="0"
                          placeholderTextColor="#666"
                          onChangeText={(t) => {
                            const cleaned = t.replace(/[^0-9]/g, '');
                            const val = cleaned === '' ? 0 : parseInt(cleaned, 10);
                            updateSlotLevel(lvl, isNaN(val) ? 0 : val);
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />

                        <TouchableOpacity
                          style={styles.slotStepBtn}
                          onPress={() => updateSlotLevel(lvl, count + 1)}
                        >
                          <Plus color="#E2D8C3" size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Save color="#110F0D" size={16} />
              <Text style={styles.saveBtnText}>{initialData ? 'Selar e Salvar Alterações' : 'Inscrever Herói na Mesa'}</Text>
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
    backgroundColor: 'rgba(17, 15, 13, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    width: '100%',
    maxWidth: 650,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    backgroundColor: '#110F0D',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
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
  body: {
    maxHeight: Platform.OS === 'web' ? 550 : 400,
  },
  bodyContent: {
    padding: 24,
  },
  sectionTitle: {
    color: '#E6C280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    minWidth: 130,
  },
  label: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
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
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  attrInputCard: {
    backgroundColor: '#141210',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  profBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  profBtnActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  profDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D342C',
  },
  profDotActive: {
    backgroundColor: '#C5A059',
  },
  profBtnText: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '600',
  },
  profBtnTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  footer: {
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
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
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
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deityChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    backgroundColor: '#1A1714',
  },
  deityChipText: {
    color: '#80776C',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderWidth: 1,
    borderColor: '#4E9C8E',
  },
  autoFillBtnText: {
    color: '#4E9C8E',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#80776C',
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    flex: 1,
    minWidth: 105,
    backgroundColor: '#141210',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  slotBadgeText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3D342C',
  },
  slotCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  slotStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInput: {
    flex: 1,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#80776C',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 32,
  },
});
