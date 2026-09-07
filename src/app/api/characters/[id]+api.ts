import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/eventBus';

function toSafeNumber(val: any, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function toOptionalNumber(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function extractId(context: any): string {
  if (typeof context === 'string') return context;
  const raw = context?.id ?? context?.params?.id;
  return typeof raw === 'string' ? raw : String(raw || '');
}

export async function PUT(request: Request, context: any) {
  const id = extractId(context);
  try {
    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.$transaction(async (tx) => {
      // Se as condições foram modificadas
      if (body.conditions && Array.isArray(body.conditions)) {
        await tx.condition.deleteMany({ where: { characterId: id } });
        if (body.conditions.length > 0) {
          await tx.condition.createMany({
            data: body.conditions.map((c: any) => ({
              name: String(c.name || ''),
              description: c.description || '',
              characterId: id,
            })),
          });
        }
      }

      // Se habilidades foram modificadas (sincronização in-place para preservar integridade e concorrência)
      if (body.abilities && Array.isArray(body.abilities)) {
        const existingAbilities = await tx.ability.findMany({ where: { characterId: id } });
        const existingMap = new Map(existingAbilities.map((a) => [a.id, a]));
        const incomingIds = new Set<string>();
        const toCreate: any[] = [];

        for (const ab of body.abilities) {
          const abId =
            typeof ab.id === 'string' && ab.id.length > 20 && !ab.id.startsWith('ab-')
              ? ab.id
              : undefined;
          const max = toSafeNumber(ab.maxUses, 1);
          const cur =
            ab.currentUses !== undefined && ab.currentUses !== null && !isNaN(Number(ab.currentUses))
              ? Number(ab.currentUses)
              : max;

          if (abId && existingMap.has(abId)) {
            incomingIds.add(abId);
            const existing = existingMap.get(abId)!;
            const hasChanged =
              existing.currentUses !== cur ||
              existing.maxUses !== max ||
              existing.name !== String(ab.name || 'Habilidade') ||
              existing.description !== (ab.description || '') ||
              existing.resetType !== (ab.resetType || 'SHORT_REST') ||
              existing.actionType !== (ab.actionType || 'LIVRE');

            if (hasChanged) {
              await tx.ability.update({
                where: { id: abId },
                data: {
                  name: String(ab.name || 'Habilidade'),
                  description: ab.description || '',
                  maxUses: max,
                  currentUses: cur,
                  resetType: ab.resetType || 'SHORT_REST',
                  actionType: ab.actionType || 'LIVRE',
                },
              });
            }
          } else {
            toCreate.push({
              ...(abId ? { id: abId } : {}),
              name: String(ab.name || 'Habilidade'),
              description: ab.description || '',
              maxUses: max,
              currentUses: cur,
              resetType: ab.resetType || 'SHORT_REST',
              actionType: ab.actionType || 'LIVRE',
              characterId: id,
            });
          }
        }

        if (toCreate.length > 0) {
          await tx.ability.createMany({ data: toCreate });
        }

        const toDelete = existingAbilities
          .filter((a) => !incomingIds.has(a.id))
          .map((a) => a.id);
        if (toDelete.length > 0) {
          await tx.ability.deleteMany({ where: { id: { in: toDelete } } });
        }
      }

      // Se slots de magia foram modificados
      if (body.spellSlots && Array.isArray(body.spellSlots)) {
        const existingSlots = await tx.spellSlot.findMany({ where: { characterId: id } });
        const existingMap = new Map(existingSlots.map((s) => [s.id, s]));
        const incomingIds = new Set<string>();
        const toCreate: any[] = [];

        for (const slot of body.spellSlots) {
          const slotId =
            typeof slot.id === 'string' && slot.id.length > 20 && !slot.id.startsWith('slot-')
              ? slot.id
              : undefined;

          if (slotId && existingMap.has(slotId)) {
            incomingIds.add(slotId);
            const existing = existingMap.get(slotId)!;
            const total = Math.max(0, toSafeNumber(slot.total, 0));
            const used = Math.max(0, toSafeNumber(slot.used, 0));
            const level = toSafeNumber(slot.level, 1);

            if (existing.used !== used || existing.total !== total || existing.level !== level) {
              await tx.spellSlot.update({
                where: { id: slotId },
                data: { level, total, used },
              });
            }
          } else {
            toCreate.push({
              ...(slotId ? { id: slotId } : {}),
              level: toSafeNumber(slot.level, 1),
              total: Math.max(0, toSafeNumber(slot.total, 0)),
              used: Math.max(0, toSafeNumber(slot.used, 0)),
              characterId: id,
            });
          }
        }

        if (toCreate.length > 0) {
          await tx.spellSlot.createMany({ data: toCreate });
        }

        const toDelete = existingSlots
          .filter((s) => !incomingIds.has(s.id))
          .map((s) => s.id);
        if (toDelete.length > 0) {
          await tx.spellSlot.deleteMany({ where: { id: { in: toDelete } } });
        }
      }

      // Se itens de inventário foram modificados
      if (body.items && Array.isArray(body.items)) {
        const existingItems = await tx.item.findMany({ where: { characterId: id } });
        const existingMap = new Map(existingItems.map((i) => [i.id, i]));
        const incomingIds = new Set<string>();
        const toCreate: any[] = [];

        for (const item of body.items) {
          const itemId =
            typeof item.id === 'string' && item.id.length > 20 && !item.id.startsWith('item-')
              ? item.id
              : undefined;

          if (itemId && existingMap.has(itemId)) {
            incomingIds.add(itemId);
            const existing = existingMap.get(itemId)!;
            const hasChanged =
              existing.isEquipped !== !!item.isEquipped ||
              existing.quantity !== Math.max(1, toSafeNumber(item.quantity, 1)) ||
              existing.name !== String(item.name || 'Item') ||
              existing.description !== (item.description || '') ||
              existing.weight !== toSafeNumber(item.weight, 0) ||
              existing.isWeapon !== !!item.isWeapon ||
              existing.damage !== (item.damage || '') ||
              existing.isArmor !== !!item.isArmor ||
              existing.armorClassBonus !== toSafeNumber(item.armorClassBonus, 0);

            if (hasChanged) {
              await tx.item.update({
                where: { id: itemId },
                data: {
                  name: String(item.name || 'Item'),
                  description: item.description || '',
                  weight: toSafeNumber(item.weight, 0),
                  quantity: Math.max(1, toSafeNumber(item.quantity, 1)),
                  isWeapon: !!item.isWeapon,
                  damage: item.damage || '',
                  isArmor: !!item.isArmor,
                  isEquipped: !!item.isEquipped,
                  armorClassBonus: toSafeNumber(item.armorClassBonus, 0),
                },
              });
            }
          } else {
            toCreate.push({
              ...(itemId ? { id: itemId } : {}),
              name: String(item.name || 'Item'),
              description: item.description || '',
              weight: toSafeNumber(item.weight, 0),
              quantity: Math.max(1, toSafeNumber(item.quantity, 1)),
              isWeapon: !!item.isWeapon,
              damage: item.damage || '',
              isArmor: !!item.isArmor,
              isEquipped: !!item.isEquipped,
              armorClassBonus: toSafeNumber(item.armorClassBonus, 0),
              characterId: id,
            });
          }
        }

        if (toCreate.length > 0) {
          await tx.item.createMany({ data: toCreate });
        }

        const toDelete = existingItems
          .filter((i) => !incomingIds.has(i.id))
          .map((i) => i.id);
        if (toDelete.length > 0) {
          await tx.item.deleteMany({ where: { id: { in: toDelete } } });
        }
      }

      // Se magias foram modificadas (sincronização in-place protegida contra conflito de PK)
      if (body.spells && Array.isArray(body.spells)) {
        const existingSpells = await tx.spell.findMany({ where: { characterId: id } });
        const existingMap = new Map(existingSpells.map((s) => [s.id, s]));
        const incomingIds = new Set<string>();
        const toCreate: any[] = [];

        for (const s of body.spells) {
          const sId =
            typeof s.id === 'string' && s.id.length > 20 && !s.id.startsWith('spell-')
              ? s.id
              : undefined;

          if (sId && existingMap.has(sId)) {
            incomingIds.add(sId);
            const existing = existingMap.get(sId)!;
            const hasChanged =
              existing.isPrepared !== !!s.isPrepared ||
              existing.name !== String(s.name || 'Magia') ||
              existing.level !== toSafeNumber(s.level, 0) ||
              existing.castingTime !== (s.castingTime || '') ||
              existing.range !== (s.range || '') ||
              existing.duration !== (s.duration || '') ||
              existing.components !== (s.components || '') ||
              existing.description !== (s.description || '');

            if (hasChanged) {
              await tx.spell.update({
                where: { id: sId },
                data: {
                  name: String(s.name || 'Magia'),
                  level: toSafeNumber(s.level, 0),
                  castingTime: s.castingTime || '',
                  range: s.range || '',
                  duration: s.duration || '',
                  components: s.components || '',
                  isPrepared: !!s.isPrepared,
                  description: s.description || '',
                },
              });
            }
          } else {
            toCreate.push({
              ...(sId ? { id: sId } : {}),
              name: String(s.name || 'Magia'),
              level: toSafeNumber(s.level, 0),
              castingTime: s.castingTime || '',
              range: s.range || '',
              duration: s.duration || '',
              components: s.components || '',
              isPrepared: !!s.isPrepared,
              description: s.description || '',
              characterId: id,
            });
          }
        }

        if (toCreate.length > 0) {
          await tx.spell.createMany({ data: toCreate });
        }

        const toDelete = existingSpells
          .filter((s) => !incomingIds.has(s.id))
          .map((s) => s.id);
        if (toDelete.length > 0) {
          await tx.spell.deleteMany({ where: { id: { in: toDelete } } });
        }
      }

      return await tx.character.update({
        where: { id },
        data: {
          currentHp: toOptionalNumber(body.currentHp),
          maxHp: toOptionalNumber(body.maxHp),
          tempHp: toOptionalNumber(body.tempHp),
          hitDiceSpent: toOptionalNumber(body.hitDiceSpent),
          deathSaveSuccesses: toOptionalNumber(body.deathSaveSuccesses),
          deathSaveFailures: toOptionalNumber(body.deathSaveFailures),
          armorClass: toOptionalNumber(body.armorClass),
          initiativeBonus: toOptionalNumber(body.initiativeBonus),
          speed: body.speed !== undefined ? String(body.speed) : undefined,
          hitDiceType: body.hitDiceType !== undefined ? String(body.hitDiceType) : undefined,
          hitDiceTotal: toOptionalNumber(body.hitDiceTotal),
          name: body.name !== undefined ? String(body.name) : undefined,
          playerName: body.playerName !== undefined ? String(body.playerName) : undefined,
          race: body.race !== undefined ? String(body.race) : undefined,
          class: body.class !== undefined ? String(body.class) : undefined,
          level: toOptionalNumber(body.level),
          alignment: body.alignment !== undefined ? String(body.alignment) : undefined,
          background: body.background !== undefined ? String(body.background) : undefined,
          deity: body.deity !== undefined ? String(body.deity) : undefined,
          lore: body.lore !== undefined ? String(body.lore) : undefined,
          gold: toOptionalNumber(body.gold),
          silver: toOptionalNumber(body.silver),
          copper: toOptionalNumber(body.copper),
          themeColor: body.themeColor !== undefined ? String(body.themeColor) : undefined,
          proficientSkills: body.proficientSkills !== undefined ? String(body.proficientSkills) : undefined,
          username: body.username !== undefined ? String(body.username) : undefined,
          str: toOptionalNumber(body.str),
          dex: toOptionalNumber(body.dex),
          con: toOptionalNumber(body.con),
          int: toOptionalNumber(body.int),
          wis: toOptionalNumber(body.wis),
          cha: toOptionalNumber(body.cha),
          strProf: body.strProf !== undefined ? Boolean(body.strProf) : undefined,
          dexProf: body.dexProf !== undefined ? Boolean(body.dexProf) : undefined,
          conProf: body.conProf !== undefined ? Boolean(body.conProf) : undefined,
          intProf: body.intProf !== undefined ? Boolean(body.intProf) : undefined,
          wisProf: body.wisProf !== undefined ? Boolean(body.wisProf) : undefined,
          chaProf: body.chaProf !== undefined ? Boolean(body.chaProf) : undefined,
          sorceryPoints: toOptionalNumber(body.sorceryPoints),
          maxSorceryPoints: toOptionalNumber(body.maxSorceryPoints),
          kiPoints: toOptionalNumber(body.kiPoints),
          maxKiPoints: toOptionalNumber(body.maxKiPoints),
        },
        include: {
          spellSlots: { orderBy: { level: 'asc' } },
          spells: { orderBy: { level: 'asc' } },
          abilities: true,
          conditions: true,
          items: true,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    broadcastEvent({ type: 'CHARACTER_UPDATED', id, data: updated });
    return Response.json(updated);
  } catch (error) {
    console.error(`Erro no Prisma PUT /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao atualizar personagem' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const id = extractId(context);
  try {
    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    await prisma.character.delete({ where: { id } });
    broadcastEvent({ type: 'CHARACTER_DELETED', id });
    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro no Prisma DELETE /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao deletar personagem' }, { status: 500 });
  }
}

