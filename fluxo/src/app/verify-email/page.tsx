import prisma from '@/lib/prisma';
import { CheckCircle2, XCircle } from 'lucide-react';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorScreen message="Link de ativação inválido ou incompleto." />;
  }

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record) {
    return <ErrorScreen message="Este link de ativação é inválido ou já foi utilizado." />;
  }

  if (new Date() > record.expires) {
    await prisma.emailVerificationToken.delete({ where: { token } });
    return <ErrorScreen message="Este link de ativação expirou. Crie uma nova conta para receber outro." />;
  }

  // Ativar usuário
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: true, isActive: true },
  });

  // Invalidar token
  await prisma.emailVerificationToken.delete({ where: { token } });

  return <SuccessScreen />;
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E4E9F0] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#1A3A5F] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-[#00D2C8]" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-extrabold text-[#1A3A5F] tracking-tight mb-3">
          Conta ativada!
        </h1>
        <p className="text-[#64748B] text-sm leading-relaxed mb-8">
          Sua conta foi verificada com sucesso. Agora vamos configurar seu espaço financeiro.
        </p>
        <a
          href="/login?callbackUrl=/onboarding"
          className="block w-full h-14 rounded-2xl bg-[#1A3A5F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#1A3A5F]/25 hover:bg-[#1A3A5F]/90 transition-all duration-200"
        >
          Entrar e configurar minha plataforma →
        </a>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E4E9F0] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A3A5F] tracking-tight mb-3">
          Link inválido
        </h1>
        <p className="text-[#64748B] text-sm leading-relaxed mb-8">{message}</p>
        <a
          href="/register"
          className="block w-full h-12 rounded-2xl bg-[#1A3A5F] text-white font-bold text-base flex items-center justify-center hover:bg-[#1A3A5F]/90 transition-all duration-200"
        >
          Criar nova conta
        </a>
      </div>
    </div>
  );
}
