import { describe, expect, it } from 'vitest';
import { formatMod, getMod, getProfBonus, SKILLS_LIST } from './dnd5e';

describe('dnd5e', () => {
  it('calcula o modificador de atributo', () => {
    expect(getMod(10)).toBe(0);
    expect(getMod(8)).toBe(-1);
    expect(getMod(9)).toBe(-1);
    expect(getMod(18)).toBe(4);
    expect(getMod(1)).toBe(-5);
  });

  it('formata modificadores com sinal', () => {
    expect(formatMod(3)).toBe('+3');
    expect(formatMod(0)).toBe('+0');
    expect(formatMod(-2)).toBe('-2');
  });

  it('calcula o bônus de proficiência por nível', () => {
    expect(getProfBonus(1)).toBe(2);
    expect(getProfBonus(4)).toBe(2);
    expect(getProfBonus(5)).toBe(3);
    expect(getProfBonus(9)).toBe(4);
    expect(getProfBonus(13)).toBe(5);
    expect(getProfBonus(17)).toBe(6);
    expect(getProfBonus(99)).toBe(6);
  });

  it('lista as 18 perícias do D&D 5e', () => {
    expect(SKILLS_LIST).toHaveLength(18);
  });
});
