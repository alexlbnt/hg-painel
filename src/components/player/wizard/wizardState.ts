import { CharacterData } from '@/lib/mockData';
import { getMod, getProfBonus } from '@/utils/dnd5e';
import {
  ABILITIES,
  AbilityKey,
  calcBaseAc,
  calcClassResources,
  calcSpellSlots,
  calcStartingHp,
  ClassPreset,
  finalScore,
  getBackgroundPreset,
  getClassPreset,
  getRacePreset,
  pointBuyRemaining,
  STANDARD_ARRAY,
  suggestStandardArray,
} from '@/utils/classPresets';

export type ScoreMethod = 'standard' | 'pointbuy' | 'manual';

export const STEP_TITLES = ['Identidade', 'Classe', 'Atributos', 'Perícias', 'Revisão'] as const;
export const LAST_STEP = STEP_TITLES.length - 1;

export interface WizardState {
  name: string;
  playerName: string;
  assignedUsername: string;
  roomId: string;
  race: string;
  background: string;
  alignment: string;
  deity: string;
  className: string;
  archetype: string;
  level: number;
  method: ScoreMethod;
  /** Valor base de cada atributo (antes de bônus). 0 = ainda não atribuído (conjunto padrão). */
  base: Record<AbilityKey, number>;
  /** Bônus racial/ajustes somados ao valor base */
  bonus: Record<AbilityKey, number>;
  /** Perícias escolhidas da lista da classe */
  skills: string[];
  /** Sobrescritas opcionais na revisão */
  hpOverride: number | null;
  acOverride: number | null;
  themeColor: string;
}

const zeroed = (): Record<AbilityKey, number> => ({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
const filled = (n: number): Record<AbilityKey, number> => ({ str: n, dex: n, con: n, int: n, wis: n, cha: n });

export function bonusFromRace(race: string): Record<AbilityKey, number> {
  const preset = getRacePreset(race);
  return { ...zeroed(), ...(preset?.bonuses || {}) };
}

export function createInitialState(opts: { playerName?: string; assignedUsername?: string; roomId?: string }): WizardState {
  const preset = getClassPreset('Guerreiro')!;
  return {
    name: '',
    playerName: opts.playerName || '',
    assignedUsername: opts.assignedUsername || '',
    roomId: opts.roomId || '',
    race: 'Humano',
    background: 'Herói do Povo',
    alignment: 'Neutro',
    deity: 'Nenhum',
    className: preset.name,
    archetype: '',
    level: 1,
    method: 'standard',
    base: suggestStandardArray(preset),
    bonus: bonusFromRace('Humano'),
    skills: [],
    hpOverride: null,
    acOverride: null,
    themeColor: '#C5A059',
  };
}

export const THEME_COLORS = ['#C5A059', '#D63939', '#2E6DD1', '#27AE60', '#8E5AB8', '#D9822B', '#3AA6A0', '#C2527A'];

export function finalScores(state: WizardState): Record<AbilityKey, number> {
  const out = {} as Record<AbilityKey, number>;
  for (const a of ABILITIES) {
    const base = state.base[a.key] || (state.method === 'standard' ? 8 : 10);
    out[a.key] = finalScore(base, state.bonus[a.key] || 0);
  }
  return out;
}

/** Perícias concedidas pelo antecedente */
export function backgroundSkills(state: WizardState): string[] {
  return getBackgroundPreset(state.background)?.skills.slice() || [];
}

/** Opções que a classe oferece, sem repetir as que o antecedente já concede. */
export function selectableClassSkills(preset: ClassPreset | undefined, granted: string[], all: string[]): string[] {
  if (!preset) return [];
  const pool = preset.skillOptions === 'ALL' ? all : preset.skillOptions;
  return pool.filter((s) => !granted.includes(s));
}

/** Ao trocar de método, converte os valores base para algo válido naquele método. */
export function switchMethod(state: WizardState, method: ScoreMethod): WizardState {
  const preset = getClassPreset(state.className);
  let base: Record<AbilityKey, number>;
  if (method === 'standard') base = preset ? suggestStandardArray(preset) : zeroed();
  else if (method === 'pointbuy') base = preset ? suggestStandardArray(preset) : filled(8);
  else base = filled(10);
  return { ...state, method, base };
}

/** Ao trocar de classe: reaplica a distribuição sugerida (se o método for guiado) e limpa perícias. */
export function applyClass(state: WizardState, className: string): WizardState {
  const preset = getClassPreset(className);
  const next: WizardState = { ...state, className, archetype: '', skills: [] };
  if (preset && state.method !== 'manual') next.base = suggestStandardArray(preset);
  return next;
}

export function applyRace(state: WizardState, race: string): WizardState {
  return { ...state, race, bonus: bonusFromRace(race) };
}

export interface Validation {
  /** Impede avançar */
  errors: string[];
  /** Avisos que não bloqueiam */
  warnings: string[];
}

export function validateStep(step: number, state: WizardState): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const preset = getClassPreset(state.className);

  if (step === 0) {
    if (state.name.trim().length < 2) errors.push('Dê um nome ao personagem (mín. 2 letras).');
  }
  if (step === 1) {
    if (!state.className.trim()) errors.push('Escolha uma classe.');
  }
  if (step === 2) {
    if (state.method === 'standard') {
      const missing = ABILITIES.filter((a) => !state.base[a.key]).length;
      if (missing > 0) errors.push(`Atribua um valor a todos os atributos (faltam ${missing}).`);
    }
    if (state.method === 'pointbuy') {
      const left = pointBuyRemaining(state.base);
      if (left < 0) errors.push('Você passou do orçamento de 27 pontos.');
      else if (left > 0) warnings.push(`Ainda restam ${left} ponto(s) para distribuir.`);
    }
  }
  if (step === 3 && preset) {
    const need = preset.skillCount;
    if (state.skills.length < need) warnings.push(`Faltam ${need - state.skills.length} perícia(s) da classe. Você pode ajustar depois na ficha.`);
  }
  return { errors, warnings };
}

export function computeSummary(state: WizardState) {
  const preset = getClassPreset(state.className);
  const scores = finalScores(state);
  const hitDie = preset?.hitDie ?? 8;
  const autoHp = calcStartingHp(hitDie, state.level, scores.con);
  const autoAc = calcBaseAc(preset, scores);
  const race = getRacePreset(state.race);
  return {
    preset,
    scores,
    hitDie,
    hp: state.hpOverride ?? autoHp,
    autoHp,
    ac: state.acOverride ?? autoAc,
    autoAc,
    initiative: getMod(scores.dex),
    speed: race?.speed || '9m',
    profBonus: getProfBonus(state.level),
    slots: calcSpellSlots(state.className, state.level),
    resources: calcClassResources(state.className, state.archetype, state.level),
  };
}

/** Monta os dados enviados à API a partir do estado do assistente. */
export function buildCharacterPayload(
  state: WizardState,
  ctx: { isElevated: boolean; userName?: string; username?: string }
): Partial<CharacterData> {
  const s = computeSummary(state);
  const saves = new Set<AbilityKey>(s.preset?.saves || []);
  const skills = Array.from(new Set([...backgroundSkills(state), ...state.skills]));

  return {
    name: state.name.trim(),
    playerName: ctx.isElevated ? state.playerName.trim() || 'Jogador' : ctx.userName || state.playerName || 'Jogador',
    username: ctx.isElevated ? state.assignedUsername.trim().toLowerCase() : ctx.username || '',
    roomId: state.roomId || null,
    race: state.race.trim() || 'Humano',
    class: state.className.trim(),
    archetype: state.archetype.trim(),
    level: state.level,
    alignment: state.alignment,
    background: state.background.trim() || 'Herói do Povo',
    deity: state.deity.trim() || 'Nenhum',
    themeColor: state.themeColor,
    maxHp: s.hp,
    currentHp: s.hp,
    armorClass: s.ac,
    initiativeBonus: s.initiative,
    speed: s.speed,
    hitDiceType: `1d${s.hitDie}`,
    hitDiceTotal: state.level,
    str: s.scores.str,
    dex: s.scores.dex,
    con: s.scores.con,
    int: s.scores.int,
    wis: s.scores.wis,
    cha: s.scores.cha,
    strProf: saves.has('str'),
    dexProf: saves.has('dex'),
    conProf: saves.has('con'),
    intProf: saves.has('int'),
    wisProf: saves.has('wis'),
    chaProf: saves.has('cha'),
    proficientSkills: skills.join(','),
    spellSlots: s.slots.map((sl) => ({ id: '', level: sl.level, total: sl.total, used: 0 })),
    // Ficha começa limpa (sem itens/habilidades de exemplo): o jogador monta na Mochila e em Habilidades
    spells: [],
    abilities: [],
    items: [],
    ...s.resources,
  };
}

export { STANDARD_ARRAY };
