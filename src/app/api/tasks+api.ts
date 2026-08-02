import { prisma } from '@/lib/prisma';
import { INITIAL_TASKS } from '@/lib/mockData';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (tasks.length === 0) {
      for (const t of INITIAL_TASKS) {
        await prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            category: t.category,
            status: t.status,
            reward: t.reward,
            assignedTo: t.assignedTo,
          },
        });
      }
      const newTasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return Response.json(newTasks);
    }
    return Response.json(tasks);
  } catch (error) {
    console.error('Erro no Prisma GET /api/tasks:', error);
    return Response.json({ error: 'Falha ao conectar no banco de dados' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        title: body.title || 'Nova Tarefa',
        description: body.description || '',
        category: body.category || 'LORE',
        status: body.status || 'PARADO',
        reward: body.reward || '',
        resolution: body.resolution || '',
        assignedTo: body.assignedTo || null,
      },
    });
    return Response.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Erro no Prisma POST /api/tasks:', error);
    return Response.json({ error: 'Falha ao criar task' }, { status: 500 });
  }
}
