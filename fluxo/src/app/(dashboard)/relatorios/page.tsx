import { getReportMetrics } from '@/actions/reports';
import ReportsClient from './ReportsClient';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Relatórios | Fluxo',
  description: 'Inteligência financeira consolidada para gestão de cobranças B2B',
};

export default async function RelatoriosPage() {
  const metrics = await getReportMetrics('6m');

  if (!metrics) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
        <p className="font-medium">Erro ao carregar o módulo analítico.</p>
        <p className="text-sm mt-1">Verifique sua sessão e tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 border border-border text-xs font-semibold text-indigo-700 mb-2 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Inteligência Financeira
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-obsidian">Relatórios</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Saúde do caixa, volume de faturamento, taxa de recuperação e ranking de clientes por risco.
          </p>
        </div>
        <Button variant="outline" className="gap-2 shadow-sm h-9 text-[13px]" disabled>
          <Download className="w-4 h-4 text-indigo-600" /> Exportar PDF
        </Button>
      </div>

      {/* Interactive Client Component */}
      <ReportsClient initialData={metrics} />

    </div>
  );
}
