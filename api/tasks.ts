import { prisma } from '../src/lib/prisma';
import { INITIAL_TASKS } from '../src/lib/mockData';


export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
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
        return res.status(200).json(newTasks);
      }
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Erro no Prisma GET /api/tasks:', error);
      return res.status(500).json({ error: 'Falha ao conectar no banco de dados' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
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
      return res.status(201).json(newTask);
    } catch (error) {
      console.error('Erro no Prisma POST /api/tasks:', error);
      return res.status(500).json({ error: 'Falha ao criar task' });
    }
  }

  // Next routes generally handle params via query in Vercel if configured, 
  // but if it's dynamic like /api/tasks/[id].ts we should do that there.
  // Wait, if we use /api/tasks/:id in express, but Vercel requires [id].ts for path params.
  // We can just accept the ID in the body for PUT/DELETE or create a dynamic route.
  // Let's create a dynamic route /api/tasks/[id].ts for PUT and DELETE!
  return res.status(405).json({ error: 'Method not allowed' });
}
