// Uso: node scripts/setSuperDm.js <username> [--revoke]
// Marca (ou remove) o flag de Super-Mestre, com acesso a todas as mesas.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = (process.argv[2] || '').toLowerCase().trim();
  const revoke = process.argv.includes('--revoke');
  if (!username) throw new Error('Informe o username. Ex: node scripts/setSuperDm.js alex.g');
  const user = await prisma.user.update({
    where: { username },
    data: { isSuperDm: !revoke },
    select: { username: true, isSuperDm: true },
  });
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
