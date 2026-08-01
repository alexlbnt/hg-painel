import { prisma } from '../../src/lib/prisma';

// Reusing uploadToGithub for Aprovado trigger
async function uploadToGithub(task: any) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  
  if (!token || !owner || !repo) {
    console.warn('Variáveis de ambiente do GitHub ausentes. Upload ignorado.');
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
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID da task inválido' });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const updated = await prisma.task.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
          category: body.category,
          status: body.status,
          reward: body.reward,
          assignedTo: body.assignedTo !== undefined ? body.assignedTo : undefined,
        },
      });

      // Se o status acabou de mudar para APROVADO, envia para o GitHub
      if (body.status === 'APROVADO') {
        // Como o backend Vercel é assíncrono e ephemeral, é recomendado 
        // aguardar a promessa ou deixar rodar em background. 
        // Vamos aguardar para garantir.
        await uploadToGithub(updated);
      }

      return res.status(200).json(updated);
    } catch (error) {
      console.error(`Erro no Prisma PUT /api/tasks/${id}:`, error);
      return res.status(500).json({ error: 'Falha ao atualizar task' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.task.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Erro no Prisma DELETE /api/tasks/${id}:`, error);
      return res.status(500).json({ error: 'Falha ao deletar task' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
