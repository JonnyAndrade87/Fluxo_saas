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
  AlertCircle,
  Send,
  Clock,
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

const STATUS_CONFIG: Record<string, {
  label: string;
  badge: string;
  row: string;
  icon: React.ElementType;
}> = {
  pending: {
    label:  'Pendente',
    badge:  'bg-amber-50 text-amber-700 border border-amber-200',
    row:    'border-l-2 border-l-amber-300',
    icon:   Clock,
  },
  sent: {
    label:  'Enviado',
    badge:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    row:    '',
    icon:   Send,
  },
  skipped: {
    label:  'Pulado',
    badge:  'bg-slate-100 text-slate-500 border border-slate-200',
    row:    '',
    icon:   SkipForward,
  },
  failed: {
    label:  'Falhou',
    badge:  'bg-rose-50 text-rose-700 border border-rose-200',
    row:    'bg-rose-50/30 border-l-2 border-l-rose-400',
    icon:   AlertCircle,
  },
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleFetchLogs() {
    startTransition(async () => {
      const fresh = await getCommunicationLogs({
        search: search || undefined,
        status: filterStatus || undefined,
        ruleType: filterRule || undefined,
        dateFrom: dateFrom ? new Date(dateFrom + 'T00:00:00') : undefined,
        dateTo: dateTo ? new Date(dateTo + 'T23:59:59') : undefined,
      });
      setLogs(fresh);
    });
  }

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
      handleFetchLogs();
    });
  }

  // No client-side filtering needed anymore since we push filters to the server.
  // We just use `logs` directly for the table.
  const filtered = logs;

  const totalLogs = filtered.length;
  const pendingLogs = filtered.filter((l) => l.status === 'pending').length;
  const sentLogs = filtered.filter((l) => l.status === 'sent').length;
  const failedLogs = filtered.filter((l) => l.status === 'failed').length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Comunicações</h1>
          <p className="text-slate-500 text-sm mt-1">Régua de cobrança — envios manuais via WhatsApp</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          Gerar Comunicações do Dia
        </button>
      </div>

      {/* KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 tabular-nums">{totalLogs}</p>
            <p className="text-[10px] text-slate-400 font-medium">Listados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-black text-amber-700 tabular-nums">{pendingLogs}</p>
            <p className="text-[10px] text-amber-600 font-medium">Pendentes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-black text-emerald-700 tabular-nums">{sentLogs}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Enviados</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${failedLogs > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}` }>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${failedLogs > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
            <AlertCircle className={`w-4 h-4 ${failedLogs > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className={`text-xl font-black tabular-nums ${failedLogs > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{failedLogs}</p>
            <p className={`text-[10px] font-medium ${failedLogs > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Falhas</p>
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleFetchLogs(); }} 
        className="flex flex-col lg:flex-row gap-3 p-4 bg-white border border-border/60 rounded-xl shadow-sm"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 border border-border/60 rounded-lg px-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            id="input-search-communications"
            type="text"
            placeholder="Buscar por cliente ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/70 py-2.5 w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">De:</span>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-border/60 rounded-lg px-2 py-2 bg-white outline-none w-[130px]"
            />
            <span className="text-xs font-semibold text-muted-foreground">Ate:</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-border/60 rounded-lg px-2 py-2 bg-white outline-none w-[130px]"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-border/60 pl-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              id="select-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-border/60 rounded-lg px-3 py-2 bg-white outline-none font-medium"
            >
              <option value="">Status: Todos</option>
              <option value="pending">Pendentes</option>
              <option value="sent">Enviados</option>
              <option value="skipped">Pulados</option>
              <option value="failed">Falhas</option>
            </select>
            <select
              id="select-filter-rule"
              value={filterRule}
              onChange={(e) => setFilterRule(e.target.value)}
              className="text-sm border border-border/60 rounded-lg px-3 py-2 bg-white outline-none font-medium"
            >
              <option value="">Regra: Todas</option>
              {Object.entries(RULE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            disabled={isPending}
            className="px-5 py-2 flex items-center justify-center text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border border-slate-200 bg-white">
          <MessageCircle className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhuma comunicação encontrada</p>
          <p className="text-xs text-slate-400 max-w-xs">Sem faturas abertas ou filtros sem resultado. Gere as comunicações do dia para começar.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Fatura</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Venc.</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Atraso</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Estágio</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
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

                  const StatusIcon = statusInfo.icon;
                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${statusInfo.row}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 text-sm">{log.customer.name}</p>
                          {daysOverdue !== null && daysOverdue > 0 && (
                            <p className="text-[10px] text-rose-600 font-semibold">{daysOverdue}d em atraso</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden sm:table-cell">
                          {log.invoice?.invoiceNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-sm">
                          {log.invoice ? formatBRL(log.invoice.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                          {log.invoice ? formatDate(log.invoice.dueDate) : '—'}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {daysOverdue !== null && daysOverdue > 0 ? (
                            <span className="text-xs font-bold text-rose-600">{daysOverdue}d</span>
                          ) : daysOverdue !== null && daysOverdue < 0 ? (
                            <span className="text-xs text-indigo-600">{Math.abs(daysOverdue)}d antes</span>
                          ) : (
                            <span className="text-xs text-amber-600">Hoje</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${ruleInfo.color}`}>
                            {ruleInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end">
                            <a
                              href={`/historico?cliente=${log.customer.id}`}
                              title="Ver histórico do cliente"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded message preview */}
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="bg-[#FAFAFB]">
                          <td colSpan={8} className="px-6 py-5 border-b border-border/40">
                            <div className="flex gap-8 items-start">
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                                  <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                                  Conteúdo da Mensagem
                                </p>
                                <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                   <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-obsidian font-sans">
                                     {log.message}
                                   </pre>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2.5 shrink-0 w-[240px]">
                                <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                                  Controles Operacionais
                                </p>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-[transform,colors] hover:scale-[1.02] shadow-sm shadow-emerald-600/20"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Abrir no WhatsApp
                                  </a>
                                )}
                                <button
                                  onClick={() => handleCopy(log.id, log.message)}
                                  className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white border border-border/60 text-obsidian rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                  {copiedId === log.id ? (
                                    <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Copiado!</>
                                  ) : (
                                    <><Copy className="w-4 h-4" /> Copiar Texto</>
                                  )}
                                </button>
                                
                                {!isSent && !isSkipped && (
                                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/50">
                                    <button
                                      onClick={() => handleMarkSent(log.id)}
                                      disabled={isPending}
                                      className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-40"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Marcar Enviado
                                    </button>
                                    <button
                                      onClick={() => handleMarkSkipped(log.id)}
                                      disabled={isPending}
                                      className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-40"
                                    >
                                      <SkipForward className="w-4 h-4" /> Pular Registro
                                    </button>
                                  </div>
                                )}
                                
                                {log.sentAt && (
                                  <div className="mt-2 text-xs text-center font-medium px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                    Enviado em {formatDate(log.sentAt)}
                                  </div>
                                )}
                              </div>
                            </div>
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
