import { getQueueStats } from '@/actions/queue';
import QueueClient from './QueueClient';
import { Layers, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Monitor de Fila | Fluxo',
  description: 'Observabilidade operacional do motor de envio de mensagens',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FilaPage() {
  const data = await getQueueStats();

  if (!data) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
        <p className="font-medium">Erro ao carregar dados da fila.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            Observabilidade
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Monitor de Fila</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Status operacional do motor de envio — mensagens em fila, enviadas, com falha, presas e na dead-letter queue.
          </p>
        </div>
      </div>

      <QueueClient initialStats={data.stats} initialDlqItems={data.dlqItems} />
    </div>
  );
}
