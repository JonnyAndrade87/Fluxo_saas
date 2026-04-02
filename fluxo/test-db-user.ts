import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
   const user = await prisma.user.findUnique({ where: { email: 'jonattan.passos@gmail.com' } });
   console.log("USER FOUND IN DB:", user ? user.email : "NO");
}
main().catch(console.error).finally(() => prisma.$disconnect());
