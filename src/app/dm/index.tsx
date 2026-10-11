import InitiativeTracker from '@/components/dm/InitiativeTracker';
import InterventionModal from '@/components/dm/InterventionModal';
import WhispersModal from '@/components/dm/WhispersModal';
import UserManagement from '@/components/dm/UserManagement';
import RoomManager from '@/components/dm/RoomManager';
import { CharacterData } from '@/lib/mockData';
import { ApiService } from '@/services/api';
import { Crown, Moon, RefreshCw, Scale, Shield, Skull, Sun, Sword, Users, ChevronDown, ChevronUp, Key } from 'lucide-react-native';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { useRouter } from 'expo-router';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { confirmAction, errorText, notify } from '@/utils/confirm';
import { AnimatedBar } from '@/components/ui/AnimatedBar';
import { useResponsive } from '@/hooks/useResponsive';

/** Gravidade do estado do personagem, do mais urgente ao menos (para ordenar e rotular o card). */
function hpSeverity(c: CharacterData): { rank: number; label: string | null; color: string } {
  const pct = c.maxHp ? c.currentHp / c.maxHp : 1;
  if (c.currentHp <= 0) return { rank: 0, label: 'Caído', color: '#F2B8B5' };
  if (pct <= 0.25) return { rank: 1, label: 'Ferido gravemente', color: '#F2B8B5' };
  if (pct <= 0.5) return { rank: 2, label: 'Ferido', color: '#E6C280' };
  return { rank: 3, label: null, color: '#8FC79A' };
}

export default function DmModule() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'DM')) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const { activeRoom, isSuperDm, userAccessibleRooms, setActiveRoom } = useRoom();

  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [whispersModalVisible, setWhispersModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'initiative' | 'users'>('monitor');
  const [lastSync, setLastSync] = useState<string>('Carregando...');
  const { isMobile } = useResponsive();
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [hoveredCond, setHoveredCond] = useState<string | null>(null);
  const [assignUserInputs, setAssignUserInputs] = useState<Record<string, string>>({});
  const lastDataHash = useRef<string>('');

  // Ao entrar no Escudo do Mestre, se não for Super-DM, garante que a mesa ativa seja a que ele mestra
  useEffect(() => {
    if (!isSuperDm && user && userAccessibleRooms.length > 0) {
      const dmRoom = userAccessibleRooms.find(
        (r) => (r.dmUsername || '').toLowerCase().trim() === (user.username || '').toLowerCase().trim()
      );
      if (dmRoom && activeRoom?.id !== dmRoom.id) {
        setActiveRoom(dmRoom);
      }
    }
  }, [isSuperDm, user, userAccessibleRooms, activeRoom?.id, setActiveRoom]);

  // Se não for Super-DM e a aba estiver em 'users', reverte para 'monitor'
  useEffect(() => {
    if (!isSuperDm && activeTab === 'users') {
      setActiveTab('monitor');
    }
  }, [isSuperDm, activeTab]);

  const fetchTableData = async (silent = false) => {
    try {
      const data = await ApiService.getCharacters(
        activeRoom ? { roomId: activeRoom.id } : undefined
      );
      const serialized = JSON.stringify(data);
      if (serialized !== lastDataHash.current) {
        lastDataHash.current = serialized;
        setCharacters(data);
      }
      const now = new Date();
      setLastSync(`Atualizado às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      console.error('Erro no Escudo do Mestre', e);
      setLastSync('Sem conexão. Tente atualizar.');
    }
  };

  useEffect(() => {
    if (selectedChar) {
      const updated = characters.find(c => c.id === selectedChar.id);
      if (updated && (updated.updatedAt !== selectedChar.updatedAt || updated.currentHp !== selectedChar.currentHp || updated.tempHp !== selectedChar.tempHp)) {
        setSelectedChar(updated);
      }
    }
  }, [characters, selectedChar]);

  useRealtimeSync((event) => {
    if (
      event.type === 'CHARACTER_UPDATED' ||
      event.type === 'CHARACTER_CREATED' ||
      event.type === 'CHARACTER_DELETED' ||
      event.type === 'TABLE_REST'
    ) {
      fetchTableData(true);
      const now = new Date();
      setLastSync(`⚡ Tempo Real: ${now.toLocaleTimeString()}`);
    }
  });

  useEffect(() => {
    fetchTableData();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      fetchTableData(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [activeRoom?.id]);

  const handleInterveneClick = (char: CharacterData) => {
    setSelectedChar(char);
    setModalVisible(true);
  };

  const executeMassRest = async (type: 'short' | 'long') => {
    try {
      await Promise.all(
        characters.map(char =>
          type === 'short'
            ? ApiService.takeShortRest(char.id, 5, 1)
            : ApiService.takeLongRest(char.id)
        )
      );
      fetchTableData(true);
      notify(`Descanso ${type === 'short' ? 'curto' : 'longo'} aplicado a todos os personagens da mesa.`);
    } catch (e) {
      console.error(e);
      notify(errorText(e, 'Não foi possível aplicar o descanso.'), 'error');
    }
  };

  const confirmMassRest = (type: 'short' | 'long') => {
    confirmAction(
      type === 'short'
        ? 'Todos os personagens da mesa recuperam 5 PV e gastam 1 dado de vida.'
        : 'Todos os personagens da mesa recuperam PV, magias e habilidades.',
      () => executeMassRest(type),
      `Descanso ${type === 'short' ? 'curto' : 'longo'} para a mesa`,
      { confirmLabel: 'Aplicar descanso' }
    );
  };

  const handleAssignUser = async (charId: string, username: string) => {
    try {
      const trimmedUsername = username.trim();
      const newPlayerName = trimmedUsername.charAt(0).toUpperCase() + trimmedUsername.slice(1).toLowerCase();
      
      await ApiService.updateCharacter(charId, { 
        username: trimmedUsername.toLowerCase(),
        playerName: newPlayerName 
      });
      
      notify(`Personagem vinculado a @${trimmedUsername.toLowerCase()}.`);
      fetchTableData(true);
    } catch (e) {
      console.error(e);
      notify(errorText(e, 'Não foi possível vincular o personagem.'), 'error');
    }
  };

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#110F0D', minHeight: 400 }}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  if (!user || user.role !== 'DM') {
    return null;
  }

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.container, isMobile && { padding: 16, gap: 18 }]}>
      {/* Cabeçalho do Escudo do Mestre */}
      <View style={[styles.header, isMobile && { paddingBottom: 16 }]}>
        <View style={[styles.headerLeft, { flexShrink: 1 }]}>
          {!isMobile && (
            <View style={styles.crownBadge}>
              <Crown color="#C5A059" size={20} />
            </View>
          )}
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.title, isMobile && { fontSize: 24 }]} accessibilityRole="header">
              Escudo do Mestre
            </Text>
            <Text style={styles.subtitle}>Acompanhe os personagens da mesa e intervenha durante a sessão.</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.syncText}>{lastSync}</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchTableData()}
            accessibilityRole="button"
            accessibilityLabel="Atualizar dados da mesa"
          >
            <RefreshCw color="#E6C280" size={14} />
            <Text style={styles.refreshBtnText}>Atualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Abas de Navegação do Mestre */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monitor' && styles.tabBtnActive]}
          onPress={() => setActiveTab('monitor')}
        >
          <Users color={activeTab === 'monitor' ? '#E6C280' : '#80776C'} size={18} />
          <Text style={[styles.tabText, activeTab === 'monitor' && styles.tabTextActive]}>
            Personagens
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'initiative' && styles.tabBtnActive]}
          onPress={() => setActiveTab('initiative')}
        >
          <Sword color={activeTab === 'initiative' ? '#E6C280' : '#80776C'} size={18} />
          <Text style={[styles.tabText, activeTab === 'initiative' && styles.tabTextActive]}>
            Iniciativa
          </Text>
        </TouchableOpacity>

        {isSuperDm && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
            onPress={() => setActiveTab('users')}
          >
            <Key color={activeTab === 'users' ? '#E6C280' : '#80776C'} size={18} />
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
              Usuários e mesas
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      

      {/* SEÇÃO 1: MONITORAMENTO EM TEMPO REAL DA MESA */}
      <View style={{ display: activeTab === 'monitor' ? 'flex' : 'none', gap: 24, width: '100%' }}>
        {/* Rituais Divinos em Massa */}
        <View style={[styles.massActionsBox, isMobile && { flexDirection: 'column', alignItems: 'stretch', padding: 16 }]}>
        <View style={styles.massLeft}>
          <Shield color="#C5A059" size={20} />
          <Text style={styles.massTitle}>Ações para a mesa toda</Text>
        </View>

        <View style={styles.massButtonsRow}>
          <TouchableOpacity style={styles.massBtn} onPress={() => confirmMassRest('short')}>
            <Moon color="#6B4A70" size={16} />
            <Text style={styles.massBtnText}>Descanso curto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.massBtn} onPress={() => confirmMassRest('long')}>
            <Sun color="#C5A059" size={16} />
            <Text style={styles.massBtnText}>Descanso longo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.massBtn, styles.shadowBtn]} onPress={() => setWhispersModalVisible(true)}>
            <Skull color="#B82828" size={16} />
            <Text style={styles.shadowBtnText}>Sussurros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grade de Aventureiros Conectados */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Personagens da mesa ({characters.length})</Text>
        <TouchableOpacity style={styles.globalExpandBtn} onPress={() => setIsAllExpanded(!isAllExpanded)}>
          {isAllExpanded ? <ChevronUp color="#C5A059" size={16} /> : <ChevronDown color="#C5A059" size={16} />}
          <Text style={styles.globalExpandText}>{isAllExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'}</Text>
        </TouchableOpacity>
      </View>
      
      {characters.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhum personagem nesta mesa ainda.</Text>
          <Text style={styles.emptySubText}>Peça aos jogadores que criem a ficha na aba Fichas.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Mais urgentes primeiro: caídos, depois os mais feridos */}
          {[...characters].sort((a, b) => hpSeverity(a).rank - hpSeverity(b).rank).map((char) => {
            const hpPercent = char.currentHp / char.maxHp;
            const isCritical = hpPercent <= 0.25;
            const severity = hpSeverity(char);
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
                      {char.class}{char.archetype ? ` (${char.archetype})` : ''}, nível {char.level}
                    </Text>
                    <Text style={styles.playerName}>
                      Jogado por <Text style={{ color: '#E6C280', fontWeight: 'bold' }}>{char.playerName}</Text>
                      {char.username ? '' : ' (sem usuário vinculado)'}
                    </Text>
                    {isExpanded && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <TextInput 
                          style={{ backgroundColor: '#110F0D', borderWidth: 1, borderColor: '#3D342C', color: '#BAAFA0', fontSize: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, minWidth: 120 }}
                          value={assignUserInputs[char.id] !== undefined ? assignUserInputs[char.id] : (char.username || '')}
                          placeholder="usuário do jogador"
                          placeholderTextColor="#666"
                          onChangeText={(t) => setAssignUserInputs(prev => ({ ...prev, [char.id]: t }))}
                          onSubmitEditing={(e) => handleAssignUser(char.id, e.nativeEvent.text)}
                        />
                        <TouchableOpacity
                          style={{ backgroundColor: '#C5A059', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 4 }}
                          activeOpacity={0.8}
                          onPress={() => handleAssignUser(char.id, assignUserInputs[char.id] !== undefined ? assignUserInputs[char.id] : (char.username || ''))}
                        >
                          <Text style={{ color: '#110F0D', fontSize: 12, fontWeight: 'bold' }}>Vincular</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.acBadge}>
                      <Shield color="#8C6C90" size={16} />
                      <Text style={styles.acText}>{char.armorClass} CA</Text>
                    </View>
                    
                    {!!char.deity && char.deity !== 'Nenhum' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: char.deity === 'Arcké' ? '#B82828' : char.deity === 'Vitta' ? '#C5A059' : '#1B3B6F', backgroundColor: char.deity === 'Arcké' ? '#B8282815' : char.deity === 'Vitta' ? '#C5A05915' : '#1B3B6F15' }}>
                        {char.deity === 'Arcké' && <Scale color="#B82828" size={10} />}
                        {char.deity === 'Vitta' && <Sun color="#C5A059" size={10} />}
                        {char.deity === 'Thanatos' && <Skull color="#1B3B6F" size={10} />}
                        <Text style={{ fontSize: 11, fontWeight: '700', color: char.deity === 'Arcké' ? '#B82828' : char.deity === 'Vitta' ? '#C5A059' : '#1B3B6F' }}>
                          {char.deity}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Sinais Vitais / HP Bar */}
                <View style={styles.hpSection}>
                  <View style={styles.hpTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.hpLabel}>Pontos de vida</Text>
                      {severity.label && (
                        <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
                      )}
                    </View>
                    <Text style={styles.hpVal}>
                      {char.currentHp} / {char.maxHp}{char.tempHp > 0 ? ` (+${char.tempHp} temp.)` : ''}
                    </Text>
                  </View>
                  <AnimatedBar
                    value={char.currentHp}
                    max={char.maxHp || 1}
                    color={hpPercent > 0.5 ? '#38783C' : hpPercent > 0.25 ? '#C5A059' : '#B82828'}
                    height={10}
                    overlayValue={char.tempHp}
                    flashOnDecrease
                    accessibilityLabel={`Pontos de vida de ${char.name}: ${char.currentHp} de ${char.maxHp}`}
                  />
                </View>

                {/* Testes contra a Morte se estiver Inconsciente / 0 HP */}
                {char.currentHp === 0 && (
                  <View style={styles.deathBox}>
                    <Text style={styles.deathTitle}>Testes contra a morte</Text>
                    <Text style={styles.deathStats}>
                      {char.deathSaveSuccesses} de 3 sucessos, {char.deathSaveFailures} de 3 falhas
                    </Text>
                  </View>
                )}

                {/* Alerta de Sobrecarga de Inventário */}
                {(isExpanded || isOverloaded) && (
                  <View style={[styles.weightBox, isOverloaded ? { backgroundColor: 'rgba(255, 69, 69, 0.15)', borderColor: '#FF4545' } : { backgroundColor: '#110F0D', borderColor: '#3D342C' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Scale color={isOverloaded ? "#FF4545" : "#80776C"} size={16} />
                      <Text style={[styles.overloadTitle, !isOverloaded && { color: '#80776C' }]}>
                        {isOverloaded ? 'Sobrecarregado' : 'Peso carregado'}: {totalWeight.toFixed(1)} de {maxWeight.toFixed(1)} kg
                      </Text>
                    </View>
                    {isOverloaded && <Text style={styles.overloadDesc}>Deslocamento reduzido em 3m.</Text>}
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
                      <Text style={styles.coinBadge}>{char.gold || 0} PO</Text>
                      <Text style={styles.coinBadge}>{char.silver || 0} PP</Text>
                      <Text style={styles.coinBadge}>{char.copper || 0} PC</Text>
                    </View>
                  </>
                )}

                {/* Condições Ativas */}
                {char.conditions && char.conditions.length > 0 && (
                  <View style={styles.conditionsBox}>
                    <Text style={styles.conditionsLabel}>Condições</Text>
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
                    accessibilityRole="button"
                    accessibilityLabel={`Intervir em ${char.name}`}
                  >
                    <Crown color="#E6C280" size={16} />
                    <Text style={styles.interveneBtnText}>Intervir</Text>
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
          key={activeRoom?.id || 'default'}
          characters={characters}
          roomId={activeRoom?.id}
          onInterveneCharacter={async (id, action) => {
            await ApiService.dmIntervene(id, action);
            fetchTableData(true);
          }}
        />
      </View>

      {/* SEÇÃO 3: GESTÃO DE USUÁRIOS E PERMISSÕES (Exclusivo Super-DM Alex) */}
      {isSuperDm && (
        <View style={{ display: activeTab === 'users' ? 'flex' : 'none', width: '100%' }}>
          <RoomManager />
          <View style={{ height: 16 }} />
          <UserManagement />
        </View>
      )}

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
    </ScrollView>
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
    gap: 8,
    paddingBottom: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  tabText: {
    color: '#BAAFA0',
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
    flexWrap: 'wrap',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  syncText: {
    color: '#9A8F82',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#8C704F',
    minHeight: 38,
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
    color: '#E2D8C3',
    fontSize: 15,
    fontWeight: '700',
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
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
  hpVal: {
    color: '#E2D8C3',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
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
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
  },
  conditionsBox: {
    gap: 6,
  },
  conditionsLabel: {
    color: '#B82828',
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '700',
  },
  interveneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#8C704F',
    minHeight: 42,
    borderRadius: 6,
  },
  interveneBtnText: {
    color: '#E6C280',
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
    fontSize: 12,
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
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0, 0, 0, 0.8)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  tooltipText: {
    color: '#BAAFA0',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? '"Georgia", serif' : undefined,
  },
});
