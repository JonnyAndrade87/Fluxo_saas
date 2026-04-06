'use client';

import { useState, useTransition } from 'react';
import { requeueDead, getQueueStats } from '@/actions/queue';
import type { QueueStats, DlqItem } from '@/actions/queue';
import {
  Clock, Send, CheckCircle2, XCircle, AlertTriangle, Inbox,
  RefreshCw, RotateCcw, Mail, MessageSquare, Loader2
} from 'lucide-react';

interface Props {
  initialStats: QueueStats;
  initialDlqItems: DlqItem[];
}

const CHANNEL_ICON = {
  email: <Mail className="w-3.5 h-3.5" />,
  whatsapp: <MessageSquare className="w-3.5 h-3.5" />,
};

export default function QueueClient({ initialStats, initialDlqItems }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [dlqItems, setDlqItems] = useState(initialDlqItems);
  const [isPending, startTransition] = useTransition();
  const [requeueingId, setRequeuingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getQueueStats();
      if (fresh) {
        setStats(fresh.stats);
        setDlqItems(fresh.dlqItems);
      }
    });
  };

  const handleRequeue = async (itemId: string) => {
    setRequeuingId(itemId);
    const result = await requeueDead(itemId);
    if (result.success) {
      setDlqItems(prev => prev.filter(i => i.id !== itemId));
      setStats(prev => ({ ...prev, dlq: Math.max(0, prev.dlq - 1), queued: prev.queued + 1 }));
      setMessage({ text: 'Item recolocado na fila com sucesso.', type: 'ok' });
    } else {
      setMessage({ text: result.error ?? 'Erro ao recolocar na fila.', type: 'err' });
    }
    setRequeuingId(null);
    setTimeout(() => setMessage(null), 4000);
  };

  const KPI_CARDS = [
    { label: 'Na Fila', value: stats.queued, icon: <Inbox className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Enviadas (total)', value: stats.sent, icon: <Send className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Processando', value: stats.sending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Falha', value: stats.failed, icon: <XCircle className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Dead-Letter', value: stats.dlq, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-rose-700', bg: 'bg-rose-100', highlight: stats.dlq > 0 },
    { label: 'Presas (>10min)', value: stats.stuck, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-amber-700', bg: 'bg-amber-100', highlight: stats.stuck > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
          message.type === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_CARDS.map(card => (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 bg-white shadow-sm ${card.highlight ? 'border-rose-300 ring-1 ring-rose-200' : 'border-border'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.highlight ? 'text-rose-600' : 'text-obsidian'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-obsidian">Dead-Letter Queue (DLQ)</h2>
        <button
          onClick={refresh}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl border border-border hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

      {/* DLQ Table */}
      {dlqItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500 opacity-60" />
          <p className="font-semibold text-obsidian">DLQ está vazia</p>
          <p className="text-sm text-muted-foreground mt-1">Nenhuma mensagem com falha permanente.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F4F5] border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Canal</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Destino</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Tentativas</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Erro</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dlqItems.map(item => {
                const meta = item.metadata ? JSON.parse(item.metadata) : {};
                return (
                  <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                        {CHANNEL_ICON[item.channel as 'email' | 'whatsapp'] ?? null}
                        {item.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-obsidian font-medium max-w-[160px] truncate">{item.to}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-rose-600">{item.retryCount}</span>
                      <span className="text-muted-foreground">/{item.maxRetries}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[12px] max-w-[200px] truncate" title={item.errorLog ?? ''}>
                      {item.errorLog ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[12px]">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRequeue(item.id)}
                        disabled={requeueingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg bg-fluxeer-blue text-white hover:bg-fluxeer-blue-hover transition-colors disabled:opacity-50"
                      >
                        {requeueingId === item.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RotateCcw className="w-3 h-3" />
                        }
                        Reprocessar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
