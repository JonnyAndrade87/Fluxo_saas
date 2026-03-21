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

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenants: {
              take: 1,
              select: { tenantId: true, role: true }
            }
          }
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        const tenantUser = user.tenants[0];

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          tenantId: tenantUser?.tenantId ?? null,
          role: tenantUser?.role ?? 'operator',  // ← NEW: pass role to token
        } as any;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;   // ← persist role in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role;  // ← expose role in session
      }
      return session;
    }
  },
  session: { strategy: 'jwt' }
});
