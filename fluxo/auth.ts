import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from '@/lib/db';
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email_verified) {
           throw new Error("Apenas e-mails verificados pelo Google são permitidos.");
        }

        const email = user.email!;
        
        let dbUser = await prisma.user.findUnique({
          where: { email }
        });

        if (dbUser) {
          // Linked account: update googleId if not present
          if (!dbUser.googleId) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { googleId: account.providerAccountId }
            });
          }
          return true;
        }

        // New Account -> Register with minimum required data
        await prisma.$transaction(async (tx) => {
          const companyName = user.name ? `${user.name} Workspace` : `Minha Empresa`;
          const tenant = await tx.tenant.create({
            data: {
              name: companyName,
              documentNumber: `TMP-GGL-${Date.now()}`,
            }
          });

          const createdUser = await tx.user.create({
            data: {
              email,
              fullName: user.name || "Google User",
              googleId: account.providerAccountId,
            }
          });

          await tx.tenantUser.create({
            data: {
              tenantId: tenant.id,
              userId: createdUser.id,
              role: 'admin'
            }
          });
        });

        // Enviar E-mail de Boas Vindas para o usuário recém-criado
        // Await necessário pois serverless functions matam promises pendentes
        const fallbackName = user.name || "Usuário";
        const fallbackCompany = user.name ? `${user.name} Workspace` : `Sua Empresa`;
        
        await sendEmail({
          to: email,
          subject: 'Bem-vindo ao Fluxo',
          html: buildWelcomeEmailHtml({
            name: fallbackName,
            companyName: fallbackCompany,
            email,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br'}/onboarding`
          }),
        }).catch(err => console.error("Erro ao disparar welcome email (Google Oauth):", err));

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
