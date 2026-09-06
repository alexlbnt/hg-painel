import { prisma } from '../../../lib/prisma';
import { broadcastEvent } from '../../../lib/eventBus';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduledSessionId, userId, status, note } = body;

    if (!scheduledSessionId || !userId || !status) {
      return Response.json({ error: 'Dados incompletos para confirmação de presença' }, { status: 400 });
    }

    if (!['CONFIRMED', 'MAYBE', 'DECLINED'].includes(status)) {
      return Response.json({ error: 'Status de presença inválido' }, { status: 400 });
    }

    // Verifica se a sessão existe
    const session = await prisma.scheduledSession.findUnique({
      where: { id: scheduledSessionId },
    });

    if (!session) {
      return Response.json({ error: 'Sessão agendada não encontrada' }, { status: 404 });
    }

    // Upsert do RSVP
    const rsvp = await prisma.sessionRsvp.upsert({
      where: {
        scheduledSessionId_userId: {
          scheduledSessionId,
          userId,
        },
      },
      update: {
        status,
        note: note !== undefined ? note : '',
      },
      create: {
        scheduledSessionId,
        userId,
        status,
        note: note !== undefined ? note : '',
      },
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
    });

    broadcastEvent({ type: 'RSVP_UPDATED', data: rsvp });
    return Response.json(rsvp, { status: 200 });
  } catch (error) {
    console.error('Erro ao salvar confirmação de presença (RSVP):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
