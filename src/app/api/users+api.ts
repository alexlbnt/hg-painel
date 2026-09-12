import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
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
    const { name, username, password, role } = await req.json();

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

    const requesterId = req.headers.get('x-user-id');
    let validRole: 'PLAYER' | 'MECHANIC' | 'DM' = 'PLAYER';

    if (role === 'DM' || role === 'MECHANIC') {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        // Permite primeiro usuário do sistema ser configurado como DM
        validRole = role;
      } else {
        if (!requesterId) {
          return Response.json(
            { error: 'Apenas o Mestre da Campanha pode criar usuários com cargo especial' },
            { status: 403 }
          );
        }
        const requester = await prisma.user.findUnique({ where: { id: requesterId } });
        if (!requester || requester.role !== 'DM') {
          return Response.json(
            { error: 'Apenas o Mestre da Campanha pode criar usuários com cargo especial' },
            { status: 403 }
          );
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
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
