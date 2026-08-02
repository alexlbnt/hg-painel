import InitiativeTracker from '@/components/dm/InitiativeTracker';
import InterventionModal from '@/components/dm/InterventionModal';
import WhispersModal from '@/components/dm/WhispersModal';
import { CharacterData } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { AlertTriangle, Crown, Moon, RefreshCw, Scale, Shield, Skull, Sun, Sword, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function DmModule() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'DM') {
      router.replace('/');
    }
  }, [user, router]);

  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [whispersModalVisible, setWhispersModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'initiative'>('monitor');
  const [lastSync, setLastSync] = useState<string>('Conectando ao Escudo do Mestre...');
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [hoveredCond, setHoveredCond] = useState<string | null>(null);

  const fetchTableData = async (silent = false) => {
    try {
      const data = await ApiService.getCharacters();
      setCharacters(data);
      const now = new Date();
      setLastSync(`Sincronizado: ${now.toLocaleTimeString()}`);
    } catch (e) {
      console.error('Erro no Escudo do Mestre', e);
      setLastSync('Desconectado do Escudo do Mestre');
    }
  };

  useEffect(() => {
    if (selectedChar) {
      const updated = characters.find(c => c.id === selectedChar.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (updated) setSelectedChar(updated);
    }
  }, [characters, selectedChar]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTableData();
    const timer = setInterval(() => {
      fetchTableData(true);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleInterveneClick = (char: CharacterData) => {
    setSelectedChar(char);
    setModalVisible(true);
  };

  const executeMassRest = async (type: 'short' | 'long') => {
    try {
      for (const char of characters) {
        if (type === 'short') {
          await ApiService.takeShortRest(char.id, 5, 1);
        } else {
          await ApiService.takeLongRest(char.id);
        }
      }
      fetchTableData(true);
      if (Platform.OS === 'web') {
        window.alert(`Ritual de Descanso ${type === 'short' ? 'Curto' : 'Longo'} aplicado a todos os heróis da mesa!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmMassRest = (type: 'short' | 'long') => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Aplicar Ritual de Descanso ${type === 'short' ? 'Curto' : 'Longo'} para todos os heróis?`)) {
        executeMassRest(type);
      }
    } else {
      Alert.alert(
        `Ritual em Massa (${type === 'short' ? 'Curto' : 'Longo'})`,
        `Deseja aplicar este descanso para todos na mesa?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Invocar Ritual', onPress: () => executeMassRest(type) },
        ]
      );
    }
  };

  const handleAssignUser = async (charId: string, username: string) => {
    try {
      const trimmedUsername = username.trim();
      const newPlayerName = trimmedUsername.charAt(0).toUpperCase() + trimmedUsername.slice(1).toLowerCase();
      
      await ApiService.updateCharacter(charId, { 
        username: trimmedUsername.toLowerCase(),
        playerName: newPlayerName 
      });
      
      if (Platform.OS === 'web') window.alert(`Personagem vinculado ao usuário '${trimmedUsername}' com sucesso!`);
      else Alert.alert('Sucesso', `Vinculado ao usuário '${trimmedUsername}'`);
      fetchTableData(true);
    } catch (e) {
      console.error(e);
    }
  };

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <View style={styles.container}>
      {/* Header do Escudo do Mestre */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.crownBadge}>
            <Crown color="#C5A059" size={20} />
          </View>
          <View>
            <Text style={styles.title}>ESCUDO DO MESTRE • CONTROLE (DM)</Text>
            <Text style={styles.subtitle}>
              Monitoramento em tempo real dos heróis da campanha e rituais de intervenção divina
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.syncBox}>
            <RefreshCw color="#C5A059" size={14} />
            <Text style={styles.syncText}>{lastSync}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchTableData()}>
            <Text style={styles.refreshBtnText}>Sincronizar Escudo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Abas de Navegação do Mestre */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monitor' && styles.tabBtnActive]}
          onPress={() => setActiveTab('monitor')}
        >
          <Users color={activeTab === 'monitor' ? '#E6C280' : '#80776C'} size={18} />
          <Text style={[styles.tabText, activeTab === 'monitor' && styles.tabTextActive]}>
            Personagens da Campanha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'initiative' && styles.tabBtnActive]}
          onPress={() => setActiveTab('initiative')}
        >
          <Sword color={activeTab === 'initiative' ? '#E6C280' : '#80776C'} size={18} />
          <Text style={[styles.tabText, activeTab === 'initiative' && styles.tabTextActive]}>
            Iniciativa & Combate
          </Text>
        </TouchableOpacity>
      </View>

      

      {/* SEÇÃO 1: MONITORAMENTO EM TEMPO REAL DA MESA */}
      <View style={{ display: activeTab === 'monitor' ? 'flex' : 'none', gap: 24, width: '100%' }}>
        {/* Rituais Divinos em Massa */}
        <View style={styles.massActionsBox}>
        <View style={styles.massLeft}>
          <Shield color="#C5A059" size={20} />
          <Text style={styles.massTitle}>RITUAIS EM MASSA</Text>
        </View>

        <View style={styles.massButtonsRow}>
          <TouchableOpacity style={styles.massBtn} onPress={() => confirmMassRest('short')}>
            <Moon color="#6B4A70" size={16} />
            <Text style={styles.massBtnText}>Ritual Descanso Curto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.massBtn} onPress={() => confirmMassRest('long')}>
            <Sun color="#C5A059" size={16} />
            <Text style={styles.massBtnText}>Ritual Descanso Longo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.massBtn, styles.shadowBtn]} onPress={() => setWhispersModalVisible(true)}>
            <Skull color="#B82828" size={16} />
            <Text style={styles.shadowBtnText}>Sussurros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grade de Aventureiros Conectados */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>PERSONAGENS DA CAMPANHA ({characters.length})</Text>
        <TouchableOpacity style={styles.globalExpandBtn} onPress={() => setIsAllExpanded(!isAllExpanded)}>
          {isAllExpanded ? <ChevronUp color="#C5A059" size={16} /> : <ChevronDown color="#C5A059" size={16} />}
          <Text style={styles.globalExpandText}>{isAllExpanded ? 'Ocultar Detalhes' : 'Expandir Fichas'}</Text>
        </TouchableOpacity>
      </View>
      
      {characters.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhum aventureiro entrou na taverna ainda.</Text>
          <Text style={styles.emptySubText}>Peça aos jogadores para criarem suas fichas na aba Grimório do Jogador.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {characters.map((char) => {
            const hpPercent = char.currentHp / char.maxHp;
            const isCritical = hpPercent <= 0.25;
            const totalWeight = (char.items || []).reduce((acc, i) => acc + ((Number(i.weight) || 0) * (Number(i.quantity) || 1)), 0);
            const maxWeight = (Number(char.str) || 10) * 7.5;
            const isOverloaded = totalWeight > maxWeight;

            const isExpanded = isAllExpanded;

            return (
              <View
                key={char.id}
                style={[styles.charCard, isCritical && styles.charCardCritical]}
              >
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.charName}>{char.name}</Text>
                    <Text style={styles.charClass}>
                      {char.class} • Nvl {char.level}
                    </Text>
                    <Text style={styles.playerName}>Jogador: {char.playerName}</Text>
                    {isExpanded && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ color: '#80776C', fontSize: 10, marginRight: 4 }}>Usuário:</Text>
                        <TextInput 
                          style={{ backgroundColor: '#110F0D', borderWidth: 1, borderColor: '#3D342C', color: '#BAAFA0', fontSize: 10, padding: 2, paddingHorizontal: 6, borderRadius: 4, minWidth: 80 }}
                          defaultValue={char.username || ''}
                          placeholder="Vincular usuário..."
                          placeholderTextColor="#4A3333"
                          onSubmitEditing={(e) => handleAssignUser(char.id, e.nativeEvent.text)}
                        />
                      </View>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.acBadge}>
                      <Shield color="#8C6C90" size={16} />
                      <Text style={styles.acText}>{char.armorClass} CA</Text>
                    </View>
                    
                    {char.deity && char.deity !== 'Nenhum' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: char.deity === 'Arcké' ? '#B82828' : char.deity === 'Vitta' ? '#C5A059' : '#1B3B6F', backgroundColor: char.deity === 'Arcké' ? '#B8282815' : char.deity === 'Vitta' ? '#C5A05915' : '#1B3B6F15' }}>
                        {char.deity === 'Arcké' && <Scale color="#B82828" size={10} />}
                        {char.deity === 'Vitta' && <Sun color="#C5A059" size={10} />}
                        {char.deity === 'Thanatos' && <Skull color="#1B3B6F" size={10} />}
                        <Text style={{ fontSize: 9, fontWeight: '700', color: char.deity === 'Arcké' ? '#B82828' : char.deity === 'Vitta' ? '#C5A059' : '#1B3B6F', textTransform: 'uppercase' }}>
                          {char.deity}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Sinais Vitais / HP Bar */}
                <View style={styles.hpSection}>
                  <View style={styles.hpTopRow}>
                    <Text style={styles.hpLabel}>PONTOS DE VIDA</Text>
                    <Text style={styles.hpVal}>
                      {char.currentHp} / {char.maxHp} {char.tempHp > 0 && `(+${char.tempHp} Temp)`}
                    </Text>
                  </View>
                  <View style={styles.hpBg}>
                    <View
                      style={[
                        styles.hpFill,
                        {
                          width: `${Math.min(100, Math.max(0, hpPercent * 100))}%`,
                          backgroundColor: hpPercent > 0.5 ? '#38783C' : hpPercent > 0.25 ? '#C5A059' : '#B82828',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Testes contra a Morte se estiver Inconsciente / 0 HP */}
                {char.currentHp === 0 && (
                  <View style={styles.deathBox}>
                    <Text style={styles.deathTitle}>⚠️ HERÓI CAÍDO EM COMBATE</Text>
                    <Text style={styles.deathStats}>
                      Sucessos: {char.deathSaveSuccesses}/3 | Falhas: {char.deathSaveFailures}/3
                    </Text>
                  </View>
                )}

                {/* Alerta de Sobrecarga de Inventário */}
                {(isExpanded || isOverloaded) && (
                  <View style={[styles.weightBox, isOverloaded ? { backgroundColor: 'rgba(255, 69, 69, 0.15)', borderColor: '#FF4545' } : { backgroundColor: '#110F0D', borderColor: '#3D342C' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Scale color={isOverloaded ? "#FF4545" : "#80776C"} size={16} />
                      <Text style={[styles.overloadTitle, !isOverloaded && { color: '#80776C' }]}>
                        {isOverloaded ? `⚠️ SOBRECARGA ATIVA` : `PESO DO INVENTÁRIO`} ({totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg)
                      </Text>
                    </View>
                    {isOverloaded && <Text style={styles.overloadDesc}>Deslocamento reduzido em -3m. O herói carrega excesso de peso.</Text>}
                  </View>
                )}

                {isExpanded && (
                  <>
                    {/* Mini Atributos Rápidos */}
                    <View style={styles.miniStatsRow}>
                      {[
                        { label: 'FOR', val: char.str },
                        { label: 'DES', val: char.dex },
                        { label: 'CON', val: char.con },
                        { label: 'INT', val: char.int },
                        { label: 'SAB', val: char.wis },
                        { label: 'CAR', val: char.cha },
                      ].map(attr => (
                        <View key={attr.label} style={styles.miniStatBox}>
                          <Text style={styles.miniStatLabel}>{attr.label}</Text>
                          <Text style={styles.miniStatVal}>{attr.val}</Text>
                          <View style={styles.miniStatModBox}>
                            <Text style={styles.miniStatMod}>{getMod(attr.val)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Moedas */}
                    <View style={styles.coinsRow}>
                      <Text style={styles.coinBadge}>🥇 {char.gold || 0} PO</Text>
                      <Text style={styles.coinBadge}>🥈 {char.silver || 0} PP</Text>
                      <Text style={styles.coinBadge}>🥉 {char.copper || 0} PC</Text>
                    </View>
                  </>
                )}

                {/* Condições Ativas */}
                {char.conditions && char.conditions.length > 0 && (
                  <View style={styles.conditionsBox}>
                    <Text style={styles.conditionsLabel}>Condições Sombrias:</Text>
                    <View style={styles.conditionsList}>
                      {char.conditions.map(cond => (
                        <TouchableOpacity 
                          key={cond.id} 
                          style={{ position: 'relative' }}
                          onPress={() => setHoveredCond(hoveredCond === cond.id ? null : cond.id)}
                          {...(Platform.OS === 'web' ? {
                            onMouseEnter: () => setHoveredCond(cond.id),
                            onMouseLeave: () => setHoveredCond(null),
                          } as any : {})}
                        >
                          <View style={styles.condBadge}>
                            <Text style={styles.condText}>{cond.name}</Text>
                          </View>
                          {hoveredCond === cond.id && (
                            <View style={styles.tooltipBox}>
                              <Text style={styles.tooltipText}>{cond.description}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Botões de Ação */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.interveneBtn, { flex: 1 }]}
                    onPress={() => handleInterveneClick(char)}
                  >
                    <Crown color="#110F0D" size={16} />
                    <Text style={styles.interveneBtnText}>Intervenção</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
      </View>

      {/* SEÇÃO 2: RASTREIO DE INICIATIVA E COMBATE */}
      <View style={{ display: activeTab === 'initiative' ? 'flex' : 'none', width: '100%' }}>
        <InitiativeTracker
          characters={characters}
          onInterveneCharacter={async (id, action) => {
            await ApiService.dmIntervene(id, action);
            fetchTableData(true);
          }}
        />
      </View>

      {/* Modal de Intervenção Remota */}
      <InterventionModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelectedChar(null); }}
        character={selectedChar}
        onApplyAction={async (action) => {
          if (selectedChar) {
            await ApiService.dmIntervene(selectedChar.id, action);
            fetchTableData(true);
          }
        }}
      />

      {/* Modal de Sussurros (Intervenção em Massa) */}
      <WhispersModal
        visible={whispersModalVisible}
        onClose={() => setWhispersModalVisible(false)}
        characters={characters}
        onApplyMassAction={async (action) => {
          for (const char of characters) {
            await ApiService.dmIntervene(char.id, action as any);
          }
          fetchTableData(true);
        }}
        onClearAllConditions={async () => {
          for (const char of characters) {
            if (char.conditions && char.conditions.length > 0) {
              for (const cond of char.conditions) {
                await ApiService.dmIntervene(char.id, { type: 'REMOVE_CONDITION', conditionName: cond.name });
              }
            }
          }
          fetchTableData(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1600,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 22,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#8C704F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#E2D8C3',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", "Garamond", serif' : undefined,
  },
  subtitle: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D342C',
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  tabText: {
    color: '#80776C',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#E6C280',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1714',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  syncText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  refreshBtn: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#8C704F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#E6C280',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  massActionsBox: {
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  massLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  massTitle: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  massButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  massBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#8C704F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  massBtnText: {
    color: '#E2D8C3',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  shadowBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: '#B82828',
  },
  shadowBtnText: {
    color: '#B82828',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  gridTitle: {
    color: '#C5A059',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 12,
  },
  globalExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  globalExpandText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  charCard: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 280,
    maxWidth: 380,
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 22,
    gap: 16,
    justifyContent: 'space-between',
  },
  charCardCritical: {
    borderColor: '#B82828',
    borderWidth: 2,
    backgroundColor: 'rgba(184, 40, 40, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  charName: {
    color: '#E2D8C3',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  charClass: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  playerName: {
    color: '#80776C',
    fontSize: 12,
    marginTop: 2,
  },
  acBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  acText: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpSection: {
    backgroundColor: '#110F0D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D342C',
    padding: 14,
  },
  hpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hpLabel: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpVal: {
    color: '#E2D8C3',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  hpBg: {
    height: 14,
    backgroundColor: '#24201C',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 4,
  },
  deathBox: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderWidth: 1,
    borderColor: '#B82828',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  deathTitle: {
    color: '#B82828',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  deathStats: {
    color: '#E2D8C3',
    fontSize: 11,
    marginTop: 2,
  },
  miniStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  miniStatBox: {
    flex: 1,
    minWidth: 42,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  miniStatVal: {
    color: '#E2D8C3',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  miniStatModBox: {
    marginTop: 2,
    backgroundColor: '#1A1714',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2D2620',
  },
  miniStatMod: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '700',
  },
  conditionsBox: {
    gap: 6,
  },
  conditionsLabel: {
    color: '#B82828',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  conditionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  condBadge: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderWidth: 1,
    borderColor: '#B82828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  condText: {
    color: '#B82828',
    fontSize: 11,
    fontWeight: '700',
  },
  interveneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 6,
  },
  interveneBtnText: {
    color: '#110F0D',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#1A1714',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  emptyText: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  emptySubText: {
    color: '#80776C',
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  weightBox: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    gap: 4,
  },
  overloadTitle: {
    color: '#FF4545',
    fontSize: 12,
    fontWeight: '700',
  },
  overloadDesc: {
    color: '#E2D8C3',
    fontSize: 11,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#161311',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D251E',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinBadge: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '700',
  },
  weightBadge: {
    color: '#80776C',
    fontSize: 11,
  },
  expandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  tooltipBox: {
    position: 'absolute',
    bottom: '120%',
    left: 0,
    backgroundColor: '#24201C',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8C704F',
    width: 220,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  tooltipText: {
    color: '#BAAFA0',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
