import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';
import { getAuthenticatedUser, unauthorized, forbidden } from '@/lib/auth';

const DEFAULT_ROOMS = [
  {
    code: 'MESA-ALEX',
    name: 'Mesa Alex',
    dmName: 'Alex (Mestre)',
    dmUsername: 'alex.g',
  },
  {
    code: 'MESA-JOAO',
    name: 'Mesa João',
    dmName: 'João (Mestre)',
    dmUsername: 'joao.c',
  },
  {
    code: 'MESA-LOBO',
    name: 'Mesa Lobo',
    dmName: 'Lobo (Mestre)',
    dmUsername: 'lobo.l',
  },
];

export async function GET() {
  try {
    let rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { characters: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Se por algum motivo o banco estiver sem salas, inicializa as 3 mesas padrão
    if (rooms.length === 0) {
      for (const r of DEFAULT_ROOMS) {
        await prisma.room.create({
          data: r,
        });
      }
      rooms = await prisma.room.findMany({
        include: {
          _count: {
            select: { characters: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return Response.json(rooms, { status: 200 });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return Response.json({ error: 'Falha ao buscar mesas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return unauthorized();
    if (authUser.role !== 'DM') return forbidden('Apenas Mestres podem criar mesas');

    const body = await req.json();
    const { name, code, dmName, dmUsername } = body;

    if (!name || !code) {
      return Response.json({ error: 'Nome e código da mesa são obrigatórios' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = await prisma.room.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return Response.json({ error: 'Código de mesa já em uso' }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        dmName: dmName ? dmName.trim() : 'Mestre',
        dmUsername: dmUsername ? dmUsername.toLowerCase().trim() : null,
      },
      include: {
        _count: {
          select: { characters: true },
        },
      },
    });

    broadcastEvent({
      type: 'ROOM_CREATED',
      room,
    });

    return Response.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return Response.json({ error: 'Falha ao criar mesa' }, { status: 500 });
  }
}
