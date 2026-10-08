import { describe, expect, it } from 'vitest';
import { buildCharacterSheetHtml, sanitizeImportedCharacter } from './characterImport';
import type { CharacterData } from '@/lib/mockData';

describe('sanitizeImportedCharacter', () => {
  it('rejeita entradas sem nome nem classe', () => {
    expect(sanitizeImportedCharacter(null)).toBeNull();
    expect(sanitizeImportedCharacter({ level: 3 })).toBeNull();
    expect(sanitizeImportedCharacter('texto')).toBeNull();
  });

  it('limita números a faixas válidas e aplica padrões', () => {
    const c = sanitizeImportedCharacter({ name: 'X', level: 999, maxHp: -5, str: 99, gold: -10 })!;
    expect(c.level).toBe(20);
    expect(c.maxHp).toBe(1);
    expect(c.str).toBe(30);
    expect(c.gold).toBe(0);
  });

  it('descarta campos controlados pelo servidor (dono, mesa, id)', () => {
    const c: any = sanitizeImportedCharacter({
      name: 'X',
      id: 'abc',
      userId: 'outro',
      roomId: 'mesa',
      username: 'alguem',
    })!;
    expect(c.id).toBeUndefined();
    expect(c.userId).toBeUndefined();
    expect(c.roomId).toBeUndefined();
    expect(c.username).toBeUndefined();
  });

  it('valida listas aninhadas e tipos enumerados', () => {
    const c = sanitizeImportedCharacter({
      name: 'X',
      abilities: [{ name: 'Fúria', maxUses: 3, resetType: 'INVALIDO' }],
      themeColor: 'vermelho',
    })!;
    expect(c.abilities![0]).toMatchObject({ name: 'Fúria', maxUses: 3, currentUses: 3, resetType: 'SHORT_REST' });
    expect(c.themeColor).toBe('#C5A059');
  });
});

describe('buildCharacterSheetHtml', () => {
  it('escapa HTML em textos da ficha', () => {
    const html = buildCharacterSheetHtml({
      name: '<script>alert(1)</script>',
      race: 'Humano',
      class: 'Guerreiro',
      level: 1,
      alignment: 'Neutro',
      background: 'x',
      playerName: 'p',
      currentHp: 1,
      maxHp: 1,
      tempHp: 0,
      armorClass: 10,
      initiativeBonus: 0,
      speed: '9m',
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      strProf: false, dexProf: false, conProf: false, intProf: false, wisProf: false, chaProf: false,
      proficientSkills: '',
      gold: 0, silver: 0, copper: 0,
      spellSlots: [], spells: [], abilities: [], conditions: [], items: [],
    } as unknown as CharacterData);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
