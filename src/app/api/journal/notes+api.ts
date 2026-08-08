import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { content, authorId, sessionId } = await req.json();

    if (!content || !authorId || !sessionId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newNote = await prisma.journalNote.create({
      data: {
        content,
        authorId,
        sessionId,
      },
      include: {
        author: {
          select: { name: true, role: true },
        },
      },
    });

    return Response.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { noteId, userId } = await req.json();

    if (!noteId || !userId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const note = await prisma.journalNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.role !== 'DM' && note.authorId !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.journalNote.delete({
      where: { id: noteId },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting note:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { noteId, userId, content } = await req.json();

    if (!noteId || !userId || !content) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const note = await prisma.journalNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only the author can edit their own notes, or DM
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'DM' && note.authorId !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedNote = await prisma.journalNote.update({
      where: { id: noteId },
      data: { content },
    });

    return Response.json(updatedNote, { status: 200 });
  } catch (error) {
    console.error('Error updating note:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
