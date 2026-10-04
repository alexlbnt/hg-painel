export type CompanionBondType =
  | 'Companheiro Animal'
  | 'Familiar'
  | 'Montaria'
  | 'Mascote';

export type CompanionSize =
  | 'Miúdo'
  | 'Pequeno'
  | 'Médio'
  | 'Grande'
  | 'Enorme'
  | 'Imenso';

export interface CompanionAttack {
  id: string;
  name: string;
  attackBonus: string; // Ex: "+5" ou "+4"
  damage: string; // Ex: "1d6+3 perfurante"
  type?: string; // Ex: "Corpo a corpo (alcance 1,5m)"
  description?: string;
}

export interface CompanionTrait {
  id: string;
  name: string;
  description: string;
}

export interface CompanionData {
  id: string;
  name: string;
  species: string; // Ex: "Lobo Gigante", "Coruja", "Grifo"
  bondType: CompanionBondType;
  size: CompanionSize;
  avatarUrl: string;

  // Status de Combate
  armorClass: number;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  speed: string; // Ex: "Terrestre 12m, Voo 18m"
  initiativeBonus: number;
  proficiencyBonus: number;

  // Atributos Base D&D 5e
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;

  // Perícias, Sentidos e Condições
  skills: string; // Ex: "Furtividade +4, Percepção +5"
  senses: string; // Ex: "Visão no Escuro 18m, Percepção Passiva 13, Faro Aguçado"
  conditions: string; // Ex: "Envenenado, Caído"

  // Ações e Habilidades Especiais
  attacks: CompanionAttack[];
  traits: CompanionTrait[];

  // Inventário e Equipamento
  inventory: string; // Ex: "Alforjes com 20kg de rações, Sela Militar, Armadura Barding (Couro Batido CA 12)"

  // Notas e Comportamento
  notes: string; // Personalidade, truques/comandos conhecidos, histórico
}

export const BOND_TYPES: CompanionBondType[] = [
  'Companheiro Animal',
  'Familiar',
  'Montaria',
  'Mascote',
];

export const SIZES: CompanionSize[] = [
  'Miúdo',
  'Pequeno',
  'Médio',
  'Grande',
  'Enorme',
  'Imenso',
];

export function getCompanionMod(score: number): number {
  return Math.floor(((score || 10) - 10) / 2);
}

export function formatCompanionMod(score: number): string {
  const mod = getCompanionMod(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calcPassivePerception(
  wisScore: number,
  profBonus: number = 2,
  isTrained: boolean = false
): number {
  const mod = getCompanionMod(wisScore);
  return 10 + mod + (isTrained ? profBonus : 0);
}

export function calcCarryCapacityKg(
  strScore: number,
  size: CompanionSize
): { maxKg: number; pushDragKg: number } {
  const multiplier =
    size === 'Miúdo'
      ? 0.5
      : size === 'Pequeno' || size === 'Médio'
      ? 1
      : size === 'Grande'
      ? 2
      : size === 'Enorme'
      ? 4
      : 8;

  // D&D 5e: Força * 15 libras (~7.5 kg) * multiplicador de tamanho
  const baseKg = Math.round((strScore || 10) * 7.5 * multiplier);
  return {
    maxKg: baseKg,
    pushDragKg: baseKg * 2,
  };
}

export function createEmptyCompanion(): CompanionData {
  return {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: '',
    species: '',
    bondType: 'Companheiro Animal',
    size: 'Médio',
    avatarUrl: '',
    armorClass: 10,
    currentHp: 10,
    maxHp: 10,
    tempHp: 0,
    speed: '',
    initiativeBonus: 0,
    proficiencyBonus: 2,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    skills: '',
    senses: '',
    conditions: '',
    attacks: [],
    traits: [],
    inventory: '',
    notes: '',
  };
}

/**
 * Converte a string salva no banco em uma lista de criaturas aliadas.
 * Suporta array JSON ou objeto único para retrocompatibilidade total.
 */
export function parseCompanionList(raw?: string | null): CompanionData[] {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return [];
  }

  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => sanitizeCompanion(item));
    }
    if (typeof parsed === 'object' && parsed !== null && ('name' in parsed || 'species' in parsed)) {
      return [sanitizeCompanion(parsed)];
    }
  } catch {
    // Falha silenciosa em caso de texto não estruturado
  }

  return [];
}

/**
 * Garante que todos os campos obrigatórios estejam presentes com valores válidos.
 */
function sanitizeCompanion(raw: any): CompanionData {
  return {
    id: String(raw.id || `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`),
    name: raw.name !== undefined && raw.name !== null ? String(raw.name) : '',
    species: raw.species !== undefined && raw.species !== null ? String(raw.species) : '',
    bondType: (BOND_TYPES.includes(raw.bondType) ? raw.bondType : 'Companheiro Animal') as CompanionBondType,
    size: (SIZES.includes(raw.size) ? raw.size : 'Médio') as CompanionSize,
    avatarUrl: String(raw.avatarUrl || ''),
    armorClass: Number(raw.armorClass) || 10,
    currentHp: Number(raw.currentHp) ?? 10,
    maxHp: Math.max(1, Number(raw.maxHp) || 10),
    tempHp: Math.max(0, Number(raw.tempHp) || 0),
    speed: String(raw.speed ?? ''),
    initiativeBonus: Number(raw.initiativeBonus) || 0,
    proficiencyBonus: Math.max(0, Number(raw.proficiencyBonus) || 2),
    str: Math.max(1, Math.min(30, Number(raw.str) || 10)),
    dex: Math.max(1, Math.min(30, Number(raw.dex) || 10)),
    con: Math.max(1, Math.min(30, Number(raw.con) || 10)),
    int: Math.max(1, Math.min(30, Number(raw.int) || 10)),
    wis: Math.max(1, Math.min(30, Number(raw.wis) || 10)),
    cha: Math.max(1, Math.min(30, Number(raw.cha) || 10)),
    skills: String(raw.skills || ''),
    senses: String(raw.senses || ''),
    conditions: String(raw.conditions || ''),
    attacks: Array.isArray(raw.attacks)
      ? raw.attacks.map((a: any) => ({
          id: String(a.id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`),
          name: String(a.name || 'Ataque'),
          attackBonus: String(a.attackBonus || '+0'),
          damage: String(a.damage || '1d4'),
          type: String(a.type || ''),
          description: String(a.description || ''),
        }))
      : [],
    traits: Array.isArray(raw.traits)
      ? raw.traits.map((t: any) => ({
          id: String(t.id || `trt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`),
          name: String(t.name || 'Habilidade'),
          description: String(t.description || ''),
        }))
      : [],
    inventory: String(raw.inventory || ''),
    notes: String(raw.notes || ''),
  };
}

export function serializeCompanionList(list: CompanionData[]): string {
  return JSON.stringify(list);
}
