import { requestPasswordReset } from './src/actions/auth.actions';
import { PrismaClient } from '@prisma/client';

async function main() {
   const prisma = new PrismaClient();
   const user = await prisma.user.findUnique({ where: { email: 'jonattan.passos@gmail.com' } });
   console.log("-> USER FOUND IN DB?", user ? "YES!" : "NO! If NO, it will fake success.");
   
   const res = await requestPasswordReset('jonattan.passos@gmail.com');
   console.log("-> FORGOT PASSWORD ACTION RETURNED:", res);
}
main();
