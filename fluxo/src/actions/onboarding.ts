'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';
import { redirect } from 'next/navigation';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  /** Destination label for the CTA button */
  cta: string;
  completed: boolean;
}

export interface OnboardingStatus {
  isComplete: boolean;
  completedCount: number;
  totalSteps: number;
  progressPct: number;
  steps: OnboardingStep[];
  /** Next single step the user should focus on */
  nextStep: OnboardingStep | null;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const tenantId = session.user.tenantId;

  if (!tenantId) {
    redirect('/onboarding');
  }

  // Single parallel round-trip: 3 cheap COUNT + 1 findFirst
  const [customerCount, invoiceCount, activeBillingFlow] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.billingFlow.findFirst({
      where: { tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  const hasCustomer     = customerCount > 0;
  const hasInvoice      = invoiceCount > 0;
  const hasBillingFlow  = !!activeBillingFlow;

  const steps = buildSteps({ hasCustomer, hasInvoice, hasBillingFlow });
  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;
  const nextStep = steps.find(s => !s.completed) ?? null;

  return {
    isComplete,
    completedCount,
    totalSteps,
    progressPct,
    steps,
    nextStep,
  };
}

// ── Step definitions ──────────────────────────────────────────────────────────
// Maturidade operacional da beta: cliente + fatura + régua ativa
// WhatsApp/Meta é next step recomendado — NÃO é bloqueador do dashboard.

function buildSteps(flags: {
  hasCustomer: boolean;
  hasInvoice: boolean;
  hasBillingFlow: boolean;
}): OnboardingStep[] {
  return [
    {
      id: 'create_customer',
      label: 'Cadastre o primeiro cliente',
      description: 'Adicione um sacado para começar o fluxo de cobrança.',
      href: '/clientes',
      cta: 'Ir para Clientes',
      completed: flags.hasCustomer,
    },
    {
      id: 'create_invoice',
      label: 'Registre uma fatura',
      description: 'Cadastre um título a receber ou importe via planilha CSV.',
      href: '/cobrancas',
      cta: 'Ir para Cobranças',
      completed: flags.hasInvoice,
    },
    {
      id: 'configure_billing_flow',
      label: 'Configure a régua de cobrança',
      description: 'Defina quando e como o sistema vai contatar seus clientes automaticamente.',
      href: '/automacao',
      cta: 'Configurar Régua',
      completed: flags.hasBillingFlow,
    },
  ];
}
