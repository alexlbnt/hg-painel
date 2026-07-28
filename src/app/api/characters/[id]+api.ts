import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { id }: Record<string, string>) {
  try {
    const body = await request.json();

    // Se as condições foram modificadas
    if (body.conditions && Array.isArray(body.conditions)) {
      await prisma.condition.deleteMany({ where: { characterId: id } });
      await prisma.condition.createMany({
        data: body.conditions.map((c: any) => ({
          name: c.name,
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
          data: body.abilities.map((ab: any) => ({
            name: ab.name,
            description: ab.description || '',
            maxUses: Number(ab.maxUses) || 1,
            currentUses: Number(ab.currentUses) !== undefined ? Number(ab.currentUses) : (Number(ab.maxUses) || 1),
            resetType: ab.resetType || 'SHORT_REST',
            characterId: id,
          })),
        });
      }
    }

    if (body.spellSlots && Array.isArray(body.spellSlots)) {
      await prisma.spellSlot.deleteMany({ where: { characterId: id } });
      if (body.spellSlots.length > 0) {
        await prisma.spellSlot.createMany({
          data: body.spellSlots.map((slot: any) => ({
            level: Number(slot.level) || 1,
            total: Number(slot.total) || 1,
            used: Number(slot.used) || 0,
            characterId: id,
          })),
        });
      }
    }

    if (body.items && Array.isArray(body.items)) {
      await prisma.item.deleteMany({ where: { characterId: id } });
      await prisma.item.createMany({
        data: body.items.map((i: any) => ({
          name: i.name,
          description: i.description || '',
          weight: Number(i.weight) || 0,
          quantity: Number(i.quantity) || 1,
          isWeapon: !!i.isWeapon,
          damage: i.damage || '',
          characterId: id,
        })),
      });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        currentHp: body.currentHp !== undefined ? Number(body.currentHp) : undefined,
        maxHp: body.maxHp !== undefined ? Number(body.maxHp) : undefined,
        tempHp: body.tempHp !== undefined ? Number(body.tempHp) : undefined,
        hitDiceSpent: body.hitDiceSpent !== undefined ? Number(body.hitDiceSpent) : undefined,
        deathSaveSuccesses: body.deathSaveSuccesses !== undefined ? Number(body.deathSaveSuccesses) : undefined,
        deathSaveFailures: body.deathSaveFailures !== undefined ? Number(body.deathSaveFailures) : undefined,
        armorClass: body.armorClass !== undefined ? Number(body.armorClass) : undefined,
        initiativeBonus: body.initiativeBonus !== undefined ? Number(body.initiativeBonus) : undefined,
        speed: body.speed !== undefined ? String(body.speed) : undefined,
        hitDiceType: body.hitDiceType !== undefined ? String(body.hitDiceType) : undefined,
        hitDiceTotal: body.hitDiceTotal !== undefined ? Number(body.hitDiceTotal) : undefined,
        name: body.name,
        playerName: body.playerName,
        race: body.race !== undefined ? String(body.race) : undefined,
        class: body.class,
        level: body.level !== undefined ? Number(body.level) : undefined,
        alignment: body.alignment !== undefined ? String(body.alignment) : undefined,
        background: body.background !== undefined ? String(body.background) : undefined,
        gold: body.gold !== undefined ? Number(body.gold) : undefined,
        silver: body.silver !== undefined ? Number(body.silver) : undefined,
        copper: body.copper !== undefined ? Number(body.copper) : undefined,
        themeColor: body.themeColor !== undefined ? String(body.themeColor) : undefined,
        proficientSkills: body.proficientSkills !== undefined ? String(body.proficientSkills) : undefined,
        str: body.str !== undefined ? Number(body.str) : undefined,
        dex: body.dex !== undefined ? Number(body.dex) : undefined,
        con: body.con !== undefined ? Number(body.con) : undefined,
        int: body.int !== undefined ? Number(body.int) : undefined,
        wis: body.wis !== undefined ? Number(body.wis) : undefined,
        cha: body.cha !== undefined ? Number(body.cha) : undefined,
        strProf: body.strProf !== undefined ? Boolean(body.strProf) : undefined,
        dexProf: body.dexProf !== undefined ? Boolean(body.dexProf) : undefined,
        conProf: body.conProf !== undefined ? Boolean(body.conProf) : undefined,
        intProf: body.intProf !== undefined ? Boolean(body.intProf) : undefined,
        wisProf: body.wisProf !== undefined ? Boolean(body.wisProf) : undefined,
        chaProf: body.chaProf !== undefined ? Boolean(body.chaProf) : undefined,
      },
      include: { spellSlots: true, abilities: true, conditions: true, items: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error(`Erro no Prisma PUT /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao atualizar personagem' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  try {
    await prisma.character.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(`Erro no Prisma DELETE /api/characters/${id}:`, error);
    return Response.json({ error: 'Falha ao deletar personagem' }, { status: 500 });
  }
}
