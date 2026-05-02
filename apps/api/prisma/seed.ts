import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create a Super Admin user
  const superAdminPassword = await hash('SuperAdmin@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { phone: '03267744260' },
    update: {
      name: 'Muhammad Ammar',
      email: 'superadmin@societyops.local',
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
      role: UserRole.SUPER_ADMIN,
      societyId: null,
    },
    create: {
      name: 'Muhammad Ammar',
      email: 'superadmin@societyops.local',
      emailVerifiedAt: new Date(),
      phone: '03267744260',
      cnic: '31203-3135725-5',
      role: UserRole.SUPER_ADMIN,
      authCredential: {
        create: {
          passwordHash: superAdminPassword,
        },
      },
    },
  });

  await prisma.authCredential.upsert({
    where: { userId: superAdmin.id },
    update: { passwordHash: superAdminPassword },
    create: {
      userId: superAdmin.id,
      passwordHash: superAdminPassword,
    },
  });

  console.log(`✅ Super Admin created/updated:`, superAdmin);

  // Create a test Society and Society Admin
  const society = await prisma.society.upsert({
    where: { id: 'test-society-1' },
    update: {},
    create: {
      id: 'test-society-1',
      name: 'Green Valley Society',
      location: 'Islamabad, Pakistan',
    },
  });

  console.log(`✅ Society created/updated:`, society);

  const societyAdminPassword = await hash('SocietyAdmin@123', 10);

  const societyAdmin = await prisma.user.upsert({
    where: { phone: '03009876543' },
    update: {
      name: 'Society Admin',
      email: 'society.admin@societyops.local',
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
      role: UserRole.SOCIETY_ADMIN,
      societyId: society.id,
    },
    create: {
      name: 'Society Admin',
      email: 'society.admin@societyops.local',
      emailVerifiedAt: new Date(),
      phone: '03009876543',
      cnic: '98765-9876543-1',
      role: UserRole.SOCIETY_ADMIN,
      societyId: society.id,
      authCredential: {
        create: {
          passwordHash: societyAdminPassword,
        },
      },
    },
  });

  await prisma.authCredential.upsert({
    where: { userId: societyAdmin.id },
    update: { passwordHash: societyAdminPassword },
    create: {
      userId: societyAdmin.id,
      passwordHash: societyAdminPassword,
    },
  });

  console.log(`✅ Society Admin created/updated:`, societyAdmin);

  // Create a test House
  const house = await prisma.house.upsert({
    where: {
      societyId_block_houseNumber: {
        societyId: society.id,
        block: 'A',
        houseNumber: '101',
      },
    },
    update: {
      ownerId: societyAdmin.id,
    },
    create: {
      societyId: society.id,
      block: 'A',
      houseNumber: '101',
      ownerId: societyAdmin.id,
    },
  });

  console.log(`✅ House created:`, house);

  console.log('✨ Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Super Admin:');
  console.log('     Phone: 03267744260');
  console.log('     Password: SuperAdmin@123');
  console.log('   Society Admin:');
  console.log('     Phone: 03009876543');
  console.log('     Password: SocietyAdmin@123');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
