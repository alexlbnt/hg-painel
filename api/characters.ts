import { prisma } from '../src/lib/prisma';
import { INITIAL_CHARACTERS } from '../src/lib/mockData';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const characters = await prisma.character.findMany({
        include: { spellSlots: true, abilities: true, conditions: true },
        orderBy: { createdAt: 'asc' },
      });
      if (characters.length === 0) {
        for (const char of INITIAL_CHARACTERS) {
          await prisma.character.create({
            data: {
              name: char.name,
              playerName: char.playerName,
              race: char.race,
              class: char.class,
              level: char.level,
              alignment: char.alignment,
              background: char.background,
              currentHp: char.currentHp,
              maxHp: char.maxHp,
              tempHp: char.tempHp,
              armorClass: char.armorClass,
              initiativeBonus: char.initiativeBonus,
              speed: char.speed,
              hitDiceType: char.hitDiceType,
              hitDiceTotal: char.hitDiceTotal,
              hitDiceSpent: char.hitDiceSpent,
              deathSaveSuccesses: char.deathSaveSuccesses,
              deathSaveFailures: char.deathSaveFailures,
              str: char.str,
              dex: char.dex,
              con: char.con,
              int: char.int,
              wis: char.wis,
              cha: char.cha,
              strProf: char.strProf,
              dexProf: char.dexProf,
              conProf: char.conProf,
              intProf: char.intProf,
              wisProf: char.wisProf,
              chaProf: char.chaProf,
              proficientSkills: char.proficientSkills,
              spellSlots: { create: char.spellSlots.map(s => ({ level: s.level, total: s.total, used: s.used })) },
              abilities: { create: char.abilities.map(a => ({ name: a.name, description: a.description, maxUses: a.maxUses, currentUses: a.currentUses, resetType: a.resetType })) },
              conditions: { create: char.conditions.map(c => ({ name: c.name, description: c.description })) },
            },
          });
        }
        const newChars = await prisma.character.findMany({
          include: { spellSlots: true, abilities: true, conditions: true },
        });
        return res.status(200).json(newChars);
      }
      return res.status(200).json(characters);
    } catch (error) {
      console.error('Erro no Prisma GET /api/characters:', error);
      return res.status(500).json({ error: 'Falha ao conectar no banco de dados' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const newChar = await prisma.character.create({
        data: {
          name: body.name || 'Novo Herói',
          playerName: body.playerName || 'Jogador',
          race: body.race || 'Humano',
          class: body.class || 'Guerreiro',
          level: Number(body.level) || 1,
          alignment: body.alignment || 'Neutro',
          background: body.background || 'Herói do Povo',
          currentHp: Number(body.maxHp) || 10,
          maxHp: Number(body.maxHp) || 10,
          tempHp: 0,
          armorClass: Number(body.armorClass) || 10,
          initiativeBonus: Number(body.initiativeBonus) || 0,
          speed: body.speed || '9m',
          hitDiceType: body.hitDiceType || '1d10',
          hitDiceTotal: Number(body.level) || 1,
          hitDiceSpent: 0,
          str: Number(body.str) || 10,
          dex: Number(body.dex) || 10,
          con: Number(body.con) || 10,
          int: Number(body.int) || 10,
          wis: Number(body.wis) || 10,
          cha: Number(body.cha) || 10,
          strProf: !!body.strProf,
          dexProf: !!body.dexProf,
          conProf: !!body.conProf,
          intProf: !!body.intProf,
          wisProf: !!body.wisProf,
          chaProf: !!body.chaProf,
          proficientSkills: body.proficientSkills || '',
          spellSlots: { create: body.spellSlots || [] },
          abilities: { create: body.abilities || [] },
        },
        include: { spellSlots: true, abilities: true, conditions: true },
      });
      return res.status(201).json(newChar);
    } catch (error) {
      console.error('Erro no Prisma POST /api/characters:', error);
      return res.status(500).json({ error: 'Falha ao criar personagem' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
