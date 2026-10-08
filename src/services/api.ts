import { CharacterData, ConditionData, INITIAL_CHARACTERS, TaskData, INITIAL_TASKS, RoomData, INITIAL_ROOMS } from '@/lib/mockData';
import { Platform } from 'react-native';
import { Role, authStorage, getApiBaseUrl } from '@/contexts/AuthContext';
import { apiStatus } from '@/lib/apiStatus';

export interface UserData {
  id: string;
  name: string;
  username: string;
  role: Role;
  roomId?: string | null;
  room?: RoomData | null;
  avatarUrl?: string;
  bio?: string;
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

export interface AvailabilityRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  user: {
    id: string;
    name: string;
    username: string;
    role: Role;
  };
  createdAt?: string;
}

export interface AvailabilityResponseData {
  month: string;
  users: UserData[];
  totalPlayers: number;
  records: AvailabilityRecord[];
}

const STORAGE_KEY = 'honra_egoismo_characters_v1';

// Gerenciador de armazenamento local com fallback em memória (para funcionar em SSR/Native e Browser)
let inMemoryCharacters: CharacterData[] = [];

function loadFromStorage(): CharacterData[] {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filtro defensivo: expurga personagens de teste antigos (char-1, char-2, etc.)
          const clean = parsed.filter(
            (c: any) => c && c.id && !String(c.id).startsWith('char-')
          );
          if (clean.length !== parsed.length) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
          }
          return clean;
        }
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

inMemoryTasks = loadTasksFromStorage();
if (inMemoryTasks.length === 0) {
  inMemoryTasks = [...INITIAL_TASKS];
  saveTasksToStorage(inMemoryTasks);
}

const STORAGE_KEY_ROOMS = 'honra_egoismo_rooms_v1';
let inMemoryRooms: RoomData[] = [...INITIAL_ROOMS];

function loadRoomsFromStorage(): RoomData[] {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY_ROOMS);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Erro ao carregar rooms do localStorage', e);
  }
  return inMemoryRooms;
}

function saveRoomsToStorage(rooms: RoomData[]) {
  inMemoryRooms = rooms;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    }
  } catch (e) {
    console.warn('Erro ao salvar rooms no localStorage', e);
  }
}

inMemoryRooms = loadRoomsFromStorage();
if (inMemoryRooms.length === 0) {
  inMemoryRooms = [...INITIAL_ROOMS];
  saveRoomsToStorage(inMemoryRooms);
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}, requesterId?: string): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const authUser = authStorage.get();
  const currentUserId = requesterId || authUser?.id;
  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }
  if (authUser?.token) {
    headers['Authorization'] = `Bearer ${authUser.token}`;
  }
  return headers;
}

/**
 * fetch com tratamento global de sessão expirada: se o servidor responder 401 a uma requisição
 * autenticada, a sessão local é encerrada e o usuário volta à tela de login.
 */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && authStorage.get()?.token) {
    authStorage.set(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  }
  return res;
}

export interface CharacterLogData {
  id: string;
  characterId: string;
  kind: 'DAMAGE' | 'HEAL' | 'REST' | 'CONDITION' | 'NOTE';
  delta: number;
  message: string;
  authorId?: string | null;
  authorName: string;
  createdAt: string;
}

async function postCharacterAction(id: string, action: string, body: unknown): Promise<CharacterData> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/characters/${id}/${action}`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || `Falha na ação '${action}' (status ${res.status})`);
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
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/tasks?t=${Date.now()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiStatus.reportOk();
          return data;
        }
      }
      apiStatus.reportFailure();
    } catch {
      apiStatus.reportFailure();
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
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newTask),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao criar task (status ${res.status})`);
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }
    const tasks = loadTasksFromStorage();
    tasks.push(newTask);
    saveTasksToStorage(tasks);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao atualizar task (status ${res.status})`);
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }
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
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) return true;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao deletar task (status ${res.status})`);
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }
    let tasks = loadTasksFromStorage();
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToStorage(tasks);
    return true;
  },

  // ROOMS
  async getRooms(): Promise<RoomData[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/rooms?t=${Date.now()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveRoomsToStorage(data);
          apiStatus.reportOk();
          return data;
        }
      }
      apiStatus.reportFailure();
    } catch {
      apiStatus.reportFailure();
    }
    return loadRoomsFromStorage();
  },

  async createRoom(data: Partial<RoomData>): Promise<RoomData> {
    const newRoom: RoomData = {
      id: `room-${Date.now()}`,
      code: data.code || `MESA-${Date.now()}`,
      name: data.name || 'Nova Mesa',
      dmName: data.dmName || 'Mestre',
      dmUsername: data.dmUsername || null,
      createdAt: new Date().toISOString(),
    };
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/rooms`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newRoom),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }
    const rooms = loadRoomsFromStorage();
    rooms.push(newRoom);
    saveRoomsToStorage(rooms);
    return newRoom;
  },

  // CHARACTERS
  async getCharacters(filter?: { username?: string; role?: Role; roomId?: string }): Promise<CharacterData[]> {
    try {
      const query = new URLSearchParams();
      query.set('t', Date.now().toString());
      if (filter?.role === 'PLAYER' && filter.username) {
        query.set('role', 'PLAYER');
        query.set('username', filter.username);
      }
      if (filter?.roomId && filter.roomId !== 'all') {
        query.set('roomId', filter.roomId);
      }

      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/characters?${query.toString()}`, {
        headers: getAuthHeaders({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (!filter || (!filter.role && !filter.roomId)) {
            saveToStorage(data);
          }
          apiStatus.reportOk();
          return data;
        }
      }
      apiStatus.reportFailure();
    } catch (e) {
      console.warn('Erro ao buscar personagens da API, usando armazenamento local', e);
      apiStatus.reportFailure();
    }
    const local = loadFromStorage();
    if (filter?.roomId && filter.roomId !== 'all') {
      return local.filter(c => c.roomId === filter.roomId);
    }
    return local;
  },

  async getCharacter(id: string): Promise<CharacterData | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/characters/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback para lista local/completa em caso de falha de rede
    }
    const chars = await this.getCharacters();
    return chars.find(c => c.id === id) || null;
  },

  async getTask(id: string): Promise<TaskData | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/tasks/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === id) || null;
  },

  async getUser(id: string): Promise<UserData | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/users/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  async createCharacter(data: Partial<CharacterData>): Promise<CharacterData> {
    const currentAuth = authStorage.get();
    const newChar: CharacterData = {
      id: `char-${Date.now()}`,
      userId: data.userId || currentAuth?.id,
      roomId: data.roomId || null,
      name: data.name || 'Novo Herói',
      playerName: data.playerName || 'Jogador',
      race: data.race || 'Humano',
      class: data.class || 'Guerreiro',
      archetype: data.archetype || '',
      level: data.level || 1,
      alignment: data.alignment || 'Neutro',
      background: data.background || 'Herói do Povo',
      avatarUrl: data.avatarUrl || '',
      currentHp: data.maxHp || 10,
      maxHp: data.maxHp || 10,
      tempHp: 0,
      armorClass: data.armorClass || 10,
      initiativeBonus: data.initiativeBonus || 0,
      speed: data.speed || '9m',
      hitDiceType: data.hitDiceType || '1d10',
      hitDiceTotal: data.level || 1,
      hitDiceSpent: 0,
      username: data.username || currentAuth?.username || '',
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
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/characters`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newChar),
      });
      if (res.ok) {
        const created = await res.json();
        const chars = loadFromStorage();
        chars.push(created);
        saveToStorage(chars);
        return created;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao criar personagem (status ${res.status})`);
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }

    const chars = loadFromStorage();
    chars.push(newChar);
    saveToStorage(chars);
    return newChar;
  },

  async updateCharacter(id: string, updates: Partial<CharacterData>, requesterId?: string): Promise<CharacterData> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/characters/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }, requesterId),
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
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao atualizar personagem (status ${res.status})`);
    } catch (err) {
      if (Platform.OS === 'web') throw err;
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

  async deleteCharacter(id: string, requesterId?: string): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/characters/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders({}, requesterId),
      });
      if (res.ok) return true;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao deletar personagem (status ${res.status})`);
    } catch (e) {
      if (Platform.OS === 'web') throw e;
    }

    let chars = loadFromStorage();
    chars = chars.filter(c => c.id !== id);
    saveToStorage(chars);
    return true;
  },

  // Descanso Curto: calculado e aplicado de forma atômica no servidor
  async takeShortRest(id: string, healHp: number = 0, hitDiceToSpend: number = 0): Promise<CharacterData> {
    return postCharacterAction(id, 'rest', { type: 'SHORT', healHp, hitDice: hitDiceToSpend });
  },

  // Descanso Longo: calculado e aplicado de forma atômica no servidor
  async takeLongRest(id: string): Promise<CharacterData> {
    return postCharacterAction(id, 'rest', { type: 'LONG' });
  },

  // Intervenção Remota do Mestre (DM Intervention) — aplicada no servidor, com registro no histórico
  async dmIntervene(
    characterId: string,
    action: {
      type: 'DAMAGE' | 'HEAL' | 'TEMP_HP' | 'ADD_CONDITION' | 'REMOVE_CONDITION' | 'INSPIRATION';
      value?: number;
      conditionName?: string;
      conditionDesc?: string;
    }
  ): Promise<CharacterData> {
    if (action.type === 'INSPIRATION') {
      const char = await this.getCharacter(characterId);
      if (!char) throw new Error('Personagem não encontrado');
      return char;
    }
    return postCharacterAction(characterId, 'intervene', action);
  },

  async getCharacterLogs(characterId: string, opts?: { kind?: string; limit?: number }): Promise<CharacterLogData[]> {
    const query = new URLSearchParams();
    if (opts?.kind) query.set('kind', opts.kind);
    if (opts?.limit) query.set('limit', String(opts.limit));
    const res = await apiFetch(`${getApiBaseUrl()}/api/characters/${characterId}/logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async resetToDefaultData(): Promise<CharacterData[]> {
    saveToStorage([]);
    return [];
  },

  // USERS & PERMISSIONS
  async getUsers(): Promise<UserData[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/users?t=${Date.now()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Erro ao buscar usuários da API', e);
    }
    return [];
  },

  async createUser(data: { name: string; username: string; password?: string; role: Role; roomId?: string }, requesterId?: string): Promise<UserData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, requesterId),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar usuário');
    }
  },

  async updateUser(
    id: string,
    data: {
      name?: string;
      role?: Role;
      bio?: string;
      avatarUrl?: string;
      password?: string;
      currentPassword?: string;
      roomId?: string | null;
    },
    requesterId?: string
  ): Promise<UserData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/users/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, requesterId || id),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar usuário');
    }
  },

  async deleteUser(id: string, requesterId?: string): Promise<boolean> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders({}, requesterId),
    });
    if (res.ok) {
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir usuário');
    }
  },

  // SESSIONS / JOURNAL
  async getSessions(roomId?: string): Promise<CampaignSessionData[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const query = new URLSearchParams();
      query.set('t', Date.now().toString());
      if (roomId && roomId !== 'all') {
        query.set('roomId', roomId);
      }
      const res = await apiFetch(`${baseUrl}/api/journal/sessions?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Erro ao buscar sessões do diário:', e);
    }
    return [];
  },

  async createSession(title: string, authorId: string, roomId?: string): Promise<CampaignSessionData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/sessions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, authorId),
      body: JSON.stringify({ title, authorId, roomId }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar sessão');
  },

  async updateSession(sessionId: string, title: string, userId: string): Promise<CampaignSessionData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/sessions`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ sessionId, title, userId }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar sessão');
  },

  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/sessions`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ sessionId, userId }),
    });
    if (res.ok) {
      return true;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao excluir sessão');
  },

  async createNote(sessionId: string, authorId: string, content: string): Promise<SessionNoteData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/notes`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, authorId),
      body: JSON.stringify({ sessionId, authorId, content }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar anotação');
  },

  async updateNote(noteId: string, userId: string, content: string): Promise<SessionNoteData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/notes`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ noteId, userId, content }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar anotação');
  },

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/journal/notes`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ noteId, userId }),
    });
    if (res.ok) {
      return true;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao excluir anotação');
  },

  // SCHEDULE / NEXT SESSION & RSVP
  async getScheduledSession(roomId?: string): Promise<ScheduleResponseData> {
    try {
      const baseUrl = getApiBaseUrl();
      const query = new URLSearchParams();
      query.set('t', Date.now().toString());
      if (roomId && roomId !== 'all') {
        query.set('roomId', roomId);
      }
      const res = await apiFetch(`${baseUrl}/api/schedule?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
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
    roomId?: string;
    resetRsvps?: boolean;
  }): Promise<ScheduledSessionData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/schedule`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, payload.userId),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao agendar sessão');
    }
  },

  async submitRsvp(payload: {
    scheduledSessionId: string;
    userId: string;
    status: RsvpStatus;
    note?: string;
  }): Promise<SessionRsvpData> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/schedule/rsvp`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, payload.userId),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao confirmar presença');
    }
  },

  // DISPONIBILIDADE DA COMITIVA (CALENDÁRIO)
  async getAvailability(month: string): Promise<AvailabilityResponseData> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/api/availability?month=${month}&t=${Date.now()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao buscar disponibilidade:', e);
    }
    return {
      month,
      users: [],
      totalPlayers: 0,
      records: [],
    };
  },

  async toggleAvailability(userId: string, date: string): Promise<{ success: boolean; status: 'ADDED' | 'REMOVED' }> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/availability`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ action: 'TOGGLE', userId, date }),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao alternar disponibilidade');
    }
  },

  async batchSetAvailability(userId: string, month: string, dates: string[]): Promise<{ success: boolean; count: number }> {
    const baseUrl = getApiBaseUrl();
    const res = await apiFetch(`${baseUrl}/api/availability`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ action: 'BATCH_SET', userId, month, dates }),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao salvar disponibilidade em lote');
    }
  },
};
