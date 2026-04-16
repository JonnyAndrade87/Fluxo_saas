'use client';

import type {
  OnboardingTier,
  SubscriptionStatus,
  SupportLevel,
  TenantPlan,
} from '@prisma/client';

import { useState, useTransition } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Check,
  Diamond,
  Layers,
  Loader2,
  ExternalLink,
  Lock,
  Sparkles,
} from 'lucide-react';

import { createCustomerPortalSession, createSubscriptionCheckoutSession } from '@/actions/billing';
import type { BillingCycle } from '@/lib/billing/stripe';
import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLAN_CONFIG } from '@/lib/billing/plans';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type BillingView = {
  plan: TenantPlan;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  maxUsers: number;
  maxCustomers: number;
  maxInvoices: number;
  supportLevel: SupportLevel;
  onboardingTier: OnboardingTier;
  usage: { users: number; customers: number; invoices: number };
};

type BillingFeedback = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// Static config
// ──────────────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

const STATUS_LABELS: Partial<Record<SubscriptionStatus, string>> = {
  trialing: 'Trial',
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
};

type PlanInfo = {
  monthlyLabel: string;
  yearlyLabel: string;
  yearlyNote: string;
  tagline: string;
  description: string;
  features: string[];
  lockedFeatures?: string[];
  highlight?: boolean;
  icon: React.ElementType;
};

// Prices match Stripe exactly. Yearly = 10 months paid, 12 received.
const PLAN_INFO: Record<TenantPlan, PlanInfo> = {
  starter: {
    monthlyLabel: 'Grátis',
    yearlyLabel: 'Grátis',
    yearlyNote: '',
    tagline: 'Para começar sem custo',
    description: 'Organize cobranças, clientes e histórico sem pagar nada. Ideal para começar.',
    features: [
      '1 usuário',
      '300 clientes',
      '1.000 faturas',
      'Dashboard e visão geral',
      'Gestão de cobranças',
      'Histórico completo',
      'Configurações de conta',
    ],
    lockedFeatures: [
      'Comunicações automáticas',
      'Importação em lote',
      'Relatórios avançados',
    ],
    icon: Box,
  },
  pro: {
    monthlyLabel: 'R$ 97',
    yearlyLabel: 'R$ 970',
    yearlyNote: '2 meses grátis · R$ 80,83/mês',
    tagline: 'Para operações em crescimento',
    description: 'Mais capacidade de equipe, carteira e automação para escalar sem travar.',
    features: [
      '3 usuários',
      '2.000 clientes',
      '10.000 faturas',
      'Comunicações automáticas',
      'Importação em lote',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    highlight: true,
    icon: Layers,
  },
  scale: {
    monthlyLabel: 'R$ 297',
    yearlyLabel: 'R$ 2.970',
    yearlyNote: '2 meses grátis · R$ 247,50/mês',
    tagline: 'Para alto volume operacional',
    description: 'Capacidade máxima de time, carteira e volume com onboarding e atendimento dedicados.',
    features: [
      '10 usuários',
      '20.000 clientes',
      '100.000 faturas',
      'Tudo do Pro',
      'Onboarding assistido',
      'Atendimento VIP',
      'SLA de resposta dedicado',
    ],
    icon: Diamond,
  },
};

const PLAN_ORDER: TenantPlan[] = ['starter', 'pro', 'scale'];

const BILLING_FEEDBACK: Record<string, BillingFeedback> = {
  success: { tone: 'success', message: 'Assinatura concluída com sucesso! Seu plano já está ativo.' },
  canceled: { tone: 'info', message: 'Checkout cancelado. Nenhuma cobrança foi realizada.' },
  portal: { tone: 'info', message: 'Você voltou do portal da Stripe.' },
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export default function PlanosClient({
  billing,
  billingFeedbackParam,
}: {
  billing: BillingView | null;
  billingFeedbackParam?: string | null;
}) {
  const [feedback, setFeedback] = useState<BillingFeedback | null>(
    billingFeedbackParam ? (BILLING_FEEDBACK[billingFeedbackParam] ?? null) : null,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cycle, setCycle] = useState<Extract<BillingCycle, 'monthly' | 'yearly'>>('monthly');

  if (!billing) {
    return (
      <div className="mt-8 animate-in fade-in duration-500">
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Planos indisponíveis no momento
            </CardTitle>
            <CardDescription className="text-amber-700">
              Não foi possível carregar os dados de assinatura. Tente novamente em instantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasPortalAccess = Boolean(billing.stripeCustomerId);
  const canStartCheckout = !billing.stripeSubscriptionId || billing.subscriptionStatus === 'canceled';
  const isStarterPlan = billing.plan === 'starter';
  const currentStatusLabel = STATUS_LABELS[billing.subscriptionStatus] ?? billing.subscriptionStatus;

  const runPortalAction = () => {
    setFeedback(null);
    setPendingAction('portal');
    startTransition(async () => {
      const result = await createCustomerPortalSession();
      if (result.error) { setFeedback({ tone: 'error', message: result.error }); setPendingAction(null); return; }
      if (!result.url) { setFeedback({ tone: 'error', message: 'Não foi possível abrir o portal da Stripe agora.' }); setPendingAction(null); return; }
      window.location.assign(result.url);
    });
  };

  const runCheckoutAction = (plan: TenantPlan) => {
    if (plan === 'starter') return;
    setFeedback(null);
    setPendingAction(`checkout:${plan}:${cycle}`);
    startTransition(async () => {
      const result = await createSubscriptionCheckoutSession(plan, cycle);
      if (result.error) { setFeedback({ tone: 'error', message: result.error }); setPendingAction(null); return; }
      if (!result.url) { setFeedback({ tone: 'error', message: 'Não foi possível iniciar o checkout agora.' }); setPendingAction(null); return; }
      window.location.assign(result.url);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 lg:px-8 font-sans">

      {/* Feedback banner */}
      {feedback && (
        <div className={cn(
          'flex items-start gap-3 rounded-xl border p-4 text-sm mb-6',
          feedback.tone === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          feedback.tone === 'success' ? 'bg-teal-50 text-teal-800 border-teal-200' :
          'bg-slate-50 text-slate-600 border-slate-200'
        )}>
          {feedback.message}
        </div>
      )}

      {/* Soft upgrade nudge for Starter */}
      {isStarterPlan && billing.subscriptionStatus !== 'canceled' && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/60 px-5 py-3.5 text-sm">
          <span className="text-slate-700">
            Você está no <span className="font-semibold text-teal-700">Starter</span>. Faça upgrade para o Pro e libere comunicações automáticas, importação em lote e mais capacidade.
          </span>
          <a href="#pro-card" className="shrink-0 rounded-lg border border-teal-300 bg-white px-4 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors">
            Ver Pro →
          </a>
        </div>
      )}

      {/* ── Pricing section — clean off-white surface ── */}
      <section className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">

        {/* Top teal accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600" />

        <div className="px-6 py-12 lg:px-16 lg:py-16">

          {/* Header */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
            {/* Current plan chip */}
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 mb-5">
              Plano atual: {PLAN_LABELS[billing.plan]} · {currentStatusLabel}
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Escolha o plano ideal para o volume da sua operação
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Compare limites de usuários, clientes e faturas para crescer sem travar sua gestão.
            </p>

            {/* Billing cycle toggle */}
            <div className="mt-8 inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 gap-1">
              <button
                onClick={() => setCycle('monthly')}
                className={cn(
                  'px-5 py-1.5 rounded-full text-sm font-medium transition-all',
                  cycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setCycle('yearly')}
                className={cn(
                  'px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  cycle === 'yearly'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                Anual
                <span className="text-[10px] bg-teal-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  2 meses grátis
                </span>
              </button>
            </div>

            {/* Portal access */}
            {hasPortalAccess && (
              <button
                onClick={runPortalAction}
                disabled={isPending}
                className="mt-5 flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 transition-colors disabled:opacity-60 font-medium"
              >
                {isPending && pendingAction === 'portal' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Gerenciar cobrança
              </button>
            )}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {PLAN_ORDER.map((plan) => {
              const config = PLAN_CONFIG[plan];
              const info = PLAN_INFO[plan];
              const PlanIcon = info.icon;
              const isCurrentPlan = billing.plan === plan;
              const isPlanStarter = plan === 'starter';
              const isHighlighted = Boolean(info.highlight);

              const isPaidCheckout = !isPlanStarter && canStartCheckout;
              const actionKey = isPaidCheckout ? `checkout:${plan}:${cycle}` : 'portal';
              const isActionPending = isPending && pendingAction === actionKey;

              const displayPrice = cycle === 'yearly' ? info.yearlyLabel : info.monthlyLabel;
              const yearlySub = cycle === 'yearly' && info.yearlyNote ? info.yearlyNote : null;

              let actionLabel: string;
              if (isPlanStarter) {
                actionLabel = isCurrentPlan ? 'Plano atual' : 'Fazer downgrade';
              } else if (isPaidCheckout) {
                actionLabel = billing.subscriptionStatus === 'canceled' && isCurrentPlan
                  ? 'Reativar plano'
                  : `Assinar ${PLAN_LABELS[plan]}`;
              } else if (hasPortalAccess) {
                actionLabel = isCurrentPlan ? 'Gerenciar cobrança' : 'Alterar no portal';
              } else {
                actionLabel = 'Portal indisponível';
              }

              return (
                <div
                  key={plan}
                  id={`${plan}-card`}
                  className={cn(
                    'relative flex flex-col rounded-2xl p-7 transition-shadow duration-200',
                    isHighlighted
                      ? 'bg-slate-900 text-white shadow-xl ring-1 ring-slate-800'
                      : 'bg-white border border-slate-200 hover:shadow-md',
                  )}
                >
                  {/* Pro glow accent */}
                  {isHighlighted && (
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
                  )}

                  {/* Icon + badges */}
                  <div className="mb-5 flex items-start justify-between">
                    <div className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center',
                      isHighlighted ? 'bg-teal-500/20' : 'bg-slate-100',
                    )}>
                      <PlanIcon className={cn('h-4.5 w-4.5', isHighlighted ? 'text-teal-400' : 'text-slate-500')} />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {isHighlighted && (
                        <span className="flex items-center gap-1 rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          <Sparkles className="h-2.5 w-2.5" /> Mais popular
                        </span>
                      )}
                      {isCurrentPlan && (
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                          isHighlighted
                            ? 'border-teal-400/40 text-teal-400 bg-teal-400/10'
                            : 'border-slate-300 text-slate-500 bg-slate-50',
                        )}>
                          Plano atual
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        'text-3xl font-bold tracking-tight',
                        isHighlighted ? 'text-white' : 'text-slate-900',
                      )}>
                        {displayPrice}
                      </span>
                      {!isPlanStarter && cycle === 'monthly' && (
                        <span className={cn('text-sm', isHighlighted ? 'text-slate-400' : 'text-slate-400')}>/mês</span>
                      )}
                    </div>
                    {yearlySub && (
                      <p className={cn('text-xs mt-1', isHighlighted ? 'text-slate-400' : 'text-slate-400')}>
                        {yearlySub}
                      </p>
                    )}
                    {isPlanStarter && !cycle && (
                      <p className="text-xs text-slate-400 mt-1">sem cartão necessário</p>
                    )}
                  </div>

                  {/* Plan name + tagline + description */}
                  <div className="mb-5">
                    <h3 className={cn(
                      'text-base font-bold',
                      isHighlighted ? 'text-teal-400' : 'text-slate-900',
                    )}>
                      {PLAN_LABELS[plan]}
                    </h3>
                    <p className={cn('text-xs font-medium mt-0.5', isHighlighted ? 'text-slate-400' : 'text-slate-400')}>
                      {info.tagline}
                    </p>
                    <p className={cn('text-sm leading-relaxed mt-2', isHighlighted ? 'text-slate-300' : 'text-slate-500')}>
                      {info.description}
                    </p>

                    {/* Capacity grid */}
                    <div className={cn(
                      'mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-xs text-center',
                      isHighlighted ? 'border-slate-700' : 'border-slate-100',
                    )}>
                      {[
                        { value: config.maxUsers, label: `usuário${config.maxUsers !== 1 ? 's' : ''}` },
                        { value: config.maxCustomers.toLocaleString('pt-BR'), label: 'clientes' },
                        { value: config.maxInvoices.toLocaleString('pt-BR'), label: 'faturas' },
                      ].map(({ value, label }) => (
                        <div key={label} className={isHighlighted ? 'text-slate-400' : 'text-slate-400'}>
                          <span className={cn('block font-bold text-sm mb-0.5', isHighlighted ? 'text-white' : 'text-slate-800')}>
                            {value}
                          </span>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    disabled={isPending || isPlanStarter || (!isPaidCheckout && !hasPortalAccess)}
                    onClick={() => {
                      if (isPlanStarter) return;
                      if (isPaidCheckout) runCheckoutAction(plan);
                      else runPortalAction();
                    }}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mb-6',
                      isHighlighted
                        ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-md shadow-teal-500/20 disabled:opacity-50'
                        : isPlanStarter
                          ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {actionLabel}
                  </button>

                  {/* Feature list */}
                  <div className="mt-auto space-y-2.5">
                    <p className={cn('text-[10px] uppercase tracking-widest font-semibold', isHighlighted ? 'text-slate-500' : 'text-slate-400')}>
                      Incluso
                    </p>
                    <ul className="space-y-2">
                      {info.features.map((feat, i) => (
                        <li key={i} className={cn('flex items-center gap-2.5 text-sm', isHighlighted ? 'text-slate-300' : 'text-slate-600')}>
                          <Check className={cn('h-3.5 w-3.5 shrink-0', isHighlighted ? 'text-teal-400' : 'text-teal-500')} />
                          {feat}
                        </li>
                      ))}
                      {info.lockedFeatures?.map((feat, i) => (
                        <li key={`locked-${i}`} className="flex items-center gap-2.5 text-sm text-slate-350">
                          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                          <span className="text-slate-400">{feat}</span>
                          <span className="ml-auto text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                            Pro+
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
