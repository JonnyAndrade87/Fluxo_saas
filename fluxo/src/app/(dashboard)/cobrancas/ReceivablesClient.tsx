'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, FileText, ArrowUpDown, AlertTriangle,
  MoreHorizontal, CheckCircle, CalendarClock, Trash2, X, User, Phone, Mail,
  Clock, Edit3, XCircle, RefreshCcw, DollarSign, Handshake, TrendingDown, TrendingUp
} from "lucide-react";
import { 
  getFilteredInvoices, 
  markInvoiceAsPaid, 
  cancelInvoice, 
  reopenInvoice, 
  registerPromiseToPay, 
  deleteInvoice 
} from "@/actions/invoices";
import { getInvoiceTimeline } from "@/actions/timeline";
import type { TimelineEvent } from "@/types/timeline.types";
import { getInvoiceVisualState, calculateInvoiceFinancials, VisualStatus } from "@/lib/invoice-utils";
import BillingTimeline from "@/components/timeline/BillingTimeline";

export default function ReceivablesClient({ initialData, initialTotalPages = 1 }: { initialData: any[], initialTotalPages?: number }) {
  const [invoices, setInvoices] = useState(initialData);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isPending, startTransition] = useTransition();

  // Filters State — wrappers reset page to 1 on change
  const [search, setSearchRaw] = useState('');
  const [status, setStatusRaw] = useState('all');
  const [dateRange, setDateRangeRaw] = useState('all');
  const [sortBy, setSortByRaw] = useState('date_asc');

  const setSearch = (v: string) => { setSearchRaw(v); setPage(1); };
  const setStatus = (v: string) => { setStatusRaw(v); setPage(1); };
  const setDateRange = (v: string) => { setDateRangeRaw(v); setPage(1); };
  const setSortBy = (v: string) => { setSortByRaw(v); setPage(1); };

  // UI State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [invoiceTimeline, setInvoiceTimeline] = useState<TimelineEvent[]>([]);


  useEffect(() => {
    // Debounce fetch on any filter or page change
    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await getFilteredInvoices({ search, status, dateRange, sortBy, page });
        setInvoices(data.invoices || []);
        setTotalPages(data.totalPages || 1);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, status, dateRange, sortBy, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actions
  const handleAction = async (actionFn: (...args: any[]) => Promise<any>, ...args: any[]) => {
     setActiveDropdown(null);
     startTransition(async () => {
       try {
         await actionFn(...args);
         // Re-fetch after mutation
         const data = await getFilteredInvoices({ search, status, dateRange, sortBy, page });
         setInvoices(data.invoices || []);
         setTotalPages(data.totalPages || 1);
         if (selectedInvoice && selectedInvoice.id === args[0]) {
            setSelectedInvoice(data.invoices?.find((i: any) => i.id === args[0]));
         }
       } catch(e: any) {
         alert(e.message || "Erro ao processar ação.");
       }
     });
  };

  const handleSelectInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceTimeline([]);
    try {
      const events = await getInvoiceTimeline(invoice.id);
      setInvoiceTimeline(events);
    } catch (e) {
      console.error('Failed to load invoice timeline:', e);
    }
  };

  const handlePromessa = (id: string, currentAmount: number) => {
    setActiveDropdown(null);
    const dateStr = window.prompt("Data prometida pelo cliente (DD/MM/AAAA):", "");
    if (!dateStr) return;
    
    let promDate;
    if (dateStr.includes('/')) {
       const parts = dateStr.split('/');
       promDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    } else {
       promDate = new Date(`${dateStr}T12:00:00Z`);
    }

    if (isNaN(promDate.getTime())) {
       alert("Data inválida. Use o formato DD/MM/AAAA.");
       return;
    }
    
    handleAction(registerPromiseToPay, id, promDate.toISOString());
  };

  const handlePay = (id: string, currentUpdateAmount: number) => {
    setActiveDropdown(null);
    const amountStr = window.prompt("Valor pago pelo cliente (Ex: 1500.50):", currentUpdateAmount.toFixed(2));
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert("Valor inválido.");
      return;
    }
    handleAction(markInvoiceAsPaid, id, amount);
  };

  const handleCancel = (id: string) => {
    setActiveDropdown(null);
    const reason = window.prompt("Motivo do cancelamento:", "");
    if (!reason) return;
    handleAction(cancelInvoice, id, reason);
  };

  const handleReopen = (id: string) => {
    setActiveDropdown(null);
    if (window.confirm("Deseja reabrir esta fatura? Isso removerá o registro de pagamento ou cancelamento atual.")) {
       handleAction(reopenInvoice, id);
    }
  }

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getBadgeVariant = (visualState: VisualStatus) => {
    switch(visualState) {
      case 'Paga': return 'success';
      case 'Vencida': 
      case 'Promessa vencida': return 'destructive';
      case 'Vence hoje': 
      case 'Promessa para hoje': return 'warning';
      case 'Cancelada': return 'secondary';
      default: return 'indigo';
    }
  };

  const getStatusIcon = (visualState: VisualStatus) => {
    if (visualState === 'Paga') return <CheckCircle className="w-3 h-3 inline mr-0.5" />;
    if (visualState === 'Vencida' || visualState === 'Promessa vencida') return <AlertTriangle className="w-3 h-3 inline mr-0.5" />;
    if (visualState === 'Vence hoje' || visualState === 'Promessa para hoje') return <Clock className="w-3 h-3 inline mr-0.5" />;
    if (visualState === 'Cancelada') return <XCircle className="w-3 h-3 inline mr-0.5" />;
    if (visualState.includes('Promessa')) return <Handshake className="w-3 h-3 inline mr-0.5" />;
    return null;
  };

  // KPI values derived from loaded invoices (no extra server call)
  const kpiOverdue    = invoices.filter((i: any) => { const vs = getInvoiceVisualState(i); return vs === 'Vencida' || vs === 'Vence hoje' || vs.includes('Promessa vencida'); });
  const kpiOpen       = invoices.filter((i: any) => i.status === 'OPEN' || i.status === 'PROMISE_TO_PAY');
  const kpiPromise    = invoices.filter((i: any) => i.status === 'PROMISE_TO_PAY');
  const kpiPaid       = invoices.filter((i: any) => i.status === 'PAID');
  const totalOverdue  = kpiOverdue.reduce((a: number, i: any)  => a + calculateInvoiceFinancials(i).updatedAmount, 0);
  const totalOpen     = kpiOpen.reduce((a: number, i: any)    => a + calculateInvoiceFinancials(i).updatedAmount, 0);
  const totalPromise  = kpiPromise.reduce((a: number, i: any) => a + calculateInvoiceFinancials(i).updatedAmount, 0);
  const totalPaid     = kpiPaid.reduce((a: number, i: any)    => a + (i.paidAmount || calculateInvoiceFinancials(i).updatedAmount), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recebíveis</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de faturas — analise status, filtre por risco e engatilhe ações.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm"
          onClick={() => window.dispatchEvent(new CustomEvent('open-new-invoice-modal'))}
        >
          <Plus className="w-3.5 h-3.5" /> Nova Cobrança
        </Button>
      </div>

      {/* KPI Strip — derived from loaded page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${kpiOverdue.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpiOverdue.length > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
            <TrendingDown className={`w-4 h-4 ${kpiOverdue.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${kpiOverdue.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Em Atraso</p>
            <p className={`text-sm font-black tabular-nums truncate ${kpiOverdue.length > 0 ? 'text-rose-700' : 'text-slate-600'}`}>{formatCurrency(totalOverdue)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">A Receber</p>
            <p className="text-sm font-black tabular-nums text-amber-700 truncate">{formatCurrency(totalOpen)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Handshake className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Acordos</p>
            <p className="text-sm font-black tabular-nums text-indigo-700 truncate">{formatCurrency(totalPromise)} <span className="text-[10px] font-normal">({kpiPromise.length})</span></p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Recebido</p>
            <p className="text-sm font-black tabular-nums text-emerald-700 truncate">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar cliente ou fatura..."
              className="pl-9 h-9 text-sm border-slate-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={status} onChange={e => setStatus(e.target.value)}
          >
            <option value="all">Status: Todos</option>
            <option value="OPEN">Em Aberto</option>
            <option value="overdue">Atrasados</option>
            <option value="PROMISE_TO_PAY">Em Acordo</option>
            <option value="PAID">Pagos</option>
            <option value="CANCELED">Cancelados</option>
          </select>
          <select
            className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={dateRange} onChange={e => setDateRange(e.target.value)}
          >
            <option value="all">Período: Completo</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="last30days">Últimos 30 dias</option>
            <option value="next7days">Previsão (7 dias)</option>
          </select>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto transition-opacity duration-300 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
          <table className="w-full text-sm text-left min-w-[680px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 hidden sm:table-cell">Documento</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Status</th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-indigo-600 transition-colors select-none hidden md:table-cell"
                  onClick={() => setSortBy(sortBy === 'date_asc' ? 'date_desc' : 'date_asc')}
                >
                  <div className="flex items-center gap-1">Vencimento <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th
                  className="px-5 py-3 cursor-pointer hover:text-indigo-600 transition-colors select-none text-right"
                  onClick={() => setSortBy(sortBy === 'value_desc' ? 'value_asc' : 'value_desc')}
                >
                  <div className="flex items-center justify-end gap-1">Valor <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 relative">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Nenhum recebível encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou cadastre uma nova fatura.</p>
                  </td>
                </tr>
              )}
              {invoices.map((item: any) => {
                const vStatus = getInvoiceVisualState(item);
                const fins = calculateInvoiceFinancials(item);
                const isOverdue   = vStatus === 'Vencida' || vStatus === 'Promessa vencida';
                const isDueToday  = vStatus === 'Vence hoje' || vStatus === 'Promessa para hoje';
                const isActionable = item.status !== 'PAID' && item.status !== 'CANCELED';

                return (
                <tr
                  key={item.id}
                  className={`transition-colors group cursor-pointer ${
                    isOverdue  ? 'border-l-2 border-l-rose-400 bg-rose-50/20 hover:bg-rose-50/40' :
                    isDueToday ? 'border-l-2 border-l-amber-400 bg-amber-50/10 hover:bg-amber-50/30' :
                    'border-l-2 border-l-transparent hover:bg-indigo-50/20'
                  }`}
                  onClick={(e) => {
                    if ((e.target as any).closest('.action-btn')) return;
                    handleSelectInvoice(item);
                  }}
                >
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="font-semibold font-mono tracking-tight text-indigo-700 text-xs">{item.invoiceNumber || item.id.split('-')[0].toUpperCase()}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{item.customer?.name || 'Cliente Genérico'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Doc: {item.customer?.documentNumber || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={getBadgeVariant(vStatus) as any} className="px-2 py-0.5 text-[10px] whitespace-nowrap">
                      {getStatusIcon(vStatus)}{vStatus}
                    </Badge>
                    {item.status === 'PROMISE_TO_PAY' && item.promiseDate && (
                      <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Acordo: {formatDate(item.promiseDate)}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-500 text-xs font-mono hidden md:table-cell">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-right text-[14px]">
                    {item.status === 'PAID' ? (
                      <span className="text-emerald-600">{formatCurrency(item.paidAmount || fins.updatedAmount)}</span>
                    ) : item.status === 'CANCELED' ? (
                      <span className="text-slate-400 line-through">{formatCurrency(fins.updatedAmount)}</span>
                    ) : (
                      <span className={fins.fineAmount > 0 ? 'text-rose-600' : 'text-slate-800'}>{formatCurrency(fins.updatedAmount)}</span>
                    )}
                  </td>
                  {/* Contextual primary action + overflow menu */}
                  <td className="px-5 py-3.5 text-right relative action-btn">
                    <div className="flex items-center justify-end gap-1">
                      {isActionable && (isOverdue || isDueToday) && (
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                          onClick={() => handlePay(item.id, fins.updatedAmount)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Dar Baixa
                        </Button>
                      )}
                      {isActionable && item.status === 'PROMISE_TO_PAY' && !isOverdue && !isDueToday && (
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200"
                          onClick={() => handlePay(item.id, fins.updatedAmount)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Pago
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    {activeDropdown === item.id && (
                      <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95">
                        {item.status !== 'PAID' && item.status !== 'CANCELED' && (
                          <button onClick={() => handlePay(item.id, fins.updatedAmount)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Marcar como Pago
                          </button>
                        )}
                        {item.status !== 'PAID' && item.status !== 'CANCELED' && (
                          <button onClick={() => { setActiveDropdown(null); window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { invoice: item } })); }} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-slate-50 hover:text-indigo-700 transition-colors border-b border-slate-100">
                            <Edit3 className="w-4 h-4 text-slate-500" /> Editar Fatura
                          </button>
                        )}
                        {(vStatus.includes('Vencida') || vStatus.includes('Vence hoje')) && item.status !== 'CANCELED' && item.status !== 'PAID' && (
                          <button onClick={() => handlePromessa(item.id, fins.updatedAmount)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100">
                            <CalendarClock className="w-4 h-4 text-indigo-500" /> Registrar Promessa
                          </button>
                        )}
                        {(item.status === 'PAID' || item.status === 'CANCELED') && (
                          <button onClick={() => handleReopen(item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-slate-100">
                            <RefreshCcw className="w-4 h-4 text-amber-500" /> Reabrir Fatura
                          </button>
                        )}
                        {item.status !== 'CANCELED' && item.status !== 'PAID' && (
                          <button onClick={() => handleCancel(item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600">
                            <XCircle className="w-4 h-4 text-rose-500" /> Cancelar Título
                          </button>
                        )}
                        <button onClick={() => handleAction(deleteInvoice, item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600 border-t border-slate-100">
                          <Trash2 className="w-4 h-4" /> Excluir Fatura
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>{/* end overflow-x-auto */}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
            <span className="text-xs text-slate-400 font-medium">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 text-xs rounded-xl border-slate-200">Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 text-xs rounded-xl border-slate-200">Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Overlay for Selected Invoice */}
      {selectedInvoice && (() => {
         const vStatus = getInvoiceVisualState(selectedInvoice);
         const fins = calculateInvoiceFinancials(selectedInvoice);
         const paidAmountStr = selectedInvoice.paidAmount ? formatCurrency(selectedInvoice.paidAmount) : formatCurrency(fins.updatedAmount);

         return (
         <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 animate-in slide-in-from-right-full duration-300 flex flex-col">
               {/* Drawer Header */}
               <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/60">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Detalhes da Cobrança</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5"># {selectedInvoice.invoiceNumber || selectedInvoice.id.split('-')[0].toUpperCase()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)} className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                     <X className="w-4 h-4" />
                  </Button>
               </div>
               
               {/* Drawer Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    selectedInvoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    (vStatus.includes('Vencida')) ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    selectedInvoice.status === 'CANCELED' ? 'bg-slate-50 text-slate-800 border-slate-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  } border`}>
                     {selectedInvoice.status === 'PAID' && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                     {vStatus.includes('Vencida') && <Clock className="w-6 h-6 text-rose-600 animate-pulse" />}
                     {selectedInvoice.status === 'CANCELED' && <XCircle className="w-6 h-6 text-slate-600" />}
                     {!['PAID', 'CANCELED'].includes(selectedInvoice.status) && !vStatus.includes('Vencida') && <CalendarClock className="w-6 h-6 text-amber-600" />}
                     <div>
                        <h4 className="font-bold uppercase text-[10px] tracking-wider opacity-70 mb-0.5">Situação</h4>
                        <p className="text-lg font-bold">{vStatus}</p>
                     </div>
                  </div>

                  {/* Pricing Box - Base vs Updated */}
                  <div className="space-y-4">
                     <div>
                        <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                          {selectedInvoice.status === 'PAID' ? 'Valor Liquidado' : selectedInvoice.status === 'CANCELED' ? 'Valor Original (Aberto)' : 'Valor Atualizado (Hoje)'}
                        </p>
                        <div className={`text-4xl font-bold tracking-tight ${selectedInvoice.status === 'CANCELED' ? 'text-slate-400 line-through' : selectedInvoice.status === 'PAID' ? 'text-emerald-700' : (fins.fineAmount > 0 ? 'text-rose-600' : 'text-obsidian')}`}>
                          {selectedInvoice.status === 'PAID' ? paidAmountStr : formatCurrency(fins.updatedAmount)}
                        </div>
                     </div>
                     
                     {/* Breakdown (if active and has fines) */}
                     {selectedInvoice.status !== 'CANCELED' && selectedInvoice.status !== 'PAID' && (
                     <div className="bg-[#FAFAFB] border border-border/60 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                           <span>Valor Base</span>
                           <span>{formatCurrency(fins.baseAmount)}</span>
                        </div>
                        {fins.fineAmount > 0 && (
                          <div className="flex justify-between text-rose-600/80">
                             <span>Multa por Atraso</span>
                             <span>{formatCurrency(fins.fineAmount)}</span>
                          </div>
                        )}
                        {fins.interestAmount > 0 && (
                          <div className="flex justify-between text-rose-600/80">
                             <span>Juros de Mora (Proporcional)</span>
                             <span>{formatCurrency(fins.interestAmount)}</span>
                          </div>
                        )}
                        <hr className="border-border/60 my-2" />
                        <div className="flex justify-between font-bold text-slate-900 pb-1">
                           <span>Vencimento</span>
                           <span>{formatDate(selectedInvoice.dueDate)}</span>
                        </div>
                        {selectedInvoice.promiseDate && (
                        <div className="flex justify-between font-bold text-indigo-600 pt-1">
                           <span>Nova Data Prometida</span>
                           <span>{formatDate(selectedInvoice.promiseDate)}</span>
                        </div>
                        )}
                     </div>
                     )}

                     {(selectedInvoice.status === 'PAID' || selectedInvoice.status === 'CANCELED') && (
                        <div className="bg-[#FAFAFB] border border-border/60 rounded-xl p-4 text-sm space-y-2">
                           <div className="flex justify-between text-muted-foreground">
                              <span>Resolvida em:</span>
                              <span className="font-bold text-slate-800">{formatDate(selectedInvoice.paidAt || selectedInvoice.canceledAt || new Date())}</span>
                           </div>
                           {selectedInvoice.cancelReason && (
                              <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded">
                                 <span className="font-bold">Motivo:</span> {selectedInvoice.cancelReason}
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  <hr className="border-border/50" />

                  {/* Customer Info */}
                  <div className="space-y-4">
                     <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><User className="w-4 h-4 text-indigo-500" /> Dados do Sacado</h4>
                     <div className="bg-[#FAFAFB] border border-border/60 rounded-xl p-4 text-sm space-y-3">
                        <div>
                           <span className="text-xs text-slate-400 block mb-0.5">Razão Social / Nome</span>
                           <span className="font-semibold text-slate-800">{selectedInvoice.customer?.name}</span>
                        </div>
                        <div>
                           <span className="text-xs text-slate-400 block mb-0.5">Documento (CPF/CNPJ)</span>
                           <span className="font-mono text-slate-700">{selectedInvoice.customer?.documentNumber}</span>
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                           {selectedInvoice.customer?.phone && (
                             <a href={`https://wa.me/55${selectedInvoice.customer?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, falando da ${selectedInvoice.tenant?.name || 'sua empresa'}. Esta é uma notificação sobre a fatura de ${formatCurrency(fins.updatedAmount)}.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                               <Phone className="w-3.5 h-3.5" /> WhatsApp
                             </a>
                           )}
                           {selectedInvoice.customer?.email && (
                             <a href={`mailto:${selectedInvoice.customer?.email}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                               <Mail className="w-3.5 h-3.5" /> E-mail
                             </a>
                           )}
                        </div>
                     </div>
                   </div>

                   <hr className="border-border/50" />

                   {/* Invoice Timeline */}
                   <div>
                     <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800 mb-4">
                        <Clock className="w-4 h-4 text-indigo-500" /> Timeline da Fatura
                     </h4>
                     <BillingTimeline
                       events={invoiceTimeline}
                       emptyMessage="Nenhum evento encontrado para esta fatura."
                     />
                   </div>
                </div>
               
               {/* Drawer Footer Actions */}
               <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5">
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELED' && (
                    <>
                    <Button onClick={() => handlePay(selectedInvoice.id, fins.updatedAmount)} className="w-full h-11 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                      <DollarSign className="w-4 h-4 mr-1.5" /> Dar Baixa de Pagamento
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                         setSelectedInvoice(null);
                         window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { invoice: selectedInvoice } }));
                      }} className="flex-1 h-10 text-slate-700 hover:bg-slate-50 rounded-xl border-slate-200 text-[13px]">
                        <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Editar
                      </Button>
                      {(vStatus.includes('Vencida') || vStatus.includes('Vence hoje')) && (
                        <Button onClick={() => handlePromessa(selectedInvoice.id, fins.updatedAmount)} variant="outline" className="flex-1 h-10 text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-xl text-[13px]">
                          <CalendarClock className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Promessa
                        </Button>
                      )}
                    </div>
                    </>
                  )}
                  {selectedInvoice.status === 'CANCELED' && (
                    <Button onClick={() => handleReopen(selectedInvoice.id)} className="w-full h-11 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
                      <RefreshCcw className="w-4 h-4 mr-1.5" /> Reabrir Fatura
                    </Button>
                  )}
                  <hr className="border-slate-100" />
                  <Button variant="ghost" className="w-full h-9 text-slate-400 hover:text-slate-700 text-[13px]" onClick={() => setSelectedInvoice(null)}>
                     Fechar
                  </Button>
               </div>
            </div>
         </div>
         );
      })()}
    </div>
  )
}
