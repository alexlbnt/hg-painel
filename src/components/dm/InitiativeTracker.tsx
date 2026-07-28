import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { CharacterData } from '@/lib/mockData';
import { Sword, Shield, Skull, Heart, Award, RefreshCw, Plus, Trash2, Copy, Play, SkipForward, SkipBack, RotateCcw, Zap, Users, Dice5 } from 'lucide-react-native';

export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  characterId?: string;
  initScore: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  notes?: string;
}

interface InitiativeTrackerProps {
  characters: CharacterData[];
  onInterveneCharacter?: (characterId: string, action: { type: 'DAMAGE' | 'HEAL' | 'TEMP_HP'; value: number }) => void;
}

export default function InitiativeTracker({ characters, onInterveneCharacter }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('hg_dm_combatants');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [round, setRound] = useState<number>(() => {
    if (Platform.OS === 'web') {
      const saved = localStorage.getItem('hg_dm_round');
      if (saved) return parseInt(saved, 10) || 1;
    }
    return 1;
  });

  const [activeTurnId, setActiveTurnId] = useState<string | null>(() => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('hg_dm_active_turn_id') || null;
    }
    return null;
  });

  // Form states para novo monstro
  const [newMonsterName, setNewMonsterName] = useState('');
  const [newMonsterInit, setNewMonsterInit] = useState('');
  const [newMonsterHp, setNewMonsterHp] = useState('');
  const [newMonsterAc, setNewMonsterAc] = useState('');
  const [newMonsterCount, setNewMonsterCount] = useState('1');

  // Salvar no localStorage sempre que o combate mudar
  useEffect(() => {
    if (Platform.OS === 'web') {
      localStorage.setItem('hg_dm_combatants', JSON.stringify(combatants));
      localStorage.setItem('hg_dm_round', round.toString());
      if (activeTurnId) {
        localStorage.setItem('hg_dm_active_turn_id', activeTurnId);
      } else {
        localStorage.removeItem('hg_dm_active_turn_id');
      }
    }
  }, [combatants, round, activeTurnId]);

  // Manter HP de jogadores sincronizado com as fichas reais
  useEffect(() => {
    if (!characters || characters.length === 0) return;
    setCombatants(prev => {
      let changed = false;
      const updated = prev.map(comb => {
        if (comb.isPlayer && comb.characterId) {
          const liveChar = characters.find(c => c.id === comb.characterId);
          if (liveChar) {
            if (comb.currentHp !== liveChar.currentHp || comb.maxHp !== liveChar.maxHp || comb.ac !== liveChar.armorClass) {
              changed = true;
              return {
                ...comb,
                currentHp: liveChar.currentHp,
                maxHp: liveChar.maxHp,
                ac: liveChar.armorClass,
                name: liveChar.name,
              };
            }
          }
        }
        return comb;
      });
      return changed ? updated : prev;
    });
  }, [characters]);

  // Lista ordenada por iniciativa decrescente
  const sortedCombatants = [...combatants].sort((a, b) => {
    if (b.initScore !== a.initScore) return b.initScore - a.initScore;
    return a.isPlayer ? -1 : 1; // Em empate, jogador tem prioridade
  });

  // Descobrir o índice ativo atual na lista ordenada
  const currentTurnIndex = sortedCombatants.findIndex(c => c.id === activeTurnId);
  const effectiveTurnIndex = currentTurnIndex !== -1 ? currentTurnIndex : 0;

  // Garantir um activeTurnId se a lista não estiver vazia e activeTurnId for nulo
  useEffect(() => {
    if (sortedCombatants.length > 0 && (!activeTurnId || currentTurnIndex === -1)) {
      setActiveTurnId(sortedCombatants[0].id);
    }
  }, [sortedCombatants.length, activeTurnId, currentTurnIndex]);

  const handleNextTurn = () => {
    if (sortedCombatants.length === 0) return;
    const nextIdx = (effectiveTurnIndex + 1) % sortedCombatants.length;
    if (nextIdx === 0 && sortedCombatants.length > 1) {
      // Deu a volta no fim da rodada!
      setRound(r => r + 1);
    }
    setActiveTurnId(sortedCombatants[nextIdx].id);
  };

  const handlePrevTurn = () => {
    if (sortedCombatants.length === 0) return;
    let prevIdx = effectiveTurnIndex - 1;
    if (prevIdx < 0) {
      prevIdx = sortedCombatants.length - 1;
      if (round > 1) setRound(r => r - 1);
    }
    setActiveTurnId(sortedCombatants[prevIdx].id);
  };

  const handleResetCombat = () => {
    const doReset = () => {
      setRound(1);
      if (sortedCombatants.length > 0) {
        setActiveTurnId(sortedCombatants[0].id);
      }
      // Opcionalmente restaurar HP dos monstros ou limpar
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja reiniciar a contagem de rodadas e turnos para o início do combate?')) {
        doReset();
      }
    } else {
      Alert.alert('Reiniciar Combate', 'Deseja reiniciar a rodada e voltar para o 1º turno?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: doReset }
      ]);
    }
  };

  const handleClearMonsters = () => {
    const doClear = () => {
      setCombatants(prev => prev.filter(c => c.isPlayer));
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remover todos os monstros e inimigos do rastreador de iniciativa?')) {
        doClear();
      }
    } else {
      Alert.alert('Limpar Inimigos', 'Remover todos os monstros do combate?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover Todos', style: 'destructive', onPress: doClear }
      ]);
    }
  };

  const handleImportPlayers = () => {
    if (!characters || characters.length === 0) {
      if (Platform.OS === 'web') window.alert('Nenhum personagem conectado na campanha no momento.');
      return;
    }
    const newAdditions: Combatant[] = [];
    characters.forEach(char => {
      const exists = combatants.some(c => c.characterId === char.id);
      if (!exists) {
        const dexMod = Math.floor((char.dex - 10) / 2);
        const autoInit = 10 + dexMod;
        newAdditions.push({
          id: `player-${char.id}-${Date.now()}`,
          name: char.name,
          isPlayer: true,
          characterId: char.id,
          initScore: autoInit,
          currentHp: char.currentHp,
          maxHp: char.maxHp,
          ac: char.armorClass,
        });
      }
    });

    if (newAdditions.length === 0) {
      if (Platform.OS === 'web') window.alert('Todos os jogadores da mesa já estão importados na iniciativa!');
    } else {
      setCombatants(prev => [...prev, ...newAdditions]);
    }
  };

  const handleAddCustomMonster = () => {
    if (!newMonsterName.trim()) {
      if (Platform.OS === 'web') window.alert('Digite o nome do inimigo.');
      return;
    }
    const count = Math.max(1, parseInt(newMonsterCount, 10) || 1);
    const init = parseInt(newMonsterInit, 10) || Math.floor(Math.random() * 15) + 5;
    const hp = parseInt(newMonsterHp, 10) || 15;
    const ac = parseInt(newMonsterAc, 10) || 12;

    const added: Combatant[] = [];
    for (let i = 1; i <= count; i++) {
      const displayName = count > 1 ? `${newMonsterName.trim()} #${i}` : newMonsterName.trim();
      added.push({
        id: `monster-${Date.now()}-${i}-${Math.random()}`,
        name: displayName,
        isPlayer: false,
        initScore: init,
        currentHp: hp,
        maxHp: hp,
        ac: ac,
      });
    }

    setCombatants(prev => [...prev, ...added]);
    setNewMonsterName('');
    setNewMonsterInit('');
    setNewMonsterHp('');
    setNewMonsterAc('');
    setNewMonsterCount('1');
  };

  const handleRollRandomInit = () => {
    const roll = Math.floor(Math.random() * 20) + 1 + Math.floor(Math.random() * 4);
    setNewMonsterInit(roll.toString());
  };

  const handleUpdateHp = (comb: Combatant, delta: number) => {
    const newHp = Math.max(0, Math.min(comb.maxHp, comb.currentHp + delta));
    setCombatants(prev => prev.map(c => c.id === comb.id ? { ...c, currentHp: newHp } : c));

    if (comb.isPlayer && comb.characterId && onInterveneCharacter) {
      if (delta < 0) {
        onInterveneCharacter(comb.characterId, { type: 'DAMAGE', value: Math.abs(delta) });
      } else if (delta > 0) {
        onInterveneCharacter(comb.characterId, { type: 'HEAL', value: delta });
      }
    }
  };

  const handleAdjustInit = (id: string, delta: number) => {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, initScore: c.initScore + delta } : c));
  };

  const handleDuplicateMonster = (comb: Combatant) => {
    if (comb.isPlayer) return;
    const newComb: Combatant = {
      ...comb,
      id: `copy-${Date.now()}-${Math.random()}`,
      name: `${comb.name} (Cópia)`,
      currentHp: comb.maxHp,
    };
    setCombatants(prev => [...prev, newComb]);
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
    if (activeTurnId === id && sortedCombatants.length > 1) {
      handleNextTurn();
    }
  };

  const activeCombatant = sortedCombatants[effectiveTurnIndex] || null;

  return (
    <View style={styles.container}>
      {/* BANNER PRINCIPAL DO COMBATE (RODADAS & TURNO ATUAL) */}
      <View style={styles.bannerBox}>
        <View style={styles.bannerLeft}>
          <View style={styles.roundBadge}>
            <Text style={styles.roundLabel}>RODADA</Text>
            <Text style={styles.roundNumber}>#{round}</Text>
          </View>
          <View style={styles.roundControls}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => setRound(r => Math.max(1, r - 1))}>
              <Text style={styles.roundBtnText}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={() => setRound(r => r + 1)}>
              <Text style={styles.roundBtnText}>+1</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bannerCenter}>
          <Text style={styles.turnTitle}>TURNO ATUAL NO COMBATE:</Text>
          {activeCombatant ? (
            <View style={styles.activeHeroBox}>
              <Text style={[styles.activeHeroName, activeCombatant.isPlayer ? styles.playerColor : styles.enemyColor]}>
                {activeCombatant.isPlayer ? '🛡️ ' : '👹 '} {activeCombatant.name}
              </Text>
              <Text style={styles.activeHeroInit}>
                Iniciativa: <Text style={{ color: '#E6C280', fontWeight: '700' }}>{activeCombatant.initScore}</Text> • CA: <Text style={{ color: '#8C6C90', fontWeight: '700' }}>{activeCombatant.ac}</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.noTurnText}>Nenhum combatente na iniciativa. Adicione monstros ou importe jogadores!</Text>
          )}
        </View>

        <View style={styles.bannerRight}>
          <View style={styles.turnNavBtns}>
            <TouchableOpacity style={styles.navTurnBtn} onPress={handlePrevTurn}>
              <SkipBack color="#BAAFA0" size={18} />
              <Text style={styles.navTurnText}>Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navTurnBtn, styles.nextTurnBtn]} onPress={handleNextTurn}>
              <Text style={styles.nextTurnText}>Próximo Turno</Text>
              <SkipForward color="#110F0D" size={18} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={styles.miniResetBtn} onPress={handleResetCombat}>
              <RotateCcw color="#80776C" size={12} />
              <Text style={styles.miniResetText}>Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniResetBtn} onPress={handleClearMonsters}>
              <Trash2 color="#B82828" size={12} />
              <Text style={[styles.miniResetText, { color: '#B82828' }]}>Limpar Inimigos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SEÇÃO RÁPIDA: IMPORTAÇÃO DE JOGADORES */}
      <View style={styles.quickAddRow}>
        <TouchableOpacity style={[styles.importBtn, { flex: 1 }]} onPress={handleImportPlayers}>
          <Users color="#E6C280" size={18} />
          <View>
            <Text style={styles.importBtnText}>⚡ Importar / Sincronizar Jogadores da Campanha ({characters.length})</Text>
            <Text style={styles.importBtnSub}>Adicionar heróis à iniciativa e manter vida / CA atualizados em tempo real</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* FORMULÁRIO DE INSERÇÃO CUSTOMIZADA DE INIMIGO */}
      <View style={styles.formBox}>
        <Text style={styles.formTitle}>⚔️ Criar Monstro ou NPC Personalizado</Text>
        <View style={styles.formRow}>
          <View style={[styles.inputGroup, { flexGrow: 2, flexBasis: 180 }]}>
            <Text style={styles.inputLabel}>Nome do Monstro / NPC *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Goblin Atirador, Ogre Brutal"
              placeholderTextColor="#60584C"
              value={newMonsterName}
              onChangeText={setNewMonsterName}
            />
          </View>

          <View style={[styles.inputGroup, { width: 110 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>Iniciativa *</Text>
              <TouchableOpacity onPress={handleRollRandomInit}>
                <Text style={styles.rollHint}>🎲 Rolar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Init (15)"
              placeholderTextColor="#60584C"
              keyboardType="numeric"
              value={newMonsterInit}
              onChangeText={setNewMonsterInit}
            />
          </View>

          <View style={[styles.inputGroup, { width: 90 }]}>
            <Text style={styles.inputLabel}>HP Máx *</Text>
            <TextInput
              style={styles.input}
              placeholder="HP (30)"
              placeholderTextColor="#60584C"
              keyboardType="numeric"
              value={newMonsterHp}
              onChangeText={setNewMonsterHp}
            />
          </View>

          <View style={[styles.inputGroup, { width: 80 }]}>
            <Text style={styles.inputLabel}>CA *</Text>
            <TextInput
              style={styles.input}
              placeholder="CA (14)"
              placeholderTextColor="#60584C"
              keyboardType="numeric"
              value={newMonsterAc}
              onChangeText={setNewMonsterAc}
            />
          </View>

          <View style={[styles.inputGroup, { width: 70 }]}>
            <Text style={styles.inputLabel}>Qtd</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#60584C"
              keyboardType="numeric"
              value={newMonsterCount}
              onChangeText={setNewMonsterCount}
            />
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomMonster}>
            <Plus color="#110F0D" size={18} />
            <Text style={styles.addBtnText}>Adicionar à Ordem</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA DE COMBATENTES ORDENADA POR INICIATIVA (DECRESCENTE) */}
      <View style={styles.listHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sword color="#C5A059" size={18} />
          <Text style={styles.listTitle}>ORDEM DE COMBATE ATIVA ({sortedCombatants.length})</Text>
        </View>
        <Text style={styles.listSubtitle}>Ordenado decrescente pela iniciativa. Toque nos botões para alterar vida ou passar turnos.</Text>
      </View>

      {sortedCombatants.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>O campo de batalha está em silêncio...</Text>
          <Text style={styles.emptySubText}>
            Clique em &quot;Importar Jogadores&quot; ou escolha um inimigo acima para começar a rastrear a iniciativa da sessão.
          </Text>
        </View>
      ) : (
        <View style={styles.listGrid}>
          {sortedCombatants.map((comb, index) => {
            const isActive = comb.id === activeTurnId;
            const isFallen = comb.currentHp === 0;
            const hpPerc = Math.min(100, Math.max(0, (comb.currentHp / (comb.maxHp || 1)) * 100));

            return (
              <View
                key={comb.id}
                style={[
                  styles.card,
                  comb.isPlayer ? styles.cardPlayer : styles.cardMonster,
                  isActive && styles.cardActive,
                  isFallen && styles.cardFallen
                ]}
              >
                {/* Emblema de Ordem / Iniciativa */}
                <View style={[styles.initBadge, isActive && styles.initBadgeActive]}>
                  <Text style={[styles.initScoreText, isActive && styles.initScoreTextActive]}>{comb.initScore}</Text>
                  <View style={styles.initAdjusters}>
                    <TouchableOpacity onPress={() => handleAdjustInit(comb.id, 1)}>
                      <Text style={styles.initAdjustText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAdjustInit(comb.id, -1)}>
                      <Text style={styles.initAdjustText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Dados Principais */}
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <View style={[styles.typeBadge, comb.isPlayer ? styles.badgePlayer : styles.badgeMonster]}>
                      <Text style={[styles.typeBadgeText, { color: comb.isPlayer ? '#4E9C8E' : '#B82828' }]}>
                        {comb.isPlayer ? '🛡️ JOGADOR' : '👹 INIMIGO'}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.activeTurnBadge}>
                        <Text style={styles.activeTurnBadgeText}>⚔️ TURNO EM ANDAMENTO</Text>
                      </View>
                    )}
                    {isFallen && (
                      <View style={styles.fallenBadge}>
                        <Text style={styles.fallenBadgeText}>💀 DERROTADO / CAÍDO</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.combName, isActive && { color: '#E6C280' }, isFallen && { textDecorationLine: 'line-through', color: '#80776C' }]}>
                    {comb.name}
                  </Text>
                  
                  <Text style={styles.combSub}>
                    Classe Armadura (CA): <Text style={{ color: '#8C6C90', fontWeight: '700' }}>{comb.ac}</Text>
                  </Text>

                  {/* Barra de Vida */}
                  <View style={styles.hpContainer}>
                    <View style={styles.hpBarBg}>
                      <View style={[styles.hpBarFill, { width: `${hpPerc}%`, backgroundColor: isFallen ? '#52433D' : hpPerc < 30 ? '#B82828' : comb.isPlayer ? '#38783C' : '#8C4B38' }]} />
                    </View>
                    <Text style={styles.hpText}>
                      HP: <Text style={{ color: isFallen ? '#FF4545' : '#E2D8C3', fontWeight: '700' }}>{comb.currentHp}</Text> / {comb.maxHp}
                    </Text>
                  </View>
                </View>

                {/* Controles de Vida Rápida */}
                <View style={styles.cardActions}>
                  <Text style={styles.actionsLabel}>Ajustar Vida Rápido:</Text>
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => handleUpdateHp(comb, -10)}>
                      <Text style={styles.dmgText}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => handleUpdateHp(comb, -5)}>
                      <Text style={styles.dmgText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.hpBtn, styles.dmgBtn]} onPress={() => handleUpdateHp(comb, -1)}>
                      <Text style={styles.dmgText}>-1</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => handleUpdateHp(comb, 1)}>
                      <Text style={styles.healText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => handleUpdateHp(comb, 5)}>
                      <Text style={styles.healText}>+5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.hpBtn, styles.healBtn]} onPress={() => handleUpdateHp(comb, 10)}>
                      <Text style={styles.healText}>+10</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Ações Administrativas */}
                  <View style={styles.adminRow}>
                    {isActive ? (
                      <TouchableOpacity style={styles.passTurnBtn} onPress={handleNextTurn}>
                        <Text style={styles.passTurnText}>Passar Turno ⏭️</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.makeActiveBtn} onPress={() => setActiveTurnId(comb.id)}>
                        <Text style={styles.makeActiveText}>Tornar Turno Atual</Text>
                      </TouchableOpacity>
                    )}

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {!comb.isPlayer && (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDuplicateMonster(comb)} accessibilityLabel="Duplicar Inimigo">
                          <Copy color="#BAAFA0" size={14} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.iconBtn, styles.delBtn]} onPress={() => handleRemoveCombatant(comb.id)} accessibilityLabel="Remover da Ordem">
                        <Trash2 color="#B82828" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    width: '100%',
  },
  bannerBox: {
    backgroundColor: '#1A1714',
    borderWidth: 2,
    borderColor: '#5C4E40',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    boxShadow: Platform.OS === 'web' ? '0 8px 30px rgba(0,0,0,0.6)' : undefined,
  } as any,
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundBadge: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  roundLabel: {
    color: '#80776C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  roundNumber: {
    color: '#E6C280',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  roundControls: {
    justifyContent: 'center',
    gap: 4,
  },
  roundBtn: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  roundBtnText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerCenter: {
    flex: 1,
    minWidth: 240,
    alignItems: 'center',
  },
  turnTitle: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  activeHeroBox: {
    alignItems: 'center',
  },
  activeHeroName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  playerColor: {
    color: '#4E9C8E',
  },
  enemyColor: {
    color: '#FF6B6B',
  },
  activeHeroInit: {
    color: '#BAAFA0',
    fontSize: 13,
    marginTop: 2,
  },
  noTurnText: {
    color: '#60584C',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  turnNavBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  navTurnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  navTurnText: {
    color: '#BAAFA0',
    fontSize: 13,
    fontWeight: '600',
  },
  nextTurnBtn: {
    backgroundColor: '#C5A059',
    borderColor: '#E6C280',
  },
  nextTurnText: {
    color: '#110F0D',
    fontSize: 13,
    fontWeight: '700',
  },
  miniResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniResetText: {
    color: '#80776C',
    fontSize: 11,
    fontWeight: '600',
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#8C704F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  importBtnText: {
    color: '#E6C280',
    fontSize: 14,
    fontWeight: '700',
  },
  importBtnSub: {
    color: '#BAAFA0',
    fontSize: 11,
  },
  formBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 6,
    padding: 16,
    gap: 12,
  },
  formTitle: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '600',
  },
  rollHint: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    color: '#E2D8C3',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    height: 38,
  },
  addBtnText: {
    color: '#110F0D',
    fontWeight: '700',
    fontSize: 13,
  },
  listHeader: {
    marginTop: 8,
  },
  listTitle: {
    color: '#E2D8C3',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  listSubtitle: {
    color: '#80776C',
    fontSize: 12,
    marginTop: 2,
  },
  emptyBox: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#BAAFA0',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubText: {
    color: '#60584C',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 400,
  },
  listGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#1A1714',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardPlayer: {
    borderLeftWidth: 4,
    borderLeftColor: '#4E9C8E',
  },
  cardMonster: {
    borderLeftWidth: 4,
    borderLeftColor: '#B82828',
  },
  cardActive: {
    borderColor: '#C5A059',
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    boxShadow: Platform.OS === 'web' ? '0 0 20px rgba(197, 160, 89, 0.3)' : undefined,
  } as any,
  cardFallen: {
    opacity: 0.55,
    backgroundColor: '#110F0D',
    borderColor: '#24201C',
  },
  initBadge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#110F0D',
    borderWidth: 1,
    borderColor: '#3D342C',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  initBadgeActive: {
    borderColor: '#E6C280',
    backgroundColor: '#24201C',
  },
  initScoreText: {
    color: '#BAAFA0',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  initScoreTextActive: {
    color: '#E6C280',
  },
  initAdjusters: {
    justifyContent: 'center',
    gap: 2,
  },
  initAdjustText: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  cardInfo: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgePlayer: {
    backgroundColor: 'rgba(78, 156, 142, 0.15)',
    borderColor: 'rgba(78, 156, 142, 0.4)',
  },
  badgeMonster: {
    backgroundColor: 'rgba(184, 40, 40, 0.15)',
    borderColor: 'rgba(184, 40, 40, 0.4)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeTurnBadge: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTurnBadgeText: {
    color: '#110F0D',
    fontSize: 10,
    fontWeight: '700',
  },
  fallenBadge: {
    backgroundColor: '#B82828',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fallenBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  combName: {
    color: '#E2D8C3',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? '"Cinzel", "Georgia", serif' : undefined,
  },
  combSub: {
    color: '#80776C',
    fontSize: 12,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  hpBarBg: {
    flex: 1,
    maxWidth: 160,
    height: 6,
    backgroundColor: '#110F0D',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D342C',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hpText: {
    color: '#BAAFA0',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionsLabel: {
    color: '#80776C',
    fontSize: 10,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 4,
  },
  hpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 32,
    alignItems: 'center',
  },
  dmgBtn: {
    backgroundColor: 'rgba(184, 40, 40, 0.12)',
    borderColor: 'rgba(184, 40, 40, 0.4)',
  },
  dmgText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '700',
  },
  healBtn: {
    backgroundColor: 'rgba(56, 120, 60, 0.12)',
    borderColor: 'rgba(56, 120, 60, 0.4)',
  },
  healText: {
    color: '#4A9C4E',
    fontSize: 11,
    fontWeight: '700',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  passTurnBtn: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  passTurnText: {
    color: '#110F0D',
    fontSize: 11,
    fontWeight: '700',
  },
  makeActiveBtn: {
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#5C4E40',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  makeActiveText: {
    color: '#BAAFA0',
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#24201C',
    borderWidth: 1,
    borderColor: '#3D342C',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtn: {
    borderColor: 'rgba(184, 40, 40, 0.4)',
  },
});
