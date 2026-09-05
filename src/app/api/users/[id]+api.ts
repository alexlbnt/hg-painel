import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request, context: any) {
  try {
    const id = context?.id || context?.params?.id;
    if (!id) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }
    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.role !== undefined) {
      if (['PLAYER', 'MECHANIC', 'DM'].includes(body.role)) {
        dataToUpdate.role = body.role;
      }
    }
    if (body.password) {
      dataToUpdate.password = bcrypt.hashSync(body.password, 10);
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
    const id = context?.id || context?.params?.id;
    if (!id) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.journalNote.deleteMany({ where: { authorId: id } });
    await prisma.user.delete({ where: { id } });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
