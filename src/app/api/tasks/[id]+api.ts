import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

export async function PUT(request: Request, context: any) {
  try {
    const id = extractId(context);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title) : undefined,
        description: body.description !== undefined ? String(body.description) : undefined,
        category: body.category,
        status: body.status,
        reward: body.reward !== undefined ? String(body.reward) : undefined,
        resolution: body.resolution !== undefined ? String(body.resolution) : undefined,
        assignedTo: body.assignedTo !== undefined ? body.assignedTo : undefined,
      },
    });

    broadcastEvent({ type: 'TASK_UPDATED', id, data: updatedTask });
    return Response.json(updatedTask);
  } catch (error) {
    console.error('Erro no Prisma PUT /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao atualizar a task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const id = extractId(context);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
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

