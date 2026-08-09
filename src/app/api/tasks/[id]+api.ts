import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('PUT BODY:', body);
    
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status,
        reward: body.reward,
        resolution: body.resolution,
        assignedTo: body.assignedTo,
      },
    });

    return Response.json(updatedTask);
  } catch (error) {
    console.error('Erro no Prisma PUT /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao atualizar a task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, params: { id: string }) {
  try {
    const { id } = params;
    await prisma.task.delete({
      where: { id },
    });
    return Response.json({ message: 'Task deletada com sucesso' });
  } catch (error) {
    console.error('Erro no Prisma DELETE /api/tasks/[id]:', error);
    return Response.json({ error: 'Falha ao deletar a task' }, { status: 500 });
  }
}
