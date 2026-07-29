const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const val = Number(undefined);
    console.log("Number(undefined) is:", val);
    console.log("val !== undefined is:", val !== undefined);
    
    // We don't actually need to run Prisma to know NaN is rejected by Prisma's type checker
    // But let's see if Prisma throws an error or just ignores it?
  } catch(e) {
    console.error(e);
  }
}
main();
