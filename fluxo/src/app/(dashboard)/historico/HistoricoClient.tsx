'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getCollectionCustomers, getCollectionDetail, CollectionCustomerSummary, CollectionDetail, TimelineEvent } from '@/actions/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, MessageSquare, Mail, FileText, AlertTriangle, CheckCircle,
  Clock, User, Phone, StickyNote, Handshake, Loader2, Inbox,
  ChevronRight, Filter, Building2, Calendar, Tag, X
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: Date | string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeAgo = (d: Date | string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:      { label: 'Ativo',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:    { label: 'Inativo',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  blocklisted: { label: 'Bloqueado',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  pending:        { label: 'Pendente',    cls: 'bg-amber-50 text-amber-700' },
  overdue:        { label: 'Atrasada',    cls: 'bg-rose-50 text-rose-700' },
  paid:           { label: 'Paga',        cls: 'bg-emerald-50 text-emerald-700' },
  canceled:       { label: 'Cancelada',   cls: 'bg-slate-100 text-slate-500' },
  in_negotiation: { label: 'Negociando',  cls: 'bg-indigo-50 text-indigo-700' },
  draft:          { label: 'Rascunho',    cls: 'bg-slate-100 text-slate-500' },
};

const CHANNEL_ICON = (channel?: string) => {
  if (channel === 'whatsapp') return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
  if (channel === 'email')    return <Mail className="w-3.5 h-3.5 text-slate-400" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400" />;
};

// ─── Timeline Card Components ────────────────────────────────────────────────

function TimelineItem({ event }: { event: TimelineEvent }) {
  if (event.type === 'communication') {
    const isFailed = event.status === 'failed';
    return (
      <div className="flex gap-3 group">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            event.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {CHANNEL_ICON(event.channel)}
          </div>
          <div className="w-px flex-1 bg-border/60 mt-1" />
        </div>
        <div className="pb-5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-obsidian uppercase tracking-wide">
                {event.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'} Enviado
              </span>
              {isFailed && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-3 h-3" /> Falha
                </span>
              )}
              {!isFailed && event.status === 'delivered' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-3 h-3" /> Entregue
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{fmtDateTime(event.createdAt)}</span>
          </div>
          {event.invoiceNumber && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Fatura <span className="font-semibold">#{event.invoiceNumber}</span>
              {event.invoiceAmount ? ` • ${fmt.format(event.invoiceAmount)}` : ''}
            </p>
          )}
          <div className={`p-3 rounded-xl text-[12.5px] leading-relaxed max-w-md font-medium border ${
            event.channel === 'whatsapp'
              ? 'bg-[#E7FFDB] text-[#202C33] border-emerald-100/50 rounded-tl-none'
              : 'bg-slate-50 text-slate-700 border-slate-100'
          }`}>
            <p className="line-clamp-3">{event.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'note') {
    return (
      <div className="flex gap-3 group">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
            <StickyNote className="w-3.5 h-3.5" />
          </div>
          <div className="w-px flex-1 bg-border/60 mt-1" />
        </div>
        <div className="pb-5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wide">Nota Interna</span>
            <span className="text-[11px] text-muted-foreground shrink-0">{fmtDateTime(event.createdAt)}</span>
          </div>
          {event.authorName && (
            <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> {event.authorName}
            </p>
          )}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl text-[12.5px] text-indigo-900 leading-relaxed font-medium max-w-md">
            {event.content}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'promise') {
    const isOk = event.promiseStatus === 'fulfilled';
    const isBroken = event.promiseStatus === 'broken';
    return (
      <div className="flex gap-3 group">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isOk ? 'bg-emerald-50 text-emerald-600' :
            isBroken ? 'bg-rose-50 text-rose-600' :
            'bg-amber-50 text-amber-600'
          }`}>
            <Handshake className="w-3.5 h-3.5" />
          </div>
          <div className="w-px flex-1 bg-border/60 mt-1" />
        </div>
        <div className="pb-5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">Promessa de Pagamento</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isOk ? 'bg-emerald-50 text-emerald-700' :
                isBroken ? 'bg-rose-50 text-rose-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {isOk ? 'Cumprida' : isBroken ? 'Quebrada' : 'Pendente'}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{fmtDateTime(event.createdAt)}</span>
          </div>
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-[12.5px] text-amber-900 font-medium max-w-md space-y-1">
            <p>Fatura <span className="font-bold">#{event.invoiceNumber}</span> • Valor: <span className="font-bold">{fmt.format(event.promiseAmount ?? 0)}</span></p>
            <p className="flex items-center gap-1 text-[11px]"><Calendar className="w-3 h-3" /> Prometeu pagar em <span className="font-bold">{fmtDate(event.promisedDate!)}</span></p>
            {event.promiseNotes && <p className="text-[11px] text-amber-700 italic">"{event.promiseNotes}"</p>}
            {event.authorName && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Registrado por {event.authorName}</p>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Left Panel Item ──────────────────────────────────────────────────────────

function CustomerListItem({ customer, isSelected, onClick }: {
  customer: CollectionCustomerSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasOverdue = customer.overdueInvoices > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-border/40 transition-all duration-150 ${
        isSelected
          ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
          : 'hover:bg-slate-50/80 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] font-bold leading-tight truncate ${isSelected ? 'text-indigo-700' : 'text-obsidian'}`}>
            {customer.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{customer.documentNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {customer.lastEventAt && (
            <span className="text-[10px] text-muted-foreground">{timeAgo(customer.lastEventAt)}</span>
          )}
          {hasOverdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">
              <AlertTriangle className="w-2.5 h-2.5" /> {customer.overdueInvoices} atrasada{customer.overdueInvoices > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {customer.totalOverdue > 0 && (
        <p className="text-[11px] text-rose-600 font-bold mt-1.5">{fmt.format(customer.totalOverdue)} em atraso</p>
      )}
      {customer.openInvoices > 0 && customer.totalOverdue === 0 && (
        <p className="text-[11px] text-amber-600 font-semibold mt-1.5">{customer.openInvoices} fatura{customer.openInvoices > 1 ? 's' : ''} em aberto</p>
      )}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon }: { message: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-obsidian">{message}</p>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
        Selecione um cliente no painel esquerdo para visualizar o histórico completo.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HistoricoClient() {
  const [customers, setCustomers] = useState<CollectionCustomerSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [loadingList, startListTransition] = useTransition();
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'invoices'>('timeline');

  const loadCustomers = useCallback(() => {
    startListTransition(async () => {
      const data = await getCollectionCustomers({ search, status: statusFilter });
      setCustomers(data);
    });
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const selectCustomer = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const d = await getCollectionDetail(id);
      setDetail(d);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredTimeline = detail?.timeline.filter(e => {
    if (eventTypeFilter === 'all') return true;
    return e.type === eventTypeFilter;
  }) ?? [];

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] animate-in fade-in duration-300">

      {/* ── LEFT PANEL ── */}
      <div className="w-[320px] shrink-0 border-r border-border/50 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold font-heading text-obsidian">Clientes</h2>
            {loadingList && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8 h-9 text-sm bg-slate-50 border-border/60"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-obsidian" />
              </button>
            )}
          </div>
          {/* Status filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {[
              { v: 'all', l: 'Todos' },
              { v: 'active', l: 'Ativos' },
              { v: 'inactive', l: 'Inativos' },
              { v: 'blocklisted', l: 'Bloqueados' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => setStatusFilter(opt.v)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                  statusFilter === opt.v
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {!loadingList && customers.length === 0 && (
            <EmptyState message="Nenhum cliente encontrado" icon={Building2} />
          )}
          {customers.map(c => (
            <CustomerListItem
              key={c.id}
              customer={c}
              isSelected={selectedId === c.id}
              onClick={() => selectCustomer(c.id)}
            />
          ))}
        </div>

        {/* Footer count */}
        {customers.length > 0 && (
          <div className="p-3 border-t border-border/30 bg-slate-50/50">
            <p className="text-[11px] text-muted-foreground text-center">{customers.length} cliente{customers.length > 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-[#FAFAFB] overflow-hidden">

        {/* Loading detail */}
        {loadingDetail && (
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-muted-foreground font-medium">Carregando histórico...</p>
            </div>
          </div>
        )}

        {/* No selection */}
        {!selectedId && !loadingDetail && (
          <EmptyState message="Selecione um cliente" icon={Inbox} />
        )}

        {/* Detail content */}
        {detail && !loadingDetail && (
          <div className="flex flex-col h-full overflow-hidden">

            {/* Right header: customer info */}
            <div className="p-5 border-b border-border/50 bg-white flex items-start gap-5">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[17px] font-extrabold font-heading text-obsidian">{detail.customer.name}</h2>
                  {STATUS_LABELS[detail.customer.status] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_LABELS[detail.customer.status].cls}`}>
                      {STATUS_LABELS[detail.customer.status].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{detail.customer.documentNumber}</p>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  {detail.customer.email && (
                    <a href={`mailto:${detail.customer.email}`} className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-medium">
                      <Mail className="w-3 h-3" /> {detail.customer.email}
                    </a>
                  )}
                  {detail.customer.phone && (
                    <a href={`tel:${detail.customer.phone}`} className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-medium">
                      <Phone className="w-3 h-3" /> {detail.customer.phone}
                    </a>
                  )}
                  {detail.customer.assignee && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3" /> {detail.customer.assignee.fullName}
                    </span>
                  )}
                  {detail.customer.tags && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Tag className="w-3 h-3" /> {detail.customer.tags}
                    </span>
                  )}
                </div>
              </div>
              {/* Quick stats */}
              <div className="flex gap-3 shrink-0">
                <div className="text-center">
                  <p className="text-[18px] font-extrabold text-rose-600">
                    {detail.invoices.filter(i => i.status === 'overdue').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atrasadas</p>
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-extrabold text-amber-600">
                    {detail.invoices.filter(i => i.status === 'pending').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendentes</p>
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-extrabold text-emerald-600">
                    {detail.invoices.filter(i => i.status === 'paid').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pagas</p>
                </div>
              </div>
            </div>

            {/* Tabs + Filter row */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/40 bg-white">
              <div className="flex items-center gap-0.5">
                {[
                  { v: 'timeline', l: 'Timeline' },
                  { v: 'invoices', l: 'Faturas' },
                ].map(tab => (
                  <button
                    key={tab.v}
                    onClick={() => setActiveTab(tab.v as any)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
                      activeTab === tab.v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tab.l}
                  </button>
                ))}
              </div>
              {activeTab === 'timeline' && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={eventTypeFilter}
                    onChange={e => setEventTypeFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-600 bg-transparent border-0 focus:ring-0 pr-1 cursor-pointer"
                  >
                    <option value="all">Todos os eventos</option>
                    <option value="communication">Mensagens enviadas</option>
                    <option value="note">Notas internas</option>
                    <option value="promise">Promessas</option>
                  </select>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* TIMELINE */}
              {activeTab === 'timeline' && (
                <>
                  {filteredTimeline.length === 0 && (
                    <EmptyState message="Nenhum evento registrado" icon={Clock} />
                  )}
                  <div className="max-w-2xl">
                    {filteredTimeline.map(event => (
                      <TimelineItem key={event.id} event={event} />
                    ))}
                  </div>
                </>
              )}

              {/* INVOICES */}
              {activeTab === 'invoices' && (
                <>
                  {detail.invoices.length === 0 && (
                    <EmptyState message="Nenhuma fatura encontrada" icon={FileText} />
                  )}
                  <div className="space-y-2.5 max-w-2xl">
                    {detail.invoices.map(inv => {
                      const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-500' };
                      return (
                        <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-border/60 shadow-sm hover:border-indigo-200 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-obsidian text-[14px]">#{inv.invoiceNumber}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Vence em {fmtDate(inv.dueDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[16px] font-extrabold text-obsidian">{fmt.format(inv.amount)}</p>
                            {inv.balanceDue < inv.amount && (
                              <p className="text-[11px] text-emerald-600 font-semibold">Saldo: {fmt.format(inv.balanceDue)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
