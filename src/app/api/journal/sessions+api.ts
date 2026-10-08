import { assertSelf } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { broadcastEvent } from '../../../lib/eventBus';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    const where: any = {};
    if (roomId && roomId !== 'all') {
      where.roomId = roomId;
    }

    const sessions = await prisma.campaignSession.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        notes: {
          include: {
            author: {
              select: { name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return Response.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, authorId, roomId } = await req.json();
    const denied = await assertSelf(req, authorId);
    if (denied) return denied;
    if (!title || !authorId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: authorId } });
    if (!user || user.role !== 'DM') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const newSession = await prisma.campaignSession.create({
      data: {
        title,
        roomId: roomId || user.roomId || null,
      },
      include: {
        notes: true,
      }
    });

    broadcastEvent({ type: 'JOURNAL_SESSION_CREATED', id: newSession.id, data: newSession });
    return Response.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { sessionId, title, userId } = await req.json();
    const denied = await assertSelf(req, userId);
    if (denied) return denied;
    if (!sessionId || !title || !userId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'DM') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedSession = await prisma.campaignSession.update({
      where: { id: sessionId },
      data: { title },
    });

    broadcastEvent({ type: 'JOURNAL_SESSION_UPDATED', id: sessionId, data: updatedSession });
    return Response.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { sessionId, userId } = await req.json();
    const denied = await assertSelf(req, userId);
    if (denied) return denied;
    if (!sessionId || !userId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'DM') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.journalNote.deleteMany({ where: { sessionId } });
    await prisma.campaignSession.delete({ where: { id: sessionId } });

    broadcastEvent({ type: 'JOURNAL_SESSION_DELETED', id: sessionId });
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
