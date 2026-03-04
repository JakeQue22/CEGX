import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed default pipeline stages
  const stages = [
    { name: 'Lead', order: 1, isDefault: true, color: '#6B7280' },
    { name: 'Contacted', order: 2, isDefault: false, color: '#3B82F6' },
    { name: 'Negotiation', order: 3, isDefault: false, color: '#F59E0B' },
    { name: 'Proposal Sent', order: 4, isDefault: false, color: '#8B5CF6' },
    { name: 'Won', order: 5, isDefault: false, color: '#10B981' },
    { name: 'Lost', order: 6, isDefault: false, color: '#EF4444' },
  ];

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage,
    });
  }
  console.log('✅ Pipeline stages seeded');

  // Seed default company settings
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'CEGX',
        currency: 'GBP',
        defaultVatPercent: 20,
        defaultAdPercent: 0,
        emailSenderName: 'CEGX CRM',
        notifyOnDealWon: true,
        notifyOnFollowUpDue: true,
      },
    });
    console.log('✅ Company settings seeded');
  }

  // Seed admin user (upsert so password is always reset to the known default)
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@cegx.co.uk';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin user seeded: ${adminEmail}`);

  // Seed sample product categories
  const categories = ['Electronics', 'Industrial', 'Office Supplies', 'Software', 'Services'];
  for (const name of categories) {
    await prisma.productCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Product categories seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
