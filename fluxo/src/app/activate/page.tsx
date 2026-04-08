import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ActivateClient from './ActivateClient';

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return redirect('/register?error=invalid_token');
  }

  // Verifica rapidamente se o token existe e não expirou — sem ativar ainda
  // (a ativação acontece no ActivateClient via signIn('activation-token'))
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record) {
    return redirect('/register?error=used_token');
  }

  if (new Date() > record.expires) {
    await prisma.emailVerificationToken.delete({ where: { token } });
    return redirect('/register?error=expired_token');
  }

  // Tudo ok — delegar ao client component que faz o signIn automático
  return <ActivateClient token={token} />;
}
