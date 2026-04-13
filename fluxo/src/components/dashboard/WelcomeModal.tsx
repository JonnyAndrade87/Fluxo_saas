'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, X, ArrowRight, BarChart2, Users, Zap } from 'lucide-react';

export default function WelcomeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      // Defer state update to avoid synchronous setState inside effect warning
      const timer = setTimeout(() => setOpen(true), 0);
      // Limpa a query string da URL sem recarregar a página
      window.history.replaceState({}, '', '/');
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#1A3A5F] to-[#0A5F8A] px-8 pt-10 pb-8 text-center">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#00D2C8]" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#00D2C8]/20 animate-ping" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Bem-vindo ao Fluxeer!
          </h2>
          <p className="text-white/75 text-sm mt-2 leading-relaxed">
            Seu workspace financeiro está configurado e pronto para usar.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          <p className="text-[#475569] text-sm text-center">
            Aqui está o que você pode fazer agora:
          </p>
          <div className="space-y-3">
            {[
              { icon: Users, label: 'Cadastre seus clientes', desc: 'Importe ou adicione manualmente' },
              { icon: BarChart2, label: 'Acompanhe suas cobranças', desc: 'Gerencie faturamento em tempo real' },
              { icon: Zap, label: 'Automatize lembretes', desc: 'Régua de cobrança inteligente' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F7FA] border border-[#E4E9F0]">
                <div className="w-9 h-9 rounded-xl bg-[#1A3A5F] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#00D2C8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A3A5F]">{label}</p>
                  <p className="text-xs text-[#94A3B8]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <button
            onClick={() => setOpen(false)}
            className="w-full h-12 rounded-2xl bg-[#1A3A5F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1A3A5F]/90 transition-all duration-200 shadow-lg shadow-[#1A3A5F]/25"
          >
            Começar a usar o Fluxeer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
