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
  CheckCircle,
  Diamond,
  Layers,
  Loader2,
  ExternalLink,
  Lock,
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
  usage: {
    users: number;
    customers: number;
    invoices: number;
  };
};

type BillingFeedback = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// Config
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

// Pricing values mirror exactly what is configured in Stripe.
// Yearly = pay 10 months, get 12 (2 meses grátis).
type PlanInfo = {
  monthlyLabel: string;
  yearlyLabel: string;
  yearlyNote: string; // shown below yearly price
  tagline: string;
  description: string;
  features: string[];
  lockedFeatures?: string[]; // shown as locked (pro+ only)
  highlight?: boolean;
  icon: React.ElementType;
};

const PLAN_INFO: Record<TenantPlan, PlanInfo> = {
  starter: {
    monthlyLabel: 'Grátis',
    yearlyLabel: 'Grátis',
    yearlyNote: '',
    tagline: 'Para começar sem custo',
    description: 'Organize sua operação de cobrança sem pagar nada. Ideal para quem está começando.',
    features: [
      '1 usuário',
      '300 clientes',
      '1.000 faturas',
      'Visão geral e dashboard',
      'Gestão de cobranças',
      'Histórico completo',
      'Configurações de conta',
    ],
    lockedFeatures: ['Comunicações automáticas', 'Importação em lote', 'Relatórios avançados'],
    icon: Box,
  },
  pro: {
    monthlyLabel: 'R$ 97',
    yearlyLabel: 'R$ 970',
    yearlyNote: '2 meses grátis · R$ 80,83/mês',
    tagline: 'Para operações em crescimento',
    description: 'Mais capacidade de equipe, carteira e automação para escalar a gestão de cobranças.',
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
    tagline: 'Para operações de alto volume',
    description: 'Volume operacional máximo com onboarding dedicado e time de atendimento diferenciado.',
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

// Feedback messages shown on return from Stripe
const BILLING_FEEDBACK: Record<string, BillingFeedback> = {
  success: { tone: 'success', message: 'Assinatura concluída com sucesso! Seu plano já está ativo.' },
  canceled: { tone: 'info', message: 'Checkout cancelado. Nenhuma cobrança foi realizada.' },
  portal: { tone: 'info', message: 'Você voltou do portal da Stripe.' },
};

// Brand teal — consistent with the primary design system
const TEAL = {
  solid: 'bg-[#0ea5a0]',
  hover: 'hover:bg-[#0b9490]',
  text: 'text-[#0ea5a0]',
  border: 'border-[#0ea5a0]/30',
  bg: 'bg-[#0ea5a0]/10',
  glow: 'shadow-[0_0_24px_rgba(14,165,160,0.25)]',
  gradientOverlay: 'from-[#0ea5a0]/20',
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

  // Billing cycle — 'launch' is internal only, never exposed in UI
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
  const isStarter = billing.plan === 'starter';

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

  const currentStatusLabel = STATUS_LABELS[billing.subscriptionStatus] ?? billing.subscriptionStatus;

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto lg:px-8 px-4 font-sans">

      {/* Feedback banner — returned from Stripe */}
      {feedback && (
        <div className={cn('rounded-xl border p-4 text-sm mb-6',
          feedback.tone === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          feedback.tone === 'success' ? 'bg-teal-50 text-teal-800 border-teal-200' :
          'bg-slate-50 text-slate-700 border-slate-200'
        )}>
          {feedback.message}
        </div>
      )}

      {/* Upgrade nudge for Starter tenants */}
      {isStarter && billing.subscriptionStatus !== 'canceled' && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#0ea5a0]/20 bg-[#0ea5a0]/5 px-5 py-3.5 text-sm">
          <span className="text-slate-700">
            Você está no <span className="font-semibold text-[#0ea5a0]">Starter</span>. Faça upgrade para o Pro e libere comunicações automáticas, importação em lote e mais capacidade.
          </span>
          <a href="#pro-card" className="shrink-0 rounded-lg border border-[#0ea5a0]/30 bg-[#0ea5a0]/10 px-4 py-1.5 text-xs font-semibold text-[#0ea5a0] hover:bg-[#0ea5a0]/20 transition-colors">
            Ver Pro →
          </a>
        </div>
      )}

      {/* Pricing section */}
      <section className="relative bg-[#0f1115] rounded-[2.5rem] p-8 lg:p-16 overflow-hidden shadow-2xl">
        {/* Background watermark */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none w-full text-center">
          <span className="text-[12rem] lg:text-[18rem] text-white/[0.018] leading-none font-manrope font-medium tracking-tighter block mt-[-40px]">PLANS</span>
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          {/* Current plan badge — teal, not purple/green */}
          <span className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs mb-6 font-sans',
            TEAL.border, TEAL.bg, TEAL.text,
          )}>
            Plano atual: {PLAN_LABELS[billing.plan]} · {currentStatusLabel}
          </span>

          <h2 className="text-4xl md:text-5xl text-white mb-4 font-manrope font-medium tracking-tighter">
            Escolha o plano ideal<br />para o volume da sua operação
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed font-sans">
            Compare limites de usuários, clientes e faturas para crescer sem travar sua gestão.
          </p>

          {/* Billing cycle toggle */}
          <div className="mt-8 inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1">
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'px-5 py-1.5 rounded-full text-sm font-medium transition-all',
                cycle === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white',
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={cn(
                'px-5 py-1.5 rounded-full text-sm font-medium transition-all',
                cycle === 'yearly' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white',
              )}
            >
              Anual
              <span className={cn('ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold', TEAL.solid, 'text-white')}>
                2 meses grátis
              </span>
            </button>
          </div>

          {/* Manage billing — shown only if tenant already has a Stripe customer */}
          {hasPortalAccess && (
            <button
              onClick={runPortalAction}
              disabled={isPending}
              className="mt-6 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-6 rounded-full text-sm transition-colors border border-white/10 disabled:opacity-60"
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
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
            const priceNote = cycle === 'yearly' && info.yearlyNote ? info.yearlyNote : (isPlanStarter ? 'sem cartão necessário' : '/mês');
            const perMonthSuffix = !isPlanStarter && cycle === 'monthly';

            // CTA label
            let actionLabel: string;
            if (isPlanStarter) {
              actionLabel = isCurrentPlan ? 'Plano atual' : 'Fazer downgrade';
            } else if (isPaidCheckout) {
              if (billing.subscriptionStatus === 'canceled' && isCurrentPlan) {
                actionLabel = 'Reativar plano';
              } else if (isCurrentPlan) {
                actionLabel = `Assinar ${PLAN_LABELS[plan]}`;
              } else {
                actionLabel = `Assinar ${PLAN_LABELS[plan]}`;
              }
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
                  'group relative flex flex-col p-8 rounded-3xl transition-all duration-300',
                  isHighlighted
                    ? `bg-white/[0.07] border overflow-hidden ${TEAL.border} ${TEAL.glow}`
                    : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]',
                )}
              >
                {/* Highlighted glow overlay */}
                {isHighlighted && (
                  <div className={cn('absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t pointer-events-none', TEAL.gradientOverlay, 'to-transparent')} />
                )}

                {/* Plan icon + badge row */}
                <div className="mb-6 flex items-start justify-between relative z-10">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex flex-shrink-0 items-center justify-center border',
                    isHighlighted ? `${TEAL.bg} ${TEAL.border}` : 'bg-white/10 border-white/10',
                  )}>
                    <PlanIcon className={cn('h-5 w-5', isHighlighted ? TEAL.text : 'text-white')} />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {isHighlighted && (
                      <span className={cn('text-white text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold', TEAL.solid)}>
                        Mais popular
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className={cn(
                        'text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold border',
                        isHighlighted
                          ? `${TEAL.bg} ${TEAL.border} ${TEAL.text}`
                          : 'bg-white/10 border-white/15 text-white/70',
                      )}>
                        Plano atual
                      </span>
                    )}
                  </div>
                </div>

                {/* Price + plan name */}
                <div className="mb-6 relative z-10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl text-white font-manrope font-medium tracking-tighter">{displayPrice}</span>
                    {perMonthSuffix && <span className="text-sm text-gray-500">/mês</span>}
                  </div>
                  {priceNote && (
                    <p className="text-xs text-gray-500 mt-1">{priceNote}</p>
                  )}
                  <h3 className={cn('text-lg text-white mt-3 font-sans font-semibold', isHighlighted && TEAL.text)}>
                    {PLAN_LABELS[plan]}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 font-sans">{info.tagline}</p>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed font-sans min-h-[44px]">
                    {info.description}
                  </p>

                  {/* Capacity grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs text-center">
                    <div className="text-gray-400">
                      <span className="block text-white font-semibold text-sm mb-0.5">{config.maxUsers}</span>
                      usuário{config.maxUsers !== 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-400">
                      <span className="block text-white font-semibold text-sm mb-0.5">{config.maxCustomers.toLocaleString('pt-BR')}</span>
                      clientes
                    </div>
                    <div className="text-gray-400">
                      <span className="block text-white font-semibold text-sm mb-0.5">{config.maxInvoices.toLocaleString('pt-BR')}</span>
                      faturas
                    </div>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  disabled={isPending || isPlanStarter || (!isPaidCheckout && !hasPortalAccess)}
                  onClick={() => {
                    if (isPlanStarter) return;
                    if (isPaidCheckout) runCheckoutAction(plan);
                    else runPortalAction();
                  }}
                  className={cn(
                    'relative z-10 w-full py-3 rounded-xl text-sm mb-6 flex items-center justify-center gap-2 font-sans transition-colors font-semibold',
                    isHighlighted
                      ? `${TEAL.solid} text-white ${TEAL.hover} ${TEAL.glow} disabled:opacity-50`
                      : isPlanStarter
                        ? 'bg-white/8 text-white/50 cursor-default border border-white/10'
                        : 'bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {isActionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {actionLabel}
                </button>

                {/* Features list */}
                <div className="space-y-3 mt-auto relative z-10">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans font-semibold">Incluso</p>
                  <ul className="space-y-2.5">
                    {info.features.map((feature, i) => (
                      <li key={i} className={cn('flex items-center gap-3 text-sm font-sans', isHighlighted ? 'text-gray-100' : 'text-gray-300')}>
                        <CheckCircle className={cn('h-4 w-4 shrink-0', isHighlighted ? TEAL.text : 'text-gray-500')} />
                        {feature}
                      </li>
                    ))}
                    {/* Locked features — only shown on Starter card */}
                    {info.lockedFeatures?.map((feature, i) => (
                      <li key={`locked-${i}`} className="flex items-center gap-3 text-sm font-sans text-gray-600">
                        <Lock className="h-4 w-4 shrink-0 text-gray-700" />
                        <span>{feature}</span>
                        <span className={cn('ml-auto text-[10px] font-semibold rounded-full px-2 py-0.5', TEAL.bg, TEAL.text)}>Pro+</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
