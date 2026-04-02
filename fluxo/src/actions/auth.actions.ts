'use server';

import prisma from '@/lib/db';
import { sendEmail } from '@/lib/messaging/email';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Solicita a criação do Token e o envio do Link Mágico pro email do cara!
 * Ocultamos o "erro" de não achar o email para não vazar a existência do cadastro.
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Retornar success mesmo se não achar o email previne brute-force scraping
      return { success: true };
    }

    // Invalidar os antigos: Deletamos qualquer token desse email para que apenas 1 seja válido por vez
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    const token = randomUUID();
    // Hora + 2 horas em milisegundos
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires
      }
    });

    // Enviar email via Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxo-psi-sepia.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #1a1a2e; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Fluxo SaaS</h2>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <h3 style="margin-top: 0;">Recuperação de Senha Segura</h3>
          <p>Olá ${user.fullName.split(' ')[0]},</p>
          <p>Recebemos uma solicitação para redefinir a sua senha no Fluxo. Se foi você, basta clicar no botão abaixo para escolher sua nova credencial em segurança.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #1a1a2e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Este link criptografado expira automaticamente em 2 horas.<br/>Se não recém-solicitou uma nova senha, basta ignorar este email. Sua conta continua 100% protegida.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Redefinição de Senha - Fluxo',
      html: emailHtml,
      text: `Link de redefinição: ${resetUrl}`
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro no fluxo do reset:", error);
    return { error: 'Ocorreu um erro interno. Tente de novo.' };
  }
}

/**
 * Valida o token gerado por e-mail e aplica o hash BCRYPT na nova senha
 */
export async function resetPassword(token: string, newPasswordRaw: string) {
  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!record) {
      return { error: 'Link inválido ou já utilizado.' };
    }

    if (new Date() > record.expires) {
      // Exclui do banco já que apodreceu
      await prisma.passwordResetToken.delete({ where: { token } });
      return { error: 'Esse link expirou! Solicite um novo link por email.' };
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      return { error: 'O cadastro dessa conta já não existe mais.' };
    }

    // Salgar a receita para encriptação padrão
    const hashedPassword = await bcrypt.hash(newPasswordRaw, 10);

    // Patch Senha
    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword, updatedAt: new Date() }
    });

    // QUEIMAR TOKEN
    await prisma.passwordResetToken.delete({ where: { token } });

    return { success: true };
    
  } catch (error: any) {
    console.error("Erro redefinindo credencial:", error.message);
    return { error: 'Falha durante o processo de Reset.' };
  }
}
