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
} from 'lucide-react';

import { createCustomerPortalSession, createSubscriptionCheckoutSession } from '@/actions/billing';
import type { BillingCycle } from '@/lib/billing/stripe';
import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLAN_CONFIG } from '@/lib/billing/plans';

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

const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

const PLAN_PRICING: Record<TenantPlan, { monthly: string; yearly: string; description: string; includes: string[]; highlight?: boolean; icon: any }> = {
  starter: {
    monthly: 'Grátis',
    yearly: 'Grátis',
    description: 'Operação inicial com limites enxutos e atendimento padrão.',
    includes: ['Acesso ao Sandbox', 'Atendimento básico', 'Limites Iniciais'],
    icon: Box,
  },
  pro: {
    monthly: 'R$ 249/mês',
    yearly: 'R$ 199/mês',
    description: 'Mais capacidade para equipe, carteira e volume operacional.',
    includes: ['Mais usuários e faturas', 'Integração completa', 'Suporte Prioritário'],
    highlight: true,
    icon: Layers,
  },
  scale: {
    monthly: 'R$ 599/mês',
    yearly: 'R$ 499/mês',
    description: 'Maior volume operacional com atendimento e onboarding dedicados.',
    includes: ['Onboarding Assistido ou VIP', 'Volume Operacional Extremo', 'SLA Garantido'],
    icon: Diamond,
  },
};

const PLAN_ORDER: TenantPlan[] = ['starter', 'pro', 'scale'];

// Billing cycle feedback from query params (return from Stripe)
const BILLING_FEEDBACK: Record<string, BillingFeedback> = {
  success: { tone: 'success', message: 'Assinatura concluída com sucesso! Seu plano já está ativo.' },
  canceled: { tone: 'info', message: 'Checkout cancelado. Nenhuma cobrança foi realizada.' },
  portal: { tone: 'info', message: 'Você voltou do portal da Stripe.' },
};

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

  // Billing cycle: 'monthly' | 'yearly'. 'launch' is internal-only (not exposed in UI).
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

  const runPortalAction = () => {
    setFeedback(null);
    setPendingAction('portal');

    startTransition(async () => {
      const result = await createCustomerPortalSession();

      if (result.error) {
        setFeedback({ tone: 'error', message: result.error });
        setPendingAction(null);
        return;
      }

      if (!result.url) {
        setFeedback({ tone: 'error', message: 'Não foi possível abrir o portal da Stripe agora.' });
        setPendingAction(null);
        return;
      }

      window.location.assign(result.url);
    });
  };

  const runCheckoutAction = (plan: TenantPlan) => {
    if (plan === 'starter') return; // Starter is free — no checkout

    setFeedback(null);
    setPendingAction(`checkout:${plan}:${cycle}`);

    startTransition(async () => {
      // The client sends only plan + cycle. The server resolves the priceId.
      const result = await createSubscriptionCheckoutSession(plan, cycle);

      if (result.error) {
        setFeedback({ tone: 'error', message: result.error });
        setPendingAction(null);
        return;
      }

      if (!result.url) {
        setFeedback({ tone: 'error', message: 'Não foi possível iniciar o checkout agora.' });
        setPendingAction(null);
        return;
      }

      window.location.assign(result.url);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto lg:px-8 px-4 font-sans">

      {/* Feedback Messages */}
      {feedback && (
        <div className={cn('rounded-xl border p-4 text-sm mb-6',
          feedback.tone === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          'bg-indigo-50 text-indigo-700 border-indigo-200'
        )}>
          {feedback.message}
        </div>
      )}

      {/* PRICING SECTION - Dark Theme UI */}
      <section className="relative bg-[#0f1115] rounded-[2.5rem] p-8 lg:p-16 overflow-hidden shadow-2xl">
        {/* Background text decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none w-full text-center">
          <span className="text-[12rem] lg:text-[18rem] text-white/[0.02] leading-none font-manrope font-medium tracking-tighter block mt-[-40px]">PLANS</span>
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400 mb-6 font-sans">
            Seu Plano Atual: {PLAN_LABELS[billing.plan]} ({billing.subscriptionStatus})
          </span>
          <h2 className="text-4xl md:text-5xl text-white mb-4 font-manrope font-medium tracking-tighter">
            Evolua no seu <br /> próprio ritmo.
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed font-sans">
            Descubra os limites ideais de usuários e faturas para acompanhar o crescimento da sua empresa.
          </p>

          {/* Billing Cycle Toggle — mensal/anual only. Launch is internal. */}
          <div className="mt-8 inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1">
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'px-5 py-1.5 rounded-full text-sm font-medium transition-all',
                cycle === 'monthly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={cn(
                'px-5 py-1.5 rounded-full text-sm font-medium transition-all',
                cycle === 'yearly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              Anual
              <span className="ml-1.5 text-[10px] bg-emerald-400 text-black px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>

          {hasPortalAccess && (
            <button
              onClick={runPortalAction}
              disabled={isPending}
              className="mt-6 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-6 rounded-full text-sm transition-colors border border-white/10"
            >
              {isPending && pendingAction === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Acessar Portal da Stripe
            </button>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">

          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIG[plan];
            const pInfo = PLAN_PRICING[plan];
            const OptionIcon = pInfo.icon;
            const isCurrentPlan = billing.plan === plan;
            const isHighlighted = pInfo.highlight;
            const isStarter = plan === 'starter';

            // Action logic
            const isPaidCheckout = !isStarter && canStartCheckout;
            const actionKey = isPaidCheckout ? `checkout:${plan}:${cycle}` : 'portal';
            const isActionPending = isPending && pendingAction === actionKey;

            let actionLabel = 'Escolher plano';
            if (isStarter) {
              actionLabel = isCurrentPlan ? 'Plano Atual (Grátis)' : 'Fazer downgrade';
            } else if (isPaidCheckout) {
              if (billing.subscriptionStatus === 'canceled' && isCurrentPlan) {
                actionLabel = 'Reativar este plano';
              } else if (isCurrentPlan) {
                actionLabel = 'Assinar este plano';
              } else {
                actionLabel = 'Fazer upgrade';
              }
            } else if (hasPortalAccess) {
              actionLabel = isCurrentPlan ? 'Gerenciar no portal' : 'Alterar no portal';
            } else {
              actionLabel = 'Portal indisponível';
            }

            const displayPrice = cycle === 'yearly' ? pInfo.yearly : pInfo.monthly;

            return (
              <div
                key={plan}
                className={cn(
                  'group relative flex flex-col p-8 rounded-3xl transition-colors duration-300',
                  isHighlighted
                    ? 'bg-white/[0.08] border border-white/20 overflow-hidden shadow-[0_20px_60px_rgba(16,185,129,0.15)]'
                    : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]',
                )}
              >
                {isHighlighted && (
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-500/20 to-transparent pointer-events-none" />
                )}

                <div className="mb-6 flex items-start justify-between relative z-10">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex flex-shrink-0 items-center justify-center border',
                    isHighlighted ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-white/10 border-white/10',
                  )}>
                    <OptionIcon className={cn('h-5 w-5', isHighlighted ? 'text-emerald-400' : 'text-white')} />
                  </div>

                  {isHighlighted && (
                    <span className="bg-emerald-400 text-black text-[10px] px-2 py-1 rounded uppercase tracking-wider font-sans font-bold">
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && !isHighlighted && (
                    <span className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 text-[10px] px-2 py-1 rounded uppercase tracking-wider font-sans font-bold">
                      Plano Atual
                    </span>
                  )}
                </div>

                <div className="mb-6 relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl text-white font-manrope font-medium tracking-tighter">{displayPrice}</span>
                  </div>
                  <h3 className="text-lg text-white mt-4 font-sans font-semibold">{PLAN_LABELS[plan]}</h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed font-sans min-h-[44px]">
                    {pInfo.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-xs">
                    <div className="text-gray-400">
                      <span className="block text-white mb-0.5">{config.maxUsers}</span> Users
                    </div>
                    <div className="text-gray-400">
                      <span className="block text-white mb-0.5">{config.maxCustomers}</span> Customers
                    </div>
                    <div className="text-gray-400">
                      <span className="block text-white mb-0.5">{config.maxInvoices}</span> Invoices
                    </div>
                  </div>
                </div>

                <button
                  disabled={isPending || isStarter || (!isPaidCheckout && !hasPortalAccess)}
                  onClick={() => {
                    if (isStarter) return;
                    if (isPaidCheckout) {
                      runCheckoutAction(plan);
                    } else {
                      runPortalAction();
                    }
                  }}
                  className={cn(
                    'relative z-10 w-full py-3 rounded-xl text-sm mb-8 flex items-center justify-center gap-2 font-sans transition-colors font-semibold',
                    isHighlighted
                      ? 'bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50'
                      : 'bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {isActionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {actionLabel}
                </button>

                <div className="space-y-4 mt-auto relative z-10">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-sans font-bold">Incluso</p>
                  <ul className="space-y-3">
                    {pInfo.includes.map((feature, i) => (
                      <li key={i} className={cn('flex items-center gap-3 text-sm font-sans', isHighlighted ? 'text-white' : 'text-gray-300')}>
                        <CheckCircle className={cn('h-4 w-4', isHighlighted ? 'text-emerald-400' : 'text-gray-500')} />
                        {feature}
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
