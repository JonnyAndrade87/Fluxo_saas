import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'jonattan.passos@gmail.com' },
    include: {
      tenants: true
    }
  });

  if (user) {
    console.log('USER EXISTS!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.fullName);
    console.log('Password Hash Length:', user.password?.length);
    console.log('Tenants associated:', user.tenants.length);
  } else {
    console.log('USER DOES NOT EXIST IN DATABASE!');
  }
}

main().finally(() => prisma.$disconnect());
