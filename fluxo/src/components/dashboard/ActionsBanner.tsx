/**
 * ActionsBanner
 * Bloco de "Ações Recomendadas" derivado dos sinais reais do dashboard.
 * Mostra no máximo 5 ações priorizadas por criticidade.
 * Design: SaaS B2B sóbrio. Sem dados artificiais.
 */

import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  XCircle,
  ShieldAlert,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { DashboardKPIs, OverdueInvoice, RecentCommActivity } from '@/actions/dashboard';

interface Action {
  id: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}

interface Props {
  kpis: DashboardKPIs;
  overdueSnapshot: OverdueInvoice[];
  recentCommActivity: RecentCommActivity[];
  criticalAlerts: { id: string; type: string; title: string; description: string; actionUrl: string }[];
}

const PRIORITY_STYLES = {
  high:   'border-rose-200 bg-rose-50/60',
  medium: 'border-amber-200 bg-amber-50/50',
  low:    'border-slate-200 bg-slate-50',
};

const ICON_STYLES = {
  high:   'bg-rose-100 text-rose-600',
  medium: 'bg-amber-100 text-amber-600',
  low:    'bg-slate-100 text-slate-500',
};

const CTA_STYLES = {
  high:   'text-rose-700 hover:text-rose-900 border-rose-200 hover:bg-rose-100',
  medium: 'text-amber-700 hover:text-amber-900 border-amber-200 hover:bg-amber-100',
  low:    'text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-100',
};

function buildActions(
  kpis: Props['kpis'],
  overdueSnapshot: Props['overdueSnapshot'],
  recentCommActivity: Props['recentCommActivity'],
  criticalAlerts: Props['criticalAlerts'],
): Action[] {
  const actions: Action[] = [];

  // ── Alta: Faturas vencidas ──────────────────────────────────────────────
  if (overdueSnapshot.length > 0) {
    actions.push({
      id:          'overdue_invoices',
      priority:    'high',
      icon:        AlertTriangle,
      title:       `${overdueSnapshot.length} fatura${overdueSnapshot.length > 1 ? 's' : ''} vencida${overdueSnapshot.length > 1 ? 's' : ''} sem resolução`,
      description: `Total vencido: R$ ${kpis.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Priorize a cobrança dos casos mais críticos.`,
      href:        '/cobrancas?status=overdue',
      cta:         'Ver vencidas',
    });
  }

  // ── Alta: Falhas na fila de comunicação ─────────────────────────────────
  const failedComms = recentCommActivity.filter(c => c.status === 'failed');
  if (failedComms.length > 0) {
    actions.push({
      id:          'failed_comms',
      priority:    'high',
      icon:        XCircle,
      title:       `${failedComms.length} comunicação${failedComms.length > 1 ? 'ões' : ''} com falha de entrega`,
      description: 'Mensagens não entregues exigem revisão manual ou reenvio.',
      href:        '/fila',
      cta:         'Revisar fila',
    });
  }

  // ── Alta: Alertas críticos de promessas quebradas (já existem no sistema) ─
  const brokenPromises = criticalAlerts.filter(a => a.type === 'broken_promise');
  if (brokenPromises.length > 0) {
    actions.push({
      id:          'broken_promises',
      priority:    'high',
      icon:        Clock,
      title:       `${brokenPromises.length} promessa${brokenPromises.length > 1 ? 's' : ''} de pagamento quebrada${brokenPromises.length > 1 ? 's' : ''}`,
      description: 'Clientes que prometeram pagar e não cumpriram. Ação imediata recomendada.',
      href:        '/clientes?filter=broken_promise',
      cta:         'Ver clientes',
    });
  }

  // ── Média: Comunicações pendentes de envio ──────────────────────────────
  if (kpis.pendingCommsCount > 0) {
    actions.push({
      id:          'pending_comms',
      priority:    'medium',
      icon:        MessageSquare,
      title:       `${kpis.pendingCommsCount} mensagem${kpis.pendingCommsCount > 1 ? 's' : ''} aguardando envio`,
      description: 'Há comunicações planejadas que ainda não foram disparadas.',
      href:        '/fila',
      cta:         'Ver fila',
    });
  }

  // ── Média: Taxa de inadimplência acima de 15% ──────────────────────────
  if (kpis.defaultRate > 15) {
    actions.push({
      id:          'high_default_rate',
      priority:    'medium',
      icon:        ShieldAlert,
      title:       `Taxa de inadimplência em ${kpis.defaultRate.toFixed(1)}%`,
      description: 'Acima do limite saudável. Revise a régua de cobrança e priorize recuperação.',
      href:        '/automacao',
      cta:         'Revisar régua',
    });
  }

  // Limita a 5 ações, priorizando high > medium > low
  return actions
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);
}

export default function ActionsBanner({
  kpis,
  overdueSnapshot,
  recentCommActivity,
  criticalAlerts,
}: Props) {
  const actions = buildActions(kpis, overdueSnapshot, recentCommActivity, criticalAlerts);

  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Tudo em ordem</p>
          <p className="text-xs text-emerald-600">Nenhuma ação imediata necessária no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Ações Recomendadas
        </p>
        <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md">
          {actions.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-shadow hover:shadow-sm ${PRIORITY_STYLES[action.priority]}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${ICON_STYLES[action.priority]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{action.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.description}</p>
                <Link
                  href={action.href}
                  className={`inline-flex items-center gap-1 mt-2.5 text-xs font-semibold border rounded-lg px-2.5 py-1 transition-colors ${CTA_STYLES[action.priority]}`}
                >
                  {action.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
