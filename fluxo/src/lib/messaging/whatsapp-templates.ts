/**
 * WhatsApp Template Mapping — Meta Business API
 *
 * Maps each billing stage (from automation.ts) to its Meta-approved template name.
 *
 * HOW TO USE:
 *  1. Create these templates in Meta Business Manager:
 *     → https://business.facebook.com/ → WhatsApp Manager → Message Templates
 *  2. Wait for approval (usually a few hours).
 *  3. The system will automatically use them for business-initiated messages.
 *
 * STAGING IDs come from DEFAULT_FLOW_CONFIG in automation.ts:
 *   "pre"  → pre-due reminder (-3 days)
 *   "dia"  → due date reminder (day 0)
 *   "pos1" → first overdue notice (+2 days)
 *   "pos2" → medium overdue notice (+7 days)
 *   "pos3" → final notice (+15 days)
 *
 * Template variables (components) follow Meta's format:
 *   https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 *
 * Variable order per template:
 *   {{1}} = customer name
 *   {{2}} = invoice number
 *   {{3}} = due date
 *   {{4}} = amount (R$)
 */

export interface TemplateMapping {
  templateName: string;
  languageCode?: string;
  /** Build the components array from invoice data */
  buildComponents: (vars: {
    customerName: string;
    invoiceNumber: string;
    dueDate: string;
    amount: string;
    daysOverdue?: number;
    companyName?: string;
  }) => object[];
}

/**
 * Returns Meta template components in the standard body-parameters format.
 * Adjust order to match exactly how you defined variables in each template on Meta.
 */
function bodyParams(...values: string[]): object[] {
  return [
    {
      type: 'body',
      parameters: values.map((v) => ({ type: 'text', text: v })),
    },
  ];
}

/**
 * Stage → Template mapping.
 *
 * IMPORTANT: The templateName strings below must EXACTLY match the
 * template names you registered and got approved in Meta Business Manager.
 *
 * Suggested names are prefixed with "fluxo_" to avoid collision.
 */
export const WHATSAPP_TEMPLATE_MAP: Record<string, TemplateMapping> = {
  /** D-3: friendly reminder before due date */
  pre: {
    templateName: 'fluxo_lembrete_pre_vencimento',
    languageCode: 'pt_BR',
    buildComponents: ({ customerName, invoiceNumber, dueDate, amount }) =>
      bodyParams(customerName, invoiceNumber, dueDate, amount),
  },

  /** D0: due date reminder */
  dia: {
    templateName: 'fluxo_aviso_vencimento_hoje',
    languageCode: 'pt_BR',
    buildComponents: ({ customerName, invoiceNumber, amount }) =>
      bodyParams(customerName, invoiceNumber, amount),
  },

  /** D+2: first overdue notice */
  pos1: {
    templateName: 'fluxo_cobranca_atraso_inicial',
    languageCode: 'pt_BR',
    buildComponents: ({ customerName, invoiceNumber, dueDate, amount }) =>
      bodyParams(customerName, invoiceNumber, dueDate, amount),
  },

  /** D+7: firmer overdue notice */
  pos2: {
    templateName: 'fluxo_cobranca_atraso_medio',
    languageCode: 'pt_BR',
    buildComponents: ({ customerName, invoiceNumber, amount, dueDate }) =>
      bodyParams(customerName, invoiceNumber, amount, dueDate),
  },

  /** D+15: last notice before legal action */
  pos3: {
    templateName: 'fluxo_ultimo_aviso_juridico',
    languageCode: 'pt_BR',
    buildComponents: ({ customerName, invoiceNumber, amount, daysOverdue }) =>
      bodyParams(customerName, invoiceNumber, amount, String(daysOverdue ?? 15)),
  },
};

/**
 * Look up template info for a given billing stage.
 * Returns undefined if stage has no mapping (free-text will be used as fallback).
 */
export function getTemplateForStage(stageId: string): TemplateMapping | undefined {
  return WHATSAPP_TEMPLATE_MAP[stageId];
}
