import { CharacterData, ConditionData, INITIAL_CHARACTERS } from '@/lib/mockData';
import { Platform } from 'react-native';

const STORAGE_KEY = 'honra_egoismo_characters_v1';

// Gerenciador de armazenamento local com fallback em memória (para funcionar em SSR/Native e Browser)
let inMemoryCharacters: CharacterData[] = [...INITIAL_CHARACTERS];

function loadFromStorage(): CharacterData[] {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar do localStorage', e);
  }
  return inMemoryCharacters;
}

function saveToStorage(characters: CharacterData[]) {
  inMemoryCharacters = characters;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    }
  } catch (e) {
    console.warn('Erro ao salvar no localStorage', e);
  }
}

// Inicializar
inMemoryCharacters = loadFromStorage();
if (inMemoryCharacters.length === 0) {
  inMemoryCharacters = [...INITIAL_CHARACTERS];
  saveToStorage(inMemoryCharacters);
}

/**
 * Serviço de API Híbrido:
 * Tenta comunicar com as rotas serverless do Vercel/Expo (/api/...).
 * Caso não haja servidor ou o banco de dados Neon não esteja configurado, entra em modo fallback interativo em tempo real.
 */
export const ApiService = {
  async getCharacters(): Promise<CharacterData[]> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
    } catch {
      // Usar fallback
    }
    return loadFromStorage();
  },

  async getCharacter(id: string): Promise<CharacterData | null> {
    const chars = await this.getCharacters();
    return chars.find(c => c.id === id) || null;
  },

  async createCharacter(data: Partial<CharacterData>): Promise<CharacterData> {
    const newChar: CharacterData = {
      id: `char-${Date.now()}`,
      name: data.name || 'Novo Herói',
      playerName: data.playerName || 'Jogador',
      race: data.race || 'Humano',
      class: data.class || 'Guerreiro',
      level: data.level || 1,
      alignment: data.alignment || 'Neutro',
      background: data.background || 'Herói do Povo',
      currentHp: data.maxHp || 10,
      maxHp: data.maxHp || 10,
      tempHp: 0,
      armorClass: data.armorClass || 10,
      initiativeBonus: data.initiativeBonus || 0,
      speed: data.speed || '9m',
      hitDiceType: data.hitDiceType || '1d10',
      hitDiceTotal: data.level || 1,
      hitDiceSpent: 0,
      username: data.username || '',
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      str: data.str || 10,
      dex: data.dex || 10,
      con: data.con || 10,
      int: data.int || 10,
      wis: data.wis || 10,
      cha: data.cha || 10,
      strProf: !!data.strProf,
      dexProf: !!data.dexProf,
      conProf: !!data.conProf,
      intProf: !!data.intProf,
      wisProf: !!data.wisProf,
      chaProf: !!data.chaProf,
      proficientSkills: data.proficientSkills || '',
      gold: data.gold !== undefined ? data.gold : 15,
      silver: data.silver !== undefined ? data.silver : 10,
      copper: data.copper !== undefined ? data.copper : 30,
      spellSlots: data.spellSlots || [
        { id: `slot-${Date.now()}-1`, level: 1, total: 2, used: 0 }
      ],
      spells: data.spells || [],
      abilities: data.abilities || [
        { id: `ab-${Date.now()}-1`, name: 'Ataque Especial', description: 'Habilidade básica.', maxUses: 1, currentUses: 1, resetType: 'SHORT_REST' }
      ],
      conditions: [],
      items: data.items || [
        { id: `item-${Date.now()}-1`, name: 'Espada Longa', description: 'Arma versátil', weight: 1.5, quantity: 1, isWeapon: true, damage: '1d8 cortante' },
        { id: `item-${Date.now()}-2`, name: 'Mochila de Aventureiro', description: 'Kit de sobrevivência básico', weight: 5.0, quantity: 1, isWeapon: false },
      ],
      themeColor: data.themeColor || '#C5A059',
    };

    try {
      if (Platform.OS === 'web') {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newChar),
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Usar fallback
    }

    const chars = loadFromStorage();
    chars.push(newChar);
    saveToStorage(chars);
    return newChar;
  },

  async updateCharacter(id: string, updates: Partial<CharacterData>): Promise<CharacterData> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/characters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Usar fallback
    }

    const chars = loadFromStorage();
    const idx = chars.findIndex(c => c.id === id);
    if (idx !== -1) {
      chars[idx] = { ...chars[idx], ...updates };
      saveToStorage(chars);
      return chars[idx];
    }
    throw new Error('Personagem não encontrado');
  },

  async deleteCharacter(id: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      }
    } catch {
      // Usar fallback
    }

    let chars = loadFromStorage();
    chars = chars.filter(c => c.id !== id);
    saveToStorage(chars);
    return true;
  },

  // Automação de Descanso Curto
  async takeShortRest(id: string, healHp: number = 0, hitDiceToSpend: number = 0): Promise<CharacterData> {
    const char = await this.getCharacter(id);
    if (!char) throw new Error('Personagem não encontrado');

    const newHp = Math.min(char.maxHp, char.currentHp + healHp);
    const newHitDiceSpent = Math.min(char.hitDiceTotal, char.hitDiceSpent + hitDiceToSpend);

    // Resetar habilidades de Short Rest
    const updatedAbilities = char.abilities.map(ab => {
      if (ab.resetType === 'SHORT_REST') {
        return { ...ab, currentUses: ab.maxUses };
      }
      return ab;
    });

    return this.updateCharacter(id, {
      currentHp: newHp,
      hitDiceSpent: newHitDiceSpent,
      abilities: updatedAbilities,
    });
  },

  // Automação de Descanso Longo
  async takeLongRest(id: string): Promise<CharacterData> {
    const char = await this.getCharacter(id);
    if (!char) throw new Error('Personagem não encontrado');

    // Recupera metade dos dados de vida (mínimo 1)
    const recoveredHitDice = Math.max(1, Math.floor(char.hitDiceTotal / 2));
    const newHitDiceSpent = Math.max(0, char.hitDiceSpent - recoveredHitDice);

    // Resetar spell slots
    const updatedSpellSlots = char.spellSlots.map(slot => ({
      ...slot,
      used: 0,
    }));

    // Resetar habilidades (Short e Long rest)
    const updatedAbilities = char.abilities.map(ab => {
      if (ab.resetType === 'SHORT_REST' || ab.resetType === 'LONG_REST') {
        return { ...ab, currentUses: ab.maxUses };
      }
      return ab;
    });

    return this.updateCharacter(id, {
      currentHp: char.maxHp,
      tempHp: 0,
      hitDiceSpent: newHitDiceSpent,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      spellSlots: updatedSpellSlots,
      abilities: updatedAbilities,
    });
  },

  // Intervenção Remota do Mestre (DM Intervention)
  async dmIntervene(
    characterId: string,
    action: {
      type: 'DAMAGE' | 'HEAL' | 'TEMP_HP' | 'ADD_CONDITION' | 'REMOVE_CONDITION' | 'INSPIRATION';
      value?: number;
      conditionName?: string;
      conditionDesc?: string;
    }
  ): Promise<CharacterData> {
    const char = await this.getCharacter(characterId);
    if (!char) throw new Error('Personagem não encontrado');

    if (action.type === 'DAMAGE') {
      const dmg = action.value || 0;
      // Dano consome Temp HP primeiro
      let temp = char.tempHp;
      let hp = char.currentHp;
      if (temp >= dmg) {
        temp -= dmg;
      } else {
        const remainingDmg = dmg - temp;
        temp = 0;
        hp = Math.max(0, hp - remainingDmg);
      }
      return this.updateCharacter(characterId, { currentHp: hp, tempHp: temp });
    }

    if (action.type === 'HEAL') {
      const heal = action.value || 0;
      const hp = Math.min(char.maxHp, char.currentHp + heal);
      return this.updateCharacter(characterId, { currentHp: hp });
    }

    if (action.type === 'TEMP_HP') {
      const temp = Math.max(char.tempHp, action.value || 0);
      return this.updateCharacter(characterId, { tempHp: temp });
    }

    if (action.type === 'ADD_CONDITION') {
      const newCond: ConditionData = {
        id: `cond-${Date.now()}`,
        name: action.conditionName || 'Condição',
        description: action.conditionDesc || 'Aplicada pelo Mestre.',
      };
      return this.updateCharacter(characterId, {
        conditions: [...char.conditions, newCond],
      });
    }

    if (action.type === 'REMOVE_CONDITION') {
      return this.updateCharacter(characterId, {
        conditions: char.conditions.filter(c => c.name !== action.conditionName),
      });
    }

    return char;
  },

  async resetToDefaultData(): Promise<CharacterData[]> {
    const data = JSON.parse(JSON.stringify(INITIAL_CHARACTERS));
    saveToStorage(data);
    return data;
  },
};
