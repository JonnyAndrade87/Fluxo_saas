'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitDemoLead } from '@/actions/demo-lead';
import { Loader2, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveLandingSection, getLastLandingCtaContext, trackLandingEvent } from '@/lib/landing-analytics';

export function LeadFormSection() {
  const [state, action, isPending] = useActionState(submitDemoLead, { success: false, error: '', message: '' });
  const submitTrackedRef = useRef(false);
  const submitted = state?.success === true;

  useEffect(() => {
    if (!state?.success || submitTrackedRef.current) return;

    const lastCta = getLastLandingCtaContext();

    trackLandingEvent('form_submit', {
      page: '/',
      section: 'demonstracao',
      source_section: lastCta.section || getActiveLandingSection() || 'demonstracao',
      cta_label: lastCta.label,
      form_name: 'demo_request',
      user_data: state?.data ? {
        email: state.data.email,
        phone_number: state.data.whatsapp?.replace(/\D/g, '') // Apenas números para melhor compatibilidade com Google Ads
      } : undefined
    });

    submitTrackedRef.current = true;
  }, [state]);

  return (
    <section 
      className="relative py-24 lg:py-32 overflow-hidden" 
      id="demonstracao"
      style={{ background: 'linear-gradient(160deg, #10141a 0%, #0d1117 60%, #0a0f14 100%)' }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] opacity-[0.05] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(0,176,179,1) 0%, transparent 60%)' }}
      />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(circle at bottom left, rgba(255,255,255,1) 0%, transparent 60%)' }}
      />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* ── LEFT COLUMN: COPY ── */}
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-8 w-max">
              Solicite uma demonstração
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-manrope font-extrabold tracking-tighter leading-[1.05] text-white mb-6">
              Veja como o Fluxeer<br />
              <span className="text-brand-green">pode organizar sua cobrança.</span>
            </h2>
            
            <p className="text-base lg:text-lg text-white/75 font-geist leading-relaxed mb-10 max-w-lg">
              Preencha os dados abaixo e nossa equipe entra em contato para entender sua operação e apresentar a melhor configuração para o seu contas a receber.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-brand-green" />
                </div>
                <span className="text-sm text-white/80 font-geist">Demonstração guiada</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-brand-green" />
                </div>
                <span className="text-sm text-white/80 font-geist">Resposta em até 24h úteis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                </div>
                <span className="text-sm text-white/80 font-geist">Sem compromisso</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: FORM ── */}
          <div className="relative">
            <div className="absolute inset-0 bg-brand-green/10 blur-[80px] rounded-full transform scale-90" />
            
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.3)] bg-[#161b22]/80 backdrop-blur-xl p-8 lg:p-10">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-brand-green" />
                    </div>
                    <h3 className="text-2xl font-manrope font-extrabold text-white mb-4">
                      Solicitação enviada com sucesso
                    </h3>
                      <p className="text-white/75 font-geist text-base max-w-sm">
                        Nossa equipe entrará em contato em breve para agendar sua demonstração.
                      </p>
                  </motion.div>
                ) : (
                    <motion.form 
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      action={action}
                      className="flex flex-col gap-6"
                      data-track-form="true"
                      data-form-name="demo_request"
                      data-section="demonstracao"
                    >
                    {state?.error && (
                      <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-geist">{state.error}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-[11px] font-mono text-white/70 tracking-widest uppercase">Nome</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          disabled={isPending}
                          placeholder="Seu nome completo"
                          className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="company" className="block text-[11px] font-mono text-white/70 tracking-widest uppercase">Empresa</label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          required
                          disabled={isPending}
                          placeholder="Nome da empresa"
                          className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-[11px] font-mono text-white/70 tracking-widest uppercase">E-mail corporativo</label>
                        <input
                        id="email"
                        name="email"
                          type="email"
                          required
                          disabled={isPending}
                          placeholder="voce@suaempresa.com.br"
                          className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="whatsapp" className="block text-[11px] font-mono text-white/70 tracking-widest uppercase">WhatsApp</label>
                        <input
                          id="whatsapp"
                          name="whatsapp"
                          type="tel"
                          required
                          disabled={isPending}
                          placeholder="(00) 00000-0000"
                          className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="monthlyVolume" className="block text-[11px] font-mono text-white/70 tracking-widest uppercase">Volume mensal</label>
                        <select
                          id="monthlyVolume"
                          name="monthlyVolume"
                          required
                          disabled={isPending}
                          defaultValue=""
                          className="w-full rounded-xl px-4 py-3.5 text-sm text-white transition-colors appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <option value="" disabled className="text-slate-900">Selecione o volume</option>
                          <option value="Ate 50" className="text-slate-900">Até 50 por mês</option>
                          <option value="51 a 200" className="text-slate-900">51 a 200 por mês</option>
                          <option value="201 a 500" className="text-slate-900">201 a 500 por mês</option>
                          <option value="Mais de 500" className="text-slate-900">Mais de 500 por mês</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full relative group inline-flex items-center justify-center gap-3 bg-brand-green text-slate-950 font-manrope font-bold text-base py-4 rounded-xl shadow-[0_15px_30px_rgba(0,176,179,0.2)] hover:shadow-[0_20px_40px_rgba(0,176,179,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22] disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isPending ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                        ) : (
                          <>Quero ver o Fluxeer funcionando <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                      <p className="text-center text-[11px] font-geist text-white/50 mt-4">
                        Ao enviar, nossa equipe comercial entra em contato para agendar sua demonstração.
                      </p>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
