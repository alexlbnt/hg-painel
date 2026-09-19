import { prisma } from '../../lib/prisma';
import { broadcastEvent } from '../../lib/eventBus';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    const sessionWhere: any = { isActive: true };
    const userCountWhere: any = {};

    if (roomId && roomId !== 'all') {
      sessionWhere.roomId = roomId;
      userCountWhere.roomId = roomId;
    }

    // Busca a sessão agendada ativa mais recente da sala informada
    let session = await prisma.scheduledSession.findFirst({
      where: sessionWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: { updatedAt: 'asc' },
        },
      },
    });

    // Fallback: se não encontrou sessão na sala específica, busca qualquer ativa
    if (!session && roomId) {
      session = await prisma.scheduledSession.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          rsvps: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true,
                },
              },
            },
            orderBy: { updatedAt: 'asc' },
          },
        },
      });
    }

    // Total de usuários cadastrados da mesa (ou geral)
    const totalUsers = await prisma.user.count({ where: userCountWhere });

    if (!session) {
      return Response.json({
        session: null,
        totalUsers,
      }, { status: 200 });
    }

    const confirmed = session.rsvps.filter((r) => r.status === 'CONFIRMED');
    const maybe = session.rsvps.filter((r) => r.status === 'MAYBE');
    const declined = session.rsvps.filter((r) => r.status === 'DECLINED');

    return Response.json({
      session,
      quorum: {
        confirmedCount: confirmed.length,
        maybeCount: maybe.length,
        declinedCount: declined.length,
        totalUsers,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar próxima sessão agendada:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, scheduledAt, location, description, userId, resetRsvps, roomId } = body;

    if (!userId) {
      return Response.json({ error: 'Usuário não informado' }, { status: 400 });
    }

    // Apenas Mestre (DM) ou Mecânico (MECHANIC) podem agendar
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'DM' && user.role !== 'MECHANIC')) {
      return Response.json({ error: 'Apenas o Mestre ou Mecânico podem definir a próxima sessão' }, { status: 403 });
    }

    const targetRoomId = roomId || user.roomId || null;

    // Procura se já existe uma sessão ativa desta sala para atualizar
    const activeWhere: any = { isActive: true };
    if (targetRoomId) {
      activeWhere.roomId = targetRoomId;
    }

    let activeSession = await prisma.scheduledSession.findFirst({
      where: activeWhere,
      orderBy: { createdAt: 'desc' },
    });

    const parsedDate = scheduledAt ? new Date(scheduledAt) : null;

    if (activeSession) {
      // Se solicitou resetar as presenças (ex: mudou de data)
      if (resetRsvps) {
        await prisma.sessionRsvp.deleteMany({
          where: { scheduledSessionId: activeSession.id },
        });
      }

      activeSession = await prisma.scheduledSession.update({
        where: { id: activeSession.id },
        data: {
          title: title !== undefined ? title : activeSession.title,
          scheduledAt: parsedDate !== null ? parsedDate : activeSession.scheduledAt,
          location: location !== undefined ? location : activeSession.location,
          description: description !== undefined ? description : activeSession.description,
          roomId: targetRoomId !== null ? targetRoomId : activeSession.roomId,
          isActive: true,
        },
      });
    } else {
      activeSession = await prisma.scheduledSession.create({
        data: {
          title: title || 'Próxima Sessão',
          scheduledAt: parsedDate,
          location: location || 'Discord - Canal Honra & Egoísmo',
          description: description || '',
          roomId: targetRoomId,
          isActive: true,
        },
      });
    }

    broadcastEvent({ type: 'SCHEDULE_UPDATED', data: activeSession, roomId: targetRoomId });
    return Response.json(activeSession, { status: 200 });
  } catch (error) {
    console.error('Erro ao agendar sessão:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
