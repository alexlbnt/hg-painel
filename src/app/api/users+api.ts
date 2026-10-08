import { prisma } from '../../lib/prisma';
import { getAuthenticatedUser, unauthorized, forbidden } from '../../lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    if (!(await getAuthenticatedUser(req))) return unauthorized();
    const users = await prisma.user.findMany({
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
            dmUsername: true,
            dmName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return Response.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, username, password, role, roomId } = await req.json();

    if (!name || !username || !password) {
      return Response.json({ error: 'Nome, usuário e senha são obrigatórios' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return Response.json({ error: 'Nome de usuário já existe' }, { status: 409 });
    }

    const requester = await getAuthenticatedUser(req);
    let validRole: 'PLAYER' | 'MECHANIC' | 'DM' = 'PLAYER';

    if (role === 'DM' || role === 'MECHANIC') {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        // Permite primeiro usuário do sistema ser configurado como DM
        validRole = role;
      } else {
        if (!requester || requester.role !== 'DM') {
          return forbidden('Apenas o Mestre da Campanha pode criar usuários com cargo especial');
        }
        validRole = role;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        password: hashedPassword,
        role: validRole,
        roomId: roomId || undefined,
      },
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
      },
    });

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
