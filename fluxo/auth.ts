import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  role: string;
}

interface AuthToken extends JWT {
  id?: string;
  tenantId?: string | null;
  role?: string;
}

interface AuthSession extends Session {
  user: Session['user'] & {
    id?: string;
    tenantId?: string | null;
    role?: string;
  };
}

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
          role: tenantUser?.role ?? 'operator',
        } as AuthUser;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }): Promise<AuthToken> {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as AuthUser).tenantId;
        token.role = (user as AuthUser).role;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        const user = session.user as AuthSession['user'];
        user.id = (token.id as string) || (token.sub as string);
        user.tenantId = token.tenantId as string | null;
        user.role = token.role as string;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' }
});
