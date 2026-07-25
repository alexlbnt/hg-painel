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
      for (const ab of body.abilities) {
        if (ab.id && !ab.id.startsWith('ab-')) {
          await prisma.ability.update({
            where: { id: ab.id },
            data: { currentUses: ab.currentUses },
          });
        }
      }
    }

    if (body.spellSlots && Array.isArray(body.spellSlots)) {
      for (const slot of body.spellSlots) {
        if (slot.id && !slot.id.startsWith('slot-')) {
          await prisma.spellSlot.update({
            where: { id: slot.id },
            data: { used: slot.used },
          });
        }
      }
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
        name: body.name,
        playerName: body.playerName,
        class: body.class,
        level: body.level !== undefined ? Number(body.level) : undefined,
      },
      include: { spellSlots: true, abilities: true, conditions: true },
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
