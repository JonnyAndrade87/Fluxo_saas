'use server';

import { Resend } from 'resend';
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
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

    // Send Welcome Email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Fluxo <onboarding@fluxeer.com>', // MUST BE a verified domain on Resend (or onboarding@resend.dev for testing)
          to: [email],
          subject: 'Boas-vindas ao Fluxo! Seu ambiente está pronto.',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px;">
              <h2 style="color: #4f46e5;">Bem-vindo(a) ao Fluxo, ${rawName}!</h2>
              <p>O ambiente corporativo para <strong>${companyName}</strong> foi implantado com sucesso.</p>
              <p>Agora você já pode gerenciar sua carteira de recebíveis, monitorar o score de risco dos seus clientes e enviar cobranças inteligentes usando um cockpit de alta performance.</p>
              <br/>
              <p style="margin-bottom: 5px;">Seu usuário de acesso:</p>
              <strong>${email}</strong>
              <br/><br/>
              <a href="https://fluxo.com/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Plataforma</a>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 40px; margin-bottom: 20px;"/>
              <p style="font-size: 12px; color: #64748b;">
                Equipe Fluxeer &copy; ${new Date().getFullYear()}<br/>
                Para suporte, acesse nossa base de conhecimento.
              </p>
            </div>
          `
        });
      } catch (err) {
        console.warn('Welcome email failed to send (but registration succeeded):', err);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account. Please try again later.' };
  }
}
