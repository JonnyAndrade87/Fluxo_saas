/**
 * invoice-normalizer.ts
 * Fonte única de verdade para normalização de dados de fatura.
 *
 * QUALQUER caminho que escreva faturas no banco (actions, API routes, import,
 * scripts de seed) DEVE passar os dados por estas funções antes de persistir.
 *
 * Isso garante que nenhum payload externo (CSV, webhook, seed) quebre a
 * integridade do schema com valores herdados ou strings arbitrárias.
 */

// ── Status canônicos (alinhados com o schema Prisma) ─────────────────────────

export const INVOICE_STATUS_VALUES = ['OPEN', 'PAID', 'CANCELED', 'PROMISE_TO_PAY'] as const;
export type InvoiceStatus = typeof INVOICE_STATUS_VALUES[number];

/**
 * Mapa de aliases → status canônico.
 * Aceita strings em lowercase, português e inglês.
 * Retorna 'OPEN' como fallback seguro se o valor não for reconhecido.
 */
const STATUS_ALIAS_MAP: Record<string, InvoiceStatus> = {
  // Inglês
  paid:             'PAID',
  canceled:         'CANCELED',
  cancelled:        'CANCELED',
  open:             'OPEN',
  promise_to_pay:   'PROMISE_TO_PAY',
  promise:          'PROMISE_TO_PAY',
  // Português
  pago:             'PAID',
  paga:             'PAID',
  cancelado:        'CANCELED',
  cancelada:        'CANCELED',
  aberto:           'OPEN',
  aberta:           'OPEN',
  pendente:         'OPEN',
  pending:          'OPEN',
  promessa:         'PROMISE_TO_PAY',
  // Canônicos (passam direto)
  PAID:             'PAID',
  CANCELED:         'CANCELED',
  OPEN:             'OPEN',
  PROMISE_TO_PAY:   'PROMISE_TO_PAY',
};

/**
 * Normaliza um status de fatura para o valor canônico do schema.
 * Retorna 'OPEN' se o valor não for reconhecido (fail-safe).
 *
 * @param raw - string vinda de CSV, payload externo ou legado
 */
export function normalizeInvoiceStatus(raw: string | null | undefined): InvoiceStatus {
  if (!raw) return 'OPEN';
  return STATUS_ALIAS_MAP[raw.trim()] ?? STATUS_ALIAS_MAP[raw.trim().toLowerCase()] ?? 'OPEN';
}

/**
 * Asserção de tipo — lança TypeError se o status não for canônico.
 * Use em actions críticas onde valores inválidos devem ser rejeitados em vez de silenciados.
 */
export function assertCanonicalInvoiceStatus(status: string): asserts status is InvoiceStatus {
  if (!(INVOICE_STATUS_VALUES as readonly string[]).includes(status)) {
    throw new TypeError(
      `[invoice-normalizer] Status inválido: "${status}". ` +
      `Valores aceitos: ${INVOICE_STATUS_VALUES.join(', ')}.`
    );
  }
}
