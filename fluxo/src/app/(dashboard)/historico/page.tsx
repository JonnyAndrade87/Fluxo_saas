import HistoricoClient from './HistoricoClient';
import { Inbox } from 'lucide-react';

export const metadata = {
  title: 'Histórico de Cobranças | Fluxo',
  description: 'Visualize a timeline completa de comunicação, notas e promessas por cliente.',
};

export default function HistoricoPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5 mb-0 px-6 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 text-[11px] font-bold text-indigo-700 uppercase tracking-widest">
              <Inbox className="w-3 h-3" /> Inbox Financeiro
            </div>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">
            Histórico de Cobranças
          </h1>
          <p className="text-muted-foreground text-[15px] max-w-2xl leading-relaxed">
            Visão centralizada de tudo que aconteceu com cada cliente — mensagens enviadas, notas internas e promessas de pagamento.
          </p>
        </div>
      </div>

      {/* Full-height client component */}
      <div className="flex-1 overflow-hidden">
        <HistoricoClient />
      </div>
    </div>
  );
}
