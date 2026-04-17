'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Users, User, Building2, Mail, Phone, X,
  CreditCard, Activity, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, Clock, FileText, AlertTriangle, ChevronRight
} from "lucide-react";
import { getCustomersList, getCustomerDetails } from "@/actions/customers";
import { getCustomerTimeline } from "@/actions/timeline";
import type { TimelineEvent } from "@/types/timeline.types";
import CustomerFormModal from "./CustomerFormModal";
import CustomerTimeline from "./CustomerTimeline";
import ContactFormModal from "./ContactFormModal";
import { getInvoiceVisualState, calculateInvoiceFinancials } from "@/lib/invoice-utils";

// ─── Risk helpers ─────────────────────────────────────────────────────────────

function riskBadgeCls(level: string) {
  if (level === 'Baixo')   return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (level === 'Médio')   return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (level === 'Alto')    return 'bg-orange-50 text-orange-700 border border-orange-200';
  return 'bg-rose-50 text-rose-700 border border-rose-200';
}

function riskScoreColor(score: number) {
  if (score <= 25) return 'text-emerald-600';
  if (score <= 50) return 'text-amber-600';
  if (score <= 75) return 'text-orange-600';
  return 'text-rose-600';
}

function riskDrawerCls(level: string) {
  if (level === 'Baixo') return 'bg-emerald-50 border-emerald-200 text-emerald-900';
  if (level === 'Médio') return 'bg-amber-50 border-amber-200 text-amber-900';
  if (level === 'Alto')  return 'bg-orange-50 border-orange-200 text-orange-900';
  return 'bg-rose-50 border-rose-200 text-rose-900';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClientesClient({ initialData }: { initialData: any[] }) {
  const [customers, setCustomers] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch]           = useState('');
  const [riskFilter, setRiskFilter]   = useState('Todos');

  const [drawerData, setDrawerData]         = useState<any | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer]         = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen]   = useState(false);
  const [editingContact, setEditingContact]           = useState<any | null>(null);

  const fetchCustomers = useCallback(() => {
    startTransition(async () => {
      const data = await getCustomersList(search, riskFilter);
      setCustomers(data);
    });
  }, [search, riskFilter, startTransition]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 400);
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 w-full max-w-full min-w-0">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Carteira B2B — risco, exposição financeira e contatos por sacado.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm"
          onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Cliente
        </Button>
      </div>

      {/* Filters + Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="search"
              placeholder="Razão Social, CNPJ ou e-mail..."
              className="pl-9 h-9 text-sm border-slate-200 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
          >
            <option value="Todos">Risco: Todos</option>
            <option value="Baixo">Baixo</option>
            <option value="Médio">Médio</option>
            <option value="Alto">Alto</option>
            <option value="Crítico">Crítico</option>
          </select>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto transition-opacity duration-300 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3 hidden md:table-cell">Contato</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">LTV</th>
                <th className="px-5 py-3 text-center">Risco</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">Exposição</th>
                <th className="px-5 py-3 text-center hidden lg:table-cell">Status</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">

              {/* Empty state */}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste os filtros ou cadastre o primeiro cliente.
                    </p>
                  </td>
                </tr>
              )}

              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-indigo-50/20 transition-colors cursor-pointer group"
                  onClick={() => openCustomerDrawer(customer.id)}
                >
                  {/* Empresa */}
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors leading-tight">
                      {customer.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                      <CreditCard className="w-2.5 h-2.5 shrink-0" />
                      {customer.documentNumber}
                    </p>
                  </td>

                  {/* Contato — hidden on mobile */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-slate-700 text-xs font-medium flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      {customer.contactName || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      {customer.contactEmail && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <Mail className="w-2.5 h-2.5 shrink-0" />
                          {customer.contactEmail}
                        </span>
                      )}
                      {customer.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          {customer.contactPhone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* LTV — hidden on mobile */}
                  <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                    <p className="font-bold text-slate-800 text-sm tabular-nums">
                      {formatCurrency(customer.metrics.totalLtv)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                      {customer.metrics.totalInvoices} faturas
                    </p>
                  </td>

                  {/* Risco — badge compacto, score inline */}
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskBadgeCls(customer.riskLevel)}`}>
                        {customer.riskLevel}
                      </span>
                      <span className={`text-[11px] font-black tabular-nums ${riskScoreColor(customer.riskScore)}`}>
                        {customer.riskScore}
                      </span>
                    </div>
                  </td>

                  {/* Exposição (atrasado) — hidden on mobile */}
                  <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                    {customer.metrics.totalRisk > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                        <ArrowDownRight className="w-3 h-3 shrink-0" />
                        {formatCurrency(customer.metrics.totalRisk)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        <Activity className="w-2.5 h-2.5" />
                        Limpo
                      </span>
                    )}
                  </td>

                  {/* Status — hidden on smaller */}
                  <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                    <Badge
                      variant={customer.status === 'active' ? 'success' : 'secondary'}
                      className="px-2 py-0.5 text-[10px] whitespace-nowrap"
                    >
                      {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>

                  {/* CTA chevron */}
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DRAWER ── */}
      {(drawerData || isDrawerLoading) && (
        <div className="fixed inset-0 z-50 flex items-end sm:justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full sm:max-w-lg bg-white h-[92vh] sm:h-full rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:slide-in-from-right-full duration-300 flex flex-col relative overflow-hidden">

            {isDrawerLoading && !drawerData && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-3">
                <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-semibold text-indigo-700">Carregando dossiê...</p>
              </div>
            )}

            {drawerData && (
              <>
                {/* Drawer Header — clean, sem dark background */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-white shrink-0">
                  {/* Mobile pull indicator */}
                  <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full" />
                  <div className="flex items-start gap-3 mt-2 sm:mt-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{drawerData.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{drawerData.documentNumber}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskBadgeCls(drawerData.riskLevel)}`}>
                          Risco {drawerData.riskLevel}
                        </span>
                        <Badge variant={drawerData.status === 'active' ? 'success' : 'secondary'} className="text-[10px] px-2 py-0.5">
                          {drawerData.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => { setDrawerData(null); setIsDrawerLoading(false); }}
                    className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                  <div className="p-5 space-y-5">

                    {/* KPI strip */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">A Receber</p>
                        <p className="text-sm font-bold text-slate-800">
                          {formatCurrency(
                            drawerData.invoices
                              .filter((i: any) => i.status === 'OPEN' || i.status === 'PROMISE_TO_PAY')
                              .reduce((acc: number, item: any) => acc + calculateInvoiceFinancials(item).updatedAmount, 0)
                          )}
                        </p>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                          <ArrowDownRight className="w-2.5 h-2.5" /> Em Atraso
                        </p>
                        <p className="text-sm font-bold text-rose-700">
                          {formatCurrency(
                            drawerData.invoices
                              .filter((i: any) => {
                                const vState = getInvoiceVisualState(i);
                                return vState === 'Vencida' || vState === 'Vence hoje' || vState.includes('Promessa vencida');
                              })
                              .reduce((acc: number, item: any) => acc + calculateInvoiceFinancials(item).updatedAmount, 0)
                          )}
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1">
                          <ArrowUpRight className="w-2.5 h-2.5" /> LTV
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          {formatCurrency(
                            drawerData.invoices
                              .filter((i: any) => i.status === 'PAID')
                              .reduce((acc: number, item: any) => acc + (item.paidAmount || item.amount), 0)
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Score de risco */}
                    <div className={`rounded-2xl border p-4 space-y-3 ${riskDrawerCls(drawerData.riskLevel)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5">Score de Risco</p>
                          <p className="text-[13px] leading-relaxed font-medium">
                            {drawerData.riskJustification || 'Calculando score...'}
                          </p>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                          <span className={`text-4xl font-black tabular-nums ${riskScoreColor(drawerData.riskScore ?? 0)}`}>
                            {drawerData.riskScore ?? 0}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${riskBadgeCls(drawerData.riskLevel)}`}>
                            {drawerData.riskLevel}
                          </span>
                        </div>
                      </div>
                      {drawerData.riskRecommendation && (
                        <p className="text-xs font-semibold border-t pt-2.5 border-current/20 opacity-80">
                          💡 {drawerData.riskRecommendation}
                        </p>
                      )}
                      {drawerData.riskMetadata && (
                        <div className="border-t pt-2.5 border-current/20 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Fatores</p>
                          {[
                            { label: 'Atrasos', value: `${drawerData.riskMetadata.delayCount}×` },
                            { label: 'Atraso máx.', value: `${drawerData.riskMetadata.maxDelayDays}d` },
                            { label: 'Atraso médio', value: `${drawerData.riskMetadata.avgDelayDays}d` },
                            { label: 'Valor aberto', value: formatCurrency(drawerData.riskMetadata.openAmount) },
                            { label: 'Promessas quebradas', value: `${drawerData.riskMetadata.promisesBrokenCount}` },
                          ].map(item => (
                            <div key={item.label} className="flex justify-between items-center text-[11px]">
                              <span className="opacity-70">{item.label}</span>
                              <span className="font-bold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contatos */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-indigo-500" /> Contatos
                        </h4>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { setEditingContact(null); setIsContactModalOpen(true); }}
                          className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-50 px-2 py-0"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Novo
                        </Button>
                      </div>
                      {drawerData.financialContacts.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {drawerData.financialContacts.map((contact: any) => (
                            <div key={contact.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                                  {contact.name}
                                  {contact.isPrimary && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase tracking-wide font-bold">
                                      Principal
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                  {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 hover:underline truncate max-w-[160px]">{contact.email}</a>}
                                  {contact.phone && <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 hover:underline">{contact.phone}</a>}
                                </div>
                              </div>
                              <Button
                                variant="outline" size="icon"
                                onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }}
                                className="h-7 w-7 border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 shrink-0"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Nenhum contato vinculado.</p>
                      )}
                    </div>

                    {/* Faturas recentes */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100">
                        <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Faturas Recentes
                      </h4>
                      {drawerData.invoices.length > 0 ? (
                        <div className="space-y-3">
                          {drawerData.invoices.map((inv: any) => {
                            const vState = getInvoiceVisualState(inv);
                            const isOverdue = vState.includes('Vencida') || vState.includes('Vence hoje');
                            return (
                              <div key={inv.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
                                    inv.status === 'PAID' ? 'bg-emerald-500' :
                                    isOverdue ? 'bg-rose-500' : 'bg-amber-400'
                                  }`} />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 font-mono">
                                      #{inv.invoiceNumber || inv.id.split('-')[0].toUpperCase()}
                                    </p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> {formatDate(inv.dueDate)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-bold tabular-nums ${
                                    inv.status === 'PAID' ? 'text-emerald-600' :
                                    isOverdue ? 'text-rose-600' : 'text-slate-800'
                                  }`}>
                                    {formatCurrency(inv.amount)}
                                  </p>
                                  <p className={`text-[9px] uppercase font-bold tracking-wide ${
                                    inv.status === 'PAID' ? 'text-emerald-500' :
                                    isOverdue ? 'text-rose-500' : 'text-amber-500'
                                  }`}>
                                    {inv.status === 'PAID' ? 'Pago' : isOverdue ? 'Atrasado' : 'A vencer'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-400 font-medium">Nenhuma fatura vinculada.</p>
                        </div>
                      )}
                    </div>

                    {/* Timeline de cobrança */}
                    <CustomerTimeline
                      customerId={drawerData.id}
                      timelineEvents={timelineEvents}
                      onNoteAdded={() => openCustomerDrawer(drawerData.id)}
                    />

                  </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex gap-3">
                  <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-new-invoice-modal', { detail: { customerId: drawerData.id } }))}
                    className="flex-1 font-semibold text-[13px] bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-md rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Nova Fatura
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setEditingCustomer(drawerData); setIsCustomerModalOpen(true); }}
                    className="flex-1 font-semibold text-[13px] h-10 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    Editar Cliente
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isCustomerModalOpen && (
        <CustomerFormModal
          initialData={editingCustomer}
          onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
          onSuccess={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); fetchCustomers(); }}
        />
      )}

      {isContactModalOpen && drawerData && (
        <ContactFormModal
          customerId={drawerData.id}
          initialData={editingContact}
          onClose={() => { setIsContactModalOpen(false); setEditingContact(null); }}
          onSuccess={() => { setIsContactModalOpen(false); setEditingContact(null); openCustomerDrawer(drawerData.id); }}
        />
      )}
    </div>
  );
}
