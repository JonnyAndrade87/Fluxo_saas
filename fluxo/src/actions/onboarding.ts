'use server';

import prisma from '@/lib/db';
import { auth } from '../../auth';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;       // navigation target
  completed: boolean;
}

export interface OnboardingStatus {
  /** true = tenant has completed ALL steps → hide the card */
  isComplete: boolean;
  /** 0–4 */
  completedCount: number;
  steps: OnboardingStep[];
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    // unauthenticated — return fully-incomplete state
    return {
      isComplete: false,
      completedCount: 0,
      steps: buildSteps({ hasCustomer: false, hasInvoice: false, hasComm: false }),
    };
  }

  // Single parallel round-trip: three cheap COUNT queries
  const [customerCount, invoiceCount, commLogCount] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.communicationLog.count({ where: { tenantId, status: { in: ['sent', 'pending'] } } }),
  ]);

  const hasCustomer = customerCount > 0;
  const hasInvoice  = invoiceCount  > 0;
  const hasComm     = commLogCount  > 0;

  const steps = buildSteps({ hasCustomer, hasInvoice, hasComm });
  const completedCount = steps.filter(s => s.completed).length;

  return {
    isComplete: completedCount === steps.length,
    completedCount,
    steps,
  };
}

// ── Step definitions ─────────────────────────────────────────────────────────

function buildSteps(flags: {
  hasCustomer: boolean;
  hasInvoice: boolean;
  hasComm: boolean;
}): OnboardingStep[] {
  return [
    {
      id: 'create_customer',
      label: 'Cadastrar primeiro cliente',
      description: 'Adicione um sacado para começar o fluxo de cobrança.',
      href: '/clientes',
      completed: flags.hasCustomer,
    },
    {
      id: 'create_invoice',
      label: 'Emitir primeira fatura',
      description: 'Registre um recebível vinculado ao cliente.',
      href: '/cobrancas',
      completed: flags.hasInvoice,
    },
    {
      id: 'view_comms',
      label: 'Abrir a Central de Comunicações',
      description: 'Veja as comunicações geradas pelo motor de cobrança.',
      href: '/comunicacoes',
      completed: flags.hasComm,
    },
    {
      id: 'understand_flow',
      label: 'Entender o fluxo de cobrança',
      description: 'Consulte o histórico de ações do sistema para um cliente.',
      href: '/historico',
      // This step completes automatically once communication logs exist
      completed: flags.hasComm,
    },
  ];
}
