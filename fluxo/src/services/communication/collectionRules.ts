/**
 * collectionRules.ts
 * Defines the Intelligent Collection Workflow (Régua de Cobrança Inteligente).
 * Each rule maps to a specific lifecycle stage of an invoice.
 *
 * NOTE: The existing WhatsApp API / cron / webhook architecture is UNTOUCHED.
 * This module is the manual-mode counterpart and is fully plug-compatible with
 * the future COMMUNICATION_MODE=whatsapp_api activation.
 */

export type RuleType =
  | 'pre_due_3d'
  | 'due_today'
  | 'overdue_1d'
  | 'overdue_3d'
  | 'overdue_7d'
  | 'overdue_15d'
  | 'custom';

export type ChannelType = 'whatsapp_manual' | 'email_manual' | 'internal';

export type LogStatus = 'pending' | 'sent' | 'skipped' | 'failed';

export interface CollectionRule {
  /** Unique identifier for this rule stage */
  ruleType: RuleType;
  /** Days offset from due date. Negative = before, 0 = due day, positive = after */
  daysOffset: number;
  /** Human-readable label shown on the UI */
  label: string;
  /** Default channel for this rule */
  channel: ChannelType;
  /** Urgency level (affects message tone) */
  urgency: 'friendly' | 'neutral' | 'firm' | 'final';
}

/**
 * The 6 stages of the Intelligent Collection Workflow.
 * To add or remove stages, only edit this array.
 */
export const COLLECTION_RULES: CollectionRule[] = [
  {
    ruleType: 'pre_due_3d',
    daysOffset: -3,
    label: 'Lembrete Pré-Vencimento (D-3)',
    channel: 'whatsapp_manual',
    urgency: 'friendly',
  },
  {
    ruleType: 'due_today',
    daysOffset: 0,
    label: 'Vence Hoje (D0)',
    channel: 'whatsapp_manual',
    urgency: 'neutral',
  },
  {
    ruleType: 'overdue_1d',
    daysOffset: 1,
    label: 'Atraso 1 Dia (D+1)',
    channel: 'whatsapp_manual',
    urgency: 'neutral',
  },
  {
    ruleType: 'overdue_3d',
    daysOffset: 3,
    label: 'Atraso 3 Dias (D+3)',
    channel: 'whatsapp_manual',
    urgency: 'firm',
  },
  {
    ruleType: 'overdue_7d',
    daysOffset: 7,
    label: 'Atraso 7 Dias (D+7)',
    channel: 'whatsapp_manual',
    urgency: 'firm',
  },
  {
    ruleType: 'overdue_15d',
    daysOffset: 15,
    label: 'Aviso Final (D+15)',
    channel: 'whatsapp_manual',
    urgency: 'final',
  },
];

/**
 * Given a difference in days (today - dueDate), returns the matching rule.
 * Returns undefined if no rule matches.
 */
export function getRuleForDiff(diffDays: number): CollectionRule | undefined {
  return COLLECTION_RULES.find((r) => r.daysOffset === diffDays);
}
