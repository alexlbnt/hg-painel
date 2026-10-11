import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';
import { forbidden, unauthorized } from '@/lib/auth';
import { getTaskActor } from '@/lib/taskActor';
import { canDeleteTask, planTaskAction, planTaskEdit, TASK_ACTIONS, TaskAction, TaskPlan } from '@/lib/taskRules';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

export async function GET(request: Request, context: any) {
  try {
    if (!(await getTaskActor(request))) return unauthorized();
    const id = extractId(context);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }
    return Response.json(task);
  } catch (error) {
    console.error('Erro no Prisma GET /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao buscar task' }, { status: 500 });
  }
}

/**
 * Duas formas de atualizar:
 *  - `{ action, note?, resolution? }` move a task no fluxo (ver taskRules);
 *  - `{ title?, description?, category?, reward?, resolution? }` edita o conteúdo.
 * O status nunca é aceito diretamente do cliente.
 */
export async function PUT(request: Request, context: any) {
  try {
    const actor = await getTaskActor(request);
    if (!actor) return unauthorized('Identificação necessária para atualizar tarefas');

    const id = extractId(context);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    let plan: TaskPlan;
    if (body.action !== undefined) {
      if (!TASK_ACTIONS.includes(body.action)) {
        return Response.json({ error: 'Ação desconhecida' }, { status: 400 });
      }
      plan = planTaskAction(existing, actor, body.action as TaskAction, body);
    } else if (body.status !== undefined) {
      return Response.json(
        { error: 'Versão antiga do painel. Recarregue a página para continuar.' },
        { status: 400 }
      );
    } else {
      plan = planTaskEdit(existing, actor, body);
    }
    if (!plan.ok) return Response.json({ error: plan.error }, { status: plan.status });

    // Grava só se a task continua na etapa em que foi avaliada (evita duas pessoas assumirem juntas)
    const result = await prisma.task.updateMany({
      where: { id, status: existing.status },
      data: plan.changes,
    });
    if (result.count === 0) {
      return Response.json(
        { error: 'A task mudou de etapa enquanto você a via. Atualize o quadro e tente de novo.' },
        { status: 409 }
      );
    }

    const updatedTask = await prisma.task.findUnique({ where: { id } });
    broadcastEvent({ type: 'TASK_UPDATED', id, data: updatedTask });
    return Response.json(updatedTask);
  } catch (error) {
    console.error('Erro no Prisma PUT /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao atualizar a task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const actor = await getTaskActor(request);
    if (!actor) return unauthorized('Identificação necessária para excluir tarefas');

    const id = extractId(context);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }
    if (!canDeleteTask(existing, actor)) {
      return forbidden('Você não tem permissão para excluir esta task');
    }

    await prisma.task.delete({
      where: { id },
    });
    broadcastEvent({ type: 'TASK_DELETED', id });
    return Response.json({ message: 'Task deletada com sucesso' });
  } catch (error) {
    console.error('Erro no Prisma DELETE /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao deletar a task' }, { status: 500 });
  }
}
