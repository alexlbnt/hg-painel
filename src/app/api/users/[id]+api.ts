import { prisma } from '../../../lib/prisma';
import { broadcastEvent } from '../../../lib/eventBus';
import { getAuthenticatedUser, unauthorized } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

export async function GET(req: Request, context: any) {
  try {
    const id = extractId(context);
    if (!id) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        roomId: true,
        avatarUrl: true,
        bio: true,
        isSuperDm: true,
        room: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return Response.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const requester = await getAuthenticatedUser(req);
    if (!requester) return unauthorized();

    // Apenas o Mestre pode alterar permissões (role)
    if (body.role !== undefined) {
      if (!requester || requester.role !== 'DM') {
        return Response.json({ error: 'Apenas o Mestre pode alterar cargos de usuários' }, { status: 403 });
      }
    }

    // Apenas o próprio usuário ou o Mestre podem alterar nome, bio e foto
    if (body.name !== undefined || body.bio !== undefined || body.avatarUrl !== undefined) {
      if (!requester || (requester.id !== existing.id && requester.role !== 'DM')) {
        return Response.json({ error: 'Sem permissão para alterar os dados deste perfil' }, { status: 403 });
      }
    }

    // Alteração de Senha Segura
    if (body.password) {
      if (!requester) {
        return Response.json({ error: 'Identificação necessária para alterar senha' }, { status: 401 });
      }

      const isSelf = requester.id === existing.id;
      const isDm = requester.role === 'DM';

      if (!isSelf && !isDm) {
        return Response.json({ error: 'Sem permissão para alterar a senha deste usuário' }, { status: 403 });
      }

      // Se o usuário está alterando a própria senha, exige a senha atual
      if (isSelf && !isDm) {
        if (!body.currentPassword) {
          return Response.json(
            { error: 'Informe sua senha atual para definir uma nova senha' },
            { status: 400 }
          );
        }
        const isCurrentValid = await bcrypt.compare(body.currentPassword, existing.password);
        if (!isCurrentValid) {
          return Response.json({ error: 'Senha atual incorreta' }, { status: 401 });
        }
      }
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.role !== undefined) {
      if (['PLAYER', 'MECHANIC', 'DM'].includes(body.role)) {
        dataToUpdate.role = body.role;
      }
    }
    if (body.roomId !== undefined) {
      if (!requester || requester.role !== 'DM') {
        return Response.json({ error: 'Apenas o Mestre pode alterar a mesa vinculada do usuário' }, { status: 403 });
      }
      dataToUpdate.roomId = body.roomId ? String(body.roomId) : null;
    }
    if (body.bio !== undefined) dataToUpdate.bio = String(body.bio).trim();
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = String(body.avatarUrl).trim();
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
        roomId: true,
        avatarUrl: true,
        bio: true,
        room: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Sincronizar nome e vínculo de userId nos personagens deste usuário
    try {
      await prisma.character.updateMany({
        where: {
          OR: [
            { userId: id },
            { username: { equals: updatedUser.username, mode: 'insensitive' } },
          ],
        },
        data: {
          playerName: updatedUser.name,
          userId: id,
        },
      });
    } catch (charSyncErr) {
      console.warn('Aviso: falha ao sincronizar personagens com dados do usuário:', charSyncErr);
    }

    broadcastEvent({ type: 'USER_UPDATED', id: updatedUser.id, data: updatedUser });
    broadcastEvent({ type: 'CHARACTER_UPDATED', id: updatedUser.id, data: updatedUser });

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

    const requester = await getAuthenticatedUser(req);
    if (!requester) return unauthorized('Identificação necessária para excluir usuários');
    if (requester.role !== 'DM') {
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
