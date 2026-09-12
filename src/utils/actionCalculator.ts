import { CharacterData } from '@/lib/mockData';
import {
  calculateWeaponAttack,
  getMod,
  getProfBonus,
} from './dnd5e';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface PhysicalDieCount {
  die: DieType;
  count: number;
  purpose: string; // ex: "Acerto", "Corte", "Radiante", "Concussão"
  color: string;
}

export interface AttackActionChoice {
  id: string;
  name: string;
  attackBonus: number;
  attackBonusStr: string;
  damageDiceCount: number;
  damageDie: DieType;
  damageType: string;
  damageFixedBonus: number;
  sourceType: 'weapon' | 'unarmed' | 'spell';
}

export interface BonusActionChoice {
  id: 'none' | 'offhand' | 'flurry_of_blows' | 'martial_arts' | 'rage' | 'bonus_spell' | 'custom';
  name: string;
  description: string;
  kiCost?: number;
  attacksGranted?: number; // ex: 2 para Flurry of Blows, 1 para Martial Arts ou Offhand
}

export interface ComboModifiers {
  // Paladino
  hasDivineSmite: boolean;
  smiteSlotLevel: number; // 1 = 2d8, 2 = 3d8, 3 = 4d8, etc.
  smiteUndeadOrFiend: boolean; // +1d8 extra

  // Monge
  hasHandsOfHarm: boolean; // Mãos do Mal: +1d6 + Sabedoria de dano necrótico
  hasStunningStrike: boolean; // Golpe Atordoante

  // Bárbaro
  isRaging: boolean; // +2 dano corpo a corpo com Força

  // Ladino / Caçador / Geral
  hasSneakAttack: boolean; // Ataque Furtivo
  sneakAttackDice: number; // d6
  hasHuntersMarkOrHex: boolean; // +1d6 por golpe

  // Modificadores de Rolagem de Mesa
  hasAdvantage: boolean; // 2d20 por ataque
  hasDisadvantage: boolean; // 2d20 por ataque (pegar pior)
  isCriticalHit: boolean; // Dobra dados de dano
}

export interface ComboPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  apply: (config: ComboConfig, char: CharacterData) => ComboConfig;
}

export interface ComboConfig {
  numMainAttacks: number;
  mainAttackWeaponId: string; // ID da arma ou 'unarmed'
  bonusActionType: BonusActionChoice['id'];
  offhandWeaponId?: string;
  modifiers: ComboModifiers;
}

export interface CalculatedComboResult {
  // Dados Físicos a Rolar na Mesa
  hitDice: {
    totalD20: number;
    advantage: boolean;
    disadvantage: boolean;
    bonuses: { name: string; bonus: string }[];
  };
  damageDicePool: PhysicalDieCount[];
  totalDamageDiceCount: number;
  totalFixedDamageBonus: number;
  damageTypesIncluded: string[];

  // Frase direta para mesa presencial
  physicalTableSummary: {
    hitDiceSentence: string;
    damageDiceSentence: string;
    actionSummarySentence: string;
  };

  // Estimativa de dano (Mín, Médio, Máx se todos acertarem)
  damageEstimate: {
    min: number;
    avg: number;
    max: number;
  };

  // Roteiro Narrativo do Combo
  stepsNarrative: {
    stepNumber: number;
    title: string;
    actionType: 'AÇÃO' | 'AÇÃO BÔNUS' | 'GATILHO / ON-HIT' | 'EFEITO';
    detail: string;
    hitFormula?: string;
    damageFormula?: string;
  }[];
}

/**
 * Analisa uma string de fórmula de dano e extrai quantidade de dados, tipo de dado e bônus fixo
 * Ex: "1d8 + 3 cortante" -> count: 1, die: 'd8', fixed: 3, type: 'Cortante'
 */
export function parseDamageFormula(
  formula: string,
  defaultDie: DieType = 'd6'
): { count: number; die: DieType; fixed: number; type: string } {
  if (!formula) return { count: 1, die: defaultDie, fixed: 0, type: 'Dano' };

  const cleaned = formula.trim().toLowerCase();
  const diceMatch = cleaned.match(/(\d+)\s*d\s*(4|6|8|10|12|20|100)/i);

  let count = 1;
  let die: DieType = defaultDie;

  if (diceMatch) {
    count = parseInt(diceMatch[1], 10) || 1;
    die = `d${diceMatch[2]}` as DieType;
  }

  // Extrai bônus fixo (+ 3, +3, - 1, etc.)
  let fixed = 0;
  const plusMatch = cleaned.match(/([+-])\s*(\d+)/);
  if (plusMatch) {
    const sign = plusMatch[1] === '-' ? -1 : 1;
    fixed = sign * parseInt(plusMatch[2], 10);
  }

  // Extrai tipo de dano (palavras que não são números ou 'd')
  let type = '';
  const knownTypes = [
    'cortante',
    'concussão',
    'concussao',
    'perfurante',
    'fogo',
    'ígneo',
    'igneo',
    'gélido',
    'gelido',
    'frio',
    'elétrico',
    'eletrico',
    'veneno',
    'ácido',
    'acido',
    'radiante',
    'necrótico',
    'necrotico',
    'psíquico',
    'psiquico',
    'trovão',
    'trovao',
    'força',
    'forca',
  ];

  for (const t of knownTypes) {
    if (cleaned.includes(t)) {
      type = t.charAt(0).toUpperCase() + t.slice(1);
      break;
    }
  }

  if (!type) {
    // Se não encontrou tipo específico, pega resto
    const cleanWords = cleaned
      .replace(/\d+d\d+/gi, '')
      .replace(/[+-]\s*\d+/g, '')
      .trim();
    if (cleanWords.length > 2) {
      type = cleanWords.charAt(0).toUpperCase() + cleanWords.slice(1);
    } else {
      type = 'Dano';
    }
  }

  return { count, die, fixed, type };
}

/**
 * Determina quantos ataques básicos a Ação de Ataque concede por padrão na classe e nível
 */
export function getDefaultExtraAttacks(char: CharacterData): number {
  const cls = (char.class || '').toLowerCase();
  const lvl = char.level || 1;

  // Guerreiro Nvl 20 = 4 ataques; Nvl 11 = 3 ataques; Nvl 5 = 2 ataques
  if (cls.includes('guerreiro') || cls.includes('fighter')) {
    if (lvl >= 20) return 4;
    if (lvl >= 11) return 3;
    if (lvl >= 5) return 2;
    return 1;
  }

  // Bárbaro, Paladino, Monge, Guardião (Ranger) Nvl 5+ = 2 ataques
  if (
    cls.includes('bárbaro') ||
    cls.includes('barbaro') ||
    cls.includes('paladino') ||
    cls.includes('paladin') ||
    cls.includes('monge') ||
    cls.includes('monk') ||
    cls.includes('guardião') ||
    cls.includes('guardiao') ||
    cls.includes('patrulheiro') ||
    cls.includes('ranger')
  ) {
    if (lvl >= 5) return 2;
    return 1;
  }

  // Se o personagem possuir habilidade explícita "Ataque Extra"
  const hasExtraAttackAbility = (char.abilities || []).some((a) =>
    a.name.toLowerCase().includes('ataque extra')
  );
  if (hasExtraAttackAbility) return 2;

  return 1;
}

/**
 * Obtém as opções de ataques disponíveis (armas equipadas/na mochila e ataque desarmado do monge)
 */
export function getAvailableAttackChoices(char: CharacterData): AttackActionChoice[] {
  const choices: AttackActionChoice[] = [];
  const prof = getProfBonus(char.level);
  const strMod = getMod(char.str);
  const dexMod = getMod(char.dex);

  // 1. Armas da Ficha
  const weapons = (char.items || []).filter((i) => i.isWeapon);
  for (const w of weapons) {
    const atk = calculateWeaponAttack(char, w);
    const parsed = parseDamageFormula(atk.damageFormula, 'd8');

    choices.push({
      id: w.id,
      name: `${w.name}${w.isEquipped ? ' (Empunhada)' : ''}`,
      attackBonus: atk.attackBonus,
      attackBonusStr: atk.attackBonusStr,
      damageDiceCount: parsed.count,
      damageDie: parsed.die,
      damageType: parsed.type,
      damageFixedBonus: parsed.fixed,
      sourceType: 'weapon',
    });
  }

  // 2. Ataque Desarmado (especial para Monge ou geral)
  const isMonk = (char.class || '').toLowerCase().includes('monge');
  const monkDie: DieType =
    char.level >= 17 ? 'd10' : char.level >= 11 ? 'd8' : char.level >= 5 ? 'd6' : 'd4';
  const bestMod = isMonk ? Math.max(strMod, dexMod) : strMod;
  const unarmedAtkBonus = bestMod + prof;

  choices.push({
    id: 'unarmed',
    name: isMonk ? `Ataque Desarmado / Artes Marciais (1${monkDie})` : 'Ataque Desarmado (1 + FOR)',
    attackBonus: unarmedAtkBonus,
    attackBonusStr: unarmedAtkBonus >= 0 ? `+${unarmedAtkBonus}` : `${unarmedAtkBonus}`,
    damageDiceCount: isMonk ? 1 : 0,
    damageDie: isMonk ? monkDie : 'd4',
    damageType: 'Concussão',
    damageFixedBonus: isMonk ? bestMod : 1 + strMod,
    sourceType: 'unarmed',
  });

  return choices;
}

/**
 * Obtém as opções de Ação Bônus disponíveis de acordo com o personagem
 */
export function getAvailableBonusActions(char: CharacterData): BonusActionChoice[] {
  const choices: BonusActionChoice[] = [
    {
      id: 'none',
      name: 'Nenhuma Ação Bônus',
      description: 'Não utiliza Ação Bônus nesta rodada.',
    },
  ];

  const cls = (char.class || '').toLowerCase();
  const abilities = char.abilities || [];
  const weapons = (char.items || []).filter((i) => i.isWeapon);

  // Combate com Duas Armas (se tiver ao menos 2 armas no inventário)
  if (weapons.length >= 2) {
    choices.push({
      id: 'offhand',
      name: 'Ataque com Segunda Arma (Mão Inábil)',
      description: 'Desfere 1 ataque adicional com arma leve na mão inábil (sem mod de habilidade no dano).',
      attacksGranted: 1,
    });
  }

  // Monge
  if (cls.includes('monge')) {
    choices.push({
      id: 'flurry_of_blows',
      name: 'Rajada de Golpes (1 Ponto de Ki)',
      description: 'Gasta 1 Ki imediatamente após a ação de ataque para desferir 2 Ataques Desarmados.',
      kiCost: 1,
      attacksGranted: 2,
    });
    choices.push({
      id: 'martial_arts',
      name: 'Golpe de Artes Marciais',
      description: 'Desfere 1 Ataque Desarmado adicional com ação bônus após atacar.',
      attacksGranted: 1,
    });
  }

  // Bárbaro
  if (cls.includes('bárbaro') || cls.includes('barbaro') || abilities.some((a) => a.name.toLowerCase().includes('furia'))) {
    choices.push({
      id: 'rage',
      name: 'Entrar em Fúria (Rage)',
      description: 'Ativa Fúria: adiciona +2 de dano em todos os ataques corpo a corpo com Força e concede resistências.',
    });
  }

  // Magias Bônus
  const hasBonusSpells = (char.spells || []).some(
    (s) =>
      s.castingTime?.toLowerCase().includes('bônus') ||
      s.castingTime?.toLowerCase().includes('bonus')
  );
  if (hasBonusSpells) {
    choices.push({
      id: 'bonus_spell',
      name: 'Magia de Ação Bônus (ex: Smite, Passo Nebuloso)',
      description: 'Conjura uma magia que consome apenas Ação Bônus no turno.',
    });
  }

  return choices;
}

/**
 * Cria Presets rápidos e inteligentes específicos para a classe do personagem
 */
export function getRecommendedPresets(char: CharacterData): ComboPreset[] {
  const presets: ComboPreset[] = [];
  const cls = (char.class || '').toLowerCase();
  const defaultAttacks = getDefaultExtraAttacks(char);

  // Paladino: Combo Divino
  if (cls.includes('paladino') || cls.includes('paladin')) {
    presets.push({
      id: 'paladin_smite',
      title: '⚔️ Combo Sagrado (Ataque Duplo + Smite)',
      subtitle: `${defaultAttacks} Ataques com arma + Destruição Divina Nvl 1`,
      icon: 'Sword',
      apply: (cfg, c) => {
        const weapons = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = weapons.find((w) => w.isEquipped) || weapons[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          bonusActionType: 'none',
          modifiers: {
            ...cfg.modifiers,
            hasDivineSmite: true,
            smiteSlotLevel: 1,
            smiteUndeadOrFiend: false,
          },
        };
      },
    });

    presets.push({
      id: 'paladin_crit_smite',
      title: '💥 Crítico Sagrado (Smite Dobrado!)',
      subtitle: 'Quando você rola 20 natural: todos os dados de dano dobram!',
      icon: 'Flame',
      apply: (cfg, c) => {
        const weapons = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = weapons.find((w) => w.isEquipped) || weapons[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          modifiers: {
            ...cfg.modifiers,
            hasDivineSmite: true,
            smiteSlotLevel: 1,
            isCriticalHit: true,
          },
        };
      },
    });
  }

  // Monge: Rajada de 4 Golpes
  if (cls.includes('monge') || cls.includes('monk')) {
    presets.push({
      id: 'monk_flurry',
      title: '🥋 Rajada Total (4 Golpes de Ki)',
      subtitle: `${defaultAttacks} Ataques da Ação + 2 Ataques da Rajada de Golpes`,
      icon: 'Zap',
      apply: (cfg, c) => {
        const weapons = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = weapons.find((w) => w.isEquipped) || weapons[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          bonusActionType: 'flurry_of_blows',
          modifiers: {
            ...cfg.modifiers,
            hasHandsOfHarm: false,
          },
        };
      },
    });

    presets.push({
      id: 'monk_mercy_harm',
      title: '💀 Combo Mão da Misericórdia & Morte',
      subtitle: '4 Golpes + Mãos do Mal (+1d6 necrótico)',
      icon: 'Zap',
      apply: (cfg, c) => {
        const weapons = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = weapons.find((w) => w.isEquipped) || weapons[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          bonusActionType: 'flurry_of_blows',
          modifiers: {
            ...cfg.modifiers,
            hasHandsOfHarm: true,
            hasStunningStrike: true,
          },
        };
      },
    });
  }

  // Bárbaro: Fúria e Ataques Imprudentes
  if (cls.includes('bárbaro') || cls.includes('barbaro')) {
    presets.push({
      id: 'barbarian_reckless_rage',
      title: '🪓 Fúria & Ataque Imprudente',
      subtitle: 'Fúria ativa (+2 dano cada) + Ataques com Vantagem',
      icon: 'Flame',
      apply: (cfg, c) => {
        const weapons = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = weapons.find((w) => w.isEquipped) || weapons[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          bonusActionType: 'rage',
          modifiers: {
            ...cfg.modifiers,
            isRaging: true,
            hasAdvantage: true,
          },
        };
      },
    });
  }

  // Presets Genéricos (para qualquer personagem marcial ou com duas armas)
  const weapons = (char.items || []).filter((i) => i.isWeapon);
  if (weapons.length >= 2) {
    presets.push({
      id: 'dual_wield',
      title: '🗡️ Combate com Duas Armas',
      subtitle: `${defaultAttacks} Ataques com arma primária + 1 com arma secundária`,
      icon: 'Sword',
      apply: (cfg, c) => {
        const wps = (c.items || []).filter((i) => i.isWeapon);
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: wps[0]?.id || 'unarmed',
          bonusActionType: 'offhand',
          offhandWeaponId: wps[1]?.id || wps[0]?.id || 'unarmed',
        };
      },
    });
  }

  // Presets Básicos se não teve nenhum
  if (presets.length === 0) {
    presets.push({
      id: 'basic_attack',
      title: '⚔️ Ataque Padrão de Turno',
      subtitle: `${defaultAttacks} Ataque(s) com a arma principal`,
      icon: 'Sword',
      apply: (cfg, c) => {
        const wps = (c.items || []).filter((i) => i.isWeapon);
        const mainWp = wps.find((w) => w.isEquipped) || wps[0];
        return {
          ...cfg,
          numMainAttacks: defaultAttacks,
          mainAttackWeaponId: mainWp ? mainWp.id : 'unarmed',
          bonusActionType: 'none',
        };
      },
    });
  }

  return presets;
}

/**
 * Função principal de cálculo da Calculadora de Ação
 * Calcula exatamente os dados físicos para a mesa e gera a narrativa explicativa
 */
export function calculateActionCombo(
  char: CharacterData,
  config: ComboConfig
): CalculatedComboResult {
  const choices = getAvailableAttackChoices(char);
  const strMod = getMod(char.str);
  const wisMod = getMod(char.wis);

  // Encontra a arma/ataque principal
  const mainChoice =
    choices.find((c) => c.id === config.mainAttackWeaponId) || choices[0] || {
      id: 'unarmed',
      name: 'Ataque Básico',
      attackBonus: strMod + getProfBonus(char.level),
      attackBonusStr: `+${strMod + getProfBonus(char.level)}`,
      damageDiceCount: 1,
      damageDie: 'd6' as DieType,
      damageType: 'Concussão',
      damageFixedBonus: strMod,
      sourceType: 'unarmed' as const,
    };

  // Encontra arma da mão inábil se aplicável
  const offhandChoice =
    config.bonusActionType === 'offhand'
      ? choices.find((c) => c.id === config.offhandWeaponId) ||
        choices.find((c) => c.id !== mainChoice.id) ||
        mainChoice
      : null;

  // Monge unarmed choice para rajada de golpes
  const monkUnarmedChoice =
    choices.find((c) => c.id === 'unarmed') || choices[0];

  // Pool acumuladora de dados de dano
  const diceMap: Record<DieType, { count: number; purpose: string[]; color: string }> = {
    d4: { count: 0, purpose: [], color: '#81C784' },
    d6: { count: 0, purpose: [], color: '#E57373' },
    d8: { count: 0, purpose: [], color: '#C5A059' },
    d10: { count: 0, purpose: [], color: '#64B5F6' },
    d12: { count: 0, purpose: [], color: '#BA68C8' },
    d20: { count: 0, purpose: [], color: '#FFB74D' },
    d100: { count: 0, purpose: [], color: '#A1887F' },
  };

  const hitBonuses: { name: string; bonus: string }[] = [];
  let totalAttacksCount = 0;
  let totalFixedBonus = 0;
  const damageTypesSet = new Set<string>();
  const stepsNarrative: CalculatedComboResult['stepsNarrative'] = [];
  let stepIdx = 1;

  // Bônus adicional de fúria (+2 por ataque corpo a corpo com força)
  const rageBonus = config.modifiers.isRaging ? 2 : 0;

  // ----------------------------------------------------
  // 1. AÇÃO PRINCIPAL (1 a N Ataques)
  // ----------------------------------------------------
  const mainAttackCount = Math.max(1, config.numMainAttacks || 1);

  for (let i = 1; i <= mainAttackCount; i++) {
    totalAttacksCount++;
    hitBonuses.push({
      name: `${i}º Ataque (${mainChoice.name.split(' (')[0]})`,
      bonus: mainChoice.attackBonusStr,
    });

    // Dano da arma
    let weaponDiceCount = mainChoice.damageDiceCount;
    if (config.modifiers.isCriticalHit) {
      weaponDiceCount *= 2; // Crítico dobra dados
    }

    if (weaponDiceCount > 0) {
      diceMap[mainChoice.damageDie].count += weaponDiceCount;
      if (!diceMap[mainChoice.damageDie].purpose.includes(mainChoice.damageType)) {
        diceMap[mainChoice.damageDie].purpose.push(mainChoice.damageType);
      }
      damageTypesSet.add(mainChoice.damageType);
    }

    const attackFixed = mainChoice.damageFixedBonus + rageBonus;
    totalFixedBonus += attackFixed;

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: i === 1 ? `1º Golpe: ${mainChoice.name.split(' (')[0]}` : `${i}º Golpe (Ataque Extra): ${mainChoice.name.split(' (')[0]}`,
      actionType: 'AÇÃO',
      detail: `Role d20 para acertar. Em caso de acerto, causa o dano da arma somado ao seu modificador${rageBonus > 0 ? ' + 2 (Fúria)' : ''}.`,
      hitFormula: `1d20 ${mainChoice.attackBonusStr}`,
      damageFormula: `${weaponDiceCount}${mainChoice.damageDie} + ${attackFixed} ${mainChoice.damageType}`,
    });
  }

  // ----------------------------------------------------
  // 2. GATILHOS ON-HIT (Modificadores no Acerto)
  // ----------------------------------------------------
  // A. Destruição Divina (Paladino)
  if (config.modifiers.hasDivineSmite) {
    const slotLvl = config.modifiers.smiteSlotLevel || 1;
    // 1º nível = 2d8, +1d8 por nível até 5º nível (máx 5d8 base). +1d8 se morto-vivo/ínfero (máx 6d8).
    let smiteDice = Math.min(5, 1 + slotLvl);
    if (config.modifiers.smiteUndeadOrFiend) {
      smiteDice = Math.min(6, smiteDice + 1);
    }
    if (config.modifiers.isCriticalHit) {
      smiteDice *= 2;
    }

    diceMap['d8'].count += smiteDice;
    if (!diceMap['d8'].purpose.includes('Radiante')) {
      diceMap['d8'].purpose.push('Radiante');
    }
    damageTypesSet.add('Radiante');

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: `Destruição Divina (Divine Smite Nvl ${slotLvl})`,
      actionType: 'GATILHO / ON-HIT',
      detail: `Ao acertar um dos seus ataques corpo a corpo, canalize poder sagrado${config.modifiers.smiteUndeadOrFiend ? ' (Alvo Morto-Vivo / Ínfero: +1d8)' : ''}.`,
      damageFormula: `+${smiteDice}d8 Radiante`,
    });
  }

  // B. Mãos do Mal (Monge da Misericórdia)
  if (config.modifiers.hasHandsOfHarm) {
    let harmDice = 1;
    if (config.modifiers.isCriticalHit) harmDice *= 2;

    diceMap['d6'].count += harmDice;
    if (!diceMap['d6'].purpose.includes('Necrótico')) {
      diceMap['d6'].purpose.push('Necrótico');
    }
    damageTypesSet.add('Necrótico');
    totalFixedBonus += Math.max(0, wisMod);

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Mãos do Mal (Way of Mercy)',
      actionType: 'GATILHO / ON-HIT',
      detail: 'Ao acertar um ataque desarmado, gaste 1 Ki para infligir trevas na ferida da criatura.',
      damageFormula: `+${harmDice}d6 + ${Math.max(0, wisMod)} Necrótico`,
    });
  }

  // C. Golpe Atordoante (Monge)
  if (config.modifiers.hasStunningStrike) {
    const prof = getProfBonus(char.level);
    const monkDc = 8 + prof + wisMod;

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Golpe Atordoante (Stunning Strike)',
      actionType: 'GATILHO / ON-HIT',
      detail: `Ao acertar a criatura, gaste 1 Ki. O alvo deve ter sucesso em uma Salvaguarda de Constituição CD ${monkDc} ou ficará Atordoado até o final do seu próximo turno.`,
    });
  }

  // D. Marca do Caçador / Hex
  if (config.modifiers.hasHuntersMarkOrHex) {
    let markDice = totalAttacksCount * 1; // 1d6 por golpe que acertar
    if (config.modifiers.isCriticalHit) markDice *= 2;

    diceMap['d6'].count += markDice;
    if (!diceMap['d6'].purpose.includes('Marca/Hex')) {
      diceMap['d6'].purpose.push('Marca/Hex');
    }
    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Marca do Caçador / Hex',
      actionType: 'GATILHO / ON-HIT',
      detail: 'Causa +1d6 extra a cada ataque que acertar o alvo marcado.',
      damageFormula: `+${markDice}d6 Extra`,
    });
  }

  // E. Ataque Furtivo (Ladino)
  if (config.modifiers.hasSneakAttack) {
    let sneakDice = Math.max(1, config.modifiers.sneakAttackDice || Math.ceil(char.level / 2));
    if (config.modifiers.isCriticalHit) sneakDice *= 2;

    diceMap['d6'].count += sneakDice;
    if (!diceMap['d6'].purpose.includes('Furtivo')) {
      diceMap['d6'].purpose.push('Furtivo');
    }
    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: `Ataque Furtivo (${sneakDice}d6)`,
      actionType: 'GATILHO / ON-HIT',
      detail: 'Uma vez por turno ao acertar com vantagem ou com aliado adjacente ao alvo.',
      damageFormula: `+${sneakDice}d6 Furtivo`,
    });
  }

  // ----------------------------------------------------
  // 3. AÇÃO BÔNUS (Bonus Action)
  // ----------------------------------------------------
  if (config.bonusActionType === 'offhand' && offhandChoice) {
    totalAttacksCount++;
    hitBonuses.push({
      name: `Ataque com 2ª Arma (${offhandChoice.name.split(' (')[0]})`,
      bonus: offhandChoice.attackBonusStr,
    });

    let offhandDice = offhandChoice.damageDiceCount;
    if (config.modifiers.isCriticalHit) offhandDice *= 2;

    if (offhandDice > 0) {
      diceMap[offhandChoice.damageDie].count += offhandDice;
      if (!diceMap[offhandChoice.damageDie].purpose.includes(offhandChoice.damageType)) {
        diceMap[offhandChoice.damageDie].purpose.push(offhandChoice.damageType);
      }
    }

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: `Ataque Bônus: ${offhandChoice.name.split(' (')[0]} (Mão Inábil)`,
      actionType: 'AÇÃO BÔNUS',
      detail: 'Golpe com arma secundária leve. Pela regra de D&D 5e, não soma o modificador de atributo no dano.',
      hitFormula: `1d20 ${offhandChoice.attackBonusStr}`,
      damageFormula: `${offhandDice}${offhandChoice.damageDie} ${offhandChoice.damageType}`,
    });
  } else if (config.bonusActionType === 'flurry_of_blows') {
    // 2 Ataques Desarmados de Monge
    for (let f = 1; f <= 2; f++) {
      totalAttacksCount++;
      hitBonuses.push({
        name: `Rajada de Ki ${f} (Desarmado)`,
        bonus: monkUnarmedChoice.attackBonusStr,
      });

      let flurryDice = monkUnarmedChoice.damageDiceCount;
      if (config.modifiers.isCriticalHit) flurryDice *= 2;

      diceMap[monkUnarmedChoice.damageDie].count += flurryDice;
      if (!diceMap[monkUnarmedChoice.damageDie].purpose.includes('Concussão')) {
        diceMap[monkUnarmedChoice.damageDie].purpose.push('Concussão');
      }

      const flurryFixed = monkUnarmedChoice.damageFixedBonus;
      totalFixedBonus += flurryFixed;
    }

    const flurryTotalDice = (config.modifiers.isCriticalHit ? 2 : 1) * 2;
    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Rajada de Golpes (Flurry of Blows)',
      actionType: 'AÇÃO BÔNUS',
      detail: 'Consome 1 Ponto de Ki. Você desfere 2 Ataques Desarmados adicionais!',
      hitFormula: `2x (1d20 ${monkUnarmedChoice.attackBonusStr})`,
      damageFormula: `${flurryTotalDice}${monkUnarmedChoice.damageDie} + ${monkUnarmedChoice.damageFixedBonus * 2} Concussão`,
    });
  } else if (config.bonusActionType === 'martial_arts') {
    totalAttacksCount++;
    hitBonuses.push({
      name: 'Golpe de Artes Marciais',
      bonus: monkUnarmedChoice.attackBonusStr,
    });

    let maDice = monkUnarmedChoice.damageDiceCount;
    if (config.modifiers.isCriticalHit) maDice *= 2;

    diceMap[monkUnarmedChoice.damageDie].count += maDice;
    if (!diceMap[monkUnarmedChoice.damageDie].purpose.includes('Concussão')) {
      diceMap[monkUnarmedChoice.damageDie].purpose.push('Concussão');
    }
    totalFixedBonus += monkUnarmedChoice.damageFixedBonus;

    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Artes Marciais (Golpe Desarmado Bônus)',
      actionType: 'AÇÃO BÔNUS',
      detail: 'Desfere 1 Ataque Desarmado adicional com ação bônus.',
      hitFormula: `1d20 ${monkUnarmedChoice.attackBonusStr}`,
      damageFormula: `${maDice}${monkUnarmedChoice.damageDie} + ${monkUnarmedChoice.damageFixedBonus} Concussão`,
    });
  } else if (config.bonusActionType === 'rage') {
    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Ativar Fúria (Rage)',
      actionType: 'AÇÃO BÔNUS',
      detail: 'Entra em fúria bárbara: concede +2 de dano em ataques de Força e resistência a concussão, cortante e perfurante.',
      damageFormula: '+2 Dano por Ataque de Força',
    });
  } else if (config.bonusActionType === 'bonus_spell') {
    stepsNarrative.push({
      stepNumber: stepIdx++,
      title: 'Conjuração de Magia Rápida',
      actionType: 'AÇÃO BÔNUS',
      detail: 'Conjura uma magia que requer Ação Bônus (conforme espaços de magia da ficha).',
    });
  }

  // ----------------------------------------------------
  // CONSOLIDAÇÃO DOS DADOS FÍSICOS DE MESA
  // ----------------------------------------------------
  // Dados de Acerto (d20)
  const totalD20Needed =
    config.modifiers.hasAdvantage || config.modifiers.hasDisadvantage
      ? totalAttacksCount * 2
      : totalAttacksCount;

  // Lista de Dados de Dano com contagem > 0
  const damageDicePool: PhysicalDieCount[] = (
    ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DieType[]
  )
    .filter((die) => diceMap[die].count > 0)
    .map((die) => ({
      die,
      count: diceMap[die].count,
      purpose: diceMap[die].purpose.join(' / ') || 'Dano',
      color: diceMap[die].color,
    }));

  const totalDamageDiceCount = damageDicePool.reduce((acc, d) => acc + d.count, 0);

  // Estimativa Numérica (Mínimo, Médio e Máximo)
  const dieAverage: Record<DieType, number> = {
    d4: 2.5,
    d6: 3.5,
    d8: 4.5,
    d10: 5.5,
    d12: 6.5,
    d20: 10.5,
    d100: 50.5,
  };

  const dieMax: Record<DieType, number> = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
    d100: 100,
  };

  const minDmg = totalDamageDiceCount + totalFixedBonus;
  const avgDmg =
    totalFixedBonus +
    damageDicePool.reduce((acc, d) => acc + d.count * dieAverage[d.die], 0);
  const maxDmg =
    totalFixedBonus +
    damageDicePool.reduce((acc, d) => acc + d.count * dieMax[d.die], 0);

  // Construção da Mensagem Direta de Mesa
  const hitSentences: string[] = [];
  if (totalD20Needed > 0) {
    if (config.modifiers.hasAdvantage) {
      hitSentences.push(`Pegue ${totalD20Needed} dados d20 (rolar com Vantagem: 2 dados por ataque)`);
    } else if (config.modifiers.hasDisadvantage) {
      hitSentences.push(`Pegue ${totalD20Needed} dados d20 (rolar com Desvantagem)`);
    } else {
      hitSentences.push(`Pegue ${totalD20Needed} dado${totalD20Needed > 1 ? 's' : ''} d20 para as jogadas de acerto`);
    }
  }

  const damageDiceDesc = damageDicePool
    .map((d) => `${d.count}x ${d.die} (${d.purpose})`)
    .join(', ');

  const damageSentence =
    damageDicePool.length > 0
      ? `No dano, pegue ${damageDiceDesc}${
          totalFixedBonus !== 0
            ? ` e adicione ${totalFixedBonus > 0 ? '+' : ''}${totalFixedBonus} ao total`
            : ''
        }.`
      : 'Nenhum dado de dano adicional neste combo.';

  const actionSentence = `Seu combo realiza ${totalAttacksCount} ataque${
    totalAttacksCount > 1 ? 's' : ''
  } no turno${config.modifiers.isCriticalHit ? ' com ACERTO CRÍTICO aplicado (dados de dano dobrados)!' : '.'}`;

  return {
    hitDice: {
      totalD20: totalD20Needed,
      advantage: config.modifiers.hasAdvantage,
      disadvantage: config.modifiers.hasDisadvantage,
      bonuses: hitBonuses,
    },
    damageDicePool,
    totalDamageDiceCount,
    totalFixedDamageBonus: totalFixedBonus,
    damageTypesIncluded: Array.from(damageTypesSet),
    physicalTableSummary: {
      hitDiceSentence: hitSentences.join(' ') || 'Nenhum ataque de acerto necessário.',
      damageDiceSentence: damageSentence,
      actionSummarySentence: actionSentence,
    },
    damageEstimate: {
      min: Math.max(0, minDmg),
      avg: Math.round(avgDmg),
      max: Math.max(0, maxDmg),
    },
    stepsNarrative,
  };
}
