'use client';

import { useActionState, useEffect, useState } from 'react';
import { submitLead } from '@/actions/leads';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function LeadForm() {
  const [state, action, isPending] = useActionState(submitLead, { success: false, error: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state?.success) setSubmitted(true);
  }, [state]);

  if (submitted) {
    return (
      <div className="w-full border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-manrope font-bold text-white text-base mb-1">Solicitação recebida.</h3>
          <p className="text-sm text-white/40">Nossa equipe entrará em contato em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="w-full border border-white/10 rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)' }}
    >
      {/* Top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="p-7 flex flex-col gap-5">

        {/* Title block */}
        <div>
          <h2 className="font-manrope font-extrabold text-white text-lg leading-tight tracking-tight mb-1">
            Assuma o controle da cobrança
          </h2>
          <p className="text-xs text-white/35 font-mono">Retorno em até 24h úteis.</p>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-xs" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="block text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase mb-1.5">
              E-mail corporativo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="voce@empresa.com.br"
              required
              disabled={isPending}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase mb-1.5">
              Empresa
            </label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Nome da empresa"
              required
              disabled={isPending}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3.5 rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.15)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            'Agendar reunião de demonstração'
          )}
        </button>

        <p className="text-center text-[9px] font-mono text-white/20 tracking-widest uppercase">
          Sem spam · Dados seguros
        </p>
      </div>
    </form>
  );
}
