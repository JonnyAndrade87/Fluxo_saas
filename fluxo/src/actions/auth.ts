'use server';

import { signIn, signOut } from '../../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sendEmail, buildActivationEmailHtml, getAuthEmailFrom } from '@/lib/messaging/email';
import { getClientIp, enforceRateLimit } from '@/lib/api-rate-limiter';
import { logAudit } from '@/lib/audit';
import { AUDIT_ACTIONS } from '@/lib/permissions';
import { DEFAULT_TENANT_PLAN, getTenantPlanSnapshot } from '@/lib/billing/plans';

// ─── Validação de Senha Forte ─────────────────────────────────────────────────
function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'A senha deve ter ao menos 6 caracteres.';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'A senha deve conter ao menos uma letra.';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve conter ao menos um número.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'A senha deve conter ao menos um caractere especial (ex: @, !, #, $).';
  }
  return null;
}

export async function logout() {
  await signOut({ redirectTo: '/login' });
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = (formData.get('email') as string || '').toLowerCase();
  try {
    const ip = await getClientIp();
    await enforceRateLimit('login', ip, { limit: 5, windowMs: 10 * 60 * 1000 }); // 5/10min

    const data = Object.fromEntries(formData);
    const callbackUrl = formData.get('callbackUrl') as string | null;
    const redirectTo = callbackUrl || '/dashboard';
    
    await signIn('credentials', {
      ...data,
      redirectTo,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      // Log failure
      const user = await prisma.user.findUnique({ where: { email } });
      await logAudit({
        tenantId: 'SYSTEM',
        userId: user?.id || null,
        userRole: null,
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        entityType: 'AUTH',
        entityId: email,
        metadata: { error: error.type, email }
      });

      switch (error.type) {
        case 'CredentialsSignin':
          return 'E-mail ou senha inválidos.';
        default: {
          const causeMsg = error.cause
            ? (typeof error.cause === 'object' && 'err' in error.cause
                ? (error.cause as { err: { message: string } }).err.message
                : String(error.cause))
            : '';
          const msg = causeMsg || error.message;
          if (msg.includes('EMAIL_NOT_VERIFIED')) {
            return 'Sua conta ainda não foi verificada. Acesse seu e-mail e clique no link de ativação.';
          }
          if (msg.includes('ACCOUNT_INACTIVE')) {
            return 'Sua conta está desativada. Entre em contato com o suporte.';
          }
          return `Erro de autenticação: ${msg || error.message}`;
        }
      }
    }

    // Auth.js redirects by throwing an error that Next.js handles.
    // Catch SUCCESS here before redirect.
    if (error && typeof error === 'object' && 'message' in error && (error as { message: string }).message === 'NEXT_REDIRECT') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const tenantUser = await prisma.tenantUser.findFirst({ where: { userId: user.id } });
        await logAudit({
          tenantId: tenantUser?.tenantId || 'SYSTEM',
          userId: user.id,
          userRole: null,
          action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
          entityType: 'AUTH',
          entityId: user.id,
          metadata: { email }
        });
      }
      throw error;
    }

    if (error && typeof error === 'object' && 'digest' in error) throw error;
    const msg = error instanceof Error ? error.message : 'Tente novamente.';
    return `Erro inesperado: ${msg}`;
  }
}

export async function register(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  try {
    const ip = await getClientIp();
    await enforceRateLimit('register', ip, { limit: 3, windowMs: 60 * 60 * 1000 }); // 3 attempts / 1 hour

    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawName = formData.get('name');
    const rawCompanyName = formData.get('companyName');
    const rawCnpj = formData.get('cnpj');

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string' || typeof rawName !== 'string') {
      return { error: 'Dados inválidos no formulário.' };
    }
    if (!rawEmail || !rawName) return { error: 'Todos os campos são obrigatórios.' };

    // Validação de senha forte
    const passwordError = validatePassword(rawPassword);
    if (passwordError) return { error: passwordError };

    const email = rawEmail.trim().toLowerCase();
    const companyName = typeof rawCompanyName === 'string' && rawCompanyName.trim()
      ? rawCompanyName.trim()
      : `${rawName} Workspace`;
    const cnpj = typeof rawCnpj === 'string' && rawCnpj.trim()
      ? rawCnpj.trim()
      : `TMP-${Date.now()}`;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'Já existe uma conta com este e-mail. Faça login ou recupere sua senha.' };
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Criar tenant e usuário
    let newUser: { id: string; email: string } | undefined;
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          documentNumber: cnpj,
          ...getTenantPlanSnapshot(DEFAULT_TENANT_PLAN),
        },
      });
      newUser = await tx.user.create({
        data: {
          email,
          fullName: rawName.trim(),
          password: hashedPassword,
          emailVerified: false,
          isActive: false,
        },
      });
      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: newUser.id, role: 'admin' },
      });
    });

    // Auditoria de Cadastro
    await logAudit({
      tenantId: 'SYSTEM',
      userId: newUser?.id || null,
      userRole: 'admin',
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: 'USER',
      entityId: newUser?.id || 'new',
      metadata: { email, companyName }
    });

    // Gerar token de verificação
    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({ data: { email, token, expires } });

    // Enviar e-mail
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br';
    const activationUrl = `${baseUrl}/activate?token=${token}`;

    // Sender is controlled by RESEND_FROM_EMAIL env var (see src/lib/messaging/email.ts)
    await sendEmail({
      from: getAuthEmailFrom(),
      to: email,
      subject: 'Ative sua conta no Fluxeer',
      html: buildActivationEmailHtml({ name: rawName.trim(), companyName, activationUrl }),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return { error: 'Falha ao criar a conta. Tente novamente mais tarde.' };
  }
}
