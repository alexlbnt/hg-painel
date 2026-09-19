const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- VINCULANDO USUÁRIOS ÀS MESAS ---');

  const rooms = await prisma.room.findMany();
  const roomAlex = rooms.find(r => r.code === 'MESA-ALEX');
  const roomJoao = rooms.find(r => r.code === 'MESA-JOAO');
  const roomLobo = rooms.find(r => r.code === 'MESA-LOBO');

  if (!roomAlex || !roomJoao || !roomLobo) {
    console.error('Mesas não encontradas no banco de dados!');
    return;
  }

  console.log(`Mesa Alex: ${roomAlex.id}`);
  console.log(`Mesa João: ${roomJoao.id}`);
  console.log(`Mesa Lobo: ${roomLobo.id}`);

  // Mapeamento solicitado pelo usuário
  const userRoomMapping = [
    // Mesa Lobo = Allan, João, Leo
    { username: 'allan.m', roomId: roomLobo.id, name: 'Allan', tableName: 'Mesa do Lobo' },
    { username: 'joao.c', roomId: roomLobo.id, name: 'João', tableName: 'Mesa do Lobo (Player)' },
    { username: 'leo.a', roomId: roomLobo.id, name: 'Leo', tableName: 'Mesa do Lobo' },

    // Mesa João = Gabi, Dantas
    { username: 'gabi.f', roomId: roomJoao.id, name: 'Gabi', tableName: 'Mesa do João' },
    { username: 'dantas.p', roomId: roomJoao.id, name: 'Dantas', tableName: 'Mesa do João' },

    // Mesa Alex = Lobo, Pastor, Luis, Alex
    { username: 'lobo.l', roomId: roomAlex.id, name: 'Lobo', tableName: 'Mesa do Alex (Player)' },
    { username: 'pastor.j', roomId: roomAlex.id, name: 'Pastor', tableName: 'Mesa do Alex' },
    { username: 'luis.k', roomId: roomAlex.id, name: 'Luis', tableName: 'Mesa do Alex' },
    { username: 'alex.g', roomId: roomAlex.id, name: 'Alex', tableName: 'Mesa do Alex (Super-DM)' },
  ];

  for (const item of userRoomMapping) {
    const updated = await prisma.user.updateMany({
      where: { username: item.username },
      data: { roomId: item.roomId },
    });
    console.log(`✓ ${item.name} (@${item.username}) -> ${item.tableName}: ${updated.count} atualizado(s)`);
  }

  console.log('\n--- VERIFICAÇÃO FINAL ---');
  const allUsers = await prisma.user.findMany({
    select: {
      name: true,
      username: true,
      role: true,
      room: { select: { code: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
  console.log(JSON.stringify(allUsers, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
