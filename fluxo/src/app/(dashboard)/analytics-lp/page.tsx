import Link from 'next/link';

const integrations = [
  {
    name: 'GTM',
    value: process.env.NEXT_PUBLIC_GTM_ID,
    href: process.env.NEXT_PUBLIC_GTM_WORKSPACE_URL,
  },
  {
    name: 'GA4',
    value: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    href: process.env.NEXT_PUBLIC_GA4_DASHBOARD_URL,
  },
  {
    name: 'Clarity',
    value: process.env.NEXT_PUBLIC_CLARITY_ID,
    href: process.env.NEXT_PUBLIC_CLARITY_PROJECT_URL,
  },
] as const;

const trackedEvents = ['cta_click', 'form_start', 'form_submit', 'scroll_50', 'scroll_90'] as const;

export default function LandingAnalyticsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-brand-green">LP Analytics</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Status da medição da landing page</h1>
        <p className="text-sm text-slate-500">Painel técnico para validar integrações, eventos e links externos da stack de mensuração.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {integrations.map(integration => {
          const configured = Boolean(integration.value);

          return (
            <div key={integration.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-manrope font-extrabold text-slate-950">{integration.name}</h2>
                <span className={`rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {configured ? 'Configurado' : 'Pendente'}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                {configured ? `ID ativo: ${integration.value}` : 'Aguardando ID real de ambiente para publicar a integração externa.'}
              </p>

              {integration.href ? (
                <Link href={integration.href} className="mt-5 inline-flex text-sm font-semibold text-brand-green hover:underline">
                  Abrir dashboard externo
                </Link>
              ) : (
                <p className="mt-5 text-xs text-slate-400">Sem URL externa publicada no ambiente atual.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-manrope font-extrabold text-slate-950">Eventos rastreados</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {trackedEvents.map(eventName => (
            <span key={eventName} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-slate-600">
              {eventName}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Os eventos enviados pela LP carregam `page`, `section`, `device` e `cta_label` para análise de conversão por origem de clique.
        </p>
      </div>
    </div>
  );
}
