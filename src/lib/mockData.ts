export interface SpellSlotData {
  id: string;
  level: number;
  total: number;
  used: number;
}

export interface AbilityData {
  id: string;
  name: string;
  description: string;
  maxUses: number;
  currentUses: number;
  resetType: 'SHORT_REST' | 'LONG_REST' | 'NONE';
}

export interface ConditionData {
  id: string;
  name: string;
  description: string;
}

export interface CharacterData {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  background: string;
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
  spellSlots: SpellSlotData[];
  abilities: AbilityData[];
  conditions: ConditionData[];
}

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
    spellSlots: [
      { id: 'slot-1-1', level: 1, total: 4, used: 2 },
      { id: 'slot-1-2', level: 2, total: 2, used: 0 },
    ],
    abilities: [
      { id: 'ab-1-1', name: 'Destruição Divina (Divine Smite)', description: 'Gasta 1 spell slot para dano radiante extra.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-1-2', name: 'Impor as Mãos (25/25 HP)', description: 'Cura pontos de vida tocando uma criatura.', maxUses: 25, currentUses: 25, resetType: 'LONG_REST' },
      { id: 'ab-1-3', name: 'Canalizar Divindade: Voto de Inimizade', description: 'Vantagem nas jogadas de ataque contra 1 alvo.', maxUses: 1, currentUses: 1, resetType: 'SHORT_REST' },
    ],
    conditions: [],
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
    spellSlots: [
      { id: 'slot-2-3', level: 3, total: 2, used: 1 },
    ],
    abilities: [
      { id: 'ab-2-1', name: 'Rajada Mística (Agonizing Blast)', description: 'Dois raios de 1d10+4 de dano de energia de longe.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-2-2', name: 'Bênção do Sombrio (Temp HP ao matar)', description: 'Ganha CHA mod + Nível de Bruxo em HP temporário.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-2-3', name: 'Pacto da Lâmina', description: 'Invoca uma arma mágica sombria na mão.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
    ],
    conditions: [
      { id: 'cond-2-1', name: 'Abençoado', description: '+1d4 em jogadas de ataque e testes de resistência.' }
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
    spellSlots: [
      { id: 'slot-3-1', level: 1, total: 4, used: 3 },
      { id: 'slot-3-2', level: 2, total: 3, used: 2 },
      { id: 'slot-3-3', level: 3, total: 2, used: 1 },
    ],
    abilities: [
      { id: 'ab-3-1', name: 'Canalizar Divindade: Caminho da Sepultura', description: 'Deixa o alvo vulnerável ao próximo dano sofrido.', maxUses: 1, currentUses: 0, resetType: 'SHORT_REST' },
      { id: 'ab-3-2', name: 'Círculo da Mortalidade', description: 'Cura maximizada em criaturas com 0 HP.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
    ],
    conditions: [
      { id: 'cond-3-1', name: 'Amedrontado', description: 'Desvantagem em testes e ataques enquanto a fonte do medo estiver visível.' }
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
    spellSlots: [],
    abilities: [
      { id: 'ab-4-1', name: 'Fúria Sanguinária (Rage)', description: 'Vantagem em FOR, bônus de dano +2, resistência a dano físico.', maxUses: 3, currentUses: 3, resetType: 'LONG_REST' },
      { id: 'ab-4-2', name: 'Ataque Descuidado (Reckless Attack)', description: 'Vantagem nos ataques corpo a corpo, mas inimigos têm vantagem contra você.', maxUses: 99, currentUses: 99, resetType: 'NONE' },
      { id: 'ab-4-3', name: 'Resistência Implacável', description: 'Ao cair para 0 HP, fica com 1 HP em vez disso (1x por Descanso Longo).', maxUses: 1, currentUses: 1, resetType: 'LONG_REST' },
    ],
    conditions: [],
  }
];
