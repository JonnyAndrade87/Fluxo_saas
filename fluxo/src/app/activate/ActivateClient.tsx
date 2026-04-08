'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function ActivateClient({ token }: { token: string }) {
  useEffect(() => {
    // Loga o usuário via provider 'activation-token' e redireciona para o onboarding
    signIn('activation-token', { token, callbackUrl: '/onboarding' });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E4E9F0] p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A3A5F]/10 flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-8 h-8 text-[#1A3A5F] animate-spin" />
        </div>
        <h1 className="text-xl font-extrabold text-[#1A3A5F] tracking-tight">Ativando sua conta…</h1>
        <p className="text-[#64748B] text-sm mt-2">Aguarde um momento, estamos preparando seu workspace.</p>
      </div>
    </div>
  );
}
