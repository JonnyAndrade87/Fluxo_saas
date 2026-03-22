'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

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
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Credenciais inválidas ou erro genérico.';
      }
    }
    
    // Auth.js redirects by throwing NEXT_REDIRECT! We MUST re-throw.
    throw error;
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

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account. Please try again later.' };
  }
}
