import { describe, expect, it } from 'vitest';
import {
  canDeleteTask,
  canEditTask,
  canRunTaskAction,
  isTaskAssignee,
  planTaskAction,
  planTaskCreate,
  planTaskEdit,
  TaskActor,
  TaskSnapshot,
} from './taskRules';

const dm: TaskActor = { id: 'dm-1', name: 'Mestre', role: 'DM' };
const mechanic: TaskActor = { id: 'mec-1', name: 'Mecânico', role: 'MECHANIC' };
const alex: TaskActor = { id: 'p-1', name: 'Alex', role: 'PLAYER' };
const marina: TaskActor = { id: 'p-2', name: 'Marina', role: 'PLAYER' };

const task = (over: Partial<TaskSnapshot> = {}): TaskSnapshot => ({
  status: 'PARADO',
  assignedTo: null,
  assignedToId: null,
  createdById: null,
  ...over,
});

const inProgressByAlex = task({ status: 'ANDAMENTO', assignedTo: 'Alex', assignedToId: 'p-1' });
const finishedByAlex = task({ status: 'FINALIZADO', assignedTo: 'Alex', assignedToId: 'p-1' });

describe('responsável pela task', () => {
  it('identifica pelo id quando existe', () => {
    expect(isTaskAssignee(inProgressByAlex, alex)).toBe(true);
    // Mesmo nome, outro usuário: não é dono
    expect(isTaskAssignee(inProgressByAlex, { ...marina, name: 'Alex' })).toBe(false);
  });

  it('usa o nome como reserva em tasks antigas sem id', () => {
    expect(isTaskAssignee(task({ status: 'ANDAMENTO', assignedTo: 'Alex' }), alex)).toBe(true);
  });
});

describe('criação', () => {
  it('jogador cria sugestão sem recompensa, com autoria', () => {
    const plan = planTaskCreate(alex, { title: ' Mapa ', description: 'Desenhar', category: 'ARTE', reward: '1000 PO' });
    expect(plan).toEqual({
      ok: true,
      changes: {
        title: 'Mapa',
        description: 'Desenhar',
        category: 'ARTE',
        reward: '',
        status: 'SUGERIDO',
        createdById: 'p-1',
        createdByName: 'Alex',
      },
    });
  });

  it('Mestre e Mecânico criam direto no backlog com recompensa', () => {
    for (const actor of [dm, mechanic]) {
      const plan = planTaskCreate(actor, { title: 'T', description: 'D', reward: '50 PO' });
      expect(plan.ok && plan.changes).toMatchObject({ status: 'PARADO', reward: '50 PO', category: 'LORE' });
    }
  });

  it('exige título e descrição e valida a categoria', () => {
    expect(planTaskCreate(alex, { title: '  ', description: 'D' })).toMatchObject({ ok: false, status: 400 });
    expect(planTaskCreate(alex, { title: 'T', description: '' })).toMatchObject({ ok: false, status: 400 });
    expect(planTaskCreate(alex, { title: 'T', description: 'D', category: 'XYZ' })).toMatchObject({ ok: false, status: 400 });
    expect(planTaskCreate(alex, { title: 'x'.repeat(121), description: 'D' })).toMatchObject({ ok: false, status: 400 });
  });
});

describe('fluxo de status', () => {
  it('jogador não aprova, recusa, arquiva nem pede ajustes', () => {
    expect(planTaskAction(task({ status: 'SUGERIDO' }), alex, 'APPROVE_SUGGESTION')).toMatchObject({ ok: false, status: 403 });
    expect(planTaskAction(task({ status: 'SUGERIDO' }), alex, 'REJECT_SUGGESTION', { note: 'x' })).toMatchObject({ ok: false, status: 403 });
    expect(planTaskAction(finishedByAlex, alex, 'ARCHIVE')).toMatchObject({ ok: false, status: 403 });
    expect(planTaskAction(finishedByAlex, alex, 'REQUEST_CHANGES', { note: 'x' })).toMatchObject({ ok: false, status: 403 });
  });

  it('Mestre aprova sugestão e limpa o motivo de recusa anterior', () => {
    expect(planTaskAction(task({ status: 'RECUSADO' }), dm, 'APPROVE_SUGGESTION')).toEqual({
      ok: true,
      changes: { status: 'PARADO', reviewNote: '' },
    });
  });

  it('recusa e pedido de ajustes exigem motivo', () => {
    expect(planTaskAction(task({ status: 'SUGERIDO' }), dm, 'REJECT_SUGGESTION')).toMatchObject({ ok: false, status: 400 });
    expect(planTaskAction(task({ status: 'SUGERIDO' }), dm, 'REJECT_SUGGESTION', { note: ' Fora do tom ' })).toEqual({
      ok: true,
      changes: { status: 'RECUSADO', reviewNote: 'Fora do tom' },
    });
    expect(planTaskAction(finishedByAlex, mechanic, 'REQUEST_CHANGES', { note: 'Faltou o mapa' })).toEqual({
      ok: true,
      changes: { status: 'ANDAMENTO', reviewNote: 'Faltou o mapa' },
    });
  });

  it('assumir grava o responsável pelo id do servidor, não pelo que o cliente enviar', () => {
    expect(planTaskAction(task(), marina, 'TAKE')).toEqual({
      ok: true,
      changes: { status: 'ANDAMENTO', assignedTo: 'Marina', assignedToId: 'p-2', reviewNote: '' },
    });
  });

  it('task que já mudou de etapa gera conflito (409)', () => {
    expect(planTaskAction(inProgressByAlex, marina, 'TAKE')).toMatchObject({ ok: false, status: 409 });
  });

  it('só o responsável finaliza, e com diário preenchido', () => {
    expect(planTaskAction(inProgressByAlex, marina, 'FINISH', { resolution: 'x' })).toMatchObject({ ok: false, status: 403 });
    expect(planTaskAction(inProgressByAlex, dm, 'FINISH', { resolution: 'x' })).toMatchObject({ ok: false, status: 403 });
    expect(planTaskAction(inProgressByAlex, alex, 'FINISH', { resolution: '   ' })).toMatchObject({ ok: false, status: 400 });
    expect(planTaskAction(inProgressByAlex, alex, 'FINISH', { resolution: 'Feito' })).toEqual({
      ok: true,
      changes: { status: 'FINALIZADO', resolution: 'Feito', reviewNote: '' },
    });
  });

  it('responsável ou gestor liberam a task; outro jogador não', () => {
    expect(canRunTaskAction(inProgressByAlex, alex, 'RELEASE')).toBe(true);
    expect(canRunTaskAction(inProgressByAlex, dm, 'RELEASE')).toBe(true);
    expect(canRunTaskAction(inProgressByAlex, marina, 'RELEASE')).toBe(false);
    expect(planTaskAction(inProgressByAlex, alex, 'RELEASE')).toEqual({
      ok: true,
      changes: { status: 'PARADO', assignedTo: null, assignedToId: null },
    });
  });

  it('só o responsável reabre a própria task concluída', () => {
    expect(canRunTaskAction(finishedByAlex, alex, 'REOPEN')).toBe(true);
    expect(canRunTaskAction(finishedByAlex, marina, 'REOPEN')).toBe(false);
  });
});

describe('edição e exclusão', () => {
  const suggestionByAlex = task({ status: 'SUGERIDO', createdById: 'p-1' });

  it('autor edita e exclui a própria sugestão; outro jogador não', () => {
    expect(canEditTask(suggestionByAlex, alex)).toBe(true);
    expect(canDeleteTask(suggestionByAlex, alex)).toBe(true);
    expect(canEditTask(suggestionByAlex, marina)).toBe(false);
    expect(canDeleteTask(suggestionByAlex, marina)).toBe(false);
  });

  it('autor perde a edição depois que a sugestão é aprovada', () => {
    expect(canEditTask({ ...suggestionByAlex, status: 'PARADO' }, alex)).toBe(false);
  });

  it('autor não define recompensa nem diário', () => {
    const plan = planTaskEdit(suggestionByAlex, alex, { title: 'Novo', reward: '1000 PO', resolution: 'x' });
    expect(plan).toEqual({ ok: true, changes: { title: 'Novo' } });
  });

  it('editar sugestão recusada a reenvia para análise', () => {
    const plan = planTaskEdit({ ...suggestionByAlex, status: 'RECUSADO' }, alex, { description: 'Ajustada' });
    expect(plan).toEqual({ ok: true, changes: { description: 'Ajustada', status: 'SUGERIDO', reviewNote: '' } });
  });

  it('gestor edita qualquer task, inclusive a recompensa', () => {
    expect(planTaskEdit(inProgressByAlex, dm, { reward: '20 PO' })).toEqual({ ok: true, changes: { reward: '20 PO' } });
  });
});
