import { describe, expect, it } from 'vitest';
import {
  applyClass,
  applyRace,
  buildCharacterPayload,
  createInitialState,
  finalScores,
  selectableClassSkills,
  switchMethod,
  validateStep,
} from './wizardState';
import { getClassPreset } from '@/utils/classPresets';
import { SKILLS_LIST } from '@/utils/dnd5e';

const allSkills = SKILLS_LIST.map((s) => s.name);

describe('assistente de criação — estado', () => {
  it('começa com valores válidos (conjunto padrão atribuído)', () => {
    const st = createInitialState({});
    expect(Object.values(st.base).every((v) => v > 0)).toBe(true);
    expect(validateStep(2, st).errors).toEqual([]);
  });

  it('exige nome no passo 1 e classe no passo 2', () => {
    const st = createInitialState({});
    expect(validateStep(0, st).errors).toHaveLength(1);
    expect(validateStep(0, { ...st, name: 'Thalor' }).errors).toEqual([]);
    expect(validateStep(1, { ...st, className: '' }).errors).toHaveLength(1);
  });

  it('trocar de raça aplica o bônus racial e soma ao valor final', () => {
    let st = createInitialState({ });
    st = { ...applyClass(st, 'Guerreiro'), name: 'X' };
    const before = finalScores(st).con;
    st = applyRace(st, 'Anão');
    expect(st.bonus.con).toBe(2);
    expect(finalScores(st).con).toBe(before - 1 + 2); // Humano dava +1; Anão dá +2
  });

  it('trocar de classe limpa subclasse e perícias e redistribui os atributos', () => {
    let st = createInitialState({});
    st = { ...st, archetype: 'Campeão', skills: ['Atletismo'] };
    st = applyClass(st, 'Mago');
    expect(st.archetype).toBe('');
    expect(st.skills).toEqual([]);
    expect(st.base.int).toBe(15);
  });

  it('no método manual a troca de classe não mexe nos atributos', () => {
    let st = switchMethod(createInitialState({}), 'manual');
    st = { ...st, base: { ...st.base, str: 17 } };
    expect(applyClass(st, 'Mago').base.str).toBe(17);
  });

  it('as opções de perícia da classe excluem as que o antecedente já concede', () => {
    const preset = getClassPreset('Guerreiro');
    const opts = selectableClassSkills(preset, ['Atletismo', 'Percepção'], allSkills);
    expect(opts).not.toContain('Atletismo');
    expect(opts).toContain('Acrobacia');
    expect(selectableClassSkills(getClassPreset('Bardo'), [], allSkills)).toHaveLength(18);
  });

  it('conjunto padrão incompleto bloqueia o passo de atributos', () => {
    const st = createInitialState({});
    expect(validateStep(2, { ...st, base: { ...st.base, str: 0 } }).errors).toHaveLength(1);
  });
});

describe('assistente de criação — personagem final', () => {
  const ctxPlayer = { isElevated: false, userName: 'Pastor', username: 'pastor.j' };

  it('monta a ficha de um Paladino nível 5 com tudo preenchido pelas predefinições', () => {
    let st = createInitialState({ roomId: 'sala-1' });
    st = applyClass(st, 'Paladino');
    st = { ...st, name: '  Aurelio ', level: 5, background: 'Soldado', skills: ['Medicina', 'Persuasão'] };
    const p = buildCharacterPayload(st, ctxPlayer);

    expect(p.name).toBe('Aurelio');
    expect(p.class).toBe('Paladino');
    expect(p.hitDiceType).toBe('1d10');
    expect(p.hitDiceTotal).toBe(5);
    expect(p.wisProf).toBe(true);
    expect(p.chaProf).toBe(true);
    expect(p.strProf).toBe(false);
    expect(p.currentHp).toBe(p.maxHp);
    expect(p.spellSlots).toEqual([
      { id: '', level: 1, total: 4, used: 0 },
      { id: '', level: 2, total: 2, used: 0 },
    ]);
    // antecedente (Soldado) + escolhas da classe, sem duplicar
    expect((p.proficientSkills || '').split(',').sort()).toEqual(['Atletismo', 'Intimidação', 'Medicina', 'Persuasão']);
    expect(p.roomId).toBe('sala-1');
  });

  it('jogador comum cria sempre no próprio nome; o Mestre pode escolher o dono', () => {
    const st = { ...createInitialState({ playerName: 'Outro', assignedUsername: 'Allan.M' }), name: 'Teste' };
    const asPlayer = buildCharacterPayload(st, ctxPlayer);
    expect(asPlayer.username).toBe('pastor.j');
    expect(asPlayer.playerName).toBe('Pastor');
    const asDm = buildCharacterPayload(st, { isElevated: true });
    expect(asDm.username).toBe('allan.m');
    expect(asDm.playerName).toBe('Outro');
  });

  it('as sobrescritas de PV e CA da revisão valem', () => {
    const st = { ...createInitialState({}), name: 'Teste', hpOverride: 40, acOverride: 18 };
    const p = buildCharacterPayload(st, ctxPlayer);
    expect(p.maxHp).toBe(40);
    expect(p.currentHp).toBe(40);
    expect(p.armorClass).toBe(18);
  });

  it('Monge nível 5 recebe pontos de ki; Mestre de Batalha recebe dados de superioridade', () => {
    let monk = applyClass(createInitialState({}), 'Monge');
    monk = { ...monk, name: 'M', level: 5 };
    expect(buildCharacterPayload(monk, ctxPlayer).maxKiPoints).toBe(5);

    let fighter = applyClass(createInitialState({}), 'Guerreiro');
    fighter = { ...fighter, name: 'G', level: 3, archetype: 'Mestre de Batalha' };
    expect(buildCharacterPayload(fighter, ctxPlayer).maxSuperiorityDice).toBe(4);
  });
});
