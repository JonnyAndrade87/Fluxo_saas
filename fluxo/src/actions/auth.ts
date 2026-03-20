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
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function register(prevState: { error?: string, success?: boolean } | undefined, formData: FormData) {
  try {
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawName = formData.get('name');
    
    // Type guards
    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string' || typeof rawName !== 'string') {
       return { error: 'Invalid field data.' };
    }

    if (rawPassword.length < 6) return { error: 'Password must be at least 6 characters.' };
    if (!rawEmail || !rawName) return { error: 'All fields are required.' };

    const email = rawEmail.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'A user with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create Tenant and User simultaneously as this is B2B
    await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: {
          name: `${rawName}'s Company`,
          documentNumber: `TMP-${Date.now()}`, // Would be collected in a real form
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
