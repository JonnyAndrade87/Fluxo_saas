import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'jonattan.passos@gmail.com';
  const password = '@Joaquimlucca09';

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenants: {
        take: 1,
        select: { tenantId: true, role: true }
      }
    }
  });

  if (!user) {
    console.log('❌ Usuário NÃO encontrado no banco!');
    return;
  }
  console.log('✅ Usuário encontrado:', user.email, '| Nome:', user.fullName);
  
  if (!user.password) {
    console.log('❌ Usuário não tem senha definida!');
    return;
  }
  
  const match = await bcrypt.compare(password, user.password);
  console.log('🔑 Senha correta?', match ? '✅ SIM' : '❌ NÃO — hash não bate');
  
  const tenantUser = user.tenants[0];
  console.log('🏢 Tenant?', tenantUser ? `✅ ${tenantUser.tenantId} | role: ${tenantUser.role}` : '❌ SEM TENANT — isso causaria redirect para onboarding');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
