'use client';

import { useState, useTransition } from 'react';
import {
  MessageCircle,
  Copy,
  CheckCircle2,
  SkipForward,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';
import type { CommunicationLogRow } from '@/actions/communicationLog.actions';
import { markLogSent, markLogSkipped, triggerCollectionLogs, getCommunicationLogs } from '@/actions/communicationLog.actions';

// ── Helpers ────────────────────────────────────────────────────────────────────

const RULE_LABELS: Record<string, { label: string; color: string }> = {
  pre_due_3d:  { label: 'Pré-Venc. D-3', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  due_today:   { label: 'Vence Hoje',     color: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue_1d:  { label: 'Atraso 1d',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
  overdue_3d:  { label: 'Atraso 3d',      color: 'bg-orange-100 text-orange-800 border-orange-300' },
  overdue_7d:  { label: 'Atraso 7d',      color: 'bg-red-50 text-red-700 border-red-200' },
  overdue_15d: { label: 'Aviso Final',    color: 'bg-red-100 text-red-800 border-red-300' },
  custom:      { label: 'Manual',         color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; row: string }> = {
  pending:  { label: 'Pendente',  dot: 'bg-amber-400',  row: '' },
  sent:     { label: 'Enviado',   dot: 'bg-emerald-500', row: 'bg-emerald-50/30' },
  skipped:  { label: 'Pulado',    dot: 'bg-slate-400',   row: 'bg-slate-50/40' },
  failed:   { label: 'Falhou',    dot: 'bg-red-500',     row: 'bg-red-50/20' },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function daysOverdueFromMetadata(metadata: string | null): number | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { daysOverdue?: number };
    return parsed.daysOverdue ?? null;
  } catch { return null; }
}

function waLinkFromMetadata(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { waLink?: string };
    return parsed.waLink ?? null;
  } catch { return null; }
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  initialLogs: CommunicationLogRow[];
}

export function CommunicationsClient({ initialLogs }: Props) {
  const [logs, setLogs] = useState<CommunicationLogRow[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRule, setFilterRule] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleMarkSent(id: string) {
    startTransition(async () => {
      await markLogSent(id);
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'sent', sentAt: new Date() } : l))
      );
    });
  }

  function handleMarkSkipped(id: string) {
    startTransition(async () => {
      await markLogSkipped(id);
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'skipped' } : l)));
    });
  }

  function handleCopy(id: string, message: string) {
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      await triggerCollectionLogs();
      const fresh = await getCommunicationLogs();
      setLogs(fresh);
    });
  }

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.invoice?.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchRule = !filterRule || l.ruleType === filterRule;
    return matchSearch && matchStatus && matchRule;
  });

  const pending = logs.filter((l) => l.status === 'pending').length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-obsidian font-heading tracking-tight">
            Central de Comunicações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Régua de Cobrança Inteligente — envios manuais via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              {pending} pendente{pending !== 1 ? 's' : ''}
            </span>
          )}
          <button
            id="btn-refresh-logs"
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-border/60 rounded-lg shadow-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            Atualizar Régua
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white border border-border/60 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            id="input-search-communications"
            type="text"
            placeholder="Buscar cliente ou fatura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            id="select-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-border/60 rounded-lg px-2 py-1 bg-white outline-none"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="skipped">Pulado</option>
            <option value="failed">Falhou</option>
          </select>
          <select
            id="select-filter-rule"
            value={filterRule}
            onChange={(e) => setFilterRule(e.target.value)}
            className="text-sm border border-border/60 rounded-lg px-2 py-1 bg-white outline-none"
          >
            <option value="">Todos os estágios</option>
            {Object.entries(RULE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <MessageCircle className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhuma comunicação encontrada para os filtros selecionados.</p>
          <p className="text-xs opacity-70">Se não há faturas abertas, a régua não gera registros.</p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fatura</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Venc.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atraso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estágio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((log) => {
                  const ruleInfo = RULE_LABELS[log.ruleType] ?? RULE_LABELS.custom;
                  const statusInfo = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending;
                  const daysOverdue = daysOverdueFromMetadata(log.metadata);
                  const waLink = waLinkFromMetadata(log.metadata);
                  const isExpanded = expandedId === log.id;
                  const isSent = log.status === 'sent';
                  const isSkipped = log.status === 'skipped';

                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`hover:bg-muted/10 transition-colors cursor-pointer ${statusInfo.row}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 font-medium text-obsidian">{log.customer.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {log.invoice?.invoiceNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {log.invoice ? formatBRL(log.invoice.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.invoice ? formatDate(log.invoice.dueDate) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {daysOverdue !== null && daysOverdue > 0 ? (
                            <span className="text-xs font-semibold text-red-600">{daysOverdue}d</span>
                          ) : daysOverdue !== null && daysOverdue < 0 ? (
                            <span className="text-xs text-blue-600">{Math.abs(daysOverdue)}d antes</span>
                          ) : (
                            <span className="text-xs text-amber-600">Hoje</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ruleInfo.color}`}>
                            {ruleInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Open WhatsApp */}
                            {waLink && (
                              <a
                                id={`btn-open-wa-${log.id}`}
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir no WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            {/* Copy message */}
                            <button
                              id={`btn-copy-${log.id}`}
                              onClick={() => handleCopy(log.id, log.message)}
                              title="Copiar mensagem"
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              {copiedId === log.id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {/* Mark sent */}
                            {!isSent && !isSkipped && (
                              <button
                                id={`btn-sent-${log.id}`}
                                onClick={() => handleMarkSent(log.id)}
                                title="Marcar como enviado"
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {/* Skip */}
                            {!isSent && !isSkipped && (
                              <button
                                id={`btn-skip-${log.id}`}
                                onClick={() => handleMarkSkipped(log.id)}
                                title="Pular esta comunicação"
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                              >
                                <SkipForward className="w-4 h-4" />
                              </button>
                            )}
                            {/* External link to customer */}
                            <a
                              href={`/historico?cliente=${log.customer.id}`}
                              title="Ver histórico do cliente"
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded message preview */}
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="bg-indigo-50/30">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="flex gap-6 items-start">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                  Prévia da Mensagem
                                </p>
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-obsidian font-sans bg-white rounded-lg border border-border/40 p-4 shadow-sm">
                                  {log.message}
                                </pre>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Abrir WhatsApp
                                  </a>
                                )}
                                <button
                                  onClick={() => handleCopy(log.id, log.message)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-border/60 rounded-lg hover:bg-muted/40 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                  {copiedId === log.id ? 'Copiado!' : 'Copiar'}
                                </button>
                              </div>
                            </div>
                            {log.sentAt && (
                              <p className="text-xs text-muted-foreground mt-3">
                                Enviado em: {formatDate(log.sentAt)}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/30 text-xs text-muted-foreground">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
            {logs.length !== filtered.length && ` de ${logs.length} total`}
          </div>
        </div>
      )}
    </div>
  );
}
