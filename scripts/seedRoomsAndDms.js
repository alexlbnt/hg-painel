require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ROOMS = [
  {
    code: 'MESA-ALEX',
    name: 'Mesa do Alex',
    dmName: 'Alex (Mestre)',
    dmUsername: 'alex.g',
  },
  {
    code: 'MESA-JOAO',
    name: 'Mesa do João',
    dmName: 'João (Mestre)',
    dmUsername: 'joao.c',
  },
  {
    code: 'MESA-LOBO',
    name: 'Mesa do Lobo',
    dmName: 'Lobo (Mestre)',
    dmUsername: 'lobo.l',
  },
];

async function main() {
  console.log('🏰 Iniciando sincronização das 3 Mesas e Mestres no Neon...');

  // 1. Atualizar ou criar salas
  const createdRooms = [];
  for (const r of ROOMS) {
    // Verificar se já existe por code ou se HONRA-5E deve virar MESA-ALEX
    let room = await prisma.room.findFirst({
      where: {
        OR: [
          { code: r.code },
          ...(r.dmUsername === 'alex.g' ? [{ code: 'HONRA-5E' }] : []),
        ],
      },
    });

    if (room) {
      room = await prisma.room.update({
        where: { id: room.id },
        data: {
          code: r.code,
          name: r.name,
          dmName: r.dmName,
          dmUsername: r.dmUsername,
        },
      });
      console.log(`✅ Sala atualizada: ${room.name} (${room.code}) - Mestre: ${room.dmUsername}`);
    } else {
      room = await prisma.room.create({
        data: {
          code: r.code,
          name: r.name,
          dmName: r.dmName,
          dmUsername: r.dmUsername,
        },
      });
      console.log(`✨ Sala criada: ${room.name} (${room.code}) - Mestre: ${room.dmUsername}`);
    }
    createdRooms.push(room);
  }

  // 2. Atualizar papéis de usuários (Alex, João, Lobo -> DM)
  const dmsToPromote = ['alex.g', 'joao.c', 'lobo.l'];
  for (const username of dmsToPromote) {
    const u = await prisma.user.findUnique({ where: { username } });
    if (u) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: 'DM' },
      });
      console.log(`👑 Usuário promovido a DM: ${username} (${u.name})`);
    } else {
      console.warn(`⚠️ Usuário não encontrado para promoção: ${username}`);
    }
  }

  // 3. Vincular personagens sem sala à Mesa do Alex (mesa principal/padrão)
  const alexRoom = createdRooms.find(r => r.dmUsername === 'alex.g') || createdRooms[0];
  if (alexRoom) {
    const unassignedChars = await prisma.character.findMany({
      where: { roomId: null },
      select: { id: true, name: true, playerName: true },
    });

    if (unassignedChars.length > 0) {
      console.log(`📌 Vinculando ${unassignedChars.length} personagens sem mesa para "${alexRoom.name}"...`);
      await prisma.character.updateMany({
        where: { roomId: null },
        data: { roomId: alexRoom.id },
      });
      for (const c of unassignedChars) {
        console.log(`   - ${c.name} (${c.playerName}) -> ${alexRoom.name}`);
      }
    } else {
      console.log('✨ Todos os personagens já possuem mesa vinculada.');
    }
  }

  console.log('🎉 Sincronização de Mesas e Mestres concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na sincronização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
