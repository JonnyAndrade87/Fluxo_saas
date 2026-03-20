import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await prisma.user.findUnique({
            where: { email },
            include: { tenants: { take: 1 } }
          });
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.fullName,
              tenantId: user.tenants[0]?.tenantId
            } as any;
          }
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
           (session.user as any).tenantId = token.tenantId;
        }
      }
      return session;
    }
  },
  session: { strategy: 'jwt' }
});
