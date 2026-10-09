import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// Ícones não importam para estes testes (e puxam o react-native real, que não roda em Node)
vi.mock('lucide-react-native', () => ({ Sparkles: () => null }));
import { StepAbilities, StepClass, StepIdentity, StepReview, StepSkills } from './Steps';
import { FirstCharacterInvite } from './FirstCharacterInvite';
import { applyClass, createInitialState, switchMethod } from './wizardState';

const noop = () => {};
const rooms = [
  { id: 'r1', code: 'MESA-ALEX', name: 'Mesa Alex', dmName: 'Alex' },
  { id: 'r2', code: 'MESA-LOBO', name: 'Mesa Lobo', dmName: 'Lobo' },
];
const props = (state = createInitialState({ roomId: 'r1' })) => ({ state, update: noop, replace: noop });
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('assistente de criação — renderização dos passos', () => {
  it('passo 1 mostra identidade, raças, antecedentes, tendências e mesas', () => {
    const out = html(<StepIdentity {...props()} isElevated={false} rooms={rooms} />);
    for (const t of ['Nome do personagem', 'Anão', 'Meio-Elfo', 'Soldado', 'Leal e Bom', 'Mesa Lobo', 'Divindade']) {
      expect(out).toContain(t);
    }
    expect(out).not.toContain('Usuário vinculado'); // só para Mestre/Mecânico
    expect(html(<StepIdentity {...props()} isElevated rooms={rooms} />)).toContain('Usuário vinculado');
  });

  it('passo 2 mostra as 12 classes e o resumo da classe escolhida', () => {
    const state = applyClass(createInitialState({}), 'Paladino');
    const out = html(<StepClass {...props(state)} />);
    for (const c of ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro']) {
      expect(out).toContain(c);
    }
    expect(out).toContain('d10');
    expect(out).toContain('Meio-conjurador');
    expect(out).toContain('Juramento da Devoção');
  });

  it('passo 3 funciona nos três métodos', () => {
    const base = createInitialState({});
    const standard = html(<StepAbilities {...props(base)} />);
    expect(standard).toContain('Conjunto padrão');
    expect(standard).toContain('Sugerir distribuição');

    const pb = html(<StepAbilities {...props(switchMethod(base, 'pointbuy'))} />);
    expect(pb).toContain('Pontos restantes: 0 de 27');

    const manual = html(<StepAbilities {...props(switchMethod(base, 'manual'))} />);
    expect(manual).toContain('Manual');
    expect(manual).not.toContain('Sugerir distribuição');
  });

  it('passo 4 mostra contagem de perícias, antecedente e salvaguardas', () => {
    const state = { ...applyClass(createInitialState({}), 'Ladino'), background: 'Criminoso', skills: ['Furtividade'] };
    const out = html(<StepSkills {...props(state)} />);
    expect(out).toContain('Escolha 3 perícias de Ladino (1 de 4)');
    expect(out).toContain('Enganação'); // do antecedente
    expect(out).toContain('Destreza'); // salvaguarda
  });

  it('passo 5 resume PV, CA, espaços de magia e recursos', () => {
    let state = applyClass(createInitialState({}), 'Mago');
    state = { ...state, name: 'Aurelio', level: 5 };
    const out = html(<StepReview {...props(state)} />);
    expect(out).toContain('Aurelio');
    expect(out).toContain('Pontos de vida');
    expect(out).toContain('Espaços de magia: 1º × 4 · 2º × 3 · 3º × 2');
    expect(out).toContain('5d6');
  });

  it('convite do Pastor mostra os 5 passos e o botão de criar', () => {
    const out = html(<FirstCharacterInvite name="Pastor J" roomName="Mesa Alex" username="pastor.j" onStart={noop} />);
    expect(out).toContain('Sua aventura começa aqui, Pastor');
    expect(out).toContain('Mesa Alex');
    expect(out).toContain('Criar meu personagem');
    expect(out).toContain('@pastor.j');
  });
});
