'use client';

import { useActionState, useEffect, useState } from 'react';
import { submitLead } from '@/actions/leads';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <div className="max-w-md mx-auto bg-[#0a0c0f]/80 p-8 rounded-2xl border border-emerald-500/20 shadow-2xl flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Solicitação enviada!</h3>
        <p className="text-sm text-slate-400">
          Nossa equipe comercial entrará em contato em breve para agendar sua demonstração.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-md mx-auto bg-[#0a0c0f] p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4 text-left">
      {state?.error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seu E-mail Corporativo</label>
        <input 
          id="email"
          name="email"
          type="email" 
          placeholder="voce@empresa.com.br" 
          required
          disabled={isPending}
          className="w-full bg-[#1c2129] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D2C8] focus:ring-1 focus:ring-[#00D2C8] transition-all disabled:opacity-50"
        />
      </div>
      
      <div>
        <label htmlFor="company" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome da Empresa</label>
        <input 
          id="company"
          name="company"
          type="text" 
          placeholder="Qual empresa você representa?" 
          required
          disabled={isPending}
          className="w-full bg-[#1c2129] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D2C8] focus:ring-1 focus:ring-[#00D2C8] transition-all disabled:opacity-50"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-[#00D2C8] hover:bg-[#00bda5] text-slate-900 font-bold h-12 text-base mt-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          'Agendar Reunião de Demonstração'
        )}
      </Button>
      
      <p className="text-center text-xs text-slate-500 mt-2">
        Suas informações estão seguras. Sem spam.
      </p>
    </form>
  );
}
