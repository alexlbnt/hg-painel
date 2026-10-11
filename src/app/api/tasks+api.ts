import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';
import { unauthorized } from '@/lib/auth';
import { getTaskActor } from '@/lib/taskActor';
import { planTaskCreate } from '@/lib/taskRules';

export async function GET(request: Request) {
  try {
    if (!(await getTaskActor(request))) return unauthorized();
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return Response.json(tasks);
  } catch (error) {
    console.error('Erro no Prisma GET /api/tasks:', error);
    return Response.json({ error: 'Falha ao conectar no banco de dados' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getTaskActor(request);
    if (!actor) {
      return unauthorized('Identificação necessária para sugerir ou criar tarefas na mesa');
    }

    const body = await request.json().catch(() => ({}));
    // Status, autoria e responsável são definidos pelo servidor, nunca pelo cliente
    const plan = planTaskCreate(actor, body);
    if (!plan.ok) return Response.json({ error: plan.error }, { status: plan.status });

    const newTask = await prisma.task.create({
      data: {
        title: plan.changes.title!,
        description: plan.changes.description!,
        category: plan.changes.category,
        status: plan.changes.status,
        reward: plan.changes.reward,
        createdById: plan.changes.createdById,
        createdByName: plan.changes.createdByName,
      },
    });
    broadcastEvent({ type: 'TASK_CREATED', id: newTask.id, data: newTask });
    return Response.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Erro no Prisma POST /api/tasks:', error);
    return Response.json({ error: 'Falha ao criar task' }, { status: 500 });
  }
}
