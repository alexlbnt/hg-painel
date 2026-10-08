import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized } from '@/lib/auth';

const sig = (agg: { _count: { _all: number }; _max: { updatedAt: Date | null } }) =>
  `${agg._count._all}:${agg._max.updatedAt ? agg._max.updatedAt.getTime() : 0}`;

/**
 * GET /api/sync
 * Assinatura leve (contagem + última atualização) de cada domínio, lida direto do banco.
 * Serve de "tempo real" confiável em ambientes serverless (Vercel), onde o SSE em memória
 * não alcança clientes conectados a outras instâncias: o cliente consulta periodicamente
 * e só recarrega os dados do domínio cuja assinatura mudou.
 */
export async function GET(request: Request) {
  try {
    if (!(await getAuthenticatedUser(request))) return unauthorized();

    const [characters, tasks, sessions, notes, schedule, rsvps] = await Promise.all([
      prisma.character.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.task.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.campaignSession.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.journalNote.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.scheduledSession.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.sessionRsvp.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    ]);

    return Response.json(
      {
        characters: sig(characters),
        tasks: sig(tasks),
        journal: `${sig(sessions)}|${sig(notes)}`,
        schedule: `${sig(schedule)}|${sig(rsvps)}`,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erro em GET /api/sync:', error);
    return Response.json({ error: 'Falha ao consultar sincronização' }, { status: 500 });
  }
}
