'use client';

import type { TimelineEvent, TimelineCategory } from '@/types/timeline.types';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  SkipForward,
  AlertTriangle,
  Handshake,
  CircleDollarSign,
  StickyNote,
  Activity,
} from 'lucide-react';

// ─── Color config per category ───────────────────────────────────────────────

const CATEGORY_COLORS: Record<TimelineCategory, { dot: string; line: string; bg: string; text: string }> = {
  invoice: {
    dot: 'bg-indigo-500',
    line: 'bg-indigo-200',
    bg: 'bg-indigo-50 border-indigo-100',
    text: 'text-indigo-700',
  },
  communication: {
    dot: 'bg-emerald-500',
    line: 'bg-emerald-200',
    bg: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-700',
  },
  payment: {
    dot: 'bg-teal-500',
    line: 'bg-teal-200',
    bg: 'bg-teal-50 border-teal-100',
    text: 'text-teal-700',
  },
  note: {
    dot: 'bg-slate-400',
    line: 'bg-slate-200',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
  },
  system: {
    dot: 'bg-gray-400',
    line: 'bg-gray-200',
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-500',
  },
};

// Override for specific comm states
function getCommColor(status?: string) {
  if (status === 'skipped') return { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' };
  if (status === 'failed') return { dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700' };
  return null;
}

// ─── Icon per event type ─────────────────────────────────────────────────────

function EventIcon({ event }: { event: TimelineEvent }) {
  const cls = 'w-3.5 h-3.5';
  switch (event.type) {
    case 'INVOICE_CREATED':    return <FileText className={cls} />;
    case 'INVOICE_PAID':       return <CheckCircle2 className={cls} />;
    case 'INVOICE_CANCELED':   return <XCircle className={cls} />;
    case 'INVOICE_OVERDUE':    return <AlertCircle className={cls} />;
    case 'INVOICE_DUE_TODAY':  return <Clock className={cls} />;
    case 'COMM_GENERATED':     return <MessageSquare className={cls} />;
    case 'COMM_SENT':          return <Send className={cls} />;
    case 'COMM_SKIPPED':       return <SkipForward className={cls} />;
    case 'COMM_FAILED':        return <AlertTriangle className={cls} />;
    case 'PROMISE_CREATED':    return <Handshake className={cls} />;
    case 'PROMISE_FULFILLED':  return <CircleDollarSign className={cls} />;
    case 'PROMISE_BROKEN':     return <AlertTriangle className={cls} />;
    case 'NOTE_ADDED':         return <StickyNote className={cls} />;
    default:                   return <Activity className={cls} />;
  }
}

// ─── Badge label per event type ──────────────────────────────────────────────

function eventBadgeLabel(event: TimelineEvent): string {
  switch (event.type) {
    case 'INVOICE_CREATED':    return 'Emissão';
    case 'INVOICE_PAID':       return 'Pagamento';
    case 'INVOICE_CANCELED':   return 'Cancelamento';
    case 'INVOICE_OVERDUE':    return 'Vencida';
    case 'INVOICE_DUE_TODAY':  return 'Vence Hoje';
    case 'INVOICE_REOPENED':   return 'Reaberta';
    case 'COMM_GENERATED':     return 'Pendente Envio';
    case 'COMM_SENT':          return 'Enviada';
    case 'COMM_SKIPPED':       return 'Ignorada';
    case 'COMM_FAILED':        return 'Falhou';
    case 'PROMISE_CREATED':    return 'Promessa';
    case 'PROMISE_FULFILLED':  return 'Cumprida';
    case 'PROMISE_BROKEN':     return 'Quebrada';
    case 'NOTE_ADDED':         return 'Nota';
    default:                   return 'Evento';
  }
}

// ─── Date formatter ──────────────────────────────────────────────────────────

const dtFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function fmtDate(d: Date | string): string {
  return dtFmt.format(new Date(d));
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface BillingTimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
}

export default function BillingTimeline({ events, emptyMessage = 'Nenhum evento registrado ainda.' }: BillingTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-8 italic">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event, idx) => {
        const colors = CATEGORY_COLORS[event.category];
        const commOverride = event.category === 'communication' ? getCommColor(event.metadata?.status) : null;

        const dotColor = commOverride?.dot ?? colors.dot;
        const bgColor = commOverride?.bg ?? colors.bg;
        const textColor = commOverride?.text ?? colors.text;

        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-3 pl-1 pb-4">
            {/* Vertical line */}
            {!isLast && (
              <div className={`absolute left-[14px] top-7 bottom-0 w-px ${colors.line}`} />
            )}

            {/* Dot */}
            <div className="relative mt-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${dotColor} text-white`}>
                <EventIcon event={event} />
              </div>
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-xl border p-3 ${bgColor} min-w-0`}>
              <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${bgColor} ${textColor}`}>
                    {eventBadgeLabel(event)}
                  </span>
                  <span className="font-semibold text-[13px] text-obsidian">{event.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {fmtDate(event.date)}
                </span>
              </div>

              <p className="text-[12px] text-muted-foreground leading-relaxed">{event.description}</p>

              {/* Metadata chips */}
              {event.metadata && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.metadata.ruleType && (
                    <span className="text-[10px] bg-white/70 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                      📋 {event.metadata.ruleType}
                    </span>
                  )}
                  {event.metadata.channel && (
                    <span className="text-[10px] bg-white/70 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground">
                      📬 {event.metadata.channel}
                    </span>
                  )}
                  {event.metadata.status && event.category === 'communication' && (
                    <span className="text-[10px] bg-white/70 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground">
                      Status: {event.metadata.status}
                    </span>
                  )}
                  {event.metadata.amount !== undefined && event.category !== 'invoice' && (
                    <span className="text-[10px] bg-white/70 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground font-semibold">
                      💰 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.metadata.amount)}
                    </span>
                  )}
                  {event.metadata.actorName && (
                    <span className="text-[10px] bg-white/70 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground">
                      👤 {event.metadata.actorName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
