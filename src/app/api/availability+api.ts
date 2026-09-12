import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // Formato do mês: YYYY-MM (ex: '2026-09')
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const month = url.searchParams.get('month') || currentYearMonth;

    // Busca todos os usuários da mesa (jogadores e mestres)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    // Busca todos os registros de disponibilidade para o mês consultado
    const records = await prisma.playerAvailability.findMany({
      where: {
        date: {
          startsWith: month,
        },
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
      orderBy: { date: 'asc' },
    });

    return Response.json({
      month,
      users,
      totalPlayers: users.length,
      records,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade de jogadores:', error);
    return Response.json({ error: 'Erro interno ao buscar disponibilidade' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, date, dates, month } = body;

    if (!userId) {
      return Response.json({ error: 'Usuário não informado' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Ação: Alternar disponibilidade para um único dia (clique na célula do calendário)
    if (action === 'TOGGLE') {
      if (!date) {
        return Response.json({ error: 'Data não informada' }, { status: 400 });
      }

      const existing = await prisma.playerAvailability.findUnique({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
      });

      let status: 'ADDED' | 'REMOVED';
      if (existing) {
        await prisma.playerAvailability.delete({
          where: { id: existing.id },
        });
        status = 'REMOVED';
      } else {
        await prisma.playerAvailability.create({
          data: {
            userId,
            date,
          },
        });
        status = 'ADDED';
      }

      broadcastEvent({
        type: 'AVAILABILITY_UPDATED',
        date,
        userId,
        status,
      });

      return Response.json({ success: true, status, date, userId }, { status: 200 });
    }

    // Ação: Configuração em lote (ex: marcar todos os fins de semana ou limpar o mês)
    if (action === 'BATCH_SET') {
      if (!month || !Array.isArray(dates)) {
        return Response.json({ error: 'Mês ou lista de datas inválidos' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.playerAvailability.deleteMany({
          where: {
            userId,
            date: { startsWith: month },
          },
        }),
        ...(dates.length > 0
          ? [
              prisma.playerAvailability.createMany({
                data: dates.map((d: string) => ({
                  userId,
                  date: d,
                })),
                skipDuplicates: true,
              }),
            ]
          : []),
      ]);

      broadcastEvent({
        type: 'AVAILABILITY_UPDATED',
        month,
        userId,
      });

      return Response.json({ success: true, month, count: dates.length }, { status: 200 });
    }

    return Response.json({ error: 'Ação desconhecida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao salvar disponibilidade:', error);
    return Response.json({ error: 'Erro interno ao salvar disponibilidade' }, { status: 500 });
  }
}
