import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';
import { getAuthenticatedUser, unauthorized, forbidden } from '@/lib/auth';
import { CHARACTER_INCLUDE, canEditCharacter } from '@/lib/characterAccess';
import { longRestUpdates, shortRestUpdates } from '@/utils/combatRules';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

/**
 * POST /api/characters/:id/rest
 * Body: { type: 'SHORT' | 'LONG', healHp?: number, hitDice?: number }
 * Descanso aplicado de forma atômica no servidor (evita sobrescritas por cliques duplos/dispositivos concorrentes).
 */
export async function POST(request: Request, context: any) {
  const id = extractId(context);
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json().catch(() => ({}));
    const type = body.type === 'LONG' ? 'LONG' : body.type === 'SHORT' ? 'SHORT' : null;
    if (!type) return Response.json({ error: "Tipo de descanso inválido (use 'SHORT' ou 'LONG')" }, { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const char = await tx.character.findUnique({ where: { id } });
      if (!char) return null;
      if (!canEditCharacter(char, authUser)) throw new Error('FORBIDDEN');

      let message: string;
      let data: Record<string, number>;

      if (type === 'SHORT') {
        const healHp = Math.max(0, Math.floor(Number(body.healHp) || 0));
        const hitDice = Math.max(0, Math.floor(Number(body.hitDice) || 0));
        data = shortRestUpdates(char, healHp, hitDice);
        const abilities = await tx.ability.findMany({ where: { characterId: id, resetType: 'SHORT_REST' } });
        for (const ab of abilities) {
          await tx.ability.update({ where: { id: ab.id }, data: { currentUses: ab.maxUses } });
        }
        message = `Descanso Curto: +${data.currentHp - char.currentHp} PV, ${hitDice} dado(s) de vida gasto(s)`;
      } else {
        data = longRestUpdates(char);
        const abilities = await tx.ability.findMany({
          where: { characterId: id, resetType: { in: ['SHORT_REST', 'LONG_REST'] } },
        });
        for (const ab of abilities) {
          await tx.ability.update({ where: { id: ab.id }, data: { currentUses: ab.maxUses } });
        }
        await tx.spellSlot.updateMany({ where: { characterId: id }, data: { used: 0 } });
        message = 'Descanso Longo: PV, espaços de magia e habilidades restaurados';
      }

      await tx.character.update({ where: { id }, data });
      await tx.characterLog.create({
        data: { characterId: id, kind: 'REST', message, authorId: authUser.id },
      });
      return tx.character.findUnique({ where: { id }, include: CHARACTER_INCLUDE });
    }, { timeout: 15000, maxWait: 10000 });

    if (!updated) return Response.json({ error: 'Personagem não encontrado' }, { status: 404 });

    broadcastEvent({ type: 'CHARACTER_UPDATED', id, data: updated });
    return Response.json(updated);
  } catch (error: any) {
    if (error?.message === 'FORBIDDEN') return forbidden('Você não tem permissão para descansar por este personagem');
    console.error(`Erro em POST /api/characters/${id}/rest:`, error);
    return Response.json({ error: 'Falha ao aplicar descanso' }, { status: 500 });
  }
}
