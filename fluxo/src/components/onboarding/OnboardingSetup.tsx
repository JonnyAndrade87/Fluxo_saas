'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  Settings2,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingStatus, OnboardingStep } from '@/actions/onboarding';

// ── Icon map ───────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ElementType> = {
  create_customer:        Users,
  create_invoice:         FileText,
  configure_billing_flow: Settings2,
};

// ── Step Card ─────────────────────────────────────────────────────────────────

function SetupStepCard({
  step,
  index,
  isNext,
  isBlocked,
}: {
  step: OnboardingStep;
  index: number;
  isNext: boolean;
  isBlocked: boolean;
}) {
  const Icon = STEP_ICONS[step.id] ?? Settings2;

  // ── Concluído ──────────────────────────────────────────────────────────────
  if (step.completed) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">{step.label}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Concluído</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
          ✓ Feito
        </span>
      </div>
    );
  }

  // ── Próximo (ativo) ────────────────────────────────────────────────────────
  if (isNext) {
    return (
      <div className="relative flex items-start gap-4 px-5 py-5 rounded-2xl bg-white border-2 border-indigo-500 shadow-md shadow-indigo-100/50">
        {/* Pulse indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Agora</span>
        </div>

        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <p className="text-sm font-bold text-slate-900">{step.label}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
          <Link href={step.href} className="inline-block mt-3">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm text-xs px-4 gap-1.5 h-8"
            >
              {step.cta}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Bloqueado (próximos steps) ─────────────────────────────────────────────
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/60 opacity-50">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Circle className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-500">{step.label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Disponível após o passo anterior</p>
      </div>
      <span className="text-[10px] font-medium text-slate-400 shrink-0">Etapa {index}</span>
    </div>
  );
}

// ── Progress Bar (linear, mais legível que o ring em mobile) ─────────────────

function ProgressHeader({
  completedCount,
  totalSteps,
  progressPct,
}: {
  completedCount: number;
  totalSteps: number;
  progressPct: number;
}) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de progresso no topo */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-7 pt-7 pb-8 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

          {/* Texto principal */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Setup — Configuração inicial
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {completedCount === 0
                ? 'Vamos configurar o Fluxeer'
                : completedCount === totalSteps - 1
                ? 'Quase lá — último passo'
                : 'Continue de onde parou'}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md">
              Conclua os <strong className="text-slate-700">{totalSteps} passos</strong> abaixo para
              ativar o motor de cobrança e liberar o painel completo.
            </p>
          </div>

          {/* Indicador numérico compacto */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-black text-slate-800">{progressPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 tabular-nums">
                {completedCount} / {totalSteps}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalSteps - completedCount} restante{totalSteps - completedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

        </div>
      </div>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">

      {/* ── Header com progresso ─────────────────────────────────────────── */}
      <ProgressHeader
        completedCount={completedCount}
        totalSteps={totalSteps}
        progressPct={progressPct}
      />

      {/* ── Steps ───────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
          Passos obrigatórios
        </p>
        {steps.map((step, idx) => {
          const allPrevDone = steps.slice(0, idx).every(s => s.completed);
          const isNext = !step.completed && allPrevDone;
          const isBlocked = !step.completed && !isNext;
          return (
            <SetupStepCard
              key={step.id}
              step={step}
              index={idx + 1}
              isNext={isNext}
              isBlocked={isBlocked}
            />
          );
        })}
      </div>

      {/* ── Próximo Nível — WhatsApp (recomendação, nunca bloqueio) ──────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700">
              Próximo nível: envio automático via WhatsApp
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Após concluir os passos acima, conecte a API da Meta para que o Fluxeer envie
              cobranças automaticamente. O modo manual já funciona e gera valor total.
            </p>
          </div>
          <Link href="/configuracoes" className="shrink-0 mt-0.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              Configurar
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
