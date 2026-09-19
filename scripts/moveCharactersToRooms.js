const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== INICIANDO MIGRAÇÃO DAS FICHAS PARA SUAS RESPECTIVAS MESAS ===\n');

  // 1. Carrega todas as mesas
  const rooms = await prisma.room.findMany();
  const roomMap = new Map(); // code -> room
  rooms.forEach(r => roomMap.set(r.code, r));

  console.log('Mesas cadastradas:');
  rooms.forEach(r => console.log(` - ${r.code}: "${r.name}" (ID: ${r.id})`));

  // 2. Carrega todos os usuários
  const users = await prisma.user.findMany({ include: { room: true } });
  const userByUsername = new Map();
  const userByName = new Map();
  users.forEach(u => {
    userByUsername.set(u.username.toLowerCase().trim(), u);
    userByName.set(u.name.toLowerCase().trim(), u);
  });

  // 3. Carrega todas as fichas com todas as relações para backup
  const allCharacters = await prisma.character.findMany({
    include: {
      spellSlots: true,
      spells: true,
      abilities: true,
      conditions: true,
      items: true,
      room: true,
      user: true,
    }
  });

  console.log(`\nEncontradas ${allCharacters.length} fichas no banco de dados.`);

  // Cria backup de segurança em JSON
  const backupPath = path.join(__dirname, `characters_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(allCharacters, null, 2), 'utf-8');
  console.log(`Backup de segurança gerado com sucesso em: ${backupPath}\n`);

  // 4. Mapeia e atualiza cada ficha
  for (const char of allCharacters) {
    const charUsername = (char.username || '').toLowerCase().trim();
    const charPlayerName = (char.playerName || '').toLowerCase().trim();

    // Encontra o usuário dono da ficha
    let ownerUser = userByUsername.get(charUsername) || userByName.get(charPlayerName);

    // Se ainda não achou, tenta correspondência parcial pelo nome do jogador
    if (!ownerUser) {
      ownerUser = users.find(u => 
        charPlayerName.includes(u.name.toLowerCase()) || 
        u.name.toLowerCase().includes(charPlayerName)
      );
    }

    if (!ownerUser) {
      console.warn(`[AVISO] Não foi possível encontrar usuário para a ficha: "${char.name}" (Player: ${char.playerName}, Username: ${char.username})`);
      continue;
    }

    // A mesa onde o usuário joga é seu user.roomId
    const targetRoomId = ownerUser.roomId;
    const targetRoom = rooms.find(r => r.id === targetRoomId);

    if (!targetRoom) {
      console.warn(`[AVISO] Usuário ${ownerUser.username} não possui mesa de RPG vinculada.`);
      continue;
    }

    console.log(`Processando ficha: "${char.name}"`);
    console.log(` - Jogador: ${ownerUser.name} (@${ownerUser.username})`);
    console.log(` - Mesa onde joga: ${targetRoom.name} (${targetRoom.code})`);
    console.log(` - Mesa anterior: ${char.room ? char.room.name + ' (' + char.room.code + ')' : 'Nenhuma'}`);

    if (char.roomId === targetRoom.id && char.userId === ownerUser.id) {
      console.log(`   -> Já está na mesa correta. Nenhuma alteração necessária.\n`);
      continue;
    }

    // Atualiza apenas roomId e userId, preservando todos os atributos, magias, itens e dados intactos
    const updated = await prisma.character.update({
      where: { id: char.id },
      data: {
        roomId: targetRoom.id,
        userId: ownerUser.id,
        username: ownerUser.username,
      },
      include: {
        room: true,
        user: true,
      }
    });

    console.log(`   -> SUCESSO: Movida para ${updated.room?.name} (${updated.room?.code}) com dados 100% preservados.\n`);
  }

  console.log('=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
