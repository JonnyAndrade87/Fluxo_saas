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
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            throw new Error(`Invalid inputs: ${JSON.stringify(parsedCredentials.error)}`);
          }

          const { email, password } = parsedCredentials.data;

          let user;
          try {
            user = await prisma.user.findUnique({
              where: { email },
              include: {
                tenants: {
                  take: 1,
                  select: { tenantId: true, role: true }
                }
              }
            });
          } catch (dbErr: any) {
            throw new Error(`Prisma Crash: ${dbErr?.message}`);
          }

          if (!user || !user.password) {
            throw new Error('User not found or missing password hash.');
          }

          let passwordsMatch = false;
          try {
            passwordsMatch = await bcrypt.compare(password, user.password);
          } catch (bcryptErr: any) {
            throw new Error(`Bcrypt Crash: ${bcryptErr?.message}`);
          }

          if (!passwordsMatch) {
            throw new Error('Password mismatch.');
          }

          const tenantUser = user.tenants[0];

          const isSuperAdmin = !!process.env.SUPER_ADMIN_EMAILS && 
            process.env.SUPER_ADMIN_EMAILS
              .split(',')
              .map(e => e.trim().toLowerCase())
              .includes(user.email.toLowerCase());

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            tenantId: tenantUser?.tenantId ?? null,
            role: tenantUser?.role ?? 'operator',
            isSuperAdmin,
          };
        } catch (error: any) {
          console.error('AUTHORIZE CRASH:', error.message);
          throw new Error(`[AUTHORIZE_FATAL] ${error.message}`);
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.tenantId = token.tenantId as string | null;
        session.user.role = token.role as string;
        session.user.isSuperAdmin = !!token.isSuperAdmin;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' }
});
