/**
 * reset-password.test.ts
 *
 * Testes para o fluxo de redefinição de senha e simulação de falhas de provedor.
 * Cobre os cenários exigidos da Tarefa 5.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordReset } from '@/actions/auth.actions';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/messaging/email';

// Mocks automáticos do Vitest
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock('@/lib/messaging/email', () => ({
  sendEmail: vi.fn(),
  buildPasswordResetEmailHtml: vi.fn().mockReturnValue('<html>mocked</html>'),
  getAuthEmailFrom: vi.fn().mockReturnValue('no-reply@fluxeer.com.br'),
}));

describe('Fluxo de Recuperação de Senha', () => {
  const resetUser = {
    id: 'u1',
    email: 'vazado@ex.com',
    fullName: 'Vazado',
    password: 'hash',
    googleId: null,
    emailVerified: true,
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Awaited<ReturnType<typeof prisma.user.findUnique>>;

  const successUser = {
    ...resetUser,
    id: 'u2',
    email: 'bom@ex.com',
    fullName: 'Bom',
  } as Awaited<ReturnType<typeof prisma.user.findUnique>>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna success: true ao não encontrar o usuário (prevenção de brute-force)', async () => {
    // DB retorna nulo
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await requestPasswordReset('inexistente@example.com');
    
    // Deve afirmar sucesso para ocultar a falha do invasor
    expect(result).toEqual({ success: true });
    // E-mail NÃO deve ser enviado
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('NÃO retorna success se o provedor de e-mail falhar', async () => {
    // DB encontra o user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(resetUser);
    
    // Provedor falha internamente (ex: API key inválida, bounce)
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error: 'RESEND_API_KEY_INVALID' });

    const result = await requestPasswordReset('vazado@ex.com');

    // Falha final exposta ao frontend (forma controlada)
    expect(result.success).toBeUndefined();
    expect(result.error).toBe('O serviço de e-mail está instável. Tente novamente em alguns minutos.');
  });

  it('retorna success: true quando o provedor de e-mail consegue enviar com sucesso', async () => {
    // DB encontra o user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(successUser);
    
    // Provedor dá OK
    vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg_12345' });

    const result = await requestPasswordReset('bom@ex.com');

    // Sucesso verdadeiro
    expect(result).toEqual({ success: true });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
