import { prisma } from '../src/lib/prisma';
import { INITIAL_TASKS } from '../src/lib/mockData';

async function uploadToGithub(task: any) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  
  if (!token || !owner || !repo) {
    console.warn('Variáveis de ambiente do GitHub ausentes (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO). O upload foi ignorado.');
    return;
  }

  const safeTitle = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = `Tasks/${task.category}/${safeTitle}-${task.id.slice(-6)}.json`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // @ts-ignore
  const content = Buffer.from(JSON.stringify(task, null, 2)).toString('base64');

  try {
    let sha = undefined;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Honra-Egoismo-RPG'
      }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Honra-Egoismo-RPG'
      },
      body: JSON.stringify({
        message: `RPG: Task Aprovada - ${task.title}`,
        content: content,
        sha: sha
      })
    });

    if (!putRes.ok) {
      console.error('Falha ao subir pro GitHub:', await putRes.text());
    } else {
      console.log('Task subida pro GitHub com sucesso:', path);
    }
  } catch (error) {
    console.error('Erro na requisição ao GitHub:', error);
  }
}

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
