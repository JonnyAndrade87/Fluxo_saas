// Shared TypeScript types for the billing/communication timeline system

export type TimelineCategory =
  | 'invoice'
  | 'communication'
  | 'payment'
  | 'note'
  | 'system';

export type TimelineEventType =
  // Invoice lifecycle
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'INVOICE_CANCELED'
  | 'INVOICE_OVERDUE'
  | 'INVOICE_DUE_TODAY'
  | 'INVOICE_REOPENED'
  // Communication events
  | 'COMM_GENERATED'
  | 'COMM_SENT'
  | 'COMM_SKIPPED'
  | 'COMM_FAILED'
  // Payment events
  | 'PROMISE_CREATED'
  | 'PROMISE_FULFILLED'
  | 'PROMISE_BROKEN'
  // Note events
  | 'NOTE_ADDED'
  // Generic activity log
  | 'SYSTEM_EVENT';

export interface TimelineEventMetadata {
  ruleType?: string;       // pre_due_3d | due_today | overdue_1d | overdue_3d | overdue_7d | overdue_15d
  channel?: string;        // whatsapp_manual | email_manual | internal
  status?: string;         // pending | sent | skipped | failed
  amount?: number;         // for payment/promise events
  invoiceNumber?: string;  // invoice reference
  invoiceId?: string;      // invoice FK
  actorName?: string;      // user who performed action
  notes?: string;          // extra contextual note
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  category: TimelineCategory;
  date: Date;
  label: string;
  description: string;
  metadata?: TimelineEventMetadata;
}
