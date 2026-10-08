import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  applyHeal,
  getMaxSuperiorityDice,
  longRestUpdates,
  shortRestUpdates,
} from './combatRules';

const base = {
  class: 'Clérigo',
  archetype: '',
  level: 5,
  maxHp: 40,
  currentHp: 10,
  hitDiceTotal: 5,
  hitDiceSpent: 3,
};

describe('applyDamage', () => {
  it('consome PV temporários antes dos PV normais', () => {
    expect(applyDamage(20, 5, 3)).toEqual({ currentHp: 20, tempHp: 2 });
    expect(applyDamage(20, 5, 8)).toEqual({ currentHp: 17, tempHp: 0 });
  });

  it('nunca deixa os PV abaixo de zero e ignora dano negativo', () => {
    expect(applyDamage(4, 0, 99)).toEqual({ currentHp: 0, tempHp: 0 });
    expect(applyDamage(10, 2, -5)).toEqual({ currentHp: 10, tempHp: 2 });
  });
});

describe('applyHeal', () => {
  it('não ultrapassa o máximo de PV', () => {
    expect(applyHeal(10, 40, 100)).toBe(40);
    expect(applyHeal(10, 40, 5)).toBe(15);
  });
});

describe('descansos', () => {
  it('descanso curto cura sem ultrapassar o máximo e gasta dados de vida', () => {
    const up = shortRestUpdates(base, 12, 1);
    expect(up.currentHp).toBe(22);
    expect(up.hitDiceSpent).toBe(4);
    expect(shortRestUpdates(base, 999, 99)).toMatchObject({ currentHp: 40, hitDiceSpent: 5 });
  });

  it('descanso longo restaura PV, zera testes contra a morte e recupera metade dos dados de vida (mín. 1)', () => {
    const up = longRestUpdates(base);
    expect(up).toMatchObject({
      currentHp: 40,
      tempHp: 0,
      hitDiceSpent: 1,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
    });
    expect(longRestUpdates({ ...base, hitDiceTotal: 1, hitDiceSpent: 1 }).hitDiceSpent).toBe(0);
  });

  it('restaura recursos de classe quando existem (ki, feitiçaria)', () => {
    const up = longRestUpdates({ ...base, maxKiPoints: 5, maxSorceryPoints: 7 });
    expect(up.kiPoints).toBe(5);
    expect(up.sorceryPoints).toBe(7);
  });
});

describe('dados de superioridade', () => {
  it('usa o máximo configurado quando existe', () => {
    expect(getMaxSuperiorityDice({ ...base, maxSuperiorityDice: 3 })).toBe(3);
  });

  it('infere pelo nível para Guerreiro Mestre de Batalha', () => {
    const bm = { ...base, class: 'Guerreiro', archetype: 'Mestre de Batalha' };
    expect(getMaxSuperiorityDice({ ...bm, level: 3 })).toBe(4);
    expect(getMaxSuperiorityDice({ ...bm, level: 7 })).toBe(5);
    expect(getMaxSuperiorityDice({ ...bm, level: 15 })).toBe(6);
  });

  it('é zero para outras classes', () => {
    expect(getMaxSuperiorityDice(base)).toBe(0);
  });
});
