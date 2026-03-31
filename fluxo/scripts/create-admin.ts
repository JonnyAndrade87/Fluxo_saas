import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'jonattan.passos@gmail.com';
  const password = '@Joaquimlucca09';
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
        fullName: 'Jonattan Andrade',
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
    console.log(`✅ Admin criado!\nEmail: ${email}\nSenha: ${password}`);
  } else {
    console.log('Usuário já existe, atualizando senha...');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    // Ensure TenantUser exists
    const existing = await prisma.tenantUser.findFirst({ where: { userId: user.id } });
    if (!existing) {
      const tenant = await prisma.tenant.create({
        data: { name: 'Fluxo Admin', documentNumber: `ADMIN-${Date.now()}` }
      });
      await prisma.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: 'admin' }
      });
      console.log('Tenant criado e vinculado.');
    }
    console.log(`✅ Conta atualizada!\nEmail: ${email}\nSenha: ${password}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());

