import { prisma } from '../../../lib/prisma';
import { createAuthToken } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = createAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return Response.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      roomId: user.roomId,
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      isSuperDm: user.isSuperDm,
      token,
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
