import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail, buildWelcomeEmailHtml } from '@/lib/messaging/email';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
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

          // ── Account gate — must be verified and active ────────────────────
          if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
          }
          if (!user.isActive) {
            throw new Error('ACCOUNT_INACTIVE');
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
    // Provider especial para ativação por e-mail — não requer senha
    Credentials({
      id: 'activation-token',
      credentials: { token: { type: 'text' } },
      async authorize(credentials) {
        try {
          const token = credentials?.token as string | undefined;
          if (!token) return null;

          const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
          if (!record || new Date() > record.expires) return null;

          const user = await prisma.user.findUnique({
            where: { email: record.email },
            include: { tenants: { take: 1, select: { tenantId: true, role: true } } },
          });
          if (!user) return null;

          // Ativar conta e queimar token atomicamente
          await Promise.all([
            prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: true, isActive: true },
            }),
            prisma.emailVerificationToken.delete({ where: { token } }),
          ]);

          const tenantUser = user.tenants[0];
          const isSuperAdmin = !!process.env.SUPER_ADMIN_EMAILS &&
            process.env.SUPER_ADMIN_EMAILS.split(',')
              .map(e => e.trim().toLowerCase())
              .includes(user.email.toLowerCase());

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            tenantId: tenantUser?.tenantId ?? null,
            role: tenantUser?.role ?? 'admin',
            isSuperAdmin,
          };
        } catch (err: any) {
          console.error('[ACTIVATION-TOKEN] Error:', err.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email_verified) {
           throw new Error("Apenas e-mails verificados pelo Google são permitidos.");
        }

        const email = user.email!;
        
        const dbUser = await prisma.user.findUnique({
          where: { email }
        });

        if (!dbUser) {
          // E-mail não cadastrado na plataforma — bloqueia o acesso
          return `/login?error=AccountNotRegistered`;
        }

        // ── Account gate — mesmas regras do login por credenciais ─────────
        if (!dbUser.emailVerified) {
          return `/login?error=EmailNotVerified`;
        }
        if (!dbUser.isActive) {
          return `/login?error=AccountInactive`;
        }

        // Usuário existente: vincula o googleId se ainda não estiver salvo
        if (!dbUser.googleId) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { googleId: account.providerAccountId }
          });
        }

        return true;
      }

      return true; // Credentials fallback allows sign-in naturally
    },
    async jwt({ token, user, account }) {
      // Setup payload based on the Provider logic
      if (account?.provider === 'google' && user?.email) {
        // Needs to fetch DB user manually because Oauth lacks custom authorization returns
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { tenants: { take: 1, select: { tenantId: true, role: true } } }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.tenantId = dbUser.tenants[0]?.tenantId ?? null;
          token.role = dbUser.tenants[0]?.role ?? 'operator';

          const isSuperAdmin = !!process.env.SUPER_ADMIN_EMAILS && 
            process.env.SUPER_ADMIN_EMAILS
              .split(',')
              .map(e => e.trim().toLowerCase())
              .includes(dbUser.email.toLowerCase());
              
          token.isSuperAdmin = isSuperAdmin;
        }
      } else if (user) {
        // Credentials provider injects values directly from authorize() step
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
