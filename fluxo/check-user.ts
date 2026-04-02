import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'contato@studioelephill.com.br' } });
  if (user) console.log("USUARIO EXISTE NO BANCO!");
  else console.log("USUARIO NAO EXISTE NO BANCO!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
