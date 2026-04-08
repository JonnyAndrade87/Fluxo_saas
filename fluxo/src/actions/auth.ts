'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail, buildWelcomeEmailHtml } from '@/lib/messaging/email';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData);
    await signIn('credentials', {
      ...data,
      redirectTo: '/cobrancas',
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          const causeMsg = error.cause ? (typeof error.cause === 'object' && 'err' in error.cause ? (error.cause as any).err.message : String(error.cause)) : 'No cause provided';
          return `Auth Error Type: ${error.type} | Msg: ${error.message} | Real Cause: ${causeMsg}`;
      }
    }
    
    // Auth.js redirects by throwing NEXT_REDIRECT! We MUST re-throw.
    if (error && typeof error === 'object' && 'message' in error && (error as any).message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error; // Next.js redirect digest
    }
    
    return `Server Error: ${error?.message || 'Generic fault'}. ${error?.cause ? 'Cause: ' + String(error.cause) : ''}`;
  }
}

export async function register(prevState: { error?: string, success?: boolean } | undefined, formData: FormData) {
  try {
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawName = formData.get('name');
    const rawCompanyName = formData.get('companyName');
    const rawCnpj = formData.get('cnpj');
    
    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string' || typeof rawName !== 'string') {
       return { error: 'Dados inválidos no formulário.' };
    }

    if (rawPassword.length < 6) return { error: 'A senha deve ter ao menos 6 caracteres.' };
    if (!rawEmail || !rawName) return { error: 'Todos os campos são obrigatórios.' };

    const email = rawEmail.toLowerCase();
    const companyName = typeof rawCompanyName === 'string' && rawCompanyName.trim() ? rawCompanyName.trim() : `${rawName}'s Company`;
    const cnpj = typeof rawCnpj === 'string' && rawCnpj.trim() ? rawCnpj.trim() : `TMP-${Date.now()}`;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { error: 'A user with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create Tenant and User simultaneously as this is B2B
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          documentNumber: cnpj,
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          fullName: rawName,
          password: hashedPassword,
        }
      });

      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'admin'
        }
      });
    });

    // Send Welcome Email using centralized Fluxeer template
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br'}/login?callbackUrl=/onboarding`;
      await sendEmail({
        to: email,
        subject: 'Boas-vindas ao Fluxo! Seu ambiente está pronto.',
        html: buildWelcomeEmailHtml({
          name: rawName,
          companyName,
          email,
          loginUrl,
        }),
      });
    } catch (err) {
      console.warn('Welcome email failed to send (but registration succeeded):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account. Please try again later.' };
  }
}
