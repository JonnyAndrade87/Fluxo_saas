'use server';

import prisma from '@/lib/prisma';
import { sendEmail, buildPasswordResetEmailHtml } from '@/lib/messaging/email';
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Redefinição de Senha — Fluxo',
      html: buildPasswordResetEmailHtml({
        name: user.fullName,
        resetUrl,
      }),
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
