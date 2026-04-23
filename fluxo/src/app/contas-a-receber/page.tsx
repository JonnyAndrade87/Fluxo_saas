import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart2, TrendingUp, Search, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Gestão de Contas a Receber | Visibilidade e Controle",
  description: "Organize seu contas a receber com inteligência. O Fluxeer oferece ferramentas para monitorar recebíveis, analisar aging e otimizar a entrada de caixa.",
  alternates: { canonical: "https://www.fluxeer.com.br/contas-a-receber" }
};

export default function ContasReceberPage() {
  return (
    <InstitutionalLayout>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#fcfcfd]">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
              Gestão Financeira B2B
            </div>
            <h1 className="text-4xl lg:text-6xl font-manrope font-extrabold text-slate-950 mb-8 tracking-tighter leading-[0.95]">
              Gestão de contas a receber com <span className="text-brand-green">foco em resultado.</span>
            </h1>
            <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mb-10">
              Pare de olhar para o passado e comece a prever o futuro. O Fluxeer transforma seu contas a receber em um painel estratégico de controle e previsibilidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#demonstracao" className="btn-shimmer bg-slate-950 text-white px-8 py-4 rounded-full font-manrope font-bold text-base shadow-xl hover:scale-105 transition-all text-center">
                Organizar meus recebíveis
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Visibilidade do Aging</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Saiba exatamente quanto você tem a receber em cada faixa de atraso. Identifique gargalos e atue cirurgicamente nos clientes de maior risco.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Histórico e Contexto</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Centralize todo o histórico de interações e promessas de pagamento. Tenha o contexto completo antes de cada abordagem de cobrança.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 lg:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-manrope font-extrabold text-slate-950 mb-6">A inteligência que seu financeiro precisava.</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  O Fluxeer não é apenas um repositório de faturas, é uma camada de inteligência sobre o seu contas a receber.
                </p>
                <Link href="/#demonstracao" className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-all">
                  Testar agora
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <div className="space-y-6">
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[70%] bg-brand-green" />
                  </div>
                  <div className="h-2 w-[80%] bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-amber-400" />
                  </div>
                  <div className="h-2 w-[60%] bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] bg-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <Link href="/software-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Software de Cobrança</Link>
            <Link href="/regua-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Régua de Cobrança</Link>
            <Link href="/previsibilidade-de-caixa" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Previsibilidade de Caixa</Link>
          </div>
        </div>
      </section>
    </InstitutionalLayout>
  );
}
