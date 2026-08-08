import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const sessions = await prisma.campaignSession.findMany({
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
    const { title, authorId } = await req.json();

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
      },
      include: {
        notes: true,
      }
    });

    return Response.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { sessionId, title, userId } = await req.json();

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

    return Response.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
