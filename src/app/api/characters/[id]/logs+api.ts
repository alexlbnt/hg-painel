import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, unauthorized } from '@/lib/auth';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

/** GET /api/characters/:id/logs?kind=REST&limit=50 — histórico de eventos da ficha (mais recentes primeiro). */
export async function GET(request: Request, context: any) {
  const id = extractId(context);
  try {
    if (!(await getAuthenticatedUser(request))) return unauthorized();

    const url = new URL(request.url);
    const kind = url.searchParams.get('kind') || undefined;
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50));

    const logs = await prisma.characterLog.findMany({
      where: { characterId: id, ...(kind ? { kind } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return Response.json(logs);
  } catch (error) {
    console.error(`Erro em GET /api/characters/${id}/logs:`, error);
    return Response.json({ error: 'Falha ao buscar histórico' }, { status: 500 });
  }
}
