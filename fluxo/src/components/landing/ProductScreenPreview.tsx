import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

type ProductScreenPreviewVariant = 'overview' | 'regua' | 'risco' | 'caixa' | 'operacao';

const kpiCards = [
  { label: 'À vencer', value: 'R$ ••••••', tone: 'indigo' },
  { label: 'Vencido', value: 'R$ ••••••', tone: 'rose' },
  { label: 'Recebido', value: 'R$ ••••••', tone: 'emerald' },
  { label: 'Previsto 7 dias', value: 'R$ ••••••', tone: 'amber' },
] as const;

const riskItems = [
  'Cliente confidencial',
  'Conta corporativa protegida',
  'Recebível com histórico ativo',
] as const;

const taskItems = [
  'Follow-up automático agendado',
  'Contato do financeiro registrado',
  'Promessa de pagamento em análise',
] as const;

const commItems = ['WhatsApp enviado', 'E-mail pendente', 'Lembrete reagendado'] as const;

function toneClasses(tone: (typeof kpiCards)[number]['tone']) {
  switch (tone) {
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  }
}

export function ProductScreenPreview({ variant }: { variant: ProductScreenPreviewVariant }) {
  const showRisk = variant === 'overview' || variant === 'risco' || variant === 'operacao';
  const showCash = variant === 'overview' || variant === 'caixa';
  const showRegua = variant === 'overview' || variant === 'regua' || variant === 'operacao';

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
      <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-brand-green">Tela real do produto</p>
            <h3 className="mt-1 text-lg font-manrope font-extrabold text-slate-950">Painel operacional do Fluxeer</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
            Dados sensíveis ocultos
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5 lg:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map(card => (
            <div key={card.label} className={`rounded-2xl border p-4 ${toneClasses(card.tone)}`}>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-80">{card.label}</p>
              <p className="mt-3 text-xl font-manrope font-extrabold tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {showCash ? (
            <div className="lg:col-span-7 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-manrope font-bold text-slate-900">Fluxo de Recebimentos</p>
                  <p className="text-xs text-slate-500">Visão do histórico e previsão do tenant autenticado.</p>
                </div>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/80 p-5">
                <div className="grid h-44 grid-cols-2 gap-4 rounded-[1rem] bg-[linear-gradient(180deg,rgba(79,70,229,0.08)_0%,rgba(79,70,229,0)_100%)] p-4">
                  <div className="rounded-[0.875rem] border border-dashed border-slate-300 bg-white/80" />
                  <div className="rounded-[0.875rem] border border-dashed border-slate-300 bg-white/80" />
                  <div className="rounded-[0.875rem] border border-dashed border-slate-300 bg-white/80" />
                  <div className="rounded-[0.875rem] border border-dashed border-slate-300 bg-white/80" />
                </div>
                <p className="mt-4 text-xs text-slate-500">Estrutura do gráfico real preservada. Valores do cliente ocultos na versão pública.</p>
              </div>
            </div>
          ) : null}

          {showRisk ? (
            <div className={`${showCash ? 'lg:col-span-5' : 'lg:col-span-6'} rounded-[1.75rem] border border-slate-200 bg-white p-5`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-manrope font-bold text-slate-900">Ranking de risco</p>
                  <p className="text-xs text-slate-500">Clientes organizados por criticidade operacional.</p>
                </div>
                <ShieldAlert className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-5 space-y-3">
                {riskItems.map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="text-sm font-medium text-slate-800">{item}</span>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-rose-600">
                      P{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {showRegua ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 lg:col-span-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-manrope font-bold text-slate-900">Tarefas do dia</p>
                  <p className="text-xs text-slate-500">Fila operacional do contas a receber.</p>
                </div>
                <CalendarDays className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-5 space-y-3">
                {taskItems.map(item => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{item}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Contexto mantido na área autenticada.</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 lg:col-span-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-manrope font-bold text-slate-900">Comunicações da régua</p>
                  <p className="text-xs text-slate-500">Disparos e pendências do fluxo automatizado.</p>
                </div>
                <MessageSquare className="h-4 w-4 text-brand-green" />
              </div>
              <div className="mt-5 space-y-3">
                {commItems.map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">{item}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-500">
                      {index === 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-amber-500" />}
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {variant === 'operacao' ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-manrope font-bold">Faturas vencidas</p>
                <p className="text-xs text-white/60">Visão real da carteira com dados comerciais protegidos.</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-5 space-y-3">
              {['#INV-••••', '#INV-••••', '#INV-••••'].map(item => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-rose-300" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-rose-300">Em tratamento</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
