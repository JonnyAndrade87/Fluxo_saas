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
          <h1 className="text-2xl font-bold text-obsidian font-heading tracking-tight">
            Central de Comunicações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Régua de Cobrança Inteligente — envios manuais via WhatsApp
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-fluxeer-blue rounded-lg shadow-md hover:bg-fluxeer-blue-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            Gerar Comunicações do Dia
          </button>
        </div>
      </div>

      {/* Sub-Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm flex flex-col justify-center">
           <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Listados</p>
           <p className="text-2xl font-black text-obsidian">{totalLogs}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
           <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pendentes de Ação</p>
           <p className="text-2xl font-black text-amber-700">{pendingLogs}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
           <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Enviados (Nesta Tela)</p>
           <p className="text-2xl font-black text-emerald-700">{sentLogs}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 shadow-sm flex flex-col justify-center">
           <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">Falhas de Entrega</p>
           <p className="text-2xl font-black text-rose-700">{failedLogs}</p>
        </div>
      </div>

      {/* Filters Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleFetchLogs(); }} 
        className="flex flex-col lg:flex-row gap-3 p-4 bg-white border border-border/60 rounded-xl shadow-sm"
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-border/60 rounded-lg px-3">
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
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <a
                                href={`/historico?cliente=${log.customer.id}`}
                                title="Ver cliente"
                                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors bg-white border border-slate-200"
                              >
                                <ExternalLink className="w-4 h-4" />
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
