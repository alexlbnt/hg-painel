require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('=== VERIFICAÇÃO DE INTEGRIDADE DO BANCO DE DADOS ===\n');

  // 1. Salas
  const rooms = await prisma.room.findMany({
    orderBy: { code: 'asc' },
    include: {
      characters: { select: { id: true, name: true, playerName: true, username: true } },
      users: { select: { id: true, name: true, username: true, role: true } },
    }
  });

  console.log(`[1] SALAS ENCONTRADAS (${rooms.length}):`);
  for (const r of rooms) {
    console.log(`- ${r.name} (${r.code})`);
    console.log(`  Mestre Regente: ${r.dmName} (@${r.dmUsername})`);
    console.log(`  Jogadores Vinculados (${r.users.length}): ${r.users.map(u => `${u.name} (@${u.username})`).join(', ')}`);
    console.log(`  Fichas de Personagem (${r.characters.length}): ${r.characters.map(c => `${c.name} [${c.playerName}]`).join(', ')}`);
    console.log('');
  }

  // 2. Usuários
  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
    include: { room: true }
  });

  console.log(`[2] USUÁRIOS E ATRIBUIÇÃO DE SALAS (${users.length}):`);
  for (const u of users) {
    console.log(`- ${u.name} (@${u.username}) | Papel: ${u.role} | Sala: ${u.room ? `${u.room.name} (${u.room.code})` : 'SEM SALA!'}`);
  }

  // 3. Validação Específica das Regras do Usuário
  console.log('\n[3] VALIDAÇÃO DAS REGRAS ESPECÍFICAS DE MESAS:');
  const errors = [];

  const mesaLoboUsers = users.filter(u => u.room?.code === 'MESA-LOBO').map(u => u.username);
  const expectedMesaLobo = ['allan.m', 'joao.c', 'leo.a'];
  for (const exp of expectedMesaLobo) {
    if (!mesaLoboUsers.includes(exp)) errors.push(`Usuário ${exp} deveria estar na MESA-LOBO, mas está em ${users.find(u => u.username === exp)?.room?.code}`);
  }

  const mesaJoaoUsers = users.filter(u => u.room?.code === 'MESA-JOAO').map(u => u.username);
  const expectedMesaJoao = ['gabi.f', 'dantas.p'];
  for (const exp of expectedMesaJoao) {
    if (!mesaJoaoUsers.includes(exp)) errors.push(`Usuário ${exp} deveria estar na MESA-JOAO, mas está em ${users.find(u => u.username === exp)?.room?.code}`);
  }

  const mesaAlexUsers = users.filter(u => u.room?.code === 'MESA-ALEX').map(u => u.username);
  const expectedMesaAlex = ['lobo.l', 'pastor.j', 'luis.k'];
  for (const exp of expectedMesaAlex) {
    if (!mesaAlexUsers.includes(exp)) errors.push(`Usuário ${exp} deveria estar na MESA-ALEX, mas está em ${users.find(u => u.username === exp)?.room?.code}`);
  }

  // Alex Super DM check
  const alexUser = users.find(u => u.username === 'alex.g');
  if (!alexUser || alexUser.role !== 'DM') {
    errors.push('Alex deve ser usuário DM');
  }

  // 4. Validação de Fichas
  const allCharacters = await prisma.character.findMany({
    include: {
      spells: true,
      abilities: true,
      items: true,
      conditions: true,
      spellSlots: true,
    }
  });

  console.log(`\n[4] TOTAL DE FICHAS NO BANCO: ${allCharacters.length}`);
  for (const c of allCharacters) {
    console.log(`- ${c.name} (${c.class} Nv.${c.level}) -> Sala: ${c.roomId} | Jogador: ${c.playerName} (@${c.username})`);
    console.log(`  Atributos: FOR ${c.str}, DES ${c.dex}, CON ${c.con}, INT ${c.int}, SAB ${c.wis}, CAR ${c.cha} | HP: ${c.currentHp}/${c.maxHp} | CA: ${c.armorClass}`);
    console.log(`  Magias: ${c.spells.length} | Habilidades: ${c.abilities.length} | Itens: ${c.items.length} | Slots: ${c.spellSlots.length}`);
    if (!c.roomId) {
      errors.push(`Personagem ${c.name} está sem roomId!`);
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ ERROS ENCONTRADOS:', errors);
    process.exit(1);
  } else {
    console.log('\n✅ TODAS AS VALIDAÇÕES DE BANCO PASSARAM COM SUCESSO (100% íntegro)!');
  }
}

verify()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
