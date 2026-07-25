import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { X, Save, Shield, User, Sword } from 'lucide-react-native';

interface CharacterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<CharacterData>) => void;
  initialData?: CharacterData | null;
}

export default function CharacterModal({ visible, onClose, onSave, initialData }: CharacterModalProps) {
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [race, setRace] = useState('');
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState('1');
  const [maxHp, setMaxHp] = useState('10');
  const [armorClass, setArmorClass] = useState('10');
  const [initiativeBonus, setInitiativeBonus] = useState('0');

  // Atributos
  const [str, setStr] = useState('10');
  const [dex, setDex] = useState('10');
  const [con, setCon] = useState('10');
  const [int, setInt] = useState('10');
  const [wis, setWis] = useState('10');
  const [cha, setCha] = useState('10');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPlayerName(initialData.playerName);
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
    } else {
      setName('');
      setPlayerName('Alex');
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
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      playerName,
      race,
      class: className,
      level: parseInt(level, 10) || 1,
      maxHp: parseInt(maxHp, 10) || 10,
      currentHp: parseInt(maxHp, 10) || 10,
      armorClass: parseInt(armorClass, 10) || 10,
      initiativeBonus: parseInt(initiativeBonus, 10) || 0,
      str: parseInt(str, 10) || 10,
      dex: parseInt(dex, 10) || 10,
      con: parseInt(con, 10) || 10,
      int: parseInt(int, 10) || 10,
      wis: parseInt(wis, 10) || 10,
      cha: parseInt(cha, 10) || 10,
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
              <Text style={styles.title}>{initialData ? 'REESCREVER GRIMÓRIO DO HERÓI' : 'ESCREVER NOVO GRIMÓRIO'}</Text>
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
                <Text style={styles.label}>Nome do Aventureiro *</Text>
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
                  style={styles.input}
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="Ex: Alex"
                  placeholderTextColor="#80776C"
                />
              </View>
            </View>

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

            {/* Atributos (FOR-CAR) */}
            <Text style={styles.sectionTitle}>ATRIBUTOS ANCESTRAIS (SCORES 1-30)</Text>
            <View style={styles.grid3}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Força (FOR)</Text>
                <TextInput style={styles.input} value={str} onChangeText={setStr} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Destreza (DES)</Text>
                <TextInput style={styles.input} value={dex} onChangeText={setDex} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Constituição (CON)</Text>
                <TextInput style={styles.input} value={con} onChangeText={setCon} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Inteligência (INT)</Text>
                <TextInput style={styles.input} value={int} onChangeText={setInt} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sabedoria (SAB)</Text>
                <TextInput style={styles.input} value={wis} onChangeText={setWis} keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Carisma (CAR)</Text>
                <TextInput style={styles.input} value={cha} onChangeText={setCha} keyboardType="numeric" />
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
});
