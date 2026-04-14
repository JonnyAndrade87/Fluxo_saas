'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { sendEmail, buildActivationEmailHtml } from '@/lib/messaging/email';

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

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData);
    const callbackUrl = formData.get('callbackUrl') as string | null;
    const redirectTo = callbackUrl || '/cobrancas';
    
    await signIn('credentials', {
      ...data,
      redirectTo,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'E-mail ou senha inválidos.';
        default: {
          const causeMsg = error.cause
            ? (typeof error.cause === 'object' && 'err' in error.cause
                ? (error.cause as any).err.message
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
    if (error && typeof error === 'object' && 'message' in error && (error as any).message === 'NEXT_REDIRECT') throw error;
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    return `Erro inesperado: ${error?.message || 'Tente novamente.'}`;
  }
}

export async function register(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  try {
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

    // Criar tenant e usuário (inativo até verificar e-mail)
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName, documentNumber: cnpj },
      });
      const user = await tx.user.create({
        data: {
          email,
          fullName: rawName.trim(),
          password: hashedPassword,
          emailVerified: false,
          isActive: false,
        },
      });
      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: 'admin' },
      });
    });

    // Gerar token de verificação de e-mail (24h)
    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({ data: { email, token, expires } });

    // Enviar e-mail de ativação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br';
    const activationUrl = `${baseUrl}/activate?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Ative sua conta no Fluxeer',
      html: buildActivationEmailHtml({ name: rawName.trim(), companyName, activationUrl }),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: 'Falha ao criar a conta. Tente novamente mais tarde.' };
  }
}
