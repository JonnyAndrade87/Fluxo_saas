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

const PLAN_PRICING: Record<TenantPlan, { price: string; description: string; includes: string[]; highlight?: boolean; icon: any }> = {
  starter: {
    price: 'Free',
    description: 'Operação inicial com limites enxutos e atendimento padrão.',
    includes: ['Acesso ao Sandbox', 'Atendimento básico', 'Limites Iniciais'],
    icon: Box,
  },
  pro: {
    price: '$49',
    description: 'Mais capacidade para equipe, carteira e volume operacional.',
    includes: ['Mais usuários e faturas', 'Integração completa', 'Suporte Prioritário'],
    highlight: true,
    icon: Layers,
  },
  scale: {
    price: '$99',
    description: 'Maior volume operacional com atendimento e onboarding dedicados.',
    includes: ['Onboarding Assistido ou VIP', 'Volume Operacional Extremo', 'SLA Garantido'],
    icon: Diamond,
  },
};

const PLAN_ORDER: TenantPlan[] = ['starter', 'pro', 'scale'];

export default function PlanosClient({ billing }: { billing: BillingView | null }) {
  const [feedback, setFeedback] = useState<BillingFeedback | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    setFeedback(null);
    setPendingAction(`checkout:${plan}`);

    startTransition(async () => {
      const result = await createSubscriptionCheckoutSession(plan);

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

      {/* PRICING SECTION - Dark Theme UI Component exactly as Reference */}
      <section className="relative bg-[#0f1115] rounded-[2.5rem] p-8 lg:p-16 overflow-hidden shadow-2xl">
        {/* Large Background Text Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none w-full text-center">
          <span className="text-[12rem] lg:text-[18rem] text-white/[0.02] leading-none font-manrope font-medium tracking-tighter block mt-[-40px]">PLANS</span>
        </div>
        
        {/* Header Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400 mb-6 font-sans">
            Seu Plano Atual: {PLAN_LABELS[billing.plan]} ({billing.subscriptionStatus})
          </span>
          <h2 className="text-4xl md:text-5xl text-white mb-4 font-manrope font-medium tracking-tighter">
            Evolua no seu <br /> próprio ritmo.
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed font-sans">
            Descubra os limites ideais de usuários e faturas para acompanhar o crescimento da sua empresa com as melhores tecnologias do mercado.
          </p>
          
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

        {/* Pricing Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          
          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIG[plan];
            const pInfo = PLAN_PRICING[plan];
            const OptionIcon = pInfo.icon;
            const isCurrentPlan = billing.plan === plan;
            const isCheckoutAction = canStartCheckout;
            const actionKey = isCheckoutAction ? `checkout:${plan}` : 'portal';
            const isActionPending = isPending && pendingAction === actionKey;

            let actionLabel = 'Escolher plano';
            if (isCheckoutAction) {
              if (billing.subscriptionStatus === 'canceled' && isCurrentPlan) {
                actionLabel = 'Reativar este plano';
              } else if (isCurrentPlan) {
                actionLabel = 'Assinar este plano';
              } else if (PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(billing.plan)) {
                actionLabel = 'Fazer upgrade';
              }
            } else if (hasPortalAccess) {
              actionLabel = isCurrentPlan ? 'Gerenciar no portal' : 'Alterar no portal';
            } else {
              actionLabel = 'Portal indisponível';
            }

            const isHighlighted = pInfo.highlight;

            return (
              <div 
                key={plan}
                className={cn(
                  "group relative flex flex-col p-8 rounded-3xl transition-colors duration-300",
                  isHighlighted 
                    ? "bg-white/[0.08] border border-white/20 overflow-hidden shadow-[0_20px_60px_rgba(16,185,129,0.15)]"
                    : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]"
                )}
              >
                {/* Glow for highlighted tier */}
                {isHighlighted && (
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-500/20 to-transparent pointer-events-none"></div>
                )}

                <div className="mb-6 flex items-start justify-between relative z-10">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex flex-shrink-0 items-center justify-center border",
                    isHighlighted ? "bg-emerald-400/20 border-emerald-400/30" : "bg-white/10 border-white/10"
                  )}>
                    <OptionIcon className={cn("h-5 w-5", isHighlighted ? "text-emerald-400" : "text-white")} />
                  </div>
                  
                  {isHighlighted && (
                    <span className="bg-emerald-400 text-black text-[10px] px-2 py-1 rounded uppercase tracking-wider font-sans font-bold">
                      Most Popular
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
                    <span className="text-3xl text-white font-manrope font-medium tracking-tighter">{pInfo.price}</span>
                    <span className="text-sm text-gray-500 font-sans">/mo</span>
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
                  disabled={isPending || (!isCheckoutAction && !hasPortalAccess)}
                  onClick={() => {
                    if (isCheckoutAction) {
                      runCheckoutAction(plan);
                      return;
                    }
                    runPortalAction();
                  }}
                  className={cn(
                    "relative z-10 w-full py-3 rounded-xl text-sm mb-8 flex items-center justify-center gap-2 font-sans transition-colors font-semibold",
                    isHighlighted 
                      ? "bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      : "bg-white text-black hover:bg-gray-200 disabled:opacity-50"
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
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-sans font-bold">Includes</p>
                  <ul className="space-y-3">
                    {pInfo.includes.map((feature, i) => (
                      <li key={i} className={cn("flex items-center gap-3 text-sm font-sans", isHighlighted ? "text-white" : "text-gray-300")}>
                        <CheckCircle className={cn("h-4 w-4", isHighlighted ? "text-emerald-400" : "text-gray-500")} /> 
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
