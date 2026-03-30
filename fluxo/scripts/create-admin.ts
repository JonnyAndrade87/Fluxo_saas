import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@fluxo.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('User not found, creating new tenant and admin user...');
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Fluxo Admin',
        documentNumber: `ADMIN-${Date.now()}`,
      }
    });

    user = await prisma.user.create({
      data: {
        email,
        fullName: 'Administrador Fluxo',
        password: hashedPassword,
      }
    });

    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'admin'
      }
    });
    console.log(`✅ Default admin created successfully!\nEmail: ${email}\nPassword: ${password}`);
  } else {
    console.log('User already exists, updating password...');
    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log(`✅ Admin password reset successfully!\nEmail: ${email}\nPassword: ${password}`);
  }
}

main()
  .catch(e => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
