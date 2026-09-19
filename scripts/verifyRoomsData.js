const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const rooms = await prisma.room.findMany({ select: { id: true, code: true, name: true } });
  console.log('=== MESAS ENCONTRADAS ===');
  console.log(rooms);

  for (const r of rooms) {
    const sessions = await prisma.campaignSession.findMany({ where: { roomId: r.id } });
    const scheduled = await prisma.scheduledSession.findMany({ where: { roomId: r.id } });
    const users = await prisma.user.findMany({ where: { roomId: r.id } });
    console.log(`\n-- ${r.name} (${r.code}) --`);
    console.log(`  Capitulos do Diario: ${sessions.length} (${sessions.map(s => s.title).join(', ')})`);
    console.log(`  Proxima Sessao: ${scheduled.length > 0 ? scheduled[0].title : 'Nenhuma'}`);
    console.log(`  Aventureiros: ${users.map(u => u.name).join(', ')}`);
  }

  const tasksCount = await prisma.task.count();
  console.log('\n=== TAREFAS DA MESA ===');
  console.log(`Total de tarefas globais compartilhadas: ${tasksCount}`);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
