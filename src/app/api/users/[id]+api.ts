import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

export async function PATCH(req: Request, context: any) {
  try {
    const id = extractId(context);
    if (!id) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const requesterId = req.headers.get('x-user-id') || body.requesterId;

    // Apenas o Mestre pode alterar permissões (role)
    if (body.role !== undefined) {
      if (!requesterId) {
        return Response.json({ error: 'Identificação necessária para alterar permissões' }, { status: 401 });
      }
      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      if (!requester || requester.role !== 'DM') {
        return Response.json({ error: 'Apenas o Mestre pode alterar cargos de usuários' }, { status: 403 });
      }
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.role !== undefined) {
      if (['PLAYER', 'MECHANIC', 'DM'].includes(body.role)) {
        dataToUpdate.role = body.role;
      }
    }
    if (body.password) {
      dataToUpdate.password = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const id = extractId(context);
    if (!id) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const requesterId = req.headers.get('x-user-id');
    if (!requesterId) {
      return Response.json({ error: 'Identificação necessária para excluir usuários' }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'DM') {
      return Response.json({ error: 'Apenas o Mestre pode excluir usuários' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.sessionRsvp.deleteMany({ where: { userId: id } });
    await prisma.journalNote.deleteMany({ where: { authorId: id } });
    await prisma.user.delete({ where: { id } });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
