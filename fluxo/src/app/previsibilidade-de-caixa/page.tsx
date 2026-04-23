import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Shield, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Previsibilidade de Caixa B2B | Fluxeer" },
  description: "Saiba exatamente quanto e quando irá receber. O Fluxeer traz previsibilidade de caixa para empresas que precisam de segurança financeira.",
  alternates: { canonical: "https://www.fluxeer.com.br/previsibilidade-de-caixa" }
};

export default function PrevisibilidadeCaixaPage() {
  return (
    <InstitutionalLayout>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#fcfcfd]">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
              Visão de Futuro
            </div>
            <h1 className="text-4xl lg:text-6xl font-manrope font-extrabold text-slate-950 mb-8 tracking-tighter leading-[0.95]">
              Previsibilidade de caixa para <span className="text-brand-green">decisões seguras.</span>
            </h1>
            <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mb-10">
              O maior risco de uma empresa é a incerteza. Com o Fluxeer, você tem dados reais para projetar seu caixa com base no comportamento real de pagamento dos seus clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#demonstracao" className="btn-shimmer bg-brand-green text-white px-8 py-4 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 transition-all text-center">
                Ter mais previsibilidade
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Projeção Baseada em Dados</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Não use apenas a data de vencimento. O Fluxeer analisa o histórico para prever quando o dinheiro realmente entrará na conta.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Segurança Operacional</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Opere com margem de segurança sabendo quais recebíveis são garantidos e quais exigem atenção imediata da equipe financeira.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 text-white rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
             <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl lg:text-5xl font-manrope font-extrabold mb-8 tracking-tight">Pare de reagir ao caixa. <span className="text-brand-green">Comece a antecipar.</span></h2>
                <p className="text-white/50 text-lg mb-10 font-geist">
                  A previsibilidade de caixa é o que separa empresas que sobrevivem das que crescem com sustentabilidade.
                </p>
                <Link href="/#demonstracao" className="inline-flex items-center gap-3 bg-brand-green text-white px-8 py-4 rounded-full font-manrope font-bold text-base hover:scale-105 transition-all">
                  Conhecer o Fluxeer
                  <ArrowRight className="w-4 h-4" />
                </Link>
             </div>
             {/* Abstract wave background element */}
             <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-20 pointer-events-none">
                <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d">
                   <path d="M0,80 C100,20 300,140 400,80 L400,100 L0,100 Z" fill="rgba(0,176,179,0.5)" />
                </svg>
             </div>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <Link href="/software-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Software de Cobrança</Link>
            <Link href="/regua-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Régua de Cobrança</Link>
            <Link href="/cobranca-b2b" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Cobrança B2B</Link>
          </div>
        </div>
      </section>
    </InstitutionalLayout>
  );
}
