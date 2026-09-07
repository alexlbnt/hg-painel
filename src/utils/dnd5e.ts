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

/**
 * Nomes de magias e truques utilitários, de cura, suporte, buff e defesa (NÃO ofensivos).
 */
const NON_OFFENSIVE_SPELL_NAMES = new Set([
  // Truques utilitários (Nível 0)
  'luz', 'light',
  'prestidigitação', 'prestidigitacao', 'prestidigitation',
  'taumaturgia', 'thaumaturgy',
  'mãos mágicas', 'maos magicas', 'mage hand',
  'orientação', 'orientacao', 'guidance',
  'ilusão menor', 'ilusao menor', 'minor illusion',
  'consertar', 'mending',
  'mensagem', 'message',
  'amizade', 'friends',
  'dança das luzes', 'danca das luzes', 'globos de luz', 'dancing lights',
  'resistência', 'resistencia', 'resistance',
  'proteção contra lâminas', 'protecao contra laminas', 'blade ward',
  'golpe certeiro', 'true strike',
  'moldar terra', 'mold earth',
  'moldar água', 'moldar agua', 'shape water',
  'controlar chamas', 'control flames',
  'rajada de vento', 'gust',

  // Magias de Cura e Suporte
  'curar ferimentos', 'cure wounds',
  'palavra curativa', 'healing word',
  'palavra de cura',
  'oração de cura', 'oracao de cura', 'prayer of healing',
  'restauração menor', 'restauracao menor', 'lesser restoration',
  'restauração maior', 'restauracao maior', 'greater restoration',
  'curar ferimentos em massa', 'mass cure wounds',
  'palavra curativa em massa', 'mass healing word',
  'cura completa', 'heal',
  'auxílio', 'auxilio', 'aid',
  'bom fruto', 'goodberry',
  'revivificar', 'revivify',
  'reencarnação', 'reincarnate',
  'regeneração', 'regenerate',
  'ressurreição', 'resurrection',

  // Magias de Defesa e Buffs
  'escudo', 'escudo arcano', 'shield',
  'escudo da fé', 'escudo da fe', 'shield of faith',
  'armadura arcana', 'mage armor',
  'bênção', 'bencao', 'bless',
  'passo nebuloso', 'misty step',
  'queda suave', 'feather fall',
  'salto', 'jump',
  'passos longos', 'longstrider',
  'santuário', 'santuario', 'sanctuary',
  'velocidade', 'haste', 'aceleração', 'aceleracao',
  'invisibilidade', 'invisibility',
  'invisibilidade maior', 'greater invisibility',
  'reflexos', 'mirror image',
  'pele de árvore', 'barkskin',
  'pele de pedra', 'stoneskin',
  'vínculo de proteção', 'warding bond',
  'proteção contra veneno', 'protection from poison',
  'proteção contra o bem e mal', 'protection from evil and good',
  'proteção contra energia', 'protection from energy',
  'falar com animais', 'speak with animals',
  'falar com mortos', 'speak with dead',
  'falar com plantas', 'speak with plants',

  // Magias de Exploração, Controle e Informação
  'detectar magia', 'detect magic',
  'detectar pensamentos', 'detect thoughts',
  'detectar o bem e mal', 'detect evil and good',
  'identificar', 'identify',
  'compreender idiomas', 'comprehend languages',
  'encontrar familiar', 'find familiar',
  'alarme', 'alarm',
  'montaria mágica', 'montaria magica', 'find steed',
  'teia', 'web',
  'imobilizar pessoa', 'hold person',
  'imobilizar monstro', 'hold monster',
  'padrão hipnótico', 'padrao hipnotico', 'hypnotic pattern',
  'sugestão', 'sugestao', 'suggestion',
  'sugestão em massa', 'mass suggestion',
  'contra-feitiço', 'contra-feitico', 'contrafeitiço', 'contrafeitico', 'counterspell',
  'dissipar magia', 'dispel magic',
  'graxa', 'grease',
  'comando', 'command',
  "tasha's hideous laughter", 'riso histérico de tasha', 'riso histerico de tasha', 'hideous laughter',
  'sono', 'sleep',
  'escuridão', 'escuridao', 'darkness',
  'silêncio', 'silencio', 'silence',
  'névoa obscurecente', 'nevoa obscurecente', 'fog cloud',
  'levitação', 'levitacao', 'levitate',
  'voo', 'fly',
  'respirar na água', 'water breathing',
  'caminhar na água', 'water walk',
  'zona da verdade', 'zone of truth',
  'cabana de leomund', 'tiny hut', 'tiny hut leomond', "leomund's tiny hut",
  'portal dimensional', 'dimension door',
]);

/**
 * Nomes de magias e truques reconhecidamente ofensivos (jogada de ataque ou dano direto).
 */
const OFFENSIVE_SPELL_NAMES = new Set([
  // Truques ofensivos (Nível 0)
  'raio de fogo', 'fire bolt',
  'rajada mística', 'rajada mistica', 'eldritch blast',
  'raio de gelo', 'ray of frost',
  'toque arrepiante', 'chill touch',
  'toque chocante', 'shocking grasp',
  'chama sagrada', 'sacred flame',
  'tocar os mortos', 'toll the dead',
  'rajada venenosa', 'poison spray',
  'espirro ácido', 'espirro acido', 'acid splash',
  'chicote de espinhos', 'thorn whip',
  'zombaria viciosa', 'vicious mockery',
  'fúria primordial', 'furia primordial', 'primal savagery',
  'rajada de espadas', 'sword burst',
  'estrondo trovejante', 'thunderclap',
  'lâmina da chama verde', 'lamina da chama verde', 'green-flame blade',
  'lâmina estrondosa', 'lamina estrondosa', 'booming blade',
  'infestação', 'infestacao', 'infestation',
  'palavra radiante', 'word of radiance',
  'bordoada', 'shillelagh',

  // Magias com dano direto
  'mísseis mágicos', 'misseis magicos', 'missil magico', 'magic missile',
  'bola de fogo', 'fireball',
  'raio ardente', 'scorching ray',
  'onda trovejante', 'thunderwave',
  'mãos flamejantes', 'maos flamejantes', 'burning hands',
  'raio de bruxa', 'witch bolt',
  'raio guiado', 'guiding bolt',
  'infligir ferimentos', 'inflict wounds',
  'despedaçar', 'despedacar', 'shatter',
  'dardo do caos', 'chaos bolt',
  'flecha ácida', 'flecha acida', 'acid arrow', "melf's acid arrow",
  'tempestade de gelo', 'ice storm',
  'cone de frio', 'cone of cold',
  'relâmpago', 'relampago', 'lightning bolt',
  'coluna de chamas', 'flame strike',
  'praga', 'blight',
  'destruição divina', 'destruicao divina', 'divine smite',
  'favor divino', 'divine favor',
  'destruição colérica', 'destruicao colerica', 'wrathful smite',
  'destruição trovejante', 'destruicao trovejante', 'thunderous smite',
  'destruição estrondosa', 'destruicao estrondosa',
  'destruição estigiana', 'branding smite',
  'destruição cega', 'blinding smite',
  'destruição banidora', 'banishing smite',
  'destruição cambiante', 'staggering smite',
  'desintegrar', 'disintegrate',
  'dedo da morte', 'finger of death',
  'toque vampírico', 'toque vampirico', 'vampiric touch',
  'esfera flamejante', 'flaming sphere',
  'tempestade de meteoros', 'meteor swarm',
  'tempestade da vingança', 'storm of vengeance',
  'erupção de terra', 'erupcao de terra', 'erupting earth',
  'flecha relâmpago', 'lightning arrow',
  'flecha de fogo', 'flame arrows',
]);

/**
 * Avalia se uma magia/truque é de fato ofensivo (combate/ataque) no D&D 5e.
 * Exclui truques utilitários (Luz, Prestidigitação), magias de cura (Curar Ferimentos),
 * buffs, defesas e magias de exploração.
 */
export function isCombatOffensiveSpell(spell: {
  name: string;
  description?: string;
  level?: number;
}): boolean {
  const nameNorm = (spell.name || '').trim().toLowerCase();

  // 1. Verificação na lista explícita de magias NÃO ofensivas
  for (const nonOff of NON_OFFENSIVE_SPELL_NAMES) {
    if (
      nameNorm === nonOff ||
      nameNorm.startsWith(nonOff + ' ') ||
      nameNorm.startsWith(nonOff + '(')
    ) {
      return false;
    }
  }

  // 2. Verificação na lista explícita de magias OFENSIVAS
  for (const off of OFFENSIVE_SPELL_NAMES) {
    if (
      nameNorm === off ||
      nameNorm.startsWith(off + ' ') ||
      nameNorm.startsWith(off + '(')
    ) {
      return true;
    }
  }

  const descNorm = (spell.description || '').toLowerCase();

  // 3. Checagem de palavras-chave de cura/suporte
  if (
    nameNorm.includes('curar') ||
    nameNorm.includes('cura') ||
    nameNorm.includes('heal') ||
    descNorm.includes('pontos de vida recuperados') ||
    descNorm.includes('recupera pontos de vida') ||
    descNorm.includes('regain hit points') ||
    descNorm.includes('regains hit points') ||
    (descNorm.includes('de cura') && !descNorm.includes('de dano'))
  ) {
    return false;
  }

  // 4. Detecção algorítmica de fórmulas de dano / ataque direto
  const hasDamageDice = /\b\d+d\d+\b/.test(descNorm);
  const hasDamageKeyword =
    descNorm.includes('dano') ||
    descNorm.includes('damage') ||
    descNorm.includes('ataque mágico') ||
    descNorm.includes('spell attack') ||
    descNorm.includes('ataque a distância') ||
    descNorm.includes('ataque corpo a corpo');

  if (hasDamageDice && hasDamageKeyword) {
    return true;
  }

  return false;
}

/**
 * Tenta extrair a fórmula e o tipo de dano da descrição da magia
 * (ex: "1d10 ígneo", "2d6 fogo", "8d6 fogo", "2d12 elétrico")
 */
export function getSpellDamageFormula(spell: {
  name: string;
  description?: string;
}): string | null {
  const desc = spell.description || '';
  if (!desc) return null;

  // 1. Formato "Dano: 2d12 elétrico" ou "Dano: 1d10 de fogo"
  const labelMatch = desc.match(/(?:dano|damage)\s*:\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*([a-zá-úA-ZÁ-Ú]+)?/i);
  if (labelMatch) {
    const dice = labelMatch[1].trim();
    const type = labelMatch[2] ? labelMatch[2].trim() : '';
    return type ? `${dice} ${type}` : dice;
  }

  // 2. Formato "2d6 de dano de fogo" ou "1d8 de dano gélido" ou "8d6 fire damage"
  const ptMatch = desc.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(?:de\s+)?dano\s*(?:de\s+)?([a-zá-úA-ZÁ-Ú]+)?/i);
  if (ptMatch) {
    const dice = ptMatch[1].trim();
    const type = ptMatch[2] ? ptMatch[2].trim() : '';
    return type ? `${dice} ${type}` : dice;
  }

  const enMatch = desc.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+([a-zA-Z]+)\s+damage/i);
  if (enMatch) {
    const dice = enMatch[1].trim();
    const type = enMatch[2].trim();
    return `${dice} ${type}`;
  }

  return null;
}

