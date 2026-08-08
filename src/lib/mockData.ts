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

export interface CharacterData {
  id: string;
  name: string;
  playerName: string;
  username?: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  background: string;
  deity?: string;
  lore?: string;
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

export const INITIAL_CHARACTERS: CharacterData[] = [
  {
    id: 'char-1',
    name: 'Thalor Vane',
    playerName: 'Alex',
    race: 'Aasimar Caído',
    class: 'Paladino (Vingança)',
    level: 5,
    alignment: 'Leal e Neutro',
    background: 'Cavaleiro Caído',
    currentHp: 44,
    maxHp: 44,
    tempHp: 0,
    armorClass: 18,
    initiativeBonus: 1,
    speed: '9m',
    hitDiceType: '1d10',
    hitDiceTotal: 5,
    hitDiceSpent: 1,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    str: 18,
    dex: 12,
    con: 16,
    int: 10,
    wis: 14,
    cha: 16,
    strProf: true,
    dexProf: false,
    conProf: false,
    intProf: false,
    wisProf: true,
    chaProf: true,
    proficientSkills: 'Intimidação,Persuasão,Atletismo,Religião',
    gold: 45,
    silver: 20,
    copper: 10,
    spellSlots: [
      { id: 'slot-1-1', level: 1, total: 4, used: 2 },
      { id: 'slot-1-2', level: 2, total: 2, used: 0 },
    ],
    spells: [
      { id: 'sp-1-1', name: 'Bênção (Bless)', level: 1, castingTime: '1 Ação', range: '9m', duration: 'Concentração (1h)', components: 'V, S, M', isPrepared: true, description: '+1d4 em jogadas de ataque e testes de resistência para 3 aliados.' },
      { id: 'sp-1-2', name: 'Destruição Colérica', level: 1, castingTime: 'Bônus', range: 'Pessoal', duration: 'Concentração (1m)', components: 'V', isPrepared: true, description: '+1d6 de dano psíquico e alvo fica amedrontado.' },
      { id: 'sp-1-3', name: 'Escudo da Fé', level: 1, castingTime: 'Bônus', range: '18m', duration: 'Concentração (10m)', components: 'V, S, M', isPrepared: true, description: '+2 na CA de uma criatura.' },
      { id: 'sp-1-4', name: 'Passo Nebuloso (Misty Step)', level: 2, castingTime: 'Bônus', range: 'Pessoal', duration: 'Instantânea', components: 'V', isPrepared: true, description: 'Teleporte de 9m para espaço livre visível.' },
      { id: 'sp-1-5', name: 'Montaria Mágica', level: 2, castingTime: '10 Minutos', range: '9m', duration: 'Instantânea', components: 'V, S', isPrepared: false, description: 'Invoca um corcel leal de energia celestial.' },
    ],
    abilities: [
      { id: 'ab-1-1', name: 'Destruição Divina (Divine Smite)', description: 'Gasta 1 spell slot para dano radiante extra.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-1-2', name: 'Impor as Mãos (25/25 HP)', description: 'Cura pontos de vida tocando uma criatura.', maxUses: 25, currentUses: 25, resetType: 'LONG_REST' },
      { id: 'ab-1-3', name: 'Canalizar Divindade: Voto de Inimizade', description: 'Vantagem nas jogadas de ataque contra 1 alvo.', maxUses: 1, currentUses: 1, resetType: 'SHORT_REST' },
    ],
    conditions: [],
    items: [
      { id: 'item-1-1', name: 'Montante Sagrado', description: 'Espada pesada abençoada', weight: 3.0, quantity: 1, isWeapon: true, damage: '2d6+4 cortante' },
      { id: 'item-1-2', name: 'Armadura de Placas (CA 18)', description: 'Armadura pesada de aço anão', weight: 32.0, quantity: 1, isWeapon: false },
      { id: 'item-1-3', name: 'Poção de Cura Maior', description: 'Restaura 4d4+4 HP', weight: 0.5, quantity: 2, isWeapon: false },
    ],
  },
  {
    id: 'char-2',
    name: 'Kaelen "Sombra"',
    playerName: 'Marina',
    race: 'Tiefling',
    class: 'Bruxo (Corruptor)',
    level: 5,
    alignment: 'Caótico e Bom',
    background: 'Charlatão',
    currentHp: 32,
    maxHp: 38,
    tempHp: 5,
    armorClass: 15,
    initiativeBonus: 3,
    speed: '9m',
    hitDiceType: '1d8',
    hitDiceTotal: 5,
    hitDiceSpent: 2,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    str: 8,
    dex: 16,
    con: 14,
    int: 12,
    wis: 10,
    cha: 18,
    strProf: false,
    dexProf: false,
    conProf: false,
    intProf: false,
    wisProf: true,
    chaProf: true,
    proficientSkills: 'Enganação,Furtividade,Arcanismo,Percepção',
    gold: 120,
    silver: 50,
    copper: 80,
    spellSlots: [
      { id: 'slot-2-3', level: 3, total: 2, used: 1 },
    ],
    spells: [
      { id: 'sp-2-1', name: 'Rajada Mística (Eldritch Blast)', level: 0, castingTime: '1 Ação', range: '36m', duration: 'Instantânea', components: 'V, S', isPrepared: true, description: 'Dois raios de 1d10+4 de dano de energia cósmica.' },
      { id: 'sp-2-2', name: 'Toque Arrepiante', level: 0, castingTime: '1 Ação', range: '36m', duration: '1 Rodada', components: 'V, S', isPrepared: true, description: '1d8 necrótico e impede cura no alvo.' },
      { id: 'sp-2-3', name: 'Bola de Fogo (Fireball)', level: 3, castingTime: '1 Ação', range: '45m', duration: 'Instantânea', components: 'V, S, M', isPrepared: true, description: 'Esfera de fogo de 6m de raio causa 8d6 de dano igneo (CD Ref).' },
      { id: 'sp-2-4', name: 'Contra-feitiço (Counterspell)', level: 3, castingTime: 'Reação', range: '18m', duration: 'Instantânea', components: 'S', isPrepared: true, description: 'Interrompe a conjuração de uma magia inimiga de até 3º nível.' },
      { id: 'sp-2-5', name: 'Fome de Hadar', level: 3, castingTime: '1 Ação', range: '45m', duration: 'Concentração (1m)', components: 'V, S, M', isPrepared: true, description: 'Esfera de escuridão e tentáculos causa dano congelante e ácido.' },
    ],
    abilities: [
      { id: 'ab-2-1', name: 'Rajada Mística (Agonizing Blast)', description: 'Dois raios de 1d10+4 de dano de energia de longe.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-2-2', name: 'Bênção do Sombrio (Temp HP ao matar)', description: 'Ganha CHA mod + Nível de Bruxo em HP temporário.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-2-3', name: 'Pacto da Lâmina', description: 'Invoca uma arma mágica sombria na mão.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
    ],
    conditions: [
      { id: 'cond-2-1', name: 'Abençoado', description: '+1d4 em jogadas de ataque e testes de resistência.' }
    ],
    items: [
      { id: 'item-2-1', name: 'Adaga Mágica Sombria', description: 'Arma leve de pacto', weight: 0.5, quantity: 1, isWeapon: true, damage: '1d4+3 perfurante' },
      { id: 'item-2-2', name: 'Baú de Relíquias Amaldiçoadas', description: 'Baú maciço e pesado com artefatos de culto', weight: 45.0, quantity: 1, isWeapon: false },
      { id: 'item-2-3', name: 'Tomo dos Encantos Proibidos', description: 'Livro de feitiços selado com ferro e chumbo', weight: 18.0, quantity: 1, isWeapon: false },
    ],
  },
  {
    id: 'char-3',
    name: 'Lyra Montenegra',
    playerName: 'Rafael',
    race: 'Meio-Elfo',
    class: 'Clérigo (Sepultura)',
    level: 5,
    alignment: 'Neutro e Bom',
    background: 'Acólito das Sombras',
    currentHp: 14,
    maxHp: 36,
    tempHp: 0,
    armorClass: 16,
    initiativeBonus: 0,
    speed: '9m',
    hitDiceType: '1d8',
    hitDiceTotal: 5,
    hitDiceSpent: 3,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    str: 10,
    dex: 10,
    con: 14,
    int: 12,
    wis: 18,
    cha: 14,
    strProf: false,
    dexProf: false,
    conProf: false,
    intProf: false,
    wisProf: true,
    chaProf: true,
    proficientSkills: 'Medicina,Intuição,Religião,Persuasão',
    gold: 80,
    silver: 40,
    copper: 100,
    spellSlots: [
      { id: 'slot-3-1', level: 1, total: 4, used: 3 },
      { id: 'slot-3-2', level: 2, total: 3, used: 2 },
      { id: 'slot-3-3', level: 3, total: 2, used: 1 },
    ],
    spells: [
      { id: 'sp-3-1', name: 'Chama Sagrada (Sacred Flame)', level: 0, castingTime: '1 Ação', range: '18m', duration: 'Instantânea', components: 'V, S', isPrepared: true, description: 'Descarga radiante causa 2d8 de dano (CD Des).' },
      { id: 'sp-3-2', name: 'Orientação (Guidance)', level: 0, castingTime: '1 Ação', range: 'Toque', duration: 'Concentração (1m)', components: 'V, S', isPrepared: true, description: '+1d4 em um teste de atributo à escolha.' },
      { id: 'sp-3-3', name: 'Palavra de Cura (Healing Word)', level: 1, castingTime: 'Bônus', range: '18m', duration: 'Instantânea', components: 'V', isPrepared: true, description: 'Cura 1d4 + mod. SAB à distância.' },
      { id: 'sp-3-4', name: 'Raio Guiador (Guiding Bolt)', level: 1, castingTime: '1 Ação', range: '36m', duration: '1 Rodada', components: 'V, S', isPrepared: true, description: '4d6 radiante e próximo ataque contra o alvo tem vantagem.' },
      { id: 'sp-3-5', name: 'Arma Espiritual', level: 2, castingTime: 'Bônus', range: '18m', duration: '1 Minuto', components: 'V, S', isPrepared: true, description: 'Arma espectral flutuante causa 1d8 + mod dano como ação bônus.' },
      { id: 'sp-3-6', name: 'Espíritos Guardiões', level: 3, castingTime: '1 Ação', range: 'Pessoal (4.5m)', duration: 'Concentração (10m)', components: 'V, S, M', isPrepared: true, description: 'Espíritos cercam você, causando 3d8 de dano radiante ou necrótico.' },
      { id: 'sp-3-7', name: 'Reviver (Revivify)', level: 3, castingTime: '1 Ação', range: 'Toque', duration: 'Instantânea', components: 'V, S, M', isPrepared: true, description: 'Trás de volta à vida uma criatura que morreu no último minuto (gasta diamante 300gp).' },
    ],
    abilities: [
      { id: 'ab-3-1', name: 'Canalizar Divindade: Caminho da Sepultura', description: 'Deixa o alvo vulnerável ao próximo dano sofrido.', maxUses: 1, currentUses: 0, resetType: 'SHORT_REST' },
      { id: 'ab-3-2', name: 'Círculo da Mortalidade', description: 'Cura maximizada em criaturas com 0 HP.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
    ],
    conditions: [
      { id: 'cond-3-1', name: 'Amedrontado', description: 'Desvantagem em testes e ataques enquanto a fonte do medo estiver visível.' }
    ],
    items: [
      { id: 'item-3-1', name: 'Maça Sagrada da Sepultura', description: 'Arma de contusão abençoada', weight: 2.0, quantity: 1, isWeapon: true, damage: '1d6+1 contundente' },
      { id: 'item-3-2', name: 'Escudo com Emblema Fúnebre', description: '+2 CA', weight: 3.0, quantity: 1, isWeapon: false },
      { id: 'item-3-3', name: 'Kit de Primeiros Socorros', description: 'Estojo com ataduras e ervas de cura', weight: 1.5, quantity: 1, isWeapon: false },
    ],
  },
  {
    id: 'char-4',
    name: 'Grom Horda-Cinza',
    playerName: 'Lucas',
    race: 'Meio-Orc',
    class: 'Bárbaro (Furioso)',
    level: 5,
    alignment: 'Caótico e Neutro',
    background: 'Forasteiro',
    currentHp: 55,
    maxHp: 55,
    tempHp: 0,
    armorClass: 15,
    initiativeBonus: 2,
    speed: '12m',
    hitDiceType: '1d12',
    hitDiceTotal: 5,
    hitDiceSpent: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    str: 18,
    dex: 14,
    con: 16,
    int: 8,
    wis: 12,
    cha: 10,
    strProf: true,
    dexProf: false,
    conProf: true,
    intProf: false,
    wisProf: false,
    chaProf: false,
    proficientSkills: 'Atletismo,Sobrevivência,Percepção,Intimidação',
    gold: 15,
    silver: 10,
    copper: 5,
    spellSlots: [],
    spells: [],
    abilities: [
      { id: 'ab-4-1', name: 'Fúria Sanguinária (Rage)', description: 'Vantagem em FOR, bônus de dano +2, resistência a dano físico.', maxUses: 3, currentUses: 3, resetType: 'LONG_REST' },
      { id: 'ab-4-2', name: 'Ataque Descuidado (Reckless Attack)', description: 'Vantagem nos ataques corpo a corpo, mas inimigos têm vantagem contra você.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-4-3', name: 'Resistência Implacável', description: 'Ao cair para 0 HP, fica com 1 HP em vez disso (1x por Descanso Longo).', maxUses: 1, currentUses: 1, resetType: 'LONG_REST' },
    ],
    conditions: [],
    items: [
      { id: 'item-4-1', name: 'Machado Grande dos Orcs', description: 'Machado brutal de duas mãos', weight: 3.5, quantity: 1, isWeapon: true, damage: '1d12+4 cortante' },
      { id: 'item-4-2', name: 'Azagaia de Caça', description: 'Arma de arremesso', weight: 1.0, quantity: 3, isWeapon: true, damage: '1d6+4 perfurante' },
      { id: 'item-4-3', name: 'Mochila de Acampamento', description: 'Saco de dormir, pederneira e rações secas', weight: 12.0, quantity: 1, isWeapon: false },
    ],
  }
];

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
  }
];
