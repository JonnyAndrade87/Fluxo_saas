'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  Settings2,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingStatus, OnboardingStep } from '@/actions/onboarding';

// ── Icon map ───────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ElementType> = {
  create_customer:       Users,
  create_invoice:        FileText,
  configure_billing_flow: Settings2,
};

// ── Step Card ─────────────────────────────────────────────────────────────────

function SetupStepCard({
  step,
  index,
  isNext,
}: {
  step: OnboardingStep;
  index: number;
  isNext: boolean;
}) {
  const Icon = STEP_ICONS[step.id] ?? Settings2;

  if (step.completed) {
    return (
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-emerald-800 line-through decoration-emerald-400">
            {step.label}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">Concluído</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg shrink-0">
          ✓
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-shadow ${
        isNext
          ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50/60'
          : 'bg-white border-border opacity-60'
      }`}
    >
      {/* Step number */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isNext ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800">{step.label}</p>
          {isNext && (
            <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-100">
              Próximo
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* CTA */}
      {isNext && (
        <Link href={step.href} className="shrink-0 mt-0.5">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm text-xs px-3 gap-1.5"
          >
            {step.cta}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  status: OnboardingStatus;
}

export default function OnboardingSetup({ status }: Props) {
  const { progressPct, completedCount, totalSteps, steps } = status;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Top bar */}
        <div className="h-1.5 bg-slate-100 w-full">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-8 py-8 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                Setup Inicial
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Configure o Fluxeer
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                Siga os passos abaixo para ativar o motor de cobrança. O painel
                completo é liberado assim que você concluir os{' '}
                <strong className="text-slate-700">{totalSteps} passos essenciais</strong>.
              </p>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none" stroke="#E2E8F0" strokeWidth="8"
                  />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800">{progressPct}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {completedCount}/{totalSteps} concluídos
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalSteps - completedCount} restante{totalSteps - completedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Steps Grid ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          Passos obrigatórios
        </h2>
        <div className="space-y-2.5">
          {steps.map((step, idx) => (
            <SetupStepCard
              key={step.id}
              step={step}
              index={idx + 1}
              isNext={!step.completed && steps.slice(0, idx).every(s => s.completed)}
            />
          ))}
        </div>
      </div>

      {/* ── Próximo Nível (WhatsApp - Não Bloqueador) ───────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">
              Próximo nível: Envio automático via WhatsApp
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Após concluir os passos acima, conecte a API da Meta para que o
              Fluxeer envie cobranças automaticamente. Por ora, o modo manual
              já gera valor total.
            </p>
          </div>
          <Link href="/configuracoes" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-xl border-slate-300 text-slate-600 hover:bg-white"
            >
              Configurar
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
