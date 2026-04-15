import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getTenantPlanSnapshot } from '../src/lib/billing/plans';

const prisma = new PrismaClient();

async function main() {
  const email = 'jonattan.passos@gmail.com';
  const passwordStr = '@Joaquimlucca09';

  console.log(`Starting admin reset for ${email}...`);

  // First, check if tenant exists, if not create a default one
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Fluxeer Prime Hub',
        documentNumber: '00.000.000/0001-00',
        ...getTenantPlanSnapshot('pro')
      }
    });
    console.log('Created missing tenant:', tenant.id);
  }

  const hashedPassword = await bcrypt.hash(passwordStr, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      fullName: 'Jonattan Passos',
    },
    create: {
      email,
      fullName: 'Jonattan Passos',
      password: hashedPassword,
    }
  });

  // Ensure user is an admin of the tenant
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id
      }
    },
    update: {
      role: 'admin'
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'admin'
    }
  });

  console.log('User synced successfully:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
