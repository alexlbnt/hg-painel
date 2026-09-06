import { CharacterData, ItemData } from '@/lib/mockData';

/**
 * Retorna o modificador de um valor de atributo no D&D 5e: floor((score - 10) / 2)
 */
export function getMod(score: number): number {
  const s = Number(score) || 10;
  return Math.floor((s - 10) / 2);
}

/**
 * Formata um modificador como string (ex: +3, -1, +0)
 */
export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Calcula o bônus de proficiência padrão de D&D 5e por nível:
 * Nível 1-4: +2 | 5-8: +3 | 9-12: +4 | 13-16: +5 | 17-20: +6
 */
export function getProfBonus(level: number): number {
  const lvl = Math.max(1, Math.min(20, Number(level) || 1));
  return Math.floor((lvl - 1) / 4) + 2;
}

/**
 * Lista oficial das 18 perícias do D&D 5e com seus atributos correspondentes
 */
export interface SkillConfig {
  name: string;
  attr: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  label: string;
}

export const SKILLS_LIST: SkillConfig[] = [
  { name: 'Acrobacia', attr: 'dex', label: 'DES' },
  { name: 'Arcanismo', attr: 'int', label: 'INT' },
  { name: 'Atletismo', attr: 'str', label: 'FOR' },
  { name: 'Atuação', attr: 'cha', label: 'CAR' },
  { name: 'Enganação', attr: 'cha', label: 'CAR' },
  { name: 'Furtividade', attr: 'dex', label: 'DES' },
  { name: 'História', attr: 'int', label: 'INT' },
  { name: 'Intimidação', attr: 'cha', label: 'CAR' },
  { name: 'Intuição', attr: 'wis', label: 'SAB' },
  { name: 'Investigação', attr: 'int', label: 'INT' },
  { name: 'Lidar com Animais', attr: 'wis', label: 'SAB' },
  { name: 'Medicina', attr: 'wis', label: 'SAB' },
  { name: 'Natureza', attr: 'int', label: 'INT' },
  { name: 'Percepção', attr: 'wis', label: 'SAB' },
  { name: 'Persuasão', attr: 'cha', label: 'CAR' },
  { name: 'Prestidigitação', attr: 'dex', label: 'DES' },
  { name: 'Religião', attr: 'int', label: 'INT' },
  { name: 'Sobrevivência', attr: 'wis', label: 'SAB' },
];

/**
 * Condições oficiais do D&D 5e com resumo de regras e cor indicativa
 */
export interface ConditionDefinition {
  name: string;
  color: string;
  badgeBg: string;
  shortDesc: string;
  fullDesc: string;
}

export const STANDARD_CONDITIONS: Record<string, ConditionDefinition> = {
  Caído: {
    name: 'Caído',
    color: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.18)',
    shortDesc: 'Rasteja; desvantagem nos ataques; ataques corpo a corpo têm vantagem.',
    fullDesc: 'A única opção de movimento é rastejar (custa o dobro). Tem desvantagem nas jogadas de ataque. Ataques corpo a corpo a até 1,5m têm vantagem contra o alvo; ataques à distância têm desvantagem.',
  },
  Envenenado: {
    name: 'Envenenado',
    color: '#16A34A',
    badgeBg: 'rgba(22, 163, 74, 0.18)',
    shortDesc: 'Desvantagem em jogadas de ataque e testes de atributo.',
    fullDesc: 'Uma criatura envenenada tem desvantagem em jogadas de ataque e em testes de atributo.',
  },
  Agarrado: {
    name: 'Agarrado',
    color: '#CA8A04',
    badgeBg: 'rgba(202, 138, 4, 0.18)',
    shortDesc: 'Deslocamento se torna 0 e não recebe bônus.',
    fullDesc: 'O deslocamento da criatura se torna 0 e não pode aumentar além disso. A condição cessa se quem a agarrou for incapacitado ou empurrado.',
  },
  Assustado: {
    name: 'Assustado',
    color: '#9333EA',
    badgeBg: 'rgba(147, 51, 234, 0.18)',
    shortDesc: 'Desvantagem em testes e ataques enquanto a fonte estiver no campo de visão.',
    fullDesc: 'Tem desvantagem em testes de atributo e ataques enquanto a fonte do medo estiver visível. Não pode se mover voluntariamente para mais perto da fonte.',
  },
  Cego: {
    name: 'Cego',
    color: '#DC2626',
    badgeBg: 'rgba(220, 38, 38, 0.18)',
    shortDesc: 'Falha automática na visão; ataques contra têm vantagem, seus têm desvantagem.',
    fullDesc: 'Não pode ver e falha automaticamente em testes que exigem visão. Ataques contra o alvo têm vantagem, e os ataques do alvo têm desvantagem.',
  },
  Enfeitiçado: {
    name: 'Enfeitiçado',
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.18)',
    shortDesc: 'Não pode ferir o encantador; encantador tem vantagem social.',
    fullDesc: 'Não pode atacar o encantador ou visá-lo com habilidades nocivas. O encantador tem vantagem em testes sociais para interagir com o alvo.',
  },
  Incapacitado: {
    name: 'Incapacitado',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.18)',
    shortDesc: 'Não pode realizar ações nem reações.',
    fullDesc: 'Uma criatura incapacitada não pode realizar ações nem reações.',
  },
  Invisível: {
    name: 'Invisível',
    color: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.18)',
    shortDesc: 'Ataques contra têm desvantagem; seus ataques têm vantagem.',
    fullDesc: 'Impossível de ser vista sem auxílio de magia. Para fins de furtividade, é considerada sob camuflagem pesada. Ataques contra o alvo têm desvantagem e seus ataques têm vantagem.',
  },
  Paralisado: {
    name: 'Paralisado',
    color: '#B91C1C',
    badgeBg: 'rgba(185, 28, 28, 0.25)',
    shortDesc: 'Incapacitado, falha em FOR/DES; acertos a 1,5m são críticos!',
    fullDesc: 'Incapacitado e não pode se mover ou falar. Falha automaticamente em testes de resistência de Força e Destreza. Ataques contra têm vantagem e a até 1,5m são críticos automáticos.',
  },
  Contido: {
    name: 'Contido',
    color: '#EA580C',
    badgeBg: 'rgba(234, 88, 12, 0.18)',
    shortDesc: 'Deslocamento 0; desvantagem em ataques e saves de DES; ataques contra têm vantagem.',
    fullDesc: 'Deslocamento se torna 0. Jogadas de ataque contra têm vantagem, seus ataques têm desvantagem. Tem desvantagem em salvaguardas de Destreza.',
  },
  Atordoado: {
    name: 'Atordoado',
    color: '#EAB308',
    badgeBg: 'rgba(234, 179, 8, 0.18)',
    shortDesc: 'Incapacitado, fala vacilante, falha em saves FOR/DES; ataques contra têm vantagem.',
    fullDesc: 'Incapacitado, não pode se mover e fala apenas com dificuldade. Falha automaticamente em salvaguardas de Força e Destreza. Ataques contra têm vantagem.',
  },
  Inconsciente: {
    name: 'Inconsciente',
    color: '#7F1D1D',
    badgeBg: 'rgba(127, 29, 29, 0.3)',
    shortDesc: 'Incapacitado, derruba itens, fica caído; acertos a até 1,5m são críticos automáticos.',
    fullDesc: 'Incapacitado, não pode se mover nem falar, perde a consciência. Fica caído e derruba o que estiver segurando. Falha em saves de FOR/DES. Acertos a até 1,5m são críticos automáticos.',
  },
  Surdo: {
    name: 'Surdo',
    color: '#64748B',
    badgeBg: 'rgba(100, 116, 139, 0.18)',
    shortDesc: 'Falha automática em testes que exigem audição.',
    fullDesc: 'Não pode ouvir e falha automaticamente em qualquer teste de habilidade que exija a audição.',
  },
  Petrificado: {
    name: 'Petrificado',
    color: '#78716C',
    badgeBg: 'rgba(120, 113, 108, 0.25)',
    shortDesc: 'Transformado em pedra; peso x10; resistência a dano; imune a veneno.',
    fullDesc: 'Transformado em pedra ou substância inanimada sólida. Incapacitado, peso multiplicado por 10. Resistência a todo tipo de dano, imune a veneno e doenças.',
  },
  Exaustão: {
    name: 'Exaustão',
    color: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.2)',
    shortDesc: 'Debuff cumulativo de 1 a 6 (Nível 6 causa morte).',
    fullDesc: 'Nível 1: Desvantagem em testes de atributo. Nível 2: Deslocamento pela metade. Nível 3: Desvantagem em ataques e saves. Nível 4: HP máximo pela metade. Nível 5: Deslocamento 0. Nível 6: Morte.',
  },
};

/**
 * Calcula automaticamente bônus de acerto e fórmula de dano para uma arma equipada
 */
export function calculateWeaponAttack(
  char: CharacterData,
  item: ItemData
): {
  attackBonus: number;
  attackBonusStr: string;
  damageFormula: string;
  modUsed: 'str' | 'dex';
} {
  const prof = getProfBonus(char.level);
  const strMod = getMod(char.str);
  const dexMod = getMod(char.dex);

  const nameLower = (item.name || '').toLowerCase();
  const descLower = (item.description || '').toLowerCase();

  // Verifica se é arma à distância ou acuidade (finesse)
  const isRanged =
    nameLower.includes('arco') ||
    nameLower.includes('besta') ||
    nameLower.includes('dardo') ||
    nameLower.includes('funda') ||
    descLower.includes('distância') ||
    descLower.includes('distancia');

  const isFinesse =
    nameLower.includes('rapieira') ||
    nameLower.includes('adaga') ||
    nameLower.includes('cimitarra') ||
    nameLower.includes('chicote') ||
    descLower.includes('acuidade') ||
    descLower.includes('finesse');

  let chosenMod = strMod;
  let modType: 'str' | 'dex' = 'str';

  if (isRanged) {
    chosenMod = dexMod;
    modType = 'dex';
  } else if (isFinesse) {
    if (dexMod > strMod) {
      chosenMod = dexMod;
      modType = 'dex';
    }
  }

  const attackBonus = chosenMod + prof;
  const attackBonusStr = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;

  let baseDmg = (item.damage || '1d6').trim();
  let dmgType = '';

  // Extrai tipo de dano se houver (ex: "1d8 cortante" -> base: 1d8, tipo: cortante)
  const parts = baseDmg.split(' ');
  let dicePart = parts[0] || '1d6';
  if (parts.length > 1) {
    dmgType = parts.slice(1).join(' ');
  }

  const modSign = chosenMod >= 0 ? `+ ${chosenMod}` : `- ${Math.abs(chosenMod)}`;
  const damageFormula = `${dicePart} ${modSign}${dmgType ? ` ${dmgType}` : ''}`;

  return {
    attackBonus,
    attackBonusStr,
    damageFormula,
    modUsed: modType,
  };
}
