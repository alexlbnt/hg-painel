import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  BACKGROUND_PRESETS,
  CLASS_PRESETS,
  calcBaseAc,
  calcClassResources,
  calcSpellSlots,
  calcStartingHp,
  canIncreasePointBuy,
  getClassPreset,
  pointBuyCost,
  pointBuyRemaining,
  STANDARD_ARRAY,
  suggestStandardArray,
} from './classPresets';
import { SKILLS_LIST } from './dnd5e';

const skillNames = SKILLS_LIST.map((s) => s.name);

describe('predefinições de classe', () => {
  it('todas as perícias citadas existem na lista oficial de 18 perícias', () => {
    for (const c of CLASS_PRESETS) {
      if (c.skillOptions === 'ALL') continue;
      for (const s of c.skillOptions) expect(skillNames, `${c.name}: ${s}`).toContain(s);
      expect(c.skillOptions.length).toBeGreaterThanOrEqual(c.skillCount);
    }
    for (const b of BACKGROUND_PRESETS) for (const s of b.skills) expect(skillNames, `${b.name}: ${s}`).toContain(s);
  });

  it('a prioridade de atributos cobre os 6 atributos sem repetir', () => {
    for (const c of CLASS_PRESETS) expect(new Set(c.priority).size, c.name).toBe(6);
  });

  it('a sugestão usa o conjunto padrão com o atributo principal no maior valor', () => {
    const mago = suggestStandardArray(getClassPreset('Mago')!);
    expect(mago.int).toBe(15);
    expect(Object.values(mago).sort((a, b) => b - a)).toEqual(STANDARD_ARRAY);
  });

  it('busca de classe ignora maiúsculas e espaços', () => {
    expect(getClassPreset('  paladino ')?.hitDie).toBe(10);
    expect(getClassPreset('Inexistente')).toBeUndefined();
  });
});

describe('compra de pontos', () => {
  it('custa o previsto pela tabela do D&D 5e', () => {
    expect([8, 9, 10, 11, 12, 13, 14, 15].map(pointBuyCost)).toEqual([0, 1, 2, 3, 4, 5, 7, 9]);
  });

  it('o conjunto padrão gasta exatamente os 27 pontos', () => {
    const scores = suggestStandardArray(getClassPreset('Guerreiro')!);
    expect(pointBuyRemaining(scores)).toBe(0);
  });

  it('não deixa passar do orçamento nem de 15', () => {
    const all8 = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    expect(canIncreasePointBuy(all8, 'str')).toBe(true);
    expect(canIncreasePointBuy({ ...all8, str: 15 }, 'str')).toBe(false);
    const maxed = { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 };
    expect(pointBuyRemaining(maxed)).toBe(0);
    expect(canIncreasePointBuy(maxed, 'int')).toBe(false);
  });
});

describe('cálculos iniciais', () => {
  it('PV: nível 1 = dado máximo + CON; demais níveis = média do dado + CON', () => {
    expect(calcStartingHp(10, 1, 14)).toBe(12); // 10 + 2
    expect(calcStartingHp(8, 5, 14)).toBe(10 + 4 * 7); // 8+2, +(5+2) por nível
    expect(calcStartingHp(6, 1, 8)).toBe(5); // 6 - 1
  });

  it('PV nunca fica abaixo de 1 por nível', () => {
    expect(calcStartingHp(6, 3, 3)).toBeGreaterThanOrEqual(3);
  });

  it('CA sem armadura: 10 + DES, com Defesa sem Armadura de Bárbaro e Monge', () => {
    const s = { str: 10, dex: 14, con: 16, int: 10, wis: 14, cha: 10 };
    expect(calcBaseAc(getClassPreset('Mago'), s)).toBe(12);
    expect(calcBaseAc(getClassPreset('Bárbaro'), s)).toBe(15); // 10 + 2 + 3
    expect(calcBaseAc(getClassPreset('Monge'), s)).toBe(14); // 10 + 2 + 2
  });

  it('espaços de magia seguem a progressão da classe', () => {
    expect(calcSpellSlots('Guerreiro', 5)).toEqual([]);
    expect(calcSpellSlots('Paladino', 1)).toEqual([]);
    expect(calcSpellSlots('Paladino', 5)).toEqual([{ level: 1, total: 4 }, { level: 2, total: 2 }]);
    expect(calcSpellSlots('Mago', 1)).toEqual([{ level: 1, total: 2 }]);
  });

  it('recursos de classe: ki, feitiçaria e dados de superioridade', () => {
    expect(calcClassResources('Monge', '', 1).maxKiPoints).toBe(0);
    expect(calcClassResources('Monge', '', 5).maxKiPoints).toBe(5);
    expect(calcClassResources('Feiticeiro', '', 4).maxSorceryPoints).toBe(4);
    expect(calcClassResources('Guerreiro', 'Mestre de Batalha', 3).maxSuperiorityDice).toBe(4);
    expect(calcClassResources('Guerreiro', 'Campeão', 3).maxSuperiorityDice).toBe(0);
    expect(calcClassResources('Guerreiro', 'Mestre de Batalha', 10).superiorityDieType).toBe('d10');
  });

  it('há exatamente 6 atributos', () => {
    expect(ABILITIES).toHaveLength(6);
  });
});
