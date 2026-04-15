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
  Building2,
  Compass,
  CreditCard,
  ExternalLink,
  FileText,
  LifeBuoy,
  Loader2,
  Users,
} from 'lucide-react';

import { createCustomerPortalSession, createSubscriptionCheckoutSession } from '@/actions/billing';
import { PLAN_CONFIG } from '@/lib/billing/plans';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

type BillingPrimaryAction =
  | { kind: 'checkout'; label: string; plan: TenantPlan }
  | { kind: 'portal'; label: string };

const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

const PLAN_DESCRIPTIONS: Record<TenantPlan, string> = {
  starter: 'Operação inicial com limites enxutos e atendimento padrão.',
  pro: 'Mais capacidade para equipe, carteira e volume operacional.',
  scale: 'Maior volume operacional com atendimento e onboarding dedicados.',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Em trial',
  active: 'Ativa',
  past_due: 'Em atraso',
  canceled: 'Cancelada',
};

const STATUS_BADGE_VARIANTS: Record<SubscriptionStatus, 'indigo' | 'success' | 'warning' | 'secondary'> = {
  trialing: 'indigo',
  active: 'success',
  past_due: 'warning',
  canceled: 'secondary',
};

const STATUS_MESSAGES: Record<SubscriptionStatus, BillingFeedback> = {
  trialing: {
    tone: 'info',
    message: 'Você está em período de trial. Escolha um plano para manter a operação sem interrupções.',
  },
  active: {
    tone: 'success',
    message: 'Assinatura ativa e sincronizada com a Stripe.',
  },
  past_due: {
    tone: 'warning',
    message: 'Há cobrança pendente. Abra o portal Stripe para atualizar o pagamento e evitar impacto operacional.',
  },
  canceled: {
    tone: 'error',
    message: 'A assinatura foi cancelada. Você pode iniciar uma nova assinatura a qualquer momento.',
  },
};

const SUPPORT_LABELS: Record<SupportLevel, string> = {
  standard: 'Standard',
  priority: 'Priority',
  vip: 'VIP',
};

const ONBOARDING_LABELS: Record<OnboardingTier, string> = {
  basic: 'Basic',
  assisted: 'Assisted',
  concierge: 'Concierge',
};

const PLAN_ORDER: TenantPlan[] = ['starter', 'pro', 'scale'];

function getUsagePercentage(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function getUsageTone(percentage: number) {
  if (percentage >= 100) {
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-600',
      chip: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (percentage >= 80) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

function getFeedbackClasses(tone: BillingFeedback['tone']) {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'error':
      return 'bg-rose-50 border-rose-200 text-rose-700';
    default:
      return 'bg-indigo-50 border-indigo-200 text-indigo-700';
  }
}

function getPrimaryAction(params: {
  billing: BillingView;
  canStartCheckout: boolean;
  hasPortalAccess: boolean;
}): BillingPrimaryAction | null {
  const { billing, canStartCheckout, hasPortalAccess } = params;

  if (canStartCheckout) {
    if (billing.subscriptionStatus === 'canceled') {
      return { kind: 'checkout', label: 'Reativar assinatura', plan: billing.plan };
    }

    return { kind: 'checkout', label: `Assinar ${PLAN_LABELS[billing.plan]}`, plan: billing.plan };
  }

  if (!hasPortalAccess) {
    return null;
  }

  if (billing.subscriptionStatus === 'past_due') {
    return { kind: 'portal', label: 'Regularizar pagamento' };
  }

  return { kind: 'portal', label: 'Gerenciar assinatura' };
}

export default function BillingClient({ billing }: { billing: BillingView | null }) {
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
              Billing indisponível no momento
            </CardTitle>
            <CardDescription className="text-amber-700">
              Não foi possível carregar os dados do plano deste tenant agora. Recarregue a página em instantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasPortalAccess = Boolean(billing.stripeCustomerId);
  const canStartCheckout = !billing.stripeSubscriptionId || billing.subscriptionStatus === 'canceled';
  const subscriptionFeedback = STATUS_MESSAGES[billing.subscriptionStatus];
  const primaryAction = getPrimaryAction({ billing, canStartCheckout, hasPortalAccess });

  const usageCards = [
    {
      key: 'users',
      label: 'Usuários',
      icon: Users,
      used: billing.usage.users,
      limit: billing.maxUsers,
    },
    {
      key: 'customers',
      label: 'Clientes',
      icon: Building2,
      used: billing.usage.customers,
      limit: billing.maxCustomers,
    },
    {
      key: 'invoices',
      label: 'Faturas',
      icon: FileText,
      used: billing.usage.invoices,
      limit: billing.maxInvoices,
    },
  ] as const;

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
    <div className="mt-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-heading font-extrabold tracking-tight text-obsidian">
            <CreditCard className="h-7 w-7 text-indigo-500" />
            Plano e Billing
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Visibilidade do plano atual, uso dos limites e ações básicas de cobrança por assinatura.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {primaryAction && (
            <Button
              variant={primaryAction.kind === 'checkout' ? 'beam' : 'default'}
              className="gap-2 rounded-full px-5"
              onClick={() => {
                if (primaryAction.kind === 'checkout') {
                  runCheckoutAction(primaryAction.plan);
                  return;
                }

                runPortalAction();
              }}
              disabled={isPending}
            >
              {isPending && pendingAction === (primaryAction.kind === 'checkout' ? `checkout:${primaryAction.plan}` : 'portal') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : primaryAction.kind === 'checkout' ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {primaryAction.label}
            </Button>
          )}

          <Button
            variant="outline"
            className="gap-2 rounded-full px-5"
            onClick={runPortalAction}
            disabled={isPending || !hasPortalAccess}
          >
            {isPending && pendingAction === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Abrir portal Stripe
          </Button>
        </div>
      </div>

      <div className={cn('rounded-xl border p-4 text-sm', getFeedbackClasses(subscriptionFeedback.tone))}>
        {subscriptionFeedback.message}
      </div>

      {feedback && (
        <div className={cn('rounded-xl border p-4 text-sm', getFeedbackClasses(feedback.tone))}>
          {feedback.message}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-[#FAFAFB] pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="indigo" className="px-3 py-1 uppercase tracking-wide">
                  {PLAN_LABELS[billing.plan]}
                </Badge>
                <Badge variant={STATUS_BADGE_VARIANTS[billing.subscriptionStatus]} className="px-3 py-1">
                  {STATUS_LABELS[billing.subscriptionStatus]}
                </Badge>
              </div>
              <CardTitle className="text-xl text-obsidian">Seu plano atual está sincronizado com o tenant</CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Os limites e níveis de atendimento abaixo refletem o estado salvo no banco e atualizado pela Stripe.
              </CardDescription>
            </div>

            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm lg:min-w-[260px]">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <LifeBuoy className="h-4 w-4 text-indigo-500" /> Suporte
                  </span>
                  <span className="font-semibold text-obsidian">{SUPPORT_LABELS[billing.supportLevel]}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Compass className="h-4 w-4 text-indigo-500" /> Onboarding
                  </span>
                  <span className="font-semibold text-obsidian">{ONBOARDING_LABELS[billing.onboardingTier]}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4 text-indigo-500" /> Portal Stripe
                  </span>
                  <span className="font-semibold text-obsidian">{hasPortalAccess ? 'Disponível' : 'Ainda indisponível'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 lg:grid-cols-3">
          {usageCards.map(({ key, label, icon: Icon, used, limit }) => {
            const percentage = getUsagePercentage(used, limit);
            const tone = getUsageTone(percentage);

            return (
              <div key={key} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-obsidian">
                    <Icon className="h-4 w-4 text-indigo-500" />
                    {label}
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', tone.chip)}>
                    {percentage}%
                  </span>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight text-obsidian">{used}</div>
                    <div className="text-xs text-muted-foreground">em uso de {limit}</div>
                  </div>
                  <div className={cn('text-sm font-semibold', tone.text)}>
                    {used}/{limit}
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full transition-all', tone.bar)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const config = PLAN_CONFIG[plan];
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

          return (
            <Card
              key={plan}
              className={cn(
                'overflow-hidden border-border/70 transition-all',
                isCurrentPlan && 'border-indigo-300 shadow-lg shadow-indigo-500/10',
              )}
            >
              <CardHeader className={cn('border-b border-border/50 pb-4', isCurrentPlan && 'bg-indigo-50/60')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-obsidian">{PLAN_LABELS[plan]}</CardTitle>
                    <CardDescription className="mt-2 min-h-[44px] text-sm">
                      {PLAN_DESCRIPTIONS[plan]}
                    </CardDescription>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="indigo" className="shrink-0 px-3 py-1">
                      Atual
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-[#FAFAFB] px-3 py-2">
                    <span>Usuários</span>
                    <span className="font-semibold text-obsidian">{config.maxUsers}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-[#FAFAFB] px-3 py-2">
                    <span>Clientes</span>
                    <span className="font-semibold text-obsidian">{config.maxCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-[#FAFAFB] px-3 py-2">
                    <span>Faturas</span>
                    <span className="font-semibold text-obsidian">{config.maxInvoices}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-[#FAFAFB] px-3 py-2">
                    <span>Suporte</span>
                    <span className="font-semibold text-obsidian">{SUPPORT_LABELS[config.supportLevel]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-[#FAFAFB] px-3 py-2">
                    <span>Onboarding</span>
                    <span className="font-semibold text-obsidian">{ONBOARDING_LABELS[config.onboardingTier]}</span>
                  </div>
                </div>

                <Button
                  variant={isCurrentPlan ? 'default' : 'outline'}
                  className="w-full gap-2"
                  disabled={isPending || (!isCheckoutAction && !hasPortalAccess)}
                  onClick={() => {
                    if (isCheckoutAction) {
                      runCheckoutAction(plan);
                      return;
                    }

                    runPortalAction();
                  }}
                >
                  {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {actionLabel}
                </Button>

                {!isCheckoutAction && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Mudanças de plano passam pelo portal Stripe para manter uma única assinatura ativa por tenant.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
