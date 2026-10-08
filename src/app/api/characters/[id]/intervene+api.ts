import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';
import { getAuthenticatedUser, unauthorized, forbidden } from '@/lib/auth';
import { CHARACTER_INCLUDE, isElevatedRole } from '@/lib/characterAccess';
import { applyDamage, applyHeal } from '@/utils/combatRules';

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

type Action =
  | { type: 'DAMAGE' | 'HEAL' | 'TEMP_HP'; value?: number }
  | { type: 'ADD_CONDITION'; conditionName?: string; conditionDesc?: string }
  | { type: 'REMOVE_CONDITION'; conditionName?: string };

/**
 * POST /api/characters/:id/intervene  (Mestre/Mecânico)
 * Body: { type: DAMAGE | HEAL | TEMP_HP | ADD_CONDITION | REMOVE_CONDITION, value?, conditionName?, conditionDesc? }
 * Aplica o efeito de forma atômica sobre o estado atual do banco e registra no histórico da ficha.
 */
export async function POST(request: Request, context: any) {
  const id = extractId(context);
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return unauthorized();
    if (!isElevatedRole(authUser.role)) return forbidden('Apenas Mestre ou Mecânico podem intervir na ficha');

    const action = (await request.json()) as Action;

    const updated = await prisma.$transaction(async (tx) => {
      const char = await tx.character.findUnique({ where: { id } });
      if (!char) return null;

      let message = '';
      let kind: 'DAMAGE' | 'HEAL' | 'CONDITION' = 'CONDITION';
      let delta = 0;

      switch (action.type) {
        case 'DAMAGE': {
          const value = Math.max(0, Math.floor(Number(action.value) || 0));
          const next = applyDamage(char.currentHp, char.tempHp, value);
          await tx.character.update({ where: { id }, data: next });
          kind = 'DAMAGE';
          delta = -value;
          message = `Mestre causou ${value} de dano`;
          break;
        }
        case 'HEAL': {
          const value = Math.max(0, Math.floor(Number(action.value) || 0));
          const hp = applyHeal(char.currentHp, char.maxHp, value);
          await tx.character.update({ where: { id }, data: { currentHp: hp } });
          kind = 'HEAL';
          delta = hp - char.currentHp;
          message = `Mestre curou ${delta} PV`;
          break;
        }
        case 'TEMP_HP': {
          const value = Math.max(0, Math.floor(Number(action.value) || 0));
          await tx.character.update({ where: { id }, data: { tempHp: Math.max(char.tempHp, value) } });
          kind = 'HEAL';
          message = `Mestre concedeu ${value} PV temporários`;
          break;
        }
        case 'ADD_CONDITION': {
          const name = String(action.conditionName || 'Condição').slice(0, 80);
          await tx.condition.create({
            data: {
              characterId: id,
              name,
              description: String(action.conditionDesc || 'Aplicada pelo Mestre.').slice(0, 500),
            },
          });
          message = `Condição aplicada: ${name}`;
          break;
        }
        case 'REMOVE_CONDITION': {
          const name = String(action.conditionName || '');
          await tx.condition.deleteMany({ where: { characterId: id, name } });
          message = `Condição removida: ${name}`;
          break;
        }
        default:
          throw new Error('INVALID_ACTION');
      }

      await tx.characterLog.create({
        data: { characterId: id, kind, delta, message, authorId: authUser.id },
      });
      return tx.character.findUnique({ where: { id }, include: CHARACTER_INCLUDE });
    }, { timeout: 15000, maxWait: 10000 });

    if (!updated) return Response.json({ error: 'Personagem não encontrado' }, { status: 404 });

    broadcastEvent({ type: 'CHARACTER_UPDATED', id, data: updated });
    return Response.json(updated);
  } catch (error: any) {
    if (error?.message === 'INVALID_ACTION') return Response.json({ error: 'Ação inválida' }, { status: 400 });
    console.error(`Erro em POST /api/characters/${id}/intervene:`, error);
    return Response.json({ error: 'Falha ao aplicar intervenção' }, { status: 500 });
  }
}
