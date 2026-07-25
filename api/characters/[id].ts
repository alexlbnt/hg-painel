import { prisma } from '../../src/lib/prisma';

export default async function handler(req: any, res: any) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID do personagem inválido' });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;

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
          name: body.name,
          playerName: body.playerName,
          class: body.class,
          level: body.level !== undefined ? Number(body.level) : undefined,
          gold: body.gold !== undefined ? Number(body.gold) : undefined,
          silver: body.silver !== undefined ? Number(body.silver) : undefined,
          copper: body.copper !== undefined ? Number(body.copper) : undefined,
        },
        include: { spellSlots: true, abilities: true, conditions: true, items: true },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error(`Erro no Prisma PUT /api/characters/${id}:`, error);
      return res.status(500).json({ error: 'Falha ao atualizar personagem' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.character.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Erro no Prisma DELETE /api/characters/${id}:`, error);
      return res.status(500).json({ error: 'Falha ao deletar personagem' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
