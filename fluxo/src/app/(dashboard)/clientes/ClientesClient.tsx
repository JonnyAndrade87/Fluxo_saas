'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Filter, Plus, Users, User, Building2, Mail, Phone, X, CreditCard, Activity, ArrowUpRight, ArrowDownRight, CircleDollarSign, Clock, FileText
} from "lucide-react";
import { getCustomersList, getCustomerDetails } from "@/actions/customers";
import { getCustomerTimeline } from "@/actions/timeline";
import type { TimelineEvent } from "@/types/timeline.types";
import CustomerFormModal from "./CustomerFormModal";
import CustomerTimeline from "./CustomerTimeline";
import ContactFormModal from "./ContactFormModal";
import { getInvoiceVisualState, calculateInvoiceFinancials } from "@/lib/invoice-utils";

export default function ClientesClient({ initialData }: { initialData: any[] }) {
  const [customers, setCustomers] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('Todos');
  
  // UI State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [drawerData, setDrawerData] = useState<any | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingContact, setEditingContact] = useState<any | null>(null);

  const fetchCustomers = useCallback(() => {
    startTransition(async () => {
       const data = await getCustomersList(search, riskFilter);
       setCustomers(data);
    });
  }, [search, riskFilter, startTransition]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
       fetchCustomers();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  const openCustomerDrawer = async (customerId: string) => {
    setIsDrawerLoading(true);
    setDrawerData(null);
    setTimelineEvents([]);
    try {
      const [fullData, events] = await Promise.all([
        getCustomerDetails(customerId),
        getCustomerTimeline(customerId),
      ]);
      setDrawerData(fullData);
      setTimelineEvents(events);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <Building2 className="w-3.5 h-3.5" />
            CRM Central
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Clientes (Sacados)</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Diretório unificado de contatos financeiros, histórico de Lifetime Value (LTV) e exposição de risco.
          </p>
        </div>
        <Button className="btn-beam shadow-lg rounded-lg overflow-hidden relative group border-none bg-fluxeer-blue text-white hover:bg-fluxeer-blue-hover px-6" onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}>
          <span className="relative z-10 flex items-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Novo Cliente
          </span>
        </Button>
      </div>

      <Card className="premium-card relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl z-20" />
        <CardHeader className="border-b border-border/50 bg-[#FAFAFB] px-6">
          <CardTitle className="text-base flex items-center gap-2 text-obsidian">
            <Users className="w-4 h-4 text-indigo-500" /> Diretório Corporativo
          </CardTitle>
          <CardDescription className="text-xs">
            Visualize a saúde financeira e contatos da sua carteira B2B. Valores refletem pagamentos reais e dívidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-xl border border-border/40 shadow-sm">
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                 type="search" 
                 placeholder="Buscar por Razão Social, CNPJ ou email..." 
                 className="pl-9 h-10 border-none shadow-none focus-visible:ring-0 bg-transparent" 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <select 
                  className="h-9 w-full sm:w-36 rounded-md border border-border bg-white text-xs font-medium px-3 text-obsidian shadow-sm focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="Todos">Todos os Riscos</option>
                  <option value="Baixo">🟢 Baixo Risco</option>
                  <option value="Médio">🟡 Médio Risco</option>
                  <option value="Alto">🟠 Alto Risco</option>
                  <option value="Crítico">🔴 Risco Crítico</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                  <Filter className="h-3 w-3" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2 h-9 w-full sm:w-auto">
                <Filter className="w-4 h-4" /> Mais Filtros
              </Button>
            </div>
          </div>
          
          <div className={`rounded-xl border border-border/60 overflow-x-auto bg-white shadow-sm transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-[#FAFAFB] text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Empresa (Sacado)</th>
                  <th className="px-6 py-4">Contato Primário</th>
                  <th className="px-6 py-4 text-right">LTV Histórico <span className="text-[10px] lowercase block font-normal">(total pago)</span></th>
                  <th className="px-6 py-4 text-center">Score de Risco <span className="text-[10px] lowercase block font-normal">(0-100)</span></th>
                  <th className="px-6 py-4 text-right">Exposição <span className="text-[10px] lowercase block font-normal text-rose-500">(atrasado)</span></th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-obsidian">
                {customers.map((customer) => (
                  <tr 
                     key={customer.id} 
                     className="hover:bg-indigo-50/20 transition-colors group cursor-pointer"
                     onClick={() => openCustomerDrawer(customer.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-obsidian group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {customer.name}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" /> {customer.documentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-obsidian text-[13px] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" /> {customer.contactName}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          {customer.contactEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.contactEmail}</span>}
                          {customer.contactPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.contactPhone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-obsidian tracking-tight flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        {formatCurrency(customer.metrics.totalLtv)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">{customer.metrics.totalInvoices} emissões fluxadas</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-2xl font-black tracking-tight" style={{
                          color: customer.riskScore <= 25 ? '#10b981' : 
                                 customer.riskScore <= 50 ? '#f59e0b' : 
                                 customer.riskScore <= 75 ? '#f97316' : 
                                 '#ef4444'
                        }}>
                          {customer.riskScore}
                        </div>
                        <Badge 
                          variant={
                            customer.riskLevel === 'Baixo' ? 'success' :
                            customer.riskLevel === 'Médio' ? 'warning' :
                            customer.riskLevel === 'Alto' ? 'destructive' :
                            'destructive'
                          }
                          className="px-2 py-0.5 text-[10px] whitespace-nowrap"
                        >
                          {customer.riskLevel}
                        </Badge>
                        {customer.riskJustification && (
                          <p className="text-[9px] text-muted-foreground max-w-[140px] truncate mx-auto mt-1" title={customer.riskJustification}>
                            {customer.riskJustification}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {customer.metrics.totalRisk > 0 ? (
                         <div className="font-bold text-rose-600 tracking-tight flex items-center justify-end gap-1 px-2 py-0.5 rounded-md bg-rose-50 w-fit ml-auto">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {formatCurrency(customer.metrics.totalRisk)}
                         </div>
                       ) : (
                         <div className="font-mono text-emerald-600 tracking-tight flex items-center justify-end gap-1 px-2 py-0.5 rounded-md bg-emerald-50 w-fit ml-auto text-xs">
                            <Activity className="w-3 h-3" />
                            Limpo
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={customer.status === "active" ? "success" : "secondary"} className="px-2.5 py-1 whitespace-nowrap shadow-sm">
                        {customer.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>Nenhum cliente cadastrado ou localizado pelos filtros.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Drawer (Slide-Over Vertical) */}
      {(drawerData || isDrawerLoading) && (
         <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/20 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-border animate-in slide-in-from-right-full duration-300 flex flex-col relative overflow-hidden">
               
               {isDrawerLoading && !drawerData && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
                     <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                     <p className="text-sm font-semibold text-indigo-700 animate-pulse">Carregando Dossiê Financeiro...</p>
                  </div>
               )}

               {drawerData && (
                 <>
                   {/* Header C-Level */}
                   <div className="bg-[#050B14] text-white p-6 relative overflow-hidden shrink-0">
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-600/20 to-transparent"></div>
                      <Button variant="ghost" size="icon" onClick={() => { setDrawerData(null); setIsDrawerLoading(false); }} className="absolute top-4 right-4 rounded-full hover:bg-white/10 text-white/70 hover:text-white z-10 transition-colors">
                         <X className="w-5 h-5" />
                      </Button>
                      
                      <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/10 mb-3 backdrop-blur-md uppercase tracking-widest text-[10px]">CRM B2B</Badge>
                      <h3 className="text-2xl font-heading font-extrabold tracking-tight relative z-10">{drawerData.name}</h3>
                      <p className="text-sm text-indigo-200 font-mono mt-1 flex items-center gap-2 relative z-10">
                        <Building2 className="w-4 h-4" /> CNPJ/CPF: {drawerData.documentNumber}
                      </p>
                   </div>

                   {/* Scrollable Content */}
                   <div className="flex-1 overflow-y-auto bg-slate-50">
                      <div className="p-6 space-y-6">
                        
                        {/* Status Financeiro Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                           <div className="bg-white border border-border/60 rounded-xl p-3 shadow-sm text-center">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">A Receber</p>
                              <p className="text-sm font-bold text-obsidian">
                                 {formatCurrency(drawerData.invoices.filter((i:any) => i.status === 'OPEN' || i.status === 'PROMISE_TO_PAY').reduce((acc: number, item: any) => acc + calculateInvoiceFinancials(item).updatedAmount, 0))}
                              </p>
                           </div>
                           <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 shadow-sm text-center">
                              <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> Em Atraso
                              </p>
                              <p className="text-sm font-bold text-rose-700">
                                 {formatCurrency(drawerData.invoices.filter((i:any) => {
                                    const vState = getInvoiceVisualState(i);
                                    return vState === 'Vencida' || vState === 'Vence hoje' || vState.includes('Promessa vencida');
                                 }).reduce((acc: number, item: any) => acc + calculateInvoiceFinancials(item).updatedAmount, 0))}
                              </p>
                           </div>
                           <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm text-center">
                              <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> Recebido (LTV)
                              </p>
                              <p className="text-sm font-bold text-emerald-700">
                                 {formatCurrency(drawerData.invoices.filter((i:any) => i.status === 'PAID').reduce((acc: number, item: any) => acc + (item.paidAmount || item.amount), 0))}
                              </p>
                           </div>
                        </div>

                        {/* Score de Risco */}
                        <div className={`rounded-2xl border shadow-sm p-5 space-y-3 ${
                          drawerData.riskLevel === 'Baixo' ? 'bg-emerald-50 border-emerald-200' :
                          drawerData.riskLevel === 'Médio' ? 'bg-amber-50 border-amber-200' :
                          drawerData.riskLevel === 'Alto' ? 'bg-orange-50 border-orange-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2" style={{
                                color: drawerData.riskLevel === 'Baixo' ? '#059669' :
                                       drawerData.riskLevel === 'Médio' ? '#d97706' :
                                       drawerData.riskLevel === 'Alto' ? '#ea580c' :
                                       '#dc2626'
                              }}>
                                📊 Score de Risco
                              </h4>
                              <p className="text-[13px] leading-relaxed" style={{
                                color: drawerData.riskLevel === 'Baixo' ? '#047857' :
                                       drawerData.riskLevel === 'Médio' ? '#92400e' :
                                       drawerData.riskLevel === 'Alto' ? '#92400e' :
                                       '#7f1d1d'
                              }}>
                                {drawerData.riskJustification || 'Calculando score...'}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-center gap-2 ml-4">
                              <div className="text-4xl font-black tracking-tight" style={{
                                color: drawerData.riskLevel === 'Baixo' ? '#059669' :
                                       drawerData.riskLevel === 'Médio' ? '#d97706' :
                                       drawerData.riskLevel === 'Alto' ? '#ea580c' :
                                       '#dc2626'
                              }}>
                                {drawerData.riskScore ?? 0}
                              </div>
                              <Badge className={`text-[11px] uppercase font-bold tracking-wider ${
                                drawerData.riskLevel === 'Baixo' ? 'bg-emerald-200 text-emerald-900 border-emerald-300' :
                                drawerData.riskLevel === 'Médio' ? 'bg-amber-200 text-amber-900 border-amber-300' :
                                drawerData.riskLevel === 'Alto' ? 'bg-orange-200 text-orange-900 border-orange-300' :
                                'bg-red-200 text-red-900 border-red-300'
                              } border`}>
                                {drawerData.riskLevel}
                              </Badge>
                            </div>
                          </div>
                          {drawerData.riskRecommendation && (
                            <div className="pt-2 border-t" style={{
                              borderColor: drawerData.riskLevel === 'Baixo' ? '#d1fae5' :
                                          drawerData.riskLevel === 'Médio' ? '#fed7aa' :
                                          drawerData.riskLevel === 'Alto' ? '#fed7aa' :
                                          '#fee2e2'
                            }}>
                              <p className="text-[12px] font-semibold" style={{
                                color: drawerData.riskLevel === 'Baixo' ? '#047857' :
                                       drawerData.riskLevel === 'Médio' ? '#92400e' :
                                       drawerData.riskLevel === 'Alto' ? '#92400e' :
                                       '#7f1d1d'
                              }}>
                                💡 {drawerData.riskRecommendation}
                              </p>
                            </div>
                          )}
                          {/* Risk Component Breakdown */}
                          {drawerData.riskMetadata && (
                            <div className="pt-3 border-t" style={{
                              borderColor: drawerData.riskLevel === 'Baixo' ? '#d1fae5' :
                                          drawerData.riskLevel === 'Médio' ? '#fed7aa' :
                                          drawerData.riskLevel === 'Alto' ? '#fed7aa' :
                                          '#fee2e2'
                            }}>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 opacity-60">Fatores de Composição</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Nº de Atrasos', value: `${drawerData.riskMetadata.delayCount} ocorrências` },
                                  { label: 'Atraso Máximo', value: `${drawerData.riskMetadata.maxDelayDays} dias` },
                                  { label: 'Atraso Médio', value: `${drawerData.riskMetadata.avgDelayDays} dias` },
                                  { label: 'Valor em Aberto', value: formatCurrency(drawerData.riskMetadata.openAmount) },
                                  { label: 'Promessas Quebradas', value: `${drawerData.riskMetadata.promisesBrokenCount}` },
                                ].map(item => (
                                  <div key={item.label} className="flex justify-between items-center text-[11px]">
                                    <span className="opacity-70">{item.label}</span>
                                    <span className="font-bold">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contatos Rápidos Box */}
                        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4 space-y-3">
                           <div className="flex items-center justify-between border-b border-border/50 pb-2">
                             <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                               <Phone className="w-3.5 h-3.5 text-indigo-500" /> Contatos Adicionados
                             </h4>
                             <Button variant="ghost" size="sm" onClick={() => { setEditingContact(null); setIsContactModalOpen(true); }} className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 bg-indigo-50 shrink-0 px-2 py-0">
                               <Plus className="w-3 h-3 mr-1" /> Novo
                             </Button>
                           </div>
                           
                           {drawerData.financialContacts.length > 0 ? (
                              <div className="divide-y divide-border/40">
                                 {drawerData.financialContacts.map((contact: any) => (
                                    <div key={contact.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                                       <div>
                                         <p className="font-medium text-sm text-obsidian">{contact.name} {contact.isPrimary && <span className="text-[10px] ml-2 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>}</p>
                                         <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                           {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 hover:underline">{contact.email}</a>}
                                           {contact.phone && <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 hover:underline">{contact.phone}</a>}
                                         </div>
                                       </div>
                                       <Button variant="outline" size="icon" onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }} className="h-7 w-7 border-indigo-100 text-indigo-600 hover:bg-indigo-50 shrink-0">
                                          <ArrowUpRight className="w-3 h-3" />
                                       </Button>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                             <p className="text-sm text-muted-foreground italic">Nenhum contato anexado à esta empresa.</p>
                           )}
                        </div>

                        {/* Histórico Timeline */}
                        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                             <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" /> 15 Faturas Mais Recentes
                           </h4>
                           
                           {drawerData.invoices.length > 0 ? (
                             <div className="space-y-4">
                                {drawerData.invoices.map((inv: any) => (
                                   <div key={inv.id} className="flex items-center justify-between group">
                                      <div className="flex items-start gap-3">
                                         <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                           inv.status === 'paid' ? 'bg-emerald-500' : inv.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-400'
                                         }`} />
                                         <div>
                                            <p className="text-sm font-semibold text-obsidian font-mono">#{inv.invoiceNumber || inv.id.split('-')[0].toUpperCase()}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Vec: {formatDate(inv.dueDate)}</p>
                                         </div>
                                      </div>
                                      <div className="text-right">
                                         <p className="font-bold text-[13px] text-obsidian tracking-tight">{formatCurrency(inv.amount)}</p>
                                         <p className={`text-[10px] uppercase font-bold tracking-wider ${
                                           inv.status === 'paid' ? 'text-emerald-600' : inv.status === 'overdue' ? 'text-rose-600 animate-pulse' : 'text-amber-600'
                                         }`}>{
                                           inv.status === 'paid' ? 'Líquido' : inv.status === 'overdue' ? 'Atrasado' : 'Pendente'
                                         }</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                           ) : (
                             <div className="text-center py-6 text-sm text-muted-foreground">
                                <FileText className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                Nenhuma fatura vinculada.
                              </div>
                           )}
                        </div>

                        {/* Timeline de Cobrança */}
                        <CustomerTimeline 
                           customerId={drawerData.id}
                           timelineEvents={timelineEvents}
                           onNoteAdded={() => openCustomerDrawer(drawerData.id)}
                        />

                      </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="p-4 bg-white border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0 flex gap-3">
                      <Button onClick={() => window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { customerId: drawerData.id } }))} className="flex-1 font-semibold text-[13px] bg-fluxeer-blue hover:bg-fluxeer-blue-hover border border-transparent text-white transition-colors h-10 shadow-lg">
                        <Plus className="w-4 h-4 mr-1.5" /> Nova Fatura Manual
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingCustomer(drawerData); setIsCustomerModalOpen(true); }} className="flex-1 font-semibold text-[13px] h-10 border-border text-obsidian hover:bg-slate-50">
                        Editar Cliente
                      </Button>
                   </div>
                 </>
               )}
            </div>
         </div>
      )}

      {/* Form Modal */}
      {isCustomerModalOpen && (
         <CustomerFormModal 
            initialData={editingCustomer} 
            onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} 
            onSuccess={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); fetchCustomers(); }}
         />
      )}

      {/* Contact Modal */}
      {isContactModalOpen && drawerData && (
         <ContactFormModal 
            customerId={drawerData.id}
            initialData={editingContact} 
            onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }} 
            onSuccess={() => { setIsContactModalOpen(false); setEditingContact(null); openCustomerDrawer(drawerData.id); }}
         />
      )}

    </div>
  )
}
