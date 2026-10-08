// Uso: node scripts/listAccess.js
// Lista (somente leitura) cada usuário, seu cargo, as mesas acessíveis e os personagens.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [users, rooms, characters] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, roomId: true, isSuperDm: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.room.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.character.findMany({
      select: { id: true, name: true, class: true, level: true, userId: true, username: true, roomId: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const roomById = new Map(rooms.map((r) => [r.id, r]));
  console.log(`MESAS (${rooms.length}):`);
  for (const r of rooms) console.log(`  - ${r.name} [${r.code}] mestre: ${r.dmUsername || '(nenhum)'}`);

  for (const u of users) {
    let access;
    let why;
    const dmRooms = rooms.filter((r) => (r.dmUsername || '').toLowerCase() === u.username.toLowerCase());
    const bound = u.roomId ? roomById.get(u.roomId) : null;
    if (u.isSuperDm) {
      access = rooms;
      why = 'Super-Mestre (todas)';
    } else {
      access = [...dmRooms, ...(bound && !dmRooms.includes(bound) ? [bound] : [])];
      why = dmRooms.length ? 'mestra + vinculada' : bound ? 'vinculada' : 'SEM MESA (o app mostra todas por fallback)';
    }
    const chars = characters.filter(
      (c) => c.userId === u.id || (c.username && c.username.toLowerCase() === u.username.toLowerCase())
    );
    console.log(`\n${u.name} (@${u.username}) — ${u.role}${u.isSuperDm ? ' • SUPER-DM' : ''}`);
    console.log(`  Mesas: ${access.map((r) => r.name).join(', ') || '—'}  [${why}]`);
    console.log(
      `  Personagens: ${
        chars.map((c) => `${c.name} (${c.class} ${c.level}${c.roomId ? ', ' + (roomById.get(c.roomId)?.name || '?') : ', sem mesa'})`).join('; ') || '—'
      }`
    );
  }

  const owned = new Set(characters.filter((c) => users.some((u) => c.userId === u.id || (c.username && c.username.toLowerCase() === u.username.toLowerCase()))).map((c) => c.id));
  const orphans = characters.filter((c) => !owned.has(c.id));
  if (orphans.length) {
    console.log(`\nPERSONAGENS SEM DONO (${orphans.length}):`);
    for (const c of orphans) console.log(`  - ${c.name} (${c.class} ${c.level}) mesa: ${roomById.get(c.roomId)?.name || 'sem mesa'}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
