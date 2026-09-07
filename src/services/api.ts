import { CharacterData, ConditionData, INITIAL_CHARACTERS, TaskData, INITIAL_TASKS } from '@/lib/mockData';
import { Platform } from 'react-native';
import { Role } from '@/contexts/AuthContext';

export interface UserData {
  id: string;
  name: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionNoteData {
  id: string;
  content: string;
  authorId: string;
  author: { name: string; role: Role };
  createdAt: string;
}

export interface CampaignSessionData {
  id: string;
  title: string;
  date: string;
  notes: SessionNoteData[];
  createdAt?: string;
  updatedAt?: string;
}

export type RsvpStatus = 'CONFIRMED' | 'MAYBE' | 'DECLINED';

export interface SessionRsvpData {
  id: string;
  scheduledSessionId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: Role;
  };
  status: RsvpStatus;
  note: string;
  updatedAt: string;
}

export interface ScheduledSessionData {
  id: string;
  title: string;
  scheduledAt: string | null;
  location: string;
  description: string;
  isActive: boolean;
  rsvps: SessionRsvpData[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleResponseData {
  session: ScheduledSessionData | null;
  quorum?: {
    confirmedCount: number;
    maybeCount: number;
    declinedCount: number;
    totalUsers: number;
  };
  totalUsers?: number;
}

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

const STORAGE_KEY_TASKS = 'honra_egoismo_tasks_v1';
let inMemoryTasks: TaskData[] = [...INITIAL_TASKS];

function loadTasksFromStorage(): TaskData[] {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY_TASKS);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Erro ao carregar tasks do localStorage', e);
  }
  return inMemoryTasks;
}

function saveTasksToStorage(tasks: TaskData[]) {
  inMemoryTasks = tasks;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    }
  } catch (e) {
    console.warn('Erro ao salvar tasks no localStorage', e);
  }
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

inMemoryTasks = loadTasksFromStorage();
if (inMemoryTasks.length === 0) {
  inMemoryTasks = [...INITIAL_TASKS];
  saveTasksToStorage(inMemoryTasks);
}

/**
 * Serviço de API Híbrido:
 * Tenta comunicar com as rotas serverless do Vercel/Expo (/api/...).
 * Caso não haja servidor ou o banco de dados Neon não esteja configurado, entra em modo fallback interativo em tempo real.
 */
export const ApiService = {
  // TASKS
  async getTasks(): Promise<TaskData[]> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/tasks?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      }
    } catch {
      // Usar fallback
    }
    return loadTasksFromStorage();
  },

  async createTask(data: Partial<TaskData>): Promise<TaskData> {
    const newTask: TaskData = {
      id: `task-${Date.now()}`,
      title: data.title || 'Nova Tarefa',
      description: data.description || '',
      category: data.category || 'LORE',
      status: data.status || 'PARADO',
      reward: data.reward || '',
      assignedTo: data.assignedTo || null,
      createdAt: new Date().toISOString(),
    };
    try {
      if (Platform.OS === 'web') {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        });
        if (res.ok) return await res.json();
      }
    } catch {}
    const tasks = loadTasksFromStorage();
    tasks.push(newTask);
    saveTasksToStorage(tasks);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) return await res.json();
      }
    } catch {}
    const tasks = loadTasksFromStorage();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates };
      saveTasksToStorage(tasks);
      return tasks[idx];
    }
    throw new Error('Task não encontrada');
  },

  async deleteTask(id: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) return true;
      }
    } catch {}
    let tasks = loadTasksFromStorage();
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToStorage(tasks);
    return true;
  },

  // CHARACTERS
  async getCharacters(filter?: { username?: string; role?: Role }): Promise<CharacterData[]> {
    try {
      if (Platform.OS === 'web') {
        const query = new URLSearchParams();
        query.set('t', Date.now().toString());
        if (filter?.role === 'PLAYER' && filter.username) {
          query.set('role', 'PLAYER');
          query.set('username', filter.username);
        }

        const res = await fetch(`/api/characters?${query.toString()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            if (!filter || filter.role !== 'PLAYER') {
              saveToStorage(data);
            }
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar personagens da API, usando armazenamento local', e);
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
          const created = await res.json();
          const chars = loadFromStorage();
          chars.push(created);
          saveToStorage(chars);
          return created;
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
          const updated = await res.json();
          const chars = loadFromStorage();
          const idx = chars.findIndex(c => c.id === id);
          if (idx !== -1) {
            chars[idx] = updated;
          } else {
            chars.push(updated);
          }
          saveToStorage(chars);
          return updated;
        } else {
          console.error(`Falha no PUT /api/characters/${id}: status ${res.status}`);
        }
      }
    } catch (err) {
      console.error('Erro na requisição PUT de personagem:', err);
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

    const updates: Partial<CharacterData> = {
      currentHp: newHp,
      hitDiceSpent: newHitDiceSpent,
      abilities: updatedAbilities,
    };
    if (char.maxKiPoints && char.maxKiPoints > 0) {
      updates.kiPoints = char.maxKiPoints;
    }

    return this.updateCharacter(id, updates);
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

    const updates: Partial<CharacterData> = {
      currentHp: char.maxHp,
      tempHp: 0,
      hitDiceSpent: newHitDiceSpent,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      spellSlots: updatedSpellSlots,
      abilities: updatedAbilities,
    };
    if (char.maxKiPoints && char.maxKiPoints > 0) {
      updates.kiPoints = char.maxKiPoints;
    }
    if (char.maxSorceryPoints && char.maxSorceryPoints > 0) {
      updates.sorceryPoints = char.maxSorceryPoints;
    }

    return this.updateCharacter(id, updates);
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

  // USERS & PERMISSIONS
  async getUsers(): Promise<UserData[]> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/users?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar usuários da API', e);
    }
    return [];
  },

  async createUser(data: { name: string; username: string; password?: string; role: Role }): Promise<UserData> {
    if (Platform.OS === 'web') {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar usuário');
      }
    }
    throw new Error('Ambiente não suportado para criação de usuário');
  },

  async updateUser(id: string, data: { name?: string; role?: Role; password?: string }): Promise<UserData> {
    if (Platform.OS === 'web') {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar usuário');
      }
    }
    throw new Error('Ambiente não suportado para atualização de usuário');
  },

  async deleteUser(id: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir usuário');
      }
    }
    return false;
  },

  // SESSIONS / JOURNAL
  async getSessions(): Promise<CampaignSessionData[]> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/journal/sessions?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar sessões do diário:', e);
    }
    return [];
  },

  // SCHEDULE / NEXT SESSION & RSVP
  async getScheduledSession(): Promise<ScheduleResponseData> {
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(`/api/schedule?t=${Date.now()}`);
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar próxima sessão agendada:', e);
    }
    return { session: null };
  },

  async saveScheduledSession(payload: {
    title?: string;
    scheduledAt?: string | null;
    location?: string;
    description?: string;
    userId: string;
    resetRsvps?: boolean;
  }): Promise<ScheduledSessionData> {
    if (Platform.OS === 'web') {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao agendar sessão');
      }
    }
    throw new Error('Ambiente não suportado');
  },

  async submitRsvp(payload: {
    scheduledSessionId: string;
    userId: string;
    status: RsvpStatus;
    note?: string;
  }): Promise<SessionRsvpData> {
    if (Platform.OS === 'web') {
      const res = await fetch('/api/schedule/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao confirmar presença');
      }
    }
    throw new Error('Ambiente não suportado');
  },
};
