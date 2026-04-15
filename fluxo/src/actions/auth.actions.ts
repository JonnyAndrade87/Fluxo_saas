'use server';

import prisma from '@/lib/prisma';
import { sendEmail, buildPasswordResetEmailHtml } from '@/lib/messaging/email';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getClientIp, enforceRateLimit } from '@/lib/api-rate-limiter';

/**
 * Solicita a criação do Token e o envio do Link Mágico pro email do cara!
 * Ocultamos o "erro" de não achar o email para não vazar a existência do cadastro.
 */
export async function requestPasswordReset(email: string) {
  try {
    const ip = await getClientIp();
    await enforceRateLimit('req-reset', ip, { limit: 3, windowMs: 60 * 60 * 1000 }); // 3 per hour

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

    const emailResult = await sendEmail({
      to: email,
      subject: 'Redefinição de Senha — Fluxo',
      html: buildPasswordResetEmailHtml({
        name: user.fullName,
        resetUrl,
      }),
      text: `Link de redefinição: ${resetUrl}`
    });

    if (!emailResult.success) {
      console.error('[AuthAction] Falha ao enviar e-mail de reset:', emailResult.error);
      // Retorna erro amigável ao frontend, mantendo detalhes técnicos no log
      return { error: 'O serviço de e-mail está instável. Tente novamente em alguns minutos.' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro no fluxo do reset:", error);
    return { error: 'Ocorreu um erro interno. Tente de novo.' };
  }
}

/**
 * Valida o token gerado por e-mail e aplica o hash BCRYPT na nova senha
 */
export async function resetPassword(token: string, newPasswordRaw: string) {
  try {
    const ip = await getClientIp();
    await enforceRateLimit('apply-reset', ip, { limit: 5, windowMs: 60 * 60 * 1000 }); // 5 attempts per hr

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
    
  } catch (error: unknown) {
    console.error("Erro redefinindo credencial:", error instanceof Error ? error.message : String(error));
    return { error: 'Falha durante o processo de Reset.' };
  }
}
