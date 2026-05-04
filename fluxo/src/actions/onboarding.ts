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

export async function getOnboardingStatus(providedTenantId?: string): Promise<OnboardingStatus> {
  try {
    let tenantId = providedTenantId;

    if (!tenantId) {
      const session = await auth();
      tenantId = session?.user?.tenantId ?? undefined;
    }

    if (!tenantId) {
      // Return a safe "incomplete" state that won't crash the UI if not logged in
      const steps = buildSteps({ hasCompanyData: false, hasCustomer: false, hasInvoice: false, hasBillingFlow: false });
      return {
        isComplete: false,
        completedCount: 0,
        totalSteps: steps.length,
        progressPct: 0,
        steps,
        nextStep: steps[0],
      };
    }

    // Single parallel round-trip: 3 cheap COUNT + 1 findFirst
    const [customerCount, invoiceCount, activeBillingFlow, tenantData] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.billingFlow.findFirst({
        where: { tenantId, isActive: true },
        select: { id: true },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { documentNumber: true, name: true }
      })
    ]);

    const hasCustomer     = customerCount > 0;
    const hasInvoice      = invoiceCount > 0;
    const hasBillingFlow  = !!activeBillingFlow;
    // Considera os dados preenchidos se o documento existir ou o nome não for nulo/padrão
    const hasCompanyData  = !!(tenantData?.documentNumber || (tenantData?.name && tenantData.name !== 'Nova Empresa'));

    const steps = buildSteps({ hasCompanyData, hasCustomer, hasInvoice, hasBillingFlow });
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
  } catch (error) {
    console.error('[Onboarding] Error fetching status:', error);
    // Return a safe "incomplete" state that won't crash the UI
    const steps = buildSteps({ hasCompanyData: false, hasCustomer: false, hasInvoice: false, hasBillingFlow: false });
    return {
      isComplete: false,
      completedCount: 0,
      totalSteps: steps.length,
      progressPct: 0,
      steps,
      nextStep: steps[0],
    };
  }
}

// ── Step definitions ──────────────────────────────────────────────────────────
// Maturidade operacional da beta: cliente + fatura + régua ativa
// WhatsApp/Meta é next step recomendado — NÃO é bloqueador do dashboard.

function buildSteps(flags: {
  hasCompanyData: boolean;
  hasCustomer: boolean;
  hasInvoice: boolean;
  hasBillingFlow: boolean;
}): OnboardingStep[] {
  return [
    {
      id: 'company_data',
      label: 'Completar dados da empresa',
      description: 'Adicione suas informações e logo nas configurações.',
      href: '/configuracoes',
      cta: 'Configurações',
      completed: flags.hasCompanyData,
    },
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
      label: 'Configurar a régua de cobrança',
      description: 'Defina quando e como os alertas de cobrança devem ser acionados para seus clientes.',
      href: '/automacao',
      cta: 'Configurar Régua',
      completed: flags.hasBillingFlow,
    },
    {
      id: 'view_dashboard',
      label: 'Visualizar dashboard',
      description: 'Veja os números da sua operação ganharem vida.',
      href: '/dashboard',
      cta: 'Ver Dashboard',
      completed: flags.hasCompanyData && flags.hasCustomer && flags.hasInvoice && flags.hasBillingFlow, // Assumimos como completed se tudo estiver ok
    },
  ];
}
