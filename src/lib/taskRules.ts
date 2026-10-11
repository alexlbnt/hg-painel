/**
 * Regras do quadro de Tarefas da Mesa, compartilhadas entre a API (fonte da verdade)
 * e a tela (que só exibe os botões que o servidor aceitaria).
 *
 * Fluxo:
 *   SUGERIDO ─aprovar→ PARADO ─assumir→ ANDAMENTO ─finalizar→ FINALIZADO ─arquivar→ APROVADO
 *      │ recusar                ←liberar─┘   ↑ reabrir / pedir ajustes ─┘
 *      ↓
 *   RECUSADO ─(autor edita e reenvia)→ SUGERIDO
 */

export type TaskCategory = 'LORE' | 'MECANICA' | 'ARTE' | 'DEV' | 'ESPECIAL';
export type TaskStatus = 'SUGERIDO' | 'RECUSADO' | 'PARADO' | 'ANDAMENTO' | 'FINALIZADO' | 'APROVADO';
export type TaskRole = 'PLAYER' | 'MECHANIC' | 'DM';

export const TASK_CATEGORIES: TaskCategory[] = ['LORE', 'MECANICA', 'ARTE', 'DEV', 'ESPECIAL'];

export const TASK_LIMITS = {
  title: 120,
  description: 5000,
  reward: 200,
  resolution: 5000,
  note: 1000,
};

export interface TaskActor {
  id: string;
  name: string;
  role: TaskRole;
}

/** Campos da task que as regras precisam conhecer. */
export interface TaskSnapshot {
  status: TaskStatus;
  assignedTo: string | null;
  assignedToId?: string | null;
  createdById?: string | null;
}

export type TaskAction =
  | 'APPROVE_SUGGESTION'
  | 'REJECT_SUGGESTION'
  | 'TAKE'
  | 'RELEASE'
  | 'FINISH'
  | 'REOPEN'
  | 'REQUEST_CHANGES'
  | 'ARCHIVE';

export const TASK_ACTIONS: TaskAction[] = [
  'APPROVE_SUGGESTION',
  'REJECT_SUGGESTION',
  'TAKE',
  'RELEASE',
  'FINISH',
  'REOPEN',
  'REQUEST_CHANGES',
  'ARCHIVE',
];

/** Alterações que o servidor grava no banco. */
export interface TaskChanges {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  reward?: string;
  resolution?: string;
  reviewNote?: string;
  assignedTo?: string | null;
  assignedToId?: string | null;
  createdById?: string;
  createdByName?: string;
}

export type TaskPlan =
  | { ok: true; changes: TaskChanges }
  | { ok: false; status: 400 | 403 | 409; error: string };

const fail = (status: 400 | 403 | 409, error: string): TaskPlan => ({ ok: false, status, error });

/** Mestre e Mecânico administram o quadro (mesmo critério da agenda e das fichas). */
export function isTaskManager(role: TaskRole | undefined | null): boolean {
  return role === 'DM' || role === 'MECHANIC';
}

/**
 * Responsável pela task. Tasks antigas só guardam o nome; nesse caso o nome serve de reserva.
 */
export function isTaskAssignee(task: TaskSnapshot, actor: TaskActor): boolean {
  if (task.assignedToId) return task.assignedToId === actor.id;
  return !!task.assignedTo && task.assignedTo === actor.name;
}

export function isTaskAuthor(task: TaskSnapshot, actor: TaskActor): boolean {
  return !!task.createdById && task.createdById === actor.id;
}

const ACTION_RULES: Record<
  TaskAction,
  { from: TaskStatus[]; to: TaskStatus; who: 'manager' | 'anyone' | 'assignee' | 'assigneeOrManager' }
> = {
  APPROVE_SUGGESTION: { from: ['SUGERIDO', 'RECUSADO'], to: 'PARADO', who: 'manager' },
  REJECT_SUGGESTION: { from: ['SUGERIDO'], to: 'RECUSADO', who: 'manager' },
  TAKE: { from: ['PARADO'], to: 'ANDAMENTO', who: 'anyone' },
  RELEASE: { from: ['ANDAMENTO'], to: 'PARADO', who: 'assigneeOrManager' },
  FINISH: { from: ['ANDAMENTO'], to: 'FINALIZADO', who: 'assignee' },
  REOPEN: { from: ['FINALIZADO'], to: 'ANDAMENTO', who: 'assignee' },
  REQUEST_CHANGES: { from: ['FINALIZADO'], to: 'ANDAMENTO', who: 'manager' },
  ARCHIVE: { from: ['FINALIZADO'], to: 'APROVADO', who: 'manager' },
};

/** Indica se o usuário pode executar a ação na task no estado atual. */
export function canRunTaskAction(task: TaskSnapshot, actor: TaskActor, action: TaskAction): boolean {
  const rule = ACTION_RULES[action];
  if (!rule || !rule.from.includes(task.status)) return false;
  switch (rule.who) {
    case 'manager':
      return isTaskManager(actor.role);
    case 'anyone':
      return true;
    case 'assignee':
      return isTaskAssignee(task, actor);
    case 'assigneeOrManager':
      return isTaskAssignee(task, actor) || isTaskManager(actor.role);
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tooLong(value: string, max: number, label: string): TaskPlan | null {
  return value.length > max ? fail(400, `${label} deve ter no máximo ${max} caracteres`) : null;
}

/** Planeja uma mudança de status. `input` traz o motivo (note) ou o diário (resolution). */
export function planTaskAction(
  task: TaskSnapshot,
  actor: TaskActor,
  action: TaskAction,
  input: { note?: unknown; resolution?: unknown } = {}
): TaskPlan {
  const rule = ACTION_RULES[action];
  if (!rule) return fail(400, 'Ação desconhecida');
  if (!rule.from.includes(task.status)) {
    return fail(409, 'A tarefa mudou de etapa enquanto você a via. Atualize o quadro e tente de novo.');
  }
  if (!canRunTaskAction(task, actor, action)) {
    return fail(403, 'Você não tem permissão para esta ação nesta tarefa');
  }

  const changes: TaskChanges = { status: rule.to };

  switch (action) {
    case 'APPROVE_SUGGESTION':
      changes.reviewNote = '';
      break;
    case 'REJECT_SUGGESTION':
    case 'REQUEST_CHANGES': {
      const note = clean(input.note);
      if (!note) {
        return fail(400, action === 'REJECT_SUGGESTION' ? 'Informe o motivo da recusa' : 'Informe o que precisa ser ajustado');
      }
      const err = tooLong(note, TASK_LIMITS.note, 'O motivo');
      if (err) return err;
      changes.reviewNote = note;
      break;
    }
    case 'TAKE':
      changes.assignedTo = actor.name;
      changes.assignedToId = actor.id;
      changes.reviewNote = '';
      break;
    case 'RELEASE':
      changes.assignedTo = null;
      changes.assignedToId = null;
      break;
    case 'FINISH': {
      const resolution = clean(input.resolution);
      if (!resolution) return fail(400, 'Escreva o Diário de Missão antes de concluir');
      const err = tooLong(resolution, TASK_LIMITS.resolution, 'O Diário de Missão');
      if (err) return err;
      changes.resolution = resolution;
      changes.reviewNote = '';
      break;
    }
    case 'REOPEN':
    case 'ARCHIVE':
      break;
  }
  return { ok: true, changes };
}

interface TaskContentInput {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  reward?: unknown;
  resolution?: unknown;
}

function validateContent(input: TaskContentInput, partial: boolean): TaskPlan {
  const changes: TaskChanges = {};

  if (!partial || input.title !== undefined) {
    const title = clean(input.title);
    if (!title) return fail(400, 'Informe o título da tarefa');
    const err = tooLong(title, TASK_LIMITS.title, 'O título');
    if (err) return err;
    changes.title = title;
  }
  if (!partial || input.description !== undefined) {
    const description = clean(input.description);
    if (!description) return fail(400, 'Informe a descrição da tarefa');
    const err = tooLong(description, TASK_LIMITS.description, 'A descrição');
    if (err) return err;
    changes.description = description;
  }
  if (input.category !== undefined) {
    if (!TASK_CATEGORIES.includes(input.category as TaskCategory)) return fail(400, 'Categoria inválida');
    changes.category = input.category as TaskCategory;
  } else if (!partial) {
    changes.category = 'LORE';
  }
  if (input.reward !== undefined) {
    const reward = clean(input.reward);
    const err = tooLong(reward, TASK_LIMITS.reward, 'A recompensa');
    if (err) return err;
    changes.reward = reward;
  }
  if (input.resolution !== undefined) {
    const resolution = clean(input.resolution);
    const err = tooLong(resolution, TASK_LIMITS.resolution, 'O Diário de Missão');
    if (err) return err;
    changes.resolution = resolution;
  }
  return { ok: true, changes };
}

/** Nova task: Mestre/Mecânico criam direto no backlog; jogadores enviam sugestão sem recompensa. */
export function planTaskCreate(actor: TaskActor, input: TaskContentInput): TaskPlan {
  const manager = isTaskManager(actor.role);
  const result = validateContent({ ...input, reward: manager ? input.reward : undefined, resolution: undefined }, false);
  if (!result.ok) return result;
  return {
    ok: true,
    changes: {
      ...result.changes,
      reward: result.changes.reward ?? '',
      status: manager ? 'PARADO' : 'SUGERIDO',
      createdById: actor.id,
      createdByName: actor.name,
    },
  };
}

/** Quem pode editar o conteúdo: gestores sempre; o autor enquanto a sugestão não foi aprovada. */
export function canEditTask(task: TaskSnapshot, actor: TaskActor): boolean {
  if (isTaskManager(actor.role)) return true;
  return isTaskAuthor(task, actor) && (task.status === 'SUGERIDO' || task.status === 'RECUSADO');
}

/** Quem pode excluir: gestores sempre; o autor enquanto a sugestão não foi aprovada. */
export function canDeleteTask(task: TaskSnapshot, actor: TaskActor): boolean {
  return canEditTask(task, actor);
}

/**
 * Edição de conteúdo. O autor não define recompensa nem diário; ao editar uma sugestão
 * recusada, ela volta para análise do Mestre.
 */
export function planTaskEdit(task: TaskSnapshot, actor: TaskActor, input: TaskContentInput): TaskPlan {
  if (!canEditTask(task, actor)) return fail(403, 'Você não tem permissão para editar esta tarefa');
  const manager = isTaskManager(actor.role);
  const result = validateContent(
    manager ? input : { title: input.title, description: input.description, category: input.category },
    true
  );
  if (!result.ok) return result;
  const changes = { ...result.changes };
  if (!manager && task.status === 'RECUSADO') {
    changes.status = 'SUGERIDO';
    changes.reviewNote = '';
  }
  return { ok: true, changes };
}
