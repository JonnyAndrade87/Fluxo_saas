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
  BadgeCheck,
  Users,
  FileText,
  UserCircle,
} from 'lucide-react';

import { createCustomerPortalSession, createSubscriptionCheckoutSession } from '@/actions/billing';
import type { BillingCycle } from '@/lib/billing/stripe';
import { cn } from '@/lib/utils';
import { PLAN_CONFIG } from '@/lib/billing/plans';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Static config ──────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

const STATUS_LABELS: Partial<Record<SubscriptionStatus, { label: string; className: string }>> = {
  trialing: { label: 'Trial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  active:   { label: 'Ativo',            className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  past_due: { label: 'Pagamento pendente', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  canceled: { label: 'Cancelado',        className: 'bg-slate-100 text-slate-500 border-slate-200' },
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
  accentColor: string;
};

const PLAN_INFO: Record<TenantPlan, PlanInfo> = {
  starter: {
    monthlyLabel: 'Grátis',
    yearlyLabel: 'Grátis',
    yearlyNote: '',
    tagline: 'Para começar sem custo',
    description: 'Organize cobranças, clientes e histórico sem pagar nada.',
    features: [
      '1 usuário',
      '300 clientes',
      '1.000 faturas',
      'Dashboard operacional',
      'Gestão de cobranças',
      'Histórico completo',
    ],
    lockedFeatures: [
      'Comunicações automáticas',
      'Importação em lote',
      'Relatórios avançados',
    ],
    icon: Box,
    accentColor: 'slate',
  },
  pro: {
    monthlyLabel: 'R$ 97',
    yearlyLabel: 'R$ 970',
    yearlyNote: '2 meses grátis · R$ 80,83/mês',
    tagline: 'Para operações em crescimento',
    description: 'Mais capacidade, automação e suporte para escalar sem travar.',
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
    accentColor: 'indigo',
  },
  scale: {
    monthlyLabel: 'R$ 297',
    yearlyLabel: 'R$ 2.970',
    yearlyNote: '2 meses grátis · R$ 247,50/mês',
    tagline: 'Para alto volume operacional',
    description: 'Capacidade máxima com onboarding assistido e atendimento dedicado.',
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
    accentColor: 'slate',
  },
};

const PLAN_ORDER: TenantPlan[] = ['starter', 'pro', 'scale'];

const BILLING_FEEDBACK: Record<string, BillingFeedback> = {
  success: { tone: 'success', message: 'Assinatura concluída com sucesso! Seu plano já está ativo.' },
  canceled: { tone: 'info',   message: 'Checkout cancelado. Nenhuma cobrança foi realizada.' },
  portal:   { tone: 'info',   message: 'Você voltou do portal da Stripe.' },
};

// ── Usage Bar ─────────────────────────────────────────────────────────────────

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isWarning = pct >= 80;
  const isCritical = pct >= 95;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={cn('text-xs font-semibold tabular-nums',
          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'
        )}>
          {used.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500',
            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-indigo-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Current Plan Summary ──────────────────────────────────────────────────────

function CurrentPlanSummary({
  billing,
  onPortalClick,
  isPending,
  pendingAction,
}: {
  billing: BillingView;
  onPortalClick: () => void;
  isPending: boolean;
  pendingAction: string | null;
}) {
  const statusInfo = STATUS_LABELS[billing.subscriptionStatus];
  const hasPortalAccess = Boolean(billing.stripeCustomerId);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <BadgeCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-base font-bold text-slate-900">
              Plano {PLAN_LABELS[billing.plan]}
            </span>
            {statusInfo && (
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                statusInfo.className
              )}>
                {statusInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {PLAN_INFO[billing.plan].description}
          </p>
        </div>

        {/* Uso atual */}
        <div className="flex-1 max-w-sm space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Uso atual</p>
          <UsageBar used={billing.usage.users} max={billing.maxUsers} label="Usuários" />
          <UsageBar used={billing.usage.customers} max={billing.maxCustomers} label="Clientes" />
          <UsageBar used={billing.usage.invoices} max={billing.maxInvoices} label="Faturas" />
        </div>

      </div>

      {hasPortalAccess && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onPortalClick}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-60"
          >
            {isPending && pendingAction === 'portal'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <ExternalLink className="h-3.5 w-3.5" />
            }
            Gerenciar fatura e cartão no portal da Stripe
          </button>
        </div>
      )}
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  cycle,
  canStartCheckout,
  hasPortalAccess,
  isPending,
  pendingAction,
  onCheckout,
  onPortal,
}: {
  plan: TenantPlan;
  billing: BillingView;
  cycle: 'monthly' | 'yearly';
  canStartCheckout: boolean;
  hasPortalAccess: boolean;
  isPending: boolean;
  pendingAction: string | null;
  onCheckout: (plan: TenantPlan) => void;
  onPortal: () => void;
}) {
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
    actionLabel = isCurrentPlan ? 'Plano atual (gratuito)' : 'Fazer downgrade';
  } else if (isPaidCheckout) {
    actionLabel = billing.subscriptionStatus === 'canceled' && isCurrentPlan
      ? 'Reativar plano'
      : `Assinar ${PLAN_LABELS[plan]}`;
  } else if (hasPortalAccess) {
    actionLabel = isCurrentPlan ? 'Gerenciar assinatura' : 'Alterar no portal';
  } else {
    actionLabel = 'Portal indisponível';
  }

  return (
    <div
      id={`${plan}-card`}
      className={cn(
        'relative flex flex-col rounded-2xl p-6 transition-all duration-200',
        isHighlighted
          ? 'bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-100/50'
          : 'bg-white border border-slate-200 hover:shadow-sm',
      )}
    >
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            <Sparkles className="h-2.5 w-2.5" /> Mais popular
          </span>
        </div>
      )}

      {/* Icon + current badge */}
      <div className="flex items-start justify-between mb-5">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center',
          isHighlighted ? 'bg-indigo-50' : 'bg-slate-100',
        )}>
          <PlanIcon className={cn('h-5 w-5', isHighlighted ? 'text-indigo-600' : 'text-slate-500')} />
        </div>
        {isCurrentPlan && (
          <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 border border-indigo-200 text-indigo-600 bg-indigo-50">
            Plano atual
          </span>
        )}
      </div>

      {/* Plan name + tagline */}
      <div className="mb-4">
        <h3 className={cn(
          'text-base font-bold',
          isHighlighted ? 'text-indigo-700' : 'text-slate-900',
        )}>{PLAN_LABELS[plan]}</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{info.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tight text-slate-900">{displayPrice}</span>
          {!isPlanStarter && cycle === 'monthly' && (
            <span className="text-sm text-slate-400 font-medium">/mês</span>
          )}
        </div>
        {yearlySub && (
          <p className="text-xs text-slate-400 mt-1">{yearlySub}</p>
        )}
        {isPlanStarter && (
          <p className="text-xs text-slate-400 mt-1">sem cartão necessário</p>
        )}
      </div>

      {/* Capacity grid */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 mb-5 text-center">
        {[
          { icon: UserCircle, value: config.maxUsers,                             label: `user${config.maxUsers !== 1 ? 's' : ''}` },
          { icon: Users,      value: config.maxCustomers.toLocaleString('pt-BR'), label: 'clients' },
          { icon: FileText,   value: config.maxInvoices.toLocaleString('pt-BR'),  label: 'faturas' },
        ].map(({ icon: Ic, value, label }) => (
          <div key={label} className="space-y-0.5">
            <Ic className="w-3.5 h-3.5 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 tabular-nums">{value}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        disabled={isPending || isPlanStarter || (!isPaidCheckout && !hasPortalAccess)}
        onClick={() => {
          if (isPlanStarter) return;
          if (isPaidCheckout) onCheckout(plan);
          else onPortal();
        }}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mb-5',
          isHighlighted
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50'
            : isPlanStarter
              ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isActionPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <ArrowRight className="h-4 w-4" />
        }
        {actionLabel}
      </button>

      {/* Features */}
      <div className="mt-auto space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Incluso</p>
        <ul className="space-y-1.5">
          {info.features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {feat}
            </li>
          ))}
          {info.lockedFeatures?.map((feat, i) => (
            <li key={`locked-${i}`} className="flex items-center gap-2 text-sm">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="text-slate-400">{feat}</span>
              <span className="ml-auto text-[9px] font-bold rounded-full px-1.5 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-100 shrink-0">
                Pro+
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

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

  // ── Error state ─────────────────────────────────────────────────────────────
  if (!billing) {
    return (
      <div className="max-w-md mx-auto mt-12 animate-in fade-in duration-500">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Planos indisponíveis no momento</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Não foi possível carregar os dados de assinatura. Tente recarregar a página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasPortalAccess = Boolean(billing.stripeCustomerId);
  const canStartCheckout = !billing.stripeSubscriptionId || billing.subscriptionStatus === 'canceled';
  const isStarterPlan = billing.plan === 'starter';

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
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8 px-4 lg:px-6 font-sans pb-12">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planos e Assinatura</h1>
        <p className="text-slate-500 text-sm mt-1">
          Veja o uso atual, compare limites e faça upgrade quando precisar.
        </p>
      </div>

      {/* ── Feedback banner ───────────────────────────────────────────────── */}
      {feedback && (
        <div className={cn(
          'flex items-start gap-3 rounded-xl border p-4 text-sm',
          feedback.tone === 'error'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
          feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          'bg-slate-50 text-slate-600 border-slate-200'
        )}>
          {feedback.message}
        </div>
      )}

      {/* ── Plano atual + uso ─────────────────────────────────────────────── */}
      <CurrentPlanSummary
        billing={billing}
        onPortalClick={runPortalAction}
        isPending={isPending}
        pendingAction={pendingAction}
      />

      {/* ── Nudge upgrade para Starter ────────────────────────────────────── */}
      {isStarterPlan && billing.subscriptionStatus !== 'canceled' && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-3.5 text-sm">
          <span className="text-slate-700">
            Você está no plano <strong className="text-indigo-700">Starter</strong>.
            Faça upgrade para o Pro e desbloqueie automações, importação em lote e mais capacidade.
          </span>
          <a
            href="#pro-card"
            className="shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Ver Pro →
          </a>
        </div>
      )}

      {/* ── Seção de planos ───────────────────────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Compare os planos</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Todos os planos incluem dashboard, histórico e relatórios básicos.
            </p>
          </div>

          {/* Cycle toggle */}
          <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 gap-1 self-start sm:self-auto">
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                cycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >Mensal</button>
            <button
              onClick={() => setCycle('yearly')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
                cycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Anual
              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                −17%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {PLAN_ORDER.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              billing={billing}
              cycle={cycle}
              canStartCheckout={canStartCheckout}
              hasPortalAccess={hasPortalAccess}
              isPending={isPending}
              pendingAction={pendingAction}
              onCheckout={runCheckoutAction}
              onPortal={runPortalAction}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
