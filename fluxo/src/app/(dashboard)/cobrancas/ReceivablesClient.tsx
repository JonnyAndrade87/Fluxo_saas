'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, Plus, FileText, ArrowUpDown, 
  MoreHorizontal, CheckCircle, PauseCircle, CalendarClock, Trash2, X, User, Phone, Mail, Clock, Edit3, XCircle, RefreshCcw, DollarSign
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

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');

  // UI State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [invoiceTimeline, setInvoiceTimeline] = useState<TimelineEvent[]>([]);

  const fetchInvoices = useCallback(() => {
    startTransition(async () => {
       const data = await getFilteredInvoices({ search, status, dateRange, sortBy, page });
       setInvoices(data.invoices || []);
       setTotalPages(data.totalPages || 1);
    });
  }, [search, status, dateRange, sortBy, page]);

  // eslint-disable-next-line
  useEffect(() => {
    setPage(1);
  }, [search, status, dateRange, sortBy]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
       fetchInvoices();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

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
      default: return 'indigo'; // Em dia, Promessa futura
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Recebíveis</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Gestão unificada de faturas. Analise o status, filtre por risco e engatilhe ações rápidas.
          </p>
        </div>
        <Button className="btn-beam shadow-lg rounded-lg overflow-hidden relative group border-none bg-fluxeer-blue text-white hover:bg-fluxeer-blue-hover px-6" onClick={() => window.dispatchEvent(new CustomEvent('open-new-invoice-modal'))}>
          <span className="relative z-10 flex items-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nova Cobrança
          </span>
        </Button>
      </div>

      <Card className="premium-card relative">
        <CardHeader className="border-b border-border/50 bg-[#FAFAFB]">
          <CardTitle className="text-base flex items-center gap-2 text-obsidian">
            <FileText className="w-4 h-4 text-indigo-500" /> Tabela Matriz de Invoices
          </CardTitle>
          <CardDescription className="text-xs">
            Utilize os filtros abaixo para segmentar as categorias de contas a receber.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-start md:items-center justify-between gap-3 mb-6 bg-white p-2 rounded-xl border border-border/40 shadow-sm">
            <div className="relative w-full md:max-w-xs group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                 type="search" 
                 placeholder="Buscar cliente ou fatura..." 
                 className="pl-9 h-10 border-none shadow-none focus-visible:ring-0 bg-transparent" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                 <Filter className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
                 <select 
                   className="text-sm h-9 px-3 rounded-lg border border-border bg-white text-obsidian focus:ring-1 focus:ring-indigo-500 outline-none flex-1 min-w-0"
                   value={status} onChange={e => setStatus(e.target.value)}
                 >
                    <option value="all">Status do Banco: Todos</option>
                    <option value="OPEN">Ativos (Em Aberto)</option>
                    <option value="overdue">Atrasados (Apenas Abertos)</option>
                    <option value="PROMISE_TO_PAY">Em Acordo</option>
                    <option value="PAID">Liquidados (Pagos)</option>
                    <option value="CANCELED">Cancelados</option>
                 </select>
                 <select 
                   className="text-sm h-9 px-3 rounded-lg border border-border bg-white text-obsidian focus:ring-1 focus:ring-indigo-500 outline-none flex-1 min-w-0"
                   value={dateRange} onChange={e => setDateRange(e.target.value)}
                 >
                    <option value="all">Período: Completo</option>
                    <option value="7days">Últimos 7 dias</option>
                    <option value="last30days">Últimos 30 dias</option>
                    <option value="next7days">Previsão (7 dias)</option>
                 </select>
              </div>
            </div>
          </div>
          
          {/* Table Area */}
          <div className={`rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm transition-opacity duration-300 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAFAFB] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status Visual</th>
                  <th 
                     className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                     onClick={() => setSortBy(sortBy === 'date_asc' ? 'date_desc' : 'date_asc')}
                  >
                    <div className="flex items-center gap-1 text-right justify-end">Vencimento Original <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th 
                     className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                     onClick={() => setSortBy(sortBy === 'value_desc' ? 'value_asc' : 'value_desc')}
                  >
                    <div className="flex items-center justify-end gap-1">Valor Vigente <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-obsidian relative">
                {invoices.length === 0 && (
                   <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                         Nenhum recebível encontrado com os filtros atuais.
                      </td>
                   </tr>
                )}
                {invoices.map((item: any) => {
                  const vStatus = getInvoiceVisualState(item);
                  const fins = calculateInvoiceFinancials(item);

                  return (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group relative cursor-pointer" onClick={(e) => {
                     // Prevent triggering drawer if clicking action button
                     if ((e.target as any).closest('.action-btn')) return;
                     handleSelectInvoice(item);
                  }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold font-mono tracking-tight text-indigo-700">{item.invoiceNumber || item.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-obsidian ">{item.customer?.name || 'Cliente Genérico'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Doc: {item.customer?.documentNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getBadgeVariant(vStatus) as any} className="px-2.5 py-1 whitespace-nowrap shadow-sm">
                        {vStatus}
                      </Badge>
                      {item.status === 'PROMISE_TO_PAY' && item.promiseDate && (
                         <div className="text-[10px] text-muted-foreground mt-1">Acordo: {formatDate(item.promiseDate)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                       {formatDate(item.dueDate)}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-obsidian text-right text-[15px]">
                      {item.status === 'PAID' ? (
                         <span className="text-emerald-600">{formatCurrency(item.paidAmount || fins.updatedAmount)}</span>
                      ) : item.status === 'CANCELED' ? (
                         <span className="text-slate-400 line-through">{formatCurrency(fins.updatedAmount)}</span>
                      ) : (
                         <span className={fins.fineAmount > 0 ? "text-rose-600" : ""}>{formatCurrency(fins.updatedAmount)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative action-btn">
                      <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 relative z-10"
                         onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      >
                         <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      
                      {/* Floating Action Menu dropdown */}
                      {activeDropdown === item.id && (
                         <div className="absolute right-8 top-10 w-48 bg-white border border-border shadow-xl rounded-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95">
                            {item.status !== 'PAID' && item.status !== 'CANCELED' && (
                              <button onClick={() => handlePay(item.id, fins.updatedAmount)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                 <CheckCircle className="w-4 h-4 text-emerald-500" /> Marcar como Pago
                              </button>
                            )}
                            {item.status !== 'PAID' && item.status !== 'CANCELED' && (
                              <button onClick={() => {
                                 setActiveDropdown(null);
                                 window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { invoice: item } }));
                              }} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-slate-50 hover:text-indigo-700 transition-colors border-b border-border/50">
                                 <Edit3 className="w-4 h-4 text-slate-500" /> Editar Fatura
                              </button>
                            )}
                            {(vStatus.includes('Vencida') || vStatus.includes('Vence hoje')) && item.status !== 'CANCELED' && item.status !== 'PAID' && (
                               <button onClick={() => handlePromessa(item.id, fins.updatedAmount)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-border/50">
                                  <CalendarClock className="w-4 h-4 text-indigo-500" /> Registrar Promessa
                               </button>
                            )}
                            {(item.status === 'PAID' || item.status === 'CANCELED') && (
                               <button onClick={() => handleReopen(item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-border/50">
                                  <RefreshCcw className="w-4 h-4 text-amber-500" /> Reabrir Fatura
                               </button>
                            )}
                            {item.status !== 'CANCELED' && item.status !== 'PAID' && (
                               <button onClick={() => handleCancel(item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600">
                                  <XCircle className="w-4 h-4 text-rose-500" /> Cancelar Título
                               </button>
                            )}
                            <button onClick={() => handleAction(deleteInvoice, item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600 border-t border-border/50">
                               <Trash2 className="w-4 h-4" /> Excluir Responsabilidade
                            </button>
                         </div>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            </div>{/* end overflow-x-auto */}

            {/* Pagination Controls */}
            {totalPages > 1 && (
               <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-[#FAFAFB]">
                  <span className="text-sm text-muted-foreground font-medium">Página {page} de {totalPages}</span>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 shadow-sm">Anterior</Button>
                     <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 shadow-sm">Próxima</Button>
                  </div>
               </div>
            )}
            
          </div>
          
        </CardContent>
      </Card>

      {/* Drawer Overlay for Selected Invoice */}
      {selectedInvoice && (() => {
         const vStatus = getInvoiceVisualState(selectedInvoice);
         const fins = calculateInvoiceFinancials(selectedInvoice);
         const paidAmountStr = selectedInvoice.paidAmount ? formatCurrency(selectedInvoice.paidAmount) : formatCurrency(fins.updatedAmount);

         return (
         <div className="fixed inset-0 z-[60] flex justify-end bg-obsidian/20 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-border animate-in slide-in-from-right-full duration-300 flex flex-col">
               {/* Drawer Header */}
               <div className="flex items-center justify-between p-6 border-b border-border/50 bg-[#FAFAFB]">
                  <div>
                    <h3 className="text-xl font-heading font-extrabold text-obsidian">Detalhes da Cobrança</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">ID: {selectedInvoice.id}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)} className="rounded-full bg-white shadow-sm border border-border/50 hover:bg-rose-50 hover:text-rose-600">
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
                        <h4 className="font-bold uppercase text-[10px] tracking-wider opacity-80 mb-0.5">Status Calculado</h4>
                        <p className="text-lg font-bold">{vStatus}</p>
                     </div>
                  </div>

                  {/* Pricing Box - Base vs Updated */}
                  <div className="space-y-4">
                     <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                          {selectedInvoice.status === 'PAID' ? 'Valor Liquidado' : selectedInvoice.status === 'CANCELED' ? 'Valor Original (Aberto)' : 'Valor Atualizado (Hoje)'}
                        </p>
                        <div className={`text-4xl font-heading font-black tracking-tight ${selectedInvoice.status === 'CANCELED' ? 'text-slate-400 line-through' : selectedInvoice.status === 'PAID' ? 'text-emerald-700' : (fins.fineAmount > 0 ? 'text-rose-600' : 'text-obsidian')}`}>
                          {selectedInvoice.status === 'PAID' ? paidAmountStr : formatCurrency(fins.updatedAmount)}
                        </div>
                     </div>
                     
                     {/* Breakdown (if active and has fines) */}
                     {selectedInvoice.status !== 'CANCELED' && selectedInvoice.status !== 'PAID' && (
                     <div className="bg-[#FAFAFB] border border-border/60 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                           <span>Valor OriginalBase</span>
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
                        <div className="flex justify-between font-bold text-obsidian pb-1">
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
                              <span className="font-bold text-obsidian">{formatDate(selectedInvoice.paidAt || selectedInvoice.canceledAt || new Date())}</span>
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
                     <h4 className="font-semibold text-sm flex items-center gap-2 text-obsidian"><User className="w-4 h-4 text-indigo-500" /> Dados do Sacado</h4>
                     <div className="bg-[#FAFAFB] border border-border/60 rounded-xl p-4 text-sm space-y-3">
                        <div>
                           <span className="text-xs text-muted-foreground block mb-0.5">Razão Social / Nome</span>
                           <span className="font-semibold text-obsidian">{selectedInvoice.customer?.name}</span>
                        </div>
                        <div>
                           <span className="text-xs text-muted-foreground block mb-0.5">Documento (CPF/CNPJ)</span>
                           <span className="font-mono text-obsidian">{selectedInvoice.customer?.documentNumber}</span>
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
                     <h4 className="font-semibold text-sm flex items-center gap-2 text-obsidian mb-4">
                       <Clock className="w-4 h-4 text-indigo-500" /> Timeline da Fatura
                     </h4>
                     <BillingTimeline
                       events={invoiceTimeline}
                       emptyMessage="Nenhum evento encontrado para esta fatura."
                     />
                   </div>
                </div>
               
               {/* Drawer Footer Actions */}
               <div className="p-6 bg-white border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex flex-col gap-3">
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELED' && (
                    <>
                    <Button onClick={() => handlePay(selectedInvoice.id, fins.updatedAmount)} className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20">
                      <DollarSign className="w-4 h-4 mr-2" /> Dar Baixa de Pagamento
                    </Button>
                    <Button variant="outline" onClick={() => {
                       setSelectedInvoice(null);
                       window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { invoice: selectedInvoice } }));
                    }} className="w-full h-11 text-obsidian hover:bg-slate-50">
                      <Edit3 className="w-4 h-4 mr-2 text-slate-500" /> Editar Título
                    </Button>
                    {(vStatus.includes('Vencida') || vStatus.includes('Vence hoje')) && (
                      <Button onClick={() => handlePromessa(selectedInvoice.id, fins.updatedAmount)} variant="outline" className="w-full h-11 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                        <CalendarClock className="w-4 h-4 mr-2 text-indigo-500" /> Agendar Nova Data Prometida
                      </Button>
                    )}
                    </>
                  )}
                  {selectedInvoice.status === 'CANCELED' && (
                    <Button onClick={() => handleReopen(selectedInvoice.id)} className="w-full h-12 text-base font-semibold bg-fluxeer-blue hover:bg-fluxeer-blue-hover text-white shadow-xl shadow-fluxeer-blue/20">
                      <RefreshCcw className="w-4 h-4 mr-2" /> Reabrir Fatura Cancelada
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full h-11 text-muted-foreground hover:text-obsidian" onClick={() => setSelectedInvoice(null)}>
                     Fechar Painel
                  </Button>
               </div>
            </div>
         </div>
         );
      })()}
    </div>
  )
}
