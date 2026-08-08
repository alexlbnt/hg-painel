const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const USERS = [
  { username: 'joao.c', pass: '7392', role: 'PLAYER', name: 'João' },
  { username: 'pastor.j', pass: '4815', role: 'PLAYER', name: 'Pastor' },
  { username: 'lobo.l', pass: '9024', role: 'PLAYER', name: 'Lobo' },
  { username: 'luis.k', pass: '1568', role: 'PLAYER', name: 'Luis' },
  { username: 'allan.m', pass: '6271', role: 'PLAYER', name: 'Allan' },
  { username: 'dantas.p', pass: '3840', role: 'PLAYER', name: 'Dantas' },
  { username: 'gabi.f', pass: '8193', role: 'PLAYER', name: 'Gabi' },
  { username: 'alex.g', pass: '2807', role: 'DM', name: 'Alex (Mestre)' },
];

async function main() {
  console.log('Seeding users...');
  for (const u of USERS) {
    const existing = await prisma.user.findUnique({
      where: { username: u.username }
    });
    
    if (!existing) {
      const hashedPassword = bcrypt.hashSync(u.pass, 10);
      await prisma.user.create({
        data: {
          username: u.username,
          password: hashedPassword,
          name: u.name,
          role: u.role
        }
      });
      console.log(`Created user: ${u.username}`);
    } else {
      console.log(`User already exists: ${u.username}`);
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
