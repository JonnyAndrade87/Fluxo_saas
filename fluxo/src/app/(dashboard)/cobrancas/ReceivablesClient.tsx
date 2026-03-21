'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, Plus, FileText, ArrowUpDown, 
  MoreHorizontal, CheckCircle, PauseCircle, CalendarClock, Trash2, X, User, Phone, Mail, Clock
} from "lucide-react";
import { 
  getFilteredInvoices, GetInvoicesParams, 
  markInvoiceAsPaid, pauseInvoice, registerPromiseToPay, deleteInvoice 
} from "@/actions/invoices";

export default function ReceivablesClient({ initialData }: { initialData: any[] }) {
  const [invoices, setInvoices] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');

  // UI State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchInvoices = () => {
    startTransition(async () => {
       const data = await getFilteredInvoices({ search, status, dateRange, sortBy });
       setInvoices(data);
    });
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
       fetchInvoices();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, status, dateRange, sortBy]);

  // Actions
  const handleAction = async (actionFn: Function, id: string, extraArg?: any) => {
     setActiveDropdown(null);
     startTransition(async () => {
       await actionFn(id, extraArg);
       // Re-fetch after mutation
       const data = await getFilteredInvoices({ search, status, dateRange, sortBy });
       setInvoices(data);
       if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice(data.find((i: any) => i.id === id));
       }
     });
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getBadgeVariant = (status: string) => {
    switch(status) {
      case 'paid': return 'success';
      case 'overdue': return 'destructive';
      case 'pending': return 'warning';
      case 'paused': return 'secondary';
      default: return 'indigo';
    }
  };

  const translateStatus = (status: string) => {
    switch(status) {
      case 'paid': return 'Pago';
      case 'overdue': return 'Atrasado';
      case 'pending': return 'Pendente';
      case 'paused': return 'Pausado';
      default: return status;
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
        <Button variant="beam" className="gap-2 shadow-sm rounded-full px-6">
          <Plus className="w-4 h-4" /> Nova Cobrança
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-xl border border-border/40 shadow-sm">
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
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-2 lg:px-0">
              <div className="flex items-center gap-1.5 border-l border-border pl-4">
                 <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                 <select 
                   className="text-sm h-9 px-3 rounded-lg border border-border bg-white text-obsidian focus:ring-1 focus:ring-indigo-500 outline-none"
                   value={status} onChange={e => setStatus(e.target.value)}
                 >
                    <option value="all">Status: Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados (Risco)</option>
                    <option value="paid">Pagos</option>
                    <option value="paused">Pausados</option>
                 </select>
                 <select 
                   className="text-sm h-9 px-3 rounded-lg border border-border bg-white text-obsidian focus:ring-1 focus:ring-indigo-500 outline-none"
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
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAFAFB] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status</th>
                  <th 
                     className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                     onClick={() => setSortBy(sortBy === 'date_asc' ? 'date_desc' : 'date_asc')}
                  >
                    <div className="flex items-center gap-1 text-right justify-end">Vencimento <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th 
                     className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                     onClick={() => setSortBy(sortBy === 'value_desc' ? 'value_asc' : 'value_desc')}
                  >
                    <div className="flex items-center justify-end gap-1">Valor <ArrowUpDown className="w-3 h-3" /></div>
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
                {invoices.map((item: any) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group relative cursor-pointer" onClick={(e) => {
                     // Prevent triggering drawer if clicking action button
                     if ((e.target as any).closest('.action-btn')) return;
                     setSelectedInvoice(item);
                  }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold font-mono tracking-tight text-indigo-700">{item.invoiceNumber || item.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-obsidian ">{item.customer?.name || 'Cliente Genérico'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Doc: {item.customer?.documentNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* @ts-ignore */}
                      <Badge variant={getBadgeVariant(item.status)} className="px-2.5 py-1 whitespace-nowrap shadow-sm">
                        {translateStatus(item.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                       {formatDate(item.dueDate)}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-obsidian text-right text-[15px]">
                      {formatCurrency(item.amount)}
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
                            {item.status !== 'paid' && (
                              <button onClick={() => handleAction(markInvoiceAsPaid, item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                 <CheckCircle className="w-4 h-4 text-emerald-500" /> Marcar como Pago
                              </button>
                            )}
                            {item.status === 'overdue' && (
                               <button onClick={() => {
                                  const prom = new Date(); prom.setDate(prom.getDate() + 5);
                                  handleAction(registerPromiseToPay, item.id, prom.toISOString());
                               }} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                                  <CalendarClock className="w-4 h-4 text-indigo-500" /> Registrar Promessa
                               </button>
                            )}
                            {item.status !== 'paused' && item.status !== 'paid' && (
                               <button onClick={() => handleAction(pauseInvoice, item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-border/50">
                                  <PauseCircle className="w-4 h-4 text-amber-500" /> Pausar Cobrança
                               </button>
                            )}
                            <button onClick={() => handleAction(deleteInvoice, item.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rose-50 hover:text-rose-700 transition-colors text-rose-600">
                               <Trash2 className="w-4 h-4" /> Excluir Título
                            </button>
                         </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </CardContent>
      </Card>

      {/* Drawer Overlay for Selected Invoice */}
      {selectedInvoice && (
         <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/20 backdrop-blur-sm animate-in fade-in">
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
                    selectedInvoice.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    selectedInvoice.status === 'overdue' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    selectedInvoice.status === 'paused' ? 'bg-slate-50 text-slate-800 border-slate-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  } border`}>
                     {selectedInvoice.status === 'paid' && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                     {selectedInvoice.status === 'overdue' && <Clock className="w-6 h-6 text-rose-600 animate-pulse" />}
                     {selectedInvoice.status === 'paused' && <PauseCircle className="w-6 h-6 text-slate-600" />}
                     {selectedInvoice.status === 'pending' && <CalendarClock className="w-6 h-6 text-amber-600" />}
                     <div>
                        <h4 className="font-bold uppercase text-xs tracking-wider opacity-80">Status Atual</h4>
                        <p className="text-lg font-bold">{translateStatus(selectedInvoice.status)}</p>
                     </div>
                  </div>

                  {/* Pricing Box */}
                  <div>
                     <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Valor Principal</p>
                     <div className="text-4xl font-heading font-black text-obsidian tracking-tight">
                       {formatCurrency(selectedInvoice.amount)}
                     </div>
                     <p className="text-sm text-muted-foreground mt-1">Vencimento: <span className="font-bold text-obsidian ml-1">{formatDate(selectedInvoice.dueDate)}</span></p>
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
                           {selectedInvoice.customer?.email && (
                             <a href={`mailto:${selectedInvoice.customer?.email}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                               <Mail className="w-3.5 h-3.5" /> E-mail
                             </a>
                           )}
                           {selectedInvoice.customer?.phone && (
                             <a href={`tel:${selectedInvoice.customer?.phone}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                               <Phone className="w-3.5 h-3.5" /> Ligar
                             </a>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Drawer Footer Actions */}
               <div className="p-6 bg-white border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex flex-col gap-3">
                  {selectedInvoice.status !== 'paid' && (
                    <Button onClick={() => handleAction(markInvoiceAsPaid, selectedInvoice.id)} className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20">
                      <CheckCircle className="w-4 h-4 mr-2" /> Baixar Pagamento Manual
                    </Button>
                  )}
                  {selectedInvoice.status === 'overdue' && (
                    <Button onClick={() => {
                        const prom = new Date(); prom.setDate(prom.getDate() + 5);
                        handleAction(registerPromiseToPay, selectedInvoice.id, prom.toISOString());
                    }} variant="outline" className="w-full h-11 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                      <CalendarClock className="w-4 h-4 mr-2 text-indigo-500" /> Agendar Nova Data (+5 dias)
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full h-11 text-muted-foreground hover:text-obsidian" onClick={() => setSelectedInvoice(null)}>
                     Fechar Painel
                  </Button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}
