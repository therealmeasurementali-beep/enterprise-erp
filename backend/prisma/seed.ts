import prisma from '../src/config/db';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@fundsroom.com',
      passwordHash: password,
      role: 'Admin',
    },
    {
      name: 'Sales User',
      email: 'sales@fundsroom.com',
      passwordHash: password,
      role: 'Sales',
    },
    {
      name: 'Warehouse User',
      email: 'warehouse@fundsroom.com',
      passwordHash: password,
      role: 'Warehouse',
    },
    {
      name: 'Accounts User',
      email: 'accounts@fundsroom.com',
      passwordHash: password,
      role: 'Accounts',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  console.log('Seed completed: 4 test users created (Password: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
