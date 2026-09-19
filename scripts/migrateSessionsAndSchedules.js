require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== MIGRAÇÃO DE SESSÕES E AGENDAMENTOS POR MESA ===\n');

  const alexRoom = await prisma.room.findUnique({ where: { code: 'MESA-ALEX' } });
  const joaoRoom = await prisma.room.findUnique({ where: { code: 'MESA-JOAO' } });
  const loboRoom = await prisma.room.findUnique({ where: { code: 'MESA-LOBO' } });

  if (!alexRoom || !joaoRoom || !loboRoom) {
    throw new Error('Salas ALEX, JOAO ou LOBO não encontradas!');
  }

  // 1. Vincular sessões de diário existentes à MESA-ALEX
  const existingSessions = await prisma.campaignSession.findMany({
    where: { roomId: null }
  });
  console.log(`Sessões de diário sem sala: ${existingSessions.length}`);

  for (const s of existingSessions) {
    await prisma.campaignSession.update({
      where: { id: s.id },
      data: { roomId: alexRoom.id }
    });
    console.log(`- Sessão "${s.title}" vinculada à ${alexRoom.name}`);
  }

  // 2. Vincular agendamento existente à MESA-ALEX
  const existingSchedules = await prisma.scheduledSession.findMany({
    where: { roomId: null }
  });
  console.log(`\nAgendamentos sem sala: ${existingSchedules.length}`);

  for (const sc of existingSchedules) {
    await prisma.scheduledSession.update({
      where: { id: sc.id },
      data: { roomId: alexRoom.id }
    });
    console.log(`- Agendamento "${sc.title}" vinculado à ${alexRoom.name}`);
  }

  // 3. Garantir que MESA-JOAO e MESA-LOBO possuam um agendamento ativo próprio
  const joaoSchedule = await prisma.scheduledSession.findFirst({
    where: { roomId: joaoRoom.id }
  });
  if (!joaoSchedule) {
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
    nextFriday.setHours(20, 0, 0, 0);

    const created = await prisma.scheduledSession.create({
      data: {
        title: 'Sessão da Mesa do João',
        scheduledAt: nextFriday,
        location: 'Discord - Sala do João',
        description: 'Sessão regular da campanha da Mesa do João.',
        isActive: true,
        roomId: joaoRoom.id,
      }
    });
    console.log(`- Criado agendamento inicial para ${joaoRoom.name}: "${created.title}"`);
  }

  const loboSchedule = await prisma.scheduledSession.findFirst({
    where: { roomId: loboRoom.id }
  });
  if (!loboSchedule) {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((0 - nextSunday.getDay() + 7) % 7 || 7));
    nextSunday.setHours(19, 0, 0, 0);

    const created = await prisma.scheduledSession.create({
      data: {
        title: 'Sessão da Mesa do Lobo',
        scheduledAt: nextSunday,
        location: 'Discord - Covil do Lobo',
        description: 'Sessão regular da campanha da Mesa do Lobo.',
        isActive: true,
        roomId: loboRoom.id,
      }
    });
    console.log(`- Criado agendamento inicial para ${loboRoom.name}: "${created.title}"`);
  }

  // 4. Garantir que MESA-JOAO e MESA-LOBO possuam pelo menos uma crônica inicial no diário
  const joaoSessionsCount = await prisma.campaignSession.count({ where: { roomId: joaoRoom.id } });
  if (joaoSessionsCount === 0) {
    const joaoUser = await prisma.user.findUnique({ where: { username: 'joao.c' } });
    if (joaoUser) {
      await prisma.campaignSession.create({
        data: {
          title: 'Prólogo: A Canção das Sombras',
          roomId: joaoRoom.id,
          notes: {
            create: {
              content: 'Os primeiros acordes ecoam na taverna. A comitiva da Mesa do João inicia sua jornada rumo às terras desconhecidas.',
              authorId: joaoUser.id,
            }
          }
        }
      });
      console.log(`- Criada crônica inicial no diário para ${joaoRoom.name}`);
    }
  }

  const loboSessionsCount = await prisma.campaignSession.count({ where: { roomId: loboRoom.id } });
  if (loboSessionsCount === 0) {
    const loboUser = await prisma.user.findUnique({ where: { username: 'lobo.l' } });
    if (loboUser) {
      await prisma.campaignSession.create({
        data: {
          title: 'Prólogo: O Uivo na Névoa',
          roomId: loboRoom.id,
          notes: {
            create: {
              content: 'Sob a luz prateada da lua cheia, os bravos aventureiros da Mesa do Lobo reúnem-se para desvendar os segredos ancestrais da floresta.',
              authorId: loboUser.id,
            }
          }
        }
      });
      console.log(`- Criada crônica inicial no diário para ${loboRoom.name}`);
    }
  }

  console.log('\n✅ MIGRAÇÃO DE SESSÕES E AGENDAMENTOS CONCLUÍDA COM SUCESSO!');
}

run()
  .catch(e => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
