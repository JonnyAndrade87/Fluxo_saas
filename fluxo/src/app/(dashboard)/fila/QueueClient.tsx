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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fila de Envíio</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor da fila de mensagens — gerencie falhas e reprocesse itens bloqueados.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map(card => (
          <div
            key={card.label}
            className={`flex items-center gap-3 rounded-2xl border p-4 bg-white ${
              card.highlight ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className={`text-lg font-black tabular-nums ${card.highlight ? 'text-rose-600' : 'text-slate-900'}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* DLQ section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Fila Morta (DLQ)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mensagens que falharam após todas as tentativas. Reprocesse ou descarte manualmente.
          </p>
        </div>
      </div>

      {/* DLQ Table */}
      {dlqItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
          <p className="text-sm font-semibold text-slate-800">Fila morta está vazia</p>
          <p className="text-xs text-slate-400 mt-1">Nenhuma mensagem com falha permanente. Sistema operando normalmente.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canal</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destino</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Tentativas</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Erro</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Data</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dlqItems.map(item => {
                  const meta = item.metadata ? JSON.parse(item.metadata) : {};
                  return (
                    <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                          {CHANNEL_ICON[item.channel as 'email' | 'whatsapp'] ?? null}
                          {item.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium text-xs max-w-[160px] truncate">{item.to}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-bold text-rose-600">{item.retryCount}</span>
                        <span className="text-slate-400">/{item.maxRetries}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={item.errorLog ?? ''}>
                        {item.errorLog
                          ? <span className="line-clamp-1">{item.errorLog}</span>
                          : <span className="text-slate-300">Sem detalhe</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRequeue(item.id)}
                          disabled={requeueingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
}
