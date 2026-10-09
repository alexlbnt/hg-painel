import { getMod } from '@/utils/dnd5e';
import { getMaxSuperiorityDice } from '@/utils/combatRules';
import { parseClassesAndCalculateSlots } from '@/utils/spellProgression';

/**
 * Predefinições de D&D 5e usadas pelo assistente de criação de personagem:
 * classes (dado de vida, salvaguardas, perícias, conjuração), raças, antecedentes,
 * compra de pontos e cálculos iniciais (PV, CA, espaços de magia, recursos de classe).
 * Sem dependências de React: testável isoladamente.
 */

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITIES: { key: AbilityKey; abbr: string; name: string }[] = [
  { key: 'str', abbr: 'FOR', name: 'Força' },
  { key: 'dex', abbr: 'DES', name: 'Destreza' },
  { key: 'con', abbr: 'CON', name: 'Constituição' },
  { key: 'int', abbr: 'INT', name: 'Inteligência' },
  { key: 'wis', abbr: 'SAB', name: 'Sabedoria' },
  { key: 'cha', abbr: 'CAR', name: 'Carisma' },
];

export const abilityAbbr = (k: AbilityKey) => ABILITIES.find((a) => a.key === k)!.abbr;

export type CasterType = 'none' | 'full' | 'half' | 'pact';

export interface ClassPreset {
  name: string;
  hitDie: 6 | 8 | 10 | 12;
  /** Atributo(s) principal(is) da classe */
  primary: AbilityKey[];
  /** Salvaguardas em que a classe é proficiente */
  saves: [AbilityKey, AbilityKey];
  /** Quantas perícias a classe escolhe e de quais ('ALL' = qualquer uma) */
  skillCount: number;
  skillOptions: string[] | 'ALL';
  caster: CasterType;
  /** Ordem de prioridade dos atributos (usada na sugestão automática de distribuição) */
  priority: AbilityKey[];
  /** Sugestões de subclasse e nível em que costuma ser escolhida */
  archetypes: string[];
  archetypeLevel: number;
  /** CA sem armadura: 10 + DES + (outro atributo, se a classe tiver Defesa sem Armadura) */
  unarmored?: AbilityKey;
  summary: string;
}

export const CLASS_PRESETS: ClassPreset[] = [
  {
    name: 'Bárbaro', hitDie: 12, primary: ['str'], saves: ['str', 'con'], skillCount: 2,
    skillOptions: ['Lidar com Animais', 'Atletismo', 'Intimidação', 'Natureza', 'Percepção', 'Sobrevivência'],
    caster: 'none', priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    archetypes: ['Caminho do Furioso', 'Caminho do Guerreiro Totêmico'], archetypeLevel: 3, unarmored: 'con',
    summary: 'Combatente feroz e resistente. Defesa sem Armadura usa CON.',
  },
  {
    name: 'Bardo', hitDie: 8, primary: ['cha'], saves: ['dex', 'cha'], skillCount: 3, skillOptions: 'ALL',
    caster: 'full', priority: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    archetypes: ['Colégio do Conhecimento', 'Colégio da Bravura'], archetypeLevel: 3,
    summary: 'Artista e conjurador versátil, mestre em perícias.',
  },
  {
    name: 'Bruxo', hitDie: 8, primary: ['cha'], saves: ['wis', 'cha'], skillCount: 2,
    skillOptions: ['Arcanismo', 'Enganação', 'História', 'Intimidação', 'Investigação', 'Natureza', 'Religião'],
    caster: 'pact', priority: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    archetypes: ['A Arquifada', 'O Corruptor', 'O Grande Antigo'], archetypeLevel: 1,
    summary: 'Conjurador por pacto, poucos espaços de magia que recarregam em descanso curto.',
  },
  {
    name: 'Clérigo', hitDie: 8, primary: ['wis'], saves: ['wis', 'cha'], skillCount: 2,
    skillOptions: ['História', 'Intuição', 'Medicina', 'Persuasão', 'Religião'],
    caster: 'full', priority: ['wis', 'con', 'str', 'cha', 'dex', 'int'],
    archetypes: ['Domínio da Vida', 'Domínio da Luz', 'Domínio do Conhecimento', 'Domínio da Natureza', 'Domínio da Tempestade', 'Domínio da Trapaça', 'Domínio da Guerra'],
    archetypeLevel: 1,
    summary: 'Servo divino: cura, proteção e magia sagrada.',
  },
  {
    name: 'Druida', hitDie: 8, primary: ['wis'], saves: ['int', 'wis'], skillCount: 2,
    skillOptions: ['Arcanismo', 'Lidar com Animais', 'Intuição', 'Medicina', 'Natureza', 'Percepção', 'Religião', 'Sobrevivência'],
    caster: 'full', priority: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    archetypes: ['Círculo da Terra', 'Círculo da Lua'], archetypeLevel: 2,
    summary: 'Guardião da natureza, conjurador e metamorfo.',
  },
  {
    name: 'Feiticeiro', hitDie: 6, primary: ['cha'], saves: ['con', 'cha'], skillCount: 2,
    skillOptions: ['Arcanismo', 'Enganação', 'Intimidação', 'Intuição', 'Persuasão', 'Religião'],
    caster: 'full', priority: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    archetypes: ['Linhagem Dracônica', 'Magia Selvagem'], archetypeLevel: 1,
    summary: 'Magia inata, com pontos de feitiçaria. Poucos PV.',
  },
  {
    name: 'Guerreiro', hitDie: 10, primary: ['str', 'dex'], saves: ['str', 'con'], skillCount: 2,
    skillOptions: ['Acrobacia', 'Lidar com Animais', 'Atletismo', 'História', 'Intuição', 'Intimidação', 'Percepção', 'Sobrevivência'],
    caster: 'none', priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    archetypes: ['Mestre de Batalha', 'Campeão', 'Cavaleiro Arcano'], archetypeLevel: 3,
    summary: 'Especialista em armas e armaduras. O Mestre de Batalha ganha dados de superioridade.',
  },
  {
    name: 'Ladino', hitDie: 8, primary: ['dex'], saves: ['dex', 'int'], skillCount: 4,
    skillOptions: ['Acrobacia', 'Atletismo', 'Atuação', 'Enganação', 'Furtividade', 'Intimidação', 'Intuição', 'Investigação', 'Percepção', 'Persuasão', 'Prestidigitação'],
    caster: 'none', priority: ['dex', 'con', 'int', 'cha', 'wis', 'str'],
    archetypes: ['Ladrão', 'Assassino', 'Trapaceiro Arcano'], archetypeLevel: 3,
    summary: 'Furtivo e preciso, com muitas perícias.',
  },
  {
    name: 'Mago', hitDie: 6, primary: ['int'], saves: ['int', 'wis'], skillCount: 2,
    skillOptions: ['Arcanismo', 'História', 'Intuição', 'Investigação', 'Medicina', 'Religião'],
    caster: 'full', priority: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
    archetypes: ['Escola de Abjuração', 'Escola de Adivinhação', 'Escola de Conjuração', 'Escola de Encantamento', 'Escola de Evocação', 'Escola de Ilusão', 'Escola de Necromancia', 'Escola de Transmutação'],
    archetypeLevel: 2,
    summary: 'Maior variedade de magias. Poucos PV.',
  },
  {
    name: 'Monge', hitDie: 8, primary: ['dex', 'wis'], saves: ['str', 'dex'], skillCount: 2,
    skillOptions: ['Acrobacia', 'Atletismo', 'História', 'Intuição', 'Religião', 'Furtividade'],
    caster: 'none', priority: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
    archetypes: ['Caminho da Mão Aberta', 'Caminho da Sombra', 'Caminho dos Quatro Elementos'], archetypeLevel: 3, unarmored: 'wis',
    summary: 'Artes marciais e pontos de ki (a partir do nível 2). Defesa sem Armadura usa SAB.',
  },
  {
    name: 'Paladino', hitDie: 10, primary: ['str', 'cha'], saves: ['wis', 'cha'], skillCount: 2,
    skillOptions: ['Atletismo', 'Intimidação', 'Intuição', 'Medicina', 'Persuasão', 'Religião'],
    caster: 'half', priority: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
    archetypes: ['Juramento da Devoção', 'Juramento dos Anciões', 'Juramento da Vingança'], archetypeLevel: 3,
    summary: 'Guerreiro sagrado. Magias a partir do nível 2.',
  },
  {
    name: 'Patrulheiro', hitDie: 10, primary: ['dex', 'wis'], saves: ['str', 'dex'], skillCount: 3,
    skillOptions: ['Lidar com Animais', 'Atletismo', 'Intuição', 'Investigação', 'Natureza', 'Percepção', 'Furtividade', 'Sobrevivência'],
    caster: 'half', priority: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    archetypes: ['Caçador', 'Mestre das Feras'], archetypeLevel: 3,
    summary: 'Explorador e rastreador. Magias a partir do nível 2.',
  },
];

export const getClassPreset = (name: string): ClassPreset | undefined =>
  CLASS_PRESETS.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());

export const CASTER_LABEL: Record<CasterType, string> = {
  none: 'Não conjura',
  full: 'Conjurador pleno',
  half: 'Meio-conjurador',
  pact: 'Conjurador de pacto',
};

// ---------------------------------------------------------------------------------------------
// Raças e antecedentes
// ---------------------------------------------------------------------------------------------

export interface RacePreset {
  name: string;
  speed: string;
  bonuses: Partial<Record<AbilityKey, number>>;
  /** Raças com bônus à escolha do jogador (o assistente deixa ajustar manualmente) */
  flexibleNote?: string;
}

export const RACE_PRESETS: RacePreset[] = [
  { name: 'Humano', speed: '9m', bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
  { name: 'Humano Variante', speed: '9m', bonuses: {}, flexibleNote: '+1 em dois atributos à sua escolha (e uma perícia e um talento, ajustáveis na ficha).' },
  { name: 'Anão', speed: '7,5m', bonuses: { con: 2 } },
  { name: 'Elfo', speed: '9m', bonuses: { dex: 2 } },
  { name: 'Halfling', speed: '7,5m', bonuses: { dex: 2 } },
  { name: 'Draconato', speed: '9m', bonuses: { str: 2, cha: 1 } },
  { name: 'Gnomo', speed: '7,5m', bonuses: { int: 2 } },
  { name: 'Meio-Elfo', speed: '9m', bonuses: { cha: 2 }, flexibleNote: '+1 em dois outros atributos à sua escolha.' },
  { name: 'Meio-Orc', speed: '9m', bonuses: { str: 2, con: 1 } },
  { name: 'Tiefling', speed: '9m', bonuses: { cha: 2, int: 1 } },
];

export const getRacePreset = (name: string): RacePreset | undefined =>
  RACE_PRESETS.find((r) => r.name.toLowerCase() === name.trim().toLowerCase());

export interface BackgroundPreset {
  name: string;
  skills: [string, string];
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { name: 'Acólito', skills: ['Intuição', 'Religião'] },
  { name: 'Artesão de Guilda', skills: ['Intuição', 'Persuasão'] },
  { name: 'Artista', skills: ['Acrobacia', 'Atuação'] },
  { name: 'Charlatão', skills: ['Enganação', 'Prestidigitação'] },
  { name: 'Criminoso', skills: ['Enganação', 'Furtividade'] },
  { name: 'Eremita', skills: ['Medicina', 'Religião'] },
  { name: 'Forasteiro', skills: ['Atletismo', 'Sobrevivência'] },
  { name: 'Herói do Povo', skills: ['Lidar com Animais', 'Sobrevivência'] },
  { name: 'Marinheiro', skills: ['Atletismo', 'Percepção'] },
  { name: 'Nobre', skills: ['História', 'Persuasão'] },
  { name: 'Sábio', skills: ['Arcanismo', 'História'] },
  { name: 'Soldado', skills: ['Atletismo', 'Intimidação'] },
];

export const getBackgroundPreset = (name: string): BackgroundPreset | undefined =>
  BACKGROUND_PRESETS.find((b) => b.name.toLowerCase() === name.trim().toLowerCase());

export const ALIGNMENTS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau',
];

// ---------------------------------------------------------------------------------------------
// Atributos
// ---------------------------------------------------------------------------------------------

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export const pointBuyCost = (score: number): number => POINT_BUY_COST[score] ?? Infinity;

export const pointBuySpent = (scores: Record<AbilityKey, number>): number =>
  ABILITIES.reduce((sum, a) => sum + pointBuyCost(scores[a.key]), 0);

export const pointBuyRemaining = (scores: Record<AbilityKey, number>): number =>
  POINT_BUY_BUDGET - pointBuySpent(scores);

/** Pode somar +1 ao atributo sem estourar o orçamento nem passar de 15? */
export function canIncreasePointBuy(scores: Record<AbilityKey, number>, key: AbilityKey): boolean {
  const cur = scores[key];
  if (cur >= POINT_BUY_MAX) return false;
  return pointBuyCost(cur + 1) - pointBuyCost(cur) <= pointBuyRemaining(scores);
}

/** Distribui o conjunto padrão (15,14,13,12,10,8) segundo a prioridade da classe. */
export function suggestStandardArray(preset: ClassPreset): Record<AbilityKey, number> {
  const out = {} as Record<AbilityKey, number>;
  preset.priority.forEach((key, i) => {
    out[key] = STANDARD_ARRAY[i];
  });
  return out;
}

/** Aplica o bônus racial (e ajustes) ao valor base, limitado a 1–30. */
export const finalScore = (base: number, bonus: number): number => Math.max(1, Math.min(30, base + bonus));

// ---------------------------------------------------------------------------------------------
// Cálculos iniciais
// ---------------------------------------------------------------------------------------------

/** PV: nível 1 = dado máximo + CON; níveis seguintes = média do dado (arredondada para cima) + CON. Mín. 1 por nível. */
export function calcStartingHp(hitDie: number, level: number, conScore: number): number {
  const conMod = getMod(conScore);
  const lvl = Math.max(1, Math.min(20, Math.floor(level) || 1));
  const first = Math.max(1, hitDie + conMod);
  const perLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  return first + (lvl - 1) * perLevel;
}

/** CA sem armadura (a armadura equipada soma depois, na Mochila). */
export function calcBaseAc(preset: ClassPreset | undefined, scores: Record<AbilityKey, number>): number {
  const dex = getMod(scores.dex);
  const extra = preset?.unarmored ? getMod(scores[preset.unarmored]) : 0;
  return 10 + dex + extra;
}

export function calcSpellSlots(className: string, level: number): { level: number; total: number }[] {
  const calc = parseClassesAndCalculateSlots(className, level);
  const result: { level: number; total: number }[] = [];
  for (let l = 1; l <= 9; l++) {
    const std = calc.standard[l] || 0;
    const pact = calc.warlock && calc.warlock.level === l ? calc.warlock.count : 0;
    if (std + pact > 0) result.push({ level: l, total: std + pact });
  }
  return result;
}

export interface ClassResources {
  kiPoints: number;
  maxKiPoints: number;
  sorceryPoints: number;
  maxSorceryPoints: number;
  superiorityDice: number;
  maxSuperiorityDice: number;
  superiorityDieType: string;
}

/** Recursos de classe iniciais: ki (Monge), pontos de feitiçaria (Feiticeiro) e dados de superioridade (Mestre de Batalha). */
export function calcClassResources(className: string, archetype: string, level: number): ClassResources {
  const cls = className.trim().toLowerCase();
  const lvl = Math.max(1, Math.min(20, Math.floor(level) || 1));
  const ki = cls === 'monge' && lvl >= 2 ? lvl : 0;
  const sorcery = cls === 'feiticeiro' && lvl >= 2 ? lvl : 0;
  const sup = getMaxSuperiorityDice({
    class: className, archetype, level: lvl, maxHp: 1, currentHp: 1, hitDiceTotal: 1, hitDiceSpent: 0,
  });
  return {
    kiPoints: ki,
    maxKiPoints: ki,
    sorceryPoints: sorcery,
    maxSorceryPoints: sorcery,
    superiorityDice: sup,
    maxSuperiorityDice: sup,
    superiorityDieType: lvl >= 18 ? 'd12' : lvl >= 10 ? 'd10' : 'd8',
  };
}
