import { Invoice } from "@prisma/client";

// Configurações de Multa e Juros MVP
const FINE_PERCENTAGE = 0.02; // 2% fixa
const INTEREST_PER_MONTH = 0.01; // 1% ao mês
const INTEREST_PER_DAY = INTEREST_PER_MONTH / 30;

/**
 * Retorna a data em formato YYYY-MM-DD forçando o timezone de São Paulo
 */
export function getBrazilDateString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  // pt-BR formats to DD/MM/YYYY
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  }).format(d).split('/');
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
}

/**
 * Calcula a diferença em dias entre duas strings YYYY-MM-DD
 */
export function differenceInDaysBr(date1Str: string, date2Str: string): number {
  const d1 = new Date(`${date1Str}T12:00:00Z`);
  const d2 = new Date(`${date2Str}T12:00:00Z`);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

export type VisualStatus = 
  | 'Em dia' 
  | 'Vence hoje' 
  | 'Vencida' 
  | 'Promessa futura' 
  | 'Promessa para hoje' 
  | 'Promessa vencida' 
  | 'Paga' 
  | 'Cancelada';

/**
 * Calcula dinamicamente o estado visual da fatura baseado no status persistido e na data atual
 */
export function getInvoiceVisualState(invoice: Partial<Invoice>): VisualStatus {
  // Status Terminais
  if (invoice.status === 'PAID') return 'Paga';
  if (invoice.status === 'CANCELED') return 'Cancelada';

  const todayStr = getBrazilDateString(new Date())!;
  
  // Status Promessa
  if (invoice.status === 'PROMISE_TO_PAY' && invoice.promiseDate) {
    const promiseStr = getBrazilDateString(invoice.promiseDate)!;
    if (promiseStr > todayStr) return 'Promessa futura';
    if (promiseStr === todayStr) return 'Promessa para hoje';
    return 'Promessa vencida';
  }

  // Comportamento Default (OPEN / pending)
  const dueStr = getBrazilDateString(invoice.dueDate)!;
  if (dueStr > todayStr) return 'Em dia';
  if (dueStr === todayStr) return 'Vence hoje';
  return 'Vencida';
}

/**
 * Verifica se uma fatura está vencida
 */
export function isInvoiceOverdue(invoice: Partial<Invoice>): boolean {
  if (invoice.status === 'PAID' || invoice.status === 'CANCELED') {
    return false;
  }

  const todayStr = getBrazilDateString(new Date())!;
  const dueStr = getBrazilDateString(invoice.dueDate)!;
  
  return dueStr < todayStr;
}

/**
 * Calcula os valores financeiros da fatura (Multa e Juros)
 */
export function calculateInvoiceFinancials(invoice: Partial<Invoice>) {
  const baseAmount = invoice.amount || 0;

  // Se estiver paga ou cancelada, usamos os valores já persistidos no banco
  if (invoice.status === 'PAID' || invoice.status === 'CANCELED') {
    return {
      baseAmount,
      fineAmount: invoice.fineAmount || 0,
      interestAmount: invoice.interestAmount || 0,
      updatedAmount: invoice.updatedAmount || baseAmount
    };
  }

  let fineAmount = 0;
  let interestAmount = 0;
  let updatedAmount = baseAmount;

  const todayStr = getBrazilDateString(new Date())!;
  const dueStr = getBrazilDateString(invoice.dueDate)!;

  if (todayStr > dueStr) {
    const daysLate = differenceInDaysBr(todayStr, dueStr);
    if (daysLate > 0) {
      fineAmount = baseAmount * FINE_PERCENTAGE;
      interestAmount = baseAmount * INTEREST_PER_DAY * daysLate;
      updatedAmount = baseAmount + fineAmount + interestAmount;
    }
  }

  return {
    baseAmount,
    fineAmount,
    interestAmount,
    updatedAmount
  };
}
