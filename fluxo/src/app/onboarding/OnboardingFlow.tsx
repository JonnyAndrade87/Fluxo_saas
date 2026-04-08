'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Zap,
  RefreshCw,
  Blend,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingModel = 'manual' | 'recurring' | 'mixed' | null;
type AutomationPref = 'smart' | 'manual' | null;

interface FormData {
  companyName: string;
  businessType: string;
  billingModel: BillingModel;
  automation: AutomationPref;
}

const TOTAL_PROGRESS_STEPS = 4; // steps 2–5 show progress (welcome doesn't)



function ProgressBar({ step }: { step: number }) {
  // step 1 = welcome (no bar), step 2–5 show progress
  if (step === 1) return null;
  const current = step - 1; // 1–4
  const pct = Math.round((current / TOTAL_PROGRESS_STEPS) * 100);

  return (
    <div className="w-full mb-10">
      {/* Step dots */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#E4E9F0] -z-10" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#1A3A5F] to-[#00D2C8] -z-10 transition-all duration-700 ease-in-out"
          style={{ width: `${pct}%` }}
        />
        {Array.from({ length: TOTAL_PROGRESS_STEPS }).map((_, i) => {
          const dotStep = i + 1;
          const done = dotStep < current;
          const active = dotStep === current;
          return (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ring-4 ring-[#F5F7FA]
                ${done ? 'bg-[#1A3A5F] text-white shadow-md' : ''}
                ${active ? 'bg-gradient-to-br from-[#1A3A5F] to-[#00D2C8] text-white shadow-lg scale-110' : ''}
                ${!done && !active ? 'bg-white border-2 border-[#E4E9F0] text-[#94A3B8]' : ''}
              `}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : dotStep}
            </div>
          );
        })}
      </div>
      {/* Label */}
      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
        Passo {current} de {TOTAL_PROGRESS_STEPS}
      </p>
    </div>
  );
}

// ─── Animated Step Wrapper ────────────────────────────────────────────────────

function StepWrapper({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      key={stepKey}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: '',
    businessType: '',
    billingModel: null,
    automation: null,
  });

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // ── Step 1: Welcome ─────────────────────────────────────────────────────────
  const StepWelcome = (
    <StepWrapper stepKey={1}>
      <div className="flex flex-col items-center text-center gap-8">
        {/* Logo removido do card — fica apenas no header */}

        <div className="space-y-4 max-w-sm">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1A3A5F] leading-tight">
            Bem-vindo ao<br />
            <span className="text-[#00D2C8]">Fluxeer.</span>
          </h1>
          <p className="text-[#64748B] text-base leading-relaxed">
            Vamos configurar seu espaço financeiro em menos de 1 minuto.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <button
            onClick={next}
            className="w-full h-14 rounded-2xl bg-[#1A3A5F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#1A3A5F]/25 hover:bg-[#1A3A5F]/90 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Iniciar configuração
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-[#94A3B8] text-sm hover:text-[#64748B] transition-colors py-2"
          >
            Configurar depois
          </button>
        </div>
      </div>
    </StepWrapper>
  );

  // ── Step 2: Company Setup ────────────────────────────────────────────────────
  const StepCompany = (
    <StepWrapper stepKey={2}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A3A5F]">
            Sua empresa
          </h2>
          <p className="text-[#64748B] text-sm">
            Informações básicas para personalizar seu fluxo de cobrança.
          </p>
        </div>

        <div className="space-y-5">
          {/* Company Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1A3A5F]">Nome da empresa</label>
            <input
              type="text"
              placeholder="Ex: Agência Digital XYZ"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              className="w-full h-14 px-4 rounded-xl border-2 border-[#E4E9F0] bg-white text-[#0F1C2E] placeholder:text-[#CBD5E1] focus:border-[#1A3A5F] focus:ring-4 focus:ring-[#1A3A5F]/10 outline-none transition-all duration-200 text-base font-medium"
            />
          </div>


          {/* Business Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1A3A5F]">Segmento</label>
            <select
              value={form.businessType}
              onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
              className="w-full h-14 px-4 rounded-xl border-2 border-[#E4E9F0] bg-white text-[#0F1C2E] focus:border-[#1A3A5F] focus:ring-4 focus:ring-[#1A3A5F]/10 outline-none transition-all duration-200 text-base font-medium appearance-none cursor-pointer"
            >
              <option value="" disabled>Selecione um segmento...</option>
              <option value="services">Prestação de Serviços / B2B</option>
              <option value="tech">Tecnologia / SaaS</option>
              <option value="industry">Indústria &amp; Distribuição</option>
              <option value="retail">Comércio / Varejo</option>
              <option value="health">Saúde &amp; Clínicas</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={back}
            className="h-14 px-5 rounded-xl border-2 border-[#E4E9F0] text-[#64748B] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC] flex items-center gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            disabled={!form.companyName || !form.businessType}
            className="flex-1 h-14 rounded-xl bg-gradient-to-r from-[#1A3A5F] to-[#0A5F8A] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1A3A5F]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200"
          >
            Continuar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </StepWrapper>
  );

  // ── Step 3: Billing Preferences ──────────────────────────────────────────────

  const billingOptions = [
    {
      value: 'manual' as BillingModel,
      icon: Building2,
      label: 'Cobrança manual',
      desc: 'Gero minhas cobranças e controlo cada cliente individualmente.',
    },
    {
      value: 'recurring' as BillingModel,
      icon: RefreshCw,
      label: 'Recorrência mensal',
      desc: 'Cobro os mesmos clientes todo mês com valores fixos ou variáveis.',
    },
    {
      value: 'mixed' as BillingModel,
      icon: Blend,
      label: 'Modelo misto',
      desc: 'Tenho contratos fixos e cobranças pontuais ao mesmo tempo.',
    },
  ];

  const StepBilling = (
    <StepWrapper stepKey={3}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A3A5F]">
            Como você cobra?
          </h2>
          <p className="text-[#64748B] text-sm">
            Isso ajuda a personalizar seu fluxo de cobrança desde o primeiro dia.
          </p>
        </div>

        <div className="space-y-3">
          {billingOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = form.billingModel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, billingModel: opt.value }))}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
                  ${selected
                    ? 'border-[#1A3A5F] bg-gradient-to-r from-[#1A3A5F]/5 to-[#00D2C8]/5 shadow-md'
                    : 'border-[#E4E9F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                  ${selected ? 'bg-gradient-to-br from-[#1A3A5F] to-[#00D2C8] text-white shadow-lg' : 'bg-[#F5F7FA] text-[#64748B]'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm transition-colors ${selected ? 'text-[#1A3A5F]' : 'text-[#0F1C2E]'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 shrink-0
                  ${selected ? 'border-[#1A3A5F] bg-[#1A3A5F] shadow-sm' : 'border-[#CBD5E1]'}`}>
                  {selected && (
                    <div className="w-full h-full rounded-full bg-[#00D2C8] scale-50" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={back}
            className="h-14 px-5 rounded-xl border-2 border-[#E4E9F0] text-[#64748B] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC] flex items-center gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            disabled={!form.billingModel}
            className="flex-1 h-14 rounded-xl bg-[#1A3A5F] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1A3A5F]/20 hover:bg-[#1A3A5F]/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200"
          >
            Continuar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </StepWrapper>
  );

  // ── Step 4: Automation ───────────────────────────────────────────────────────

  const automationOptions = [
    {
      value: 'smart' as AutomationPref,
      icon: Bell,
      label: 'Ativar lembretes inteligentes',
      desc: 'O Fluxeer envia lembretes automáticos antes, no vencimento e após o atraso. Recomendado.',
      highlight: true,
    },
    {
      value: 'manual' as AutomationPref,
      icon: BellOff,
      label: 'Gerenciar manualmente',
      desc: 'Prefiro controlar cada comunicação com meus clientes por conta própria.',
      highlight: false,
    },
  ];

  const StepAutomation = (
    <StepWrapper stepKey={4}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A3A5F]">
            Automação de cobranças
          </h2>
          <p className="text-[#64748B] text-sm">
            Você pode alterar isso nas configurações a qualquer momento.
          </p>
        </div>

        <div className="space-y-4">
          {automationOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = form.automation === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, automation: opt.value }))}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
                  ${selected
                    ? 'border-[#1A3A5F] bg-gradient-to-r from-[#1A3A5F]/5 to-[#00D2C8]/5 shadow-md'
                    : 'border-[#E4E9F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200
                  ${selected ? 'bg-gradient-to-br from-[#1A3A5F] to-[#00D2C8] text-white shadow-lg' : 'bg-[#F5F7FA] text-[#64748B]'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm transition-colors ${selected ? 'text-[#1A3A5F]' : 'text-[#0F1C2E]'}`}>
                      {opt.label}
                    </p>
                    {opt.highlight && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D2C8]/10 text-[#00A89E] border border-[#00D2C8]/30">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={back}
            className="h-14 px-5 rounded-xl border-2 border-[#E4E9F0] text-[#64748B] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC] flex items-center gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            disabled={!form.automation}
            className="flex-1 h-14 rounded-xl bg-[#1A3A5F] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1A3A5F]/20 hover:bg-[#1A3A5F]/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200"
          >
            Finalizar setup
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </StepWrapper>
  );

  // ── Step 5: Complete ─────────────────────────────────────────────────────────
  const StepComplete = (
    <StepWrapper stepKey={5}>
      <div className="flex flex-col items-center text-center gap-8">
        {/* Success Animation */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-[#1A3A5F] flex items-center justify-center shadow-2xl shadow-[#1A3A5F]/30 animate-[bounce_0.6s_ease-out_1]">
            <CheckCircle2 className="w-14 h-14 text-[#00D2C8]" strokeWidth={1.5} />
          </div>
          {/* Ring pulse */}
          <div className="absolute inset-0 rounded-full bg-[#00D2C8]/20 animate-ping" />
        </div>

        <div className="space-y-4 max-w-sm">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#1A3A5F] leading-tight">
            Seu espaço financeiro<br />está pronto!
          </h2>
          <p className="text-[#64748B] text-sm leading-relaxed">
            {form.companyName ? `${form.companyName} está` : 'Você está'} configurado e pronto para começar a recuperar créditos mais rápido.
          </p>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {form.billingModel && (
            <span className="px-3 py-1.5 rounded-full bg-[#1A3A5F]/8 text-[#1A3A5F] text-xs font-semibold border border-[#1A3A5F]/15">
              {form.billingModel === 'manual' ? '📋 Cobrança Manual' : form.billingModel === 'recurring' ? '🔄 Recorrência' : '🎯 Modelo Misto'}
            </span>
          )}
          {form.automation && (
            <span className="px-3 py-1.5 rounded-full bg-[#00D2C8]/10 text-[#008F87] text-xs font-semibold border border-[#00D2C8]/20">
              {form.automation === 'smart' ? '🔔 Lembretes Ativos' : '🔕 Lembretes Manuais'}
            </span>
          )}
        </div>

        <button
          onClick={() => router.push('/?welcome=1')}
          className="w-full max-w-xs h-14 rounded-2xl bg-[#1A3A5F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#1A3A5F]/25 hover:bg-[#1A3A5F]/90 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          Ir para o Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </StepWrapper>
  );

  // ── Card Container ───────────────────────────────────────────────────────────

  const steps: Record<number, React.ReactNode> = {
    1: StepWelcome,
    2: StepCompany,
    3: StepBilling,
    4: StepAutomation,
    5: StepComplete,
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-[#1A3A5F]/8 border border-[#E4E9F0] p-8 sm:p-10">
        <ProgressBar step={step} />
        {steps[step]}
      </div>
    </div>
  );
}
