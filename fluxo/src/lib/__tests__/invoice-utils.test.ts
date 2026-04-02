import { describe, it, expect } from 'vitest';
import { calculateInvoiceFinancials, getInvoiceVisualState } from '../invoice-utils';

describe('Invoice Math and Business Rules', () => {
  it('Deve calcular multa de 2% e juros de 1% a.m (0.033% ao dia) para faturas atrasadas', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10); // 10 dias de atraso

    const invoice = {
      id: '1',
      amount: 1000,
      dueDate: pastDate,
      status: 'OPEN',
    } as any;

    const result = calculateInvoiceFinancials(invoice);
    
    // Base 1000. Multa 2% (20). Juros 10 dias * 0.033% por dia = R$ 3,30. Total: 1023,30.
    expect(result.fineAmount).toBe(20.00);
    expect(result.updatedAmount).toBeGreaterThan(1020);
    expect(result.updatedAmount).toBeLessThan(1025);
  });

  it('Valor atualizado não deve variar se a fatura estiver paga no passado', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 20); // Venceu 20 dias atrás
    
    const paidDate = new Date();
    paidDate.setDate(paidDate.getDate() - 19); // Pagou com 1 dia de atraso (ou antes)

    const invoice = {
      id: '2',
      amount: 500,
      dueDate: pastDate,
      status: 'PAID',
      paidAmount: 500,
      paidAt: paidDate
    } as any;

    const result = calculateInvoiceFinancials(invoice);
    expect(result.fineAmount).toBe(0);
    expect(result.interestAmount).toBe(0);
    expect(result.updatedAmount).toBe(500);
  });

  it('VisualState deve retornar "Vencida (X dias)" para PENDING/OPEN vencidos', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); 

    const invoice = {
      dueDate: pastDate,
      status: 'OPEN',
    } as any;

    const state = getInvoiceVisualState(invoice);
    expect(state).toContain('Vencida');
  });

});
