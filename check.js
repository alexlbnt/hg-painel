const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.character.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).then(chars => console.log(JSON.stringify(chars.map(c => ({ name: c.name, class: c.class, username: c.username, createdAt: c.createdAt })), null, 2))).finally(() => prisma.$disconnect());
