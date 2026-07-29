const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chars = await prisma.character.findMany({
    select: { id: true, name: true, playerName: true }
  });
  console.log(JSON.stringify(chars, null, 2));
}

main().finally(() => prisma.$disconnect());
