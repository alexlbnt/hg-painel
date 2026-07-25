require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Conectando ao Neon PostgreSQL e iniciando seed...');

  // Limpar dados anteriores para evitar duplicação em testes
  await prisma.condition.deleteMany({});
  await prisma.ability.deleteMany({});
  await prisma.spellSlot.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.room.deleteMany({});

  // Criar sala principal da campanha
  const room = await prisma.room.create({
    data: {
      code: 'HONRA-5E',
      name: 'Campanha Sombria: Honra & Egoísmo',
      dmName: 'Alex (Mestre)',
    },
  });

  console.log(`🏰 Sala criada: ${room.name} (#${room.code})`);

  // Criar Herói 1: Thalor Vane (Paladino)
  const char1 = await prisma.character.create({
    data: {
      name: 'Thalor Vane',
      playerName: 'Alex',
      race: 'Aasimar Caído',
      class: 'Paladino (Juramento da Vingança)',
      level: 5,
      alignment: 'Leal e Neutro',
      background: 'Cavaleiro Caído',
      currentHp: 44,
      maxHp: 44,
      tempHp: 0,
      armorClass: 18,
      initiativeBonus: 1,
      speed: '9m',
      hitDiceType: '1d10',
      hitDiceTotal: 5,
      hitDiceSpent: 1,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      str: 18,
      dex: 12,
      con: 16,
      int: 10,
      wis: 14,
      cha: 16,
      strProf: true,
      conProf: false,
      dexProf: false,
      intProf: false,
      wisProf: true,
      chaProf: true,
      proficientSkills: 'Atletismo,Intimidação,Percepção,Religião',
      roomId: room.id,
      spellSlots: {
        create: [
          { level: 1, total: 4, used: 1 },
          { level: 2, total: 2, used: 0 },
        ],
      },
      abilities: {
        create: [
          {
            name: 'Destruição Divina (Divine Smite)',
            description: 'Gasta um espaço de magia para causar dano radiante extra (+2d8 até 5d8) em acertos corpo a corpo.',
            maxUses: 99,
            currentUses: 99,
            resetType: 'NONE',
          },
          {
            name: 'Cura pelas Mãos (Lay on Hands)',
            description: 'Reserva de cura divina (25 HP restantes). Pode curar ou remover veneno/doença.',
            maxUses: 25,
            currentUses: 20,
            resetType: 'LONG_REST',
          },
          {
            name: 'Canalizar Divindade: Voto de Inimizade',
            description: 'Como uma ação bônus, você ganha vantagem em todas as jogadas de ataque contra uma criatura por 1 minuto.',
            maxUses: 1,
            currentUses: 1,
            resetType: 'SHORT_REST',
          },
        ],
      },
      conditions: {
        create: [
          {
            name: 'Abençoado',
            description: '+1d4 nas jogadas de ataque e testes de resistência.',
          },
        ],
      },
    },
  });

  // Criar Herói 2: Vespera Shadowmend (Bruxa)
  const char2 = await prisma.character.create({
    data: {
      name: 'Vespera Shadowmend',
      playerName: 'Elena',
      race: 'Tiefling Sombrio',
      class: 'Bruxa (Pacto da Lâmina Hexblade)',
      level: 5,
      alignment: 'Caótico e Bom',
      background: 'Estudiosa do Oculto',
      currentHp: 32,
      maxHp: 38,
      tempHp: 5,
      armorClass: 15,
      initiativeBonus: 3,
      speed: '9m',
      hitDiceType: '1d8',
      hitDiceTotal: 5,
      hitDiceSpent: 2,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      str: 8,
      dex: 16,
      con: 14,
      int: 12,
      wis: 10,
      cha: 19,
      strProf: false,
      dexProf: false,
      conProf: false,
      intProf: false,
      wisProf: true,
      chaProf: true,
      proficientSkills: 'Arcanismo,Enganação,Furtividade,Persuasão',
      roomId: room.id,
      spellSlots: {
        create: [
          { level: 3, total: 2, used: 1 },
        ],
      },
      abilities: {
        create: [
          {
            name: 'Maldição de Hexblade',
            description: 'Amaldiçoa um alvo por 1 minuto: bônus de dano (+3), acerto crítico em 19 ou 20 e cura ao matar.',
            maxUses: 1,
            currentUses: 1,
            resetType: 'SHORT_REST',
          },
          {
            name: 'Rajada Mística (Eldritch Blast)',
            description: 'Dois raios sombrios (dano de energia) com Bônus de Carisma adicionado a cada acerto.',
            maxUses: 99,
            currentUses: 99,
            resetType: 'NONE',
          },
          {
            name: 'Passo Nebuloso (Misty Step)',
            description: 'Teletransporte para um espaço desocupado que você possa ver a até 9 metros de distância.',
            maxUses: 2,
            currentUses: 1,
            resetType: 'SHORT_REST',
          },
        ],
      },
    },
  });

  console.log(`⚔️ Ficha criada no Neon: ${char1.name} (${char1.class})`);
  console.log(`🔮 Ficha criada no Neon: ${char2.name} (${char2.class})`);
  console.log('✅ Seed finalizado com sucesso no banco de dados Neon!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
