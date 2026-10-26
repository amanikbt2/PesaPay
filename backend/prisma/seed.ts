import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding development database for PesaPay...');

  // Default test user
  const testUser = await prisma.user.upsert({
    where: { id: 'dev-student-user-001' },
    update: {},
    create: {
      id: 'dev-student-user-001',
      displayName: 'Amani Kibet',
      phoneNumber: '254712345678',
    },
  });
  console.log(`User created: ${testUser.displayName} (${testUser.id})`);

  // Development merchants matching mockup screenshot
  const merchants = [
    {
      id: 'merchant-mess-hall-78901',
      displayName: 'Mess Hall',
      merchantReference: 'MESS_HALL',
      tillNumber: '78901',
      verificationStatus: 'VERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-bookshop-55432',
      displayName: 'Bookshop',
      merchantReference: 'CAMPUS_BOOKSHOP',
      tillNumber: '55432',
      verificationStatus: 'VERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-campus-kiosk-001',
      displayName: 'Campus Kiosk',
      merchantReference: 'CAMPUS_KIOSK',
      tillNumber: '123456',
      verificationStatus: 'VERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-science-cafe-002',
      displayName: 'Science Cafeteria',
      merchantReference: 'CAMPUS_CAFE',
      tillNumber: '567890',
      verificationStatus: 'VERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-student-bookshop-003',
      displayName: 'Student Bookshop',
      merchantReference: 'STUDENT_BOOKSHOP',
      tillNumber: '882211',
      verificationStatus: 'VERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-unverified-004',
      displayName: 'Unverified Test Shop',
      merchantReference: 'UNVERIFIED_SHOP',
      tillNumber: '999000',
      verificationStatus: 'UNVERIFIED',
      enabled: true,
    },
    {
      id: 'merchant-suspended-005',
      displayName: 'Suspended Canteen',
      merchantReference: 'SUSPENDED_CANTEEN',
      tillNumber: '999111',
      verificationStatus: 'SUSPENDED',
      enabled: false,
    },
  ];

  for (const m of merchants) {
    const record = await prisma.merchant.upsert({
      where: { merchantReference: m.merchantReference },
      update: m,
      create: m,
    });
    console.log(`Merchant registered: ${record.displayName} [Till: ${record.tillNumber}] (${record.verificationStatus})`);
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
