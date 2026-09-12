import { prisma } from '@/lib/prisma';
import { INITIAL_CHARACTERS } from '@/lib/mockData';
import { broadcastEvent } from '@/lib/eventBus';

export async function GET(request?: Request) {
  try {
    let where: any = undefined;
    if (request && request.url) {
      try {
        const url = new URL(request.url);
        const role = url.searchParams.get('role');
        const username = url.searchParams.get('username')?.toLowerCase()?.trim();
        if (role === 'PLAYER' && username) {
          where = { username };
        }
      } catch {}
    }

    const characters = await prisma.character.findMany({
      where,
      include: {
        spellSlots: { orderBy: { level: 'asc' } },
        spells: { orderBy: { level: 'asc' } },
        abilities: true,
        conditions: true,
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Só realiza seed se NÃO houver filtro de usuário e o banco realmente estiver vazio
    if (!where && characters.length === 0) {
      const count = await prisma.character.count();
      if (count === 0) {
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
              gold: char.gold || 15,
              silver: char.silver || 10,
              copper: char.copper || 30,
              themeColor: char.themeColor || '#C5A059',
              spellSlots: {
                create: char.spellSlots.map(s => ({ level: s.level, total: s.total, used: s.used })),
              },
              spells: {
                create: (char.spells || []).map(s => ({
                  name: s.name,
                  level: s.level,
                  castingTime: s.castingTime,
                  range: s.range,
                  duration: s.duration,
                  components: s.components || '',
                  isPrepared: !!s.isPrepared,
                  description: s.description || '',
                })),
              },
              abilities: {
                create: char.abilities.map(a => ({
                  name: a.name,
                  description: a.description,
                  maxUses: a.maxUses,
                  currentUses: a.currentUses,
                  resetType: a.resetType,
                })),
              },
              conditions: {
                create: char.conditions.map(c => ({ name: c.name, description: c.description })),
              },
              items: {
                create: (char.items || []).map(i => ({
                  name: i.name,
                  description: i.description || '',
                  weight: Number(i.weight) || 0,
                  quantity: Number(i.quantity) || 1,
                  isWeapon: !!i.isWeapon,
                  damage: i.damage || '',
                  isArmor: !!i.isArmor,
                  isEquipped: !!i.isEquipped,
                  armorClassBonus: Number(i.armorClassBonus) || 0,
                })),
              },
            },
          });
        }
        const newChars = await prisma.character.findMany({
          include: {
            spellSlots: { orderBy: { level: 'asc' } },
            spells: { orderBy: { level: 'asc' } },
            abilities: true,
            conditions: true,
            items: true,
          },
        });
        return Response.json(newChars);
      }
    }

    return Response.json(characters);
  } catch (error) {
    console.error('Erro no Prisma GET /api/characters:', error);
    return Response.json({ error: 'Falha ao conectar no banco de dados' }, { status: 500 });
  }
}

function toSafeNumber(val: any, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requesterId = request.headers.get('x-user-id') || body.userId;
    let userIdToSet: string | undefined = undefined;
    if (requesterId) {
      const u = await prisma.user.findUnique({ where: { id: requesterId } });
      if (u) {
        userIdToSet = u.id;
      }
    }

    const newChar = await prisma.character.create({
      data: {
        userId: userIdToSet,
        name: String(body.name || 'Novo Herói'),
        playerName: String(body.playerName || 'Jogador'),
        race: String(body.race || 'Humano'),
        class: String(body.class || 'Guerreiro'),
        level: Math.max(1, toSafeNumber(body.level, 1)),
        alignment: String(body.alignment || 'Neutro'),
        background: String(body.background || 'Herói do Povo'),
        deity: String(body.deity || 'Nenhum'),
        lore: String(body.lore || ''),
        currentHp: toSafeNumber(body.currentHp, 10),
        maxHp: Math.max(1, toSafeNumber(body.maxHp, 10)),
        tempHp: Math.max(0, toSafeNumber(body.tempHp, 0)),
        armorClass: toSafeNumber(body.armorClass, 10),
        initiativeBonus: toSafeNumber(body.initiativeBonus, 0),
        speed: String(body.speed || '9m'),
        hitDiceType: String(body.hitDiceType || '1d10'),
        hitDiceTotal: Math.max(1, toSafeNumber(body.hitDiceTotal, 1)),
        hitDiceSpent: 0,
        username: String(body.username || ''),
        str: toSafeNumber(body.str, 10),
        dex: toSafeNumber(body.dex, 10),
        con: toSafeNumber(body.con, 10),
        int: toSafeNumber(body.int, 10),
        wis: toSafeNumber(body.wis, 10),
        cha: toSafeNumber(body.cha, 10),
        strProf: !!body.strProf,
        dexProf: !!body.dexProf,
        conProf: !!body.conProf,
        intProf: !!body.intProf,
        wisProf: !!body.wisProf,
        chaProf: !!body.chaProf,
        proficientSkills: String(body.proficientSkills || ''),
        gold: toSafeNumber(body.gold, 15),
        silver: toSafeNumber(body.silver, 10),
        copper: toSafeNumber(body.copper, 30),
        themeColor: String(body.themeColor || '#C5A059'),
        sorceryPoints: toSafeNumber(body.sorceryPoints, 0),
        maxSorceryPoints: toSafeNumber(body.maxSorceryPoints, 0),
        kiPoints: toSafeNumber(body.kiPoints, 0),
        maxKiPoints: toSafeNumber(body.maxKiPoints, 0),
        spellSlots: {
          create: Array.isArray(body.spellSlots)
            ? body.spellSlots.map((s: any) => ({
                level: toSafeNumber(s.level, 1),
                total: Math.max(0, toSafeNumber(s.total, 0)),
                used: Math.max(0, toSafeNumber(s.used, 0)),
              }))
            : [],
        },
        abilities: {
          create: Array.isArray(body.abilities)
            ? body.abilities.map((a: any) => {
                const max = toSafeNumber(a.maxUses, 1);
                const cur = a.currentUses !== undefined && a.currentUses !== null && !isNaN(Number(a.currentUses))
                  ? Number(a.currentUses)
                  : max;
                return {
                  name: String(a.name || 'Habilidade'),
                  description: a.description || '',
                  maxUses: max,
                  currentUses: cur,
                  resetType: a.resetType || 'SHORT_REST',
                  actionType: a.actionType || 'LIVRE',
                };
              })
            : [],
        },
        spells: {
          create: Array.isArray(body.spells)
            ? body.spells.map((s: any) => ({
                name: String(s.name || 'Magia'),
                level: toSafeNumber(s.level, 0),
                castingTime: s.castingTime || '',
                range: s.range || '',
                duration: s.duration || '',
                components: s.components || '',
                isPrepared: !!s.isPrepared,
                description: s.description || '',
              }))
            : [],
        },
        items: {
          create: Array.isArray(body.items)
            ? body.items.map((i: any) => ({
                name: String(i.name || 'Item'),
                description: i.description || '',
                weight: toSafeNumber(i.weight, 0),
                quantity: Math.max(1, toSafeNumber(i.quantity, 1)),
                isWeapon: !!i.isWeapon,
                damage: i.damage || '',
                isArmor: !!i.isArmor,
                isEquipped: !!i.isEquipped,
                armorClassBonus: toSafeNumber(i.armorClassBonus, 0),
              }))
            : [],
        },
        conditions: {
          create: Array.isArray(body.conditions)
            ? body.conditions.map((c: any) => ({
                name: String(c.name || ''),
                description: String(c.description || ''),
              }))
            : [],
        },
      },
      include: {
        spellSlots: { orderBy: { level: 'asc' } },
        spells: { orderBy: { level: 'asc' } },
        abilities: true,
        conditions: true,
        items: true,
      },
    });

    broadcastEvent({ type: 'CHARACTER_CREATED', id: newChar.id, data: newChar });
    return Response.json(newChar, { status: 201 });
  } catch (error) {
    console.error('Erro no Prisma POST /api/characters:', error);
    return Response.json({ error: 'Falha ao criar personagem' }, { status: 500 });
  }
}
