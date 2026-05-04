import { getGlobalMetrics, getTenantsList } from "@/actions/superadmin";
import { Building2, Users, FileText, Activity, AlertCircle, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Super Admin — Fluxo",
  description: "Painel de controle global da plataforma.",
};

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  colorClass 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4 ${colorClass}`}>
      <div className="p-3 rounded-lg bg-current/10 shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-obsidian tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default async function SuperAdminPage() {
  const metrics = await getGlobalMetrics();
  const tenants = await getTenantsList();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-obsidian font-heading">Visão Geral da Plataforma</h2>
        <p className="text-sm text-muted-foreground mt-1">Métricas globais contornando o sandbox dos tenants.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Tenants Ativos" 
          value={metrics.totalTenants} 
          icon={Building2} 
          colorClass="border-slate-200 text-slate-700" 
        />
        <MetricCard 
          label="Recebíveis Globais" 
          value={fmt.format(metrics.globalReceivables)} 
          icon={Activity} 
          colorClass="border-emerald-200 text-emerald-700" 
        />
        <MetricCard 
          label="Vencidos Globais" 
          value={fmt.format(metrics.globalOverdue)} 
          icon={AlertCircle} 
          colorClass="border-rose-200 text-rose-700" 
        />
        <MetricCard 
          label="Comunicações (Hoje)" 
          value={metrics.communicationsToday} 
          icon={MessageSquare} 
          colorClass="border-blue-200 text-blue-700" 
        />
        <MetricCard 
          label="Sacados Cadastrados" 
          value={metrics.totalCustomers} 
          icon={Users} 
          colorClass="border-indigo-200 text-indigo-700" 
        />
        <MetricCard 
          label="Faturas Emitidas" 
          value={metrics.totalInvoices} 
          icon={FileText} 
          colorClass="border-amber-200 text-amber-700" 
        />
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-obsidian font-heading">Tenants Operando</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            {tenants.length} registrados
          </span>
        </div>
        
        <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tenant</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Usuários</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Plano / Volume</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Desde</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Carteira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5" title={t.id}>{t.documentNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.users.length > 0 ? (
                        <div className="space-y-1">
                          {t.users.map((u, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700 leading-tight">{u.fullName}</span>
                              <span className="text-[10px] text-slate-400 font-medium leading-tight truncate max-w-[150px]">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Sem usuários</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit ${
                          t.plan === 'scale' ? 'bg-indigo-100 text-indigo-700' :
                          t.plan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.plan}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 opacity-70">
                          <span className="flex items-center gap-1 text-[10px]">
                            <Users className="w-3 h-3 text-indigo-400" /> {t.customerCount}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]">
                            <FileText className="w-3 h-3 text-amber-400" /> {t.invoiceCount}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{t.createdAt.toLocaleDateString("pt-BR")}</span>
                        <span className="text-[10px] text-slate-400 italic">
                          {Math.floor((new Date().getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24))} dias
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {fmt.format(t.totalReceivables)}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                      Nenhum tenant operando no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
