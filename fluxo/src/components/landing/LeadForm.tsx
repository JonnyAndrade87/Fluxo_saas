'use client';

import { useActionState, useEffect, useState } from 'react';
import { submitLead } from '@/actions/leads';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function LeadForm() {
  const [state, action, isPending] = useActionState(submitLead, { success: false, error: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setSubmitted(true);
    }
  }, [state]);

  if (submitted) {
    return (
      <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-manrope font-bold text-white">Solicitação enviada!</h3>
        <p className="text-sm font-geist text-white/70">
          Nossa equipe comercial entrará em contato em breve para agendar sua demonstração.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="w-full bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-6 text-left relative overflow-hidden">
      {/* Subtle top glow inside card */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      
      {state?.error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-geist">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
        <div className="relative">
          <input 
            id="email"
            name="email"
            type="email" 
            placeholder="you@company.com" 
            required
            disabled={isPending}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-geist text-white shadow-sm placeholder:text-gray-500 disabled:opacity-50"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="company" className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-2 block">Company / Agency</label>
        <div className="relative">
          <input 
            id="company"
            name="company"
            type="text" 
            placeholder="Fluxeer Corp" 
            required
            disabled={isPending}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-geist text-white shadow-sm placeholder:text-gray-500 disabled:opacity-50"
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full btn-shimmer btn-shimmer-dark inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-70 disabled:cursor-not-allowed mt-2 active:scale-95"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          'Agendar Reunião de Demonstração'
        )}
      </button>
      
      <p className="text-center text-[11px] font-mono text-gray-500 mt-2 tracking-wide uppercase">
        Safe & Secure.
      </p>
    </form>
  );
}
