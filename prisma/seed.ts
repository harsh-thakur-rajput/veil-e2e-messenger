import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Use Argon2id for secure password hashing
  const passwordHashHarsh = await argon2.hash('harsh_dev_password');
  const passwordHashToni = await argon2.hash('toni_dev_password');

  const harsh = await prisma.user.upsert({
    where: { username: 'Harsh' },
    update: {},
    create: {
    username: 'Harsh',
    email: 'harsh@veil.test',
      passwordHash: passwordHashHarsh,
    },
  });

  const toni = await prisma.user.upsert({
    where: { username: 'Toni' },
    update: {},
    create: {
      username: 'Toni',
      email: 'toni@veil.test',
      passwordHash: passwordHashToni,
    },
  });

  console.log('✅ Created Users:');
  console.log(`  - ${harsh.username} (${harsh.email})`);
  console.log(`  - ${toni.username} (${toni.email})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });