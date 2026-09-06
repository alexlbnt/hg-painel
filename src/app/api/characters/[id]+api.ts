import { prisma } from '@/lib/prisma';

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
    const body = await request.json();

    // Se as condições foram modificadas
    if (body.conditions && Array.isArray(body.conditions)) {
      await prisma.condition.deleteMany({ where: { characterId: id } });
      await prisma.condition.createMany({
        data: body.conditions.map((c: any) => ({
          name: String(c.name || ''),
          description: c.description || '',
          characterId: id,
        })),
      });
    }

    // Se habilidades ou slots forem atualizados
    if (body.abilities && Array.isArray(body.abilities)) {
      await prisma.ability.deleteMany({ where: { characterId: id } });
      if (body.abilities.length > 0) {
        await prisma.ability.createMany({
          data: body.abilities.map((ab: any) => {
            const max = toSafeNumber(ab.maxUses, 1);
            const cur = ab.currentUses !== undefined && ab.currentUses !== null && !isNaN(Number(ab.currentUses))
              ? Number(ab.currentUses)
              : max;
            return {
              ...(typeof ab.id === 'string' && ab.id.length > 20 && !ab.id.startsWith('ab-') ? { id: ab.id } : {}),
              name: String(ab.name || 'Habilidade'),
              description: ab.description || '',
              maxUses: max,
              currentUses: cur,
              resetType: ab.resetType || 'SHORT_REST',
              actionType: ab.actionType || 'LIVRE',
              characterId: id,
            };
          }),
        });
      }
    }

    if (body.spellSlots && Array.isArray(body.spellSlots)) {
      await prisma.spellSlot.deleteMany({ where: { characterId: id } });
      if (body.spellSlots.length > 0) {
        await prisma.spellSlot.createMany({
          data: body.spellSlots.map((slot: any) => ({
            level: toSafeNumber(slot.level, 1),
            total: Math.max(0, toSafeNumber(slot.total, 0)),
            used: Math.max(0, toSafeNumber(slot.used, 0)),
            characterId: id,
          })),
        });
      }
    }

    if (body.items && Array.isArray(body.items)) {
      await prisma.item.deleteMany({ where: { characterId: id } });
      await prisma.item.createMany({
        data: body.items.map((i: any) => ({
          ...(typeof i.id === 'string' && i.id.length > 20 && !i.id.startsWith('item-') ? { id: i.id } : {}),
          name: String(i.name || 'Item'),
          description: i.description || '',
          weight: toSafeNumber(i.weight, 0),
          quantity: Math.max(1, toSafeNumber(i.quantity, 1)),
          isWeapon: !!i.isWeapon,
          damage: i.damage || '',
          isArmor: !!i.isArmor,
          isEquipped: !!i.isEquipped,
          armorClassBonus: toSafeNumber(i.armorClassBonus, 0),
          characterId: id,
        })),
      });
    }

    if (body.spells && Array.isArray(body.spells)) {
      await prisma.spell.deleteMany({ where: { characterId: id } });
      if (body.spells.length > 0) {
        await prisma.spell.createMany({
          data: body.spells.map((s: any) => ({
            ...(typeof s.id === 'string' && s.id.length > 20 && !s.id.startsWith('spell-') ? { id: s.id } : {}),
            name: String(s.name || 'Magia'),
            level: toSafeNumber(s.level, 0),
            castingTime: s.castingTime || '',
            range: s.range || '',
            duration: s.duration || '',
            components: s.components || '',
            isPrepared: !!s.isPrepared,
            description: s.description || '',
            characterId: id,
          })),
        });
      }
    }

    const updated = await prisma.character.update({
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
      },
      include: {
        spellSlots: { orderBy: { level: 'asc' } },
        spells: { orderBy: { level: 'asc' } },
        abilities: true,
        conditions: true,
        items: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error(`Erro no Prisma PUT /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao atualizar personagem' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const id = extractId(context);
  try {
    await prisma.character.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro no Prisma DELETE /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao deletar personagem' }, { status: 500 });
  }
}

