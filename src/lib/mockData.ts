export interface SpellSlotData {
  id: string;
  level: number;
  total: number;
  used: number;
}

export interface SpellItemData {
  id: string;
  name: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  components?: string;
  isPrepared: boolean;
  description?: string;
}

export interface AbilityData {
  id: string;
  name: string;
  description: string;
  maxUses: number;
  currentUses: number;
  resetType: 'SHORT_REST' | 'LONG_REST' | 'NONE';
  actionType?: string;
}

export interface ConditionData {
  id: string;
  name: string;
  description: string;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  weight: number;
  quantity: number;
  isWeapon: boolean;
  damage?: string;
  isArmor?: boolean;
  isEquipped?: boolean;
  armorClassBonus?: number;
}

export interface RoomData {
  id: string;
  code: string;
  name: string;
  dmName: string;
  dmUsername?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _count?: {
    characters: number;
  };
}

export interface CharacterData {
  id: string;
  userId?: string;
  roomId?: string | null;
  room?: {
    id: string;
    code: string;
    name: string;
    dmName: string;
    dmUsername?: string | null;
  } | null;
  name: string;
  playerName: string;
  username?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
  } | null;
  race: string;
  class: string;
  archetype?: string;
  level: number;
  alignment: string;
  background: string;
  deity?: string;
  lore?: string;
  companion?: string;
  description?: string;
  avatarUrl?: string;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  initiativeBonus: number;
  speed: string;
  hitDiceType: string;
  hitDiceTotal: number;
  hitDiceSpent: number;
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  strProf: boolean;
  dexProf: boolean;
  conProf: boolean;
  intProf: boolean;
  wisProf: boolean;
  chaProf: boolean;
  proficientSkills: string;
  gold: number;
  silver: number;
  copper: number;
  spellSlots: SpellSlotData[];
  spells: SpellItemData[];
  abilities: AbilityData[];
  conditions: ConditionData[];
  items: ItemData[];
  themeColor?: string;
  sorceryPoints?: number;
  maxSorceryPoints?: number;
  kiPoints?: number;
  maxKiPoints?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type TaskCategory = 'LORE' | 'MECANICA' | 'ARTE' | 'DEV' | 'ESPECIAL';
export type TaskStatus = 'SUGERIDO' | 'PARADO' | 'ANDAMENTO' | 'FINALIZADO' | 'APROVADO';

export interface TaskData {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  reward: string;
  resolution?: string;
  assignedTo: string | null;
  createdAt: string;
}

export const CHARACTER_THEME_COLORS = [
  { name: 'Padrão Dourado', hex: '#C5A059', bg: 'rgba(197, 160, 89, 0.15)' },
  { name: 'Vermelho Sangue', hex: '#C95B5B', bg: 'rgba(201, 91, 91, 0.15)' },
  { name: 'Verde Esmeralda', hex: '#4E9C8E', bg: 'rgba(78, 156, 142, 0.15)' },
  { name: 'Azul Arcano', hex: '#5B8AC9', bg: 'rgba(91, 138, 201, 0.15)' },
  { name: 'Roxo Sombrio', hex: '#B280E6', bg: 'rgba(178, 128, 230, 0.15)' },
  { name: 'Fogo Alaranjado', hex: '#E67E22', bg: 'rgba(230, 126, 34, 0.15)' },
  { name: 'Prata Celestial', hex: '#A8B8C8', bg: 'rgba(168, 184, 200, 0.15)' },
  { name: 'Rosa Encantado', hex: '#E84393', bg: 'rgba(232, 67, 147, 0.15)' },
];

export const INITIAL_CHARACTERS: CharacterData[] = [];


export const INITIAL_SPELLS: Record<string, SpellItemData[]> = {};

export const INITIAL_TASKS: TaskData[] = [
  {
    id: 'task-1',
    title: 'Criar História da Taverna',
    description: 'Escrever a lore da Taverna do Porco Cego e seus antigos donos.',
    category: 'LORE',
    status: 'PARADO',
    reward: 'Iniciativa +1 na próxima sessão',
    assignedTo: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Mecânica de Fadiga',
    description: 'Sugerir uma nova regra para viagem exaustiva e testes de constituição.',
    category: 'MECANICA',
    status: 'ANDAMENTO',
    reward: '20 PO',
    assignedTo: 'Alex',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Arte do Bosque',
    description: 'Fazer o mapa de batalha para o encontro no bosque das fadas.',
    category: 'ARTE',
    status: 'FINALIZADO',
    reward: 'Inspiração Bárdica',
    assignedTo: 'Marina',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ROOMS: RoomData[] = [
  {
    id: 'room-alex',
    code: 'MESA-ALEX',
    name: 'Mesa Alex',
    dmName: 'Alex (Mestre)',
    dmUsername: 'alex.g',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-joao',
    code: 'MESA-JOAO',
    name: 'Mesa João',
    dmName: 'João (Mestre)',
    dmUsername: 'joao.c',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-lobo',
    code: 'MESA-LOBO',
    name: 'Mesa Lobo',
    dmName: 'Lobo (Mestre)',
    dmUsername: 'lobo.l',
    createdAt: new Date().toISOString(),
  },
];


