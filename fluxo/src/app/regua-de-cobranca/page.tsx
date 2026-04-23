import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Target, Clock, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Régua de Cobrança Automática | Fluxeer" },
  description: "Implemente uma régua de cobrança automática e inteligente. O Fluxeer ajuda sua empresa a organizar lembretes, priorizar faturas e reduzir o atraso.",
  alternates: { canonical: "https://www.fluxeer.com.br/regua-de-cobranca" }
};

export default function ReguaCobrancaPage() {
  return (
    <InstitutionalLayout>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#fcfcfd]">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
              Metodologia de Recebimento
            </div>
            <h1 className="text-4xl lg:text-6xl font-manrope font-extrabold text-slate-950 mb-8 tracking-tighter leading-[0.95]">
              Régua de cobrança <span className="text-brand-green">automática e estratégica.</span>
            </h1>
            <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mb-10">
              Não deixe sua cobrança para depois. Com uma régua de cobrança organizada, você mantém o contato constante com o cliente e reduz drasticamente a inadimplência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#demonstracao" className="btn-shimmer bg-brand-green text-white px-8 py-4 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 transition-all text-center">
                Ativar régua inteligente
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Ação no momento certo</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Configure lembretes automáticos para faturas a vencer, vencidas e pagas. O sistema cuida do timing para que sua equipe foque no estratégico.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Comunicação Multicanal</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Mantenha a régua de cobrança ativa através de e-mail e outros canais integrados, garantindo que o cliente receba a notificação onde ele estiver.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[3rem] p-10 lg:p-16 border border-slate-200">
            <h2 className="text-3xl font-manrope font-extrabold text-slate-950 mb-8">Por que usar uma régua de cobrança?</h2>
            <div className="space-y-4">
              {[
                "Redução imediata do aging (tempo médio de atraso)",
                "Menos esforço operacional do time financeiro",
                "Melhoria no relacionamento e transparência com o cliente",
                "Previsibilidade real sobre o fluxo de caixa"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-brand-green" />
                  </div>
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link href="/#demonstracao" className="text-brand-green font-bold flex items-center gap-2 hover:underline">
                Conhecer a régua do Fluxeer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <Link href="/software-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Software de Cobrança</Link>
            <Link href="/contas-a-receber" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Contas a Receber</Link>
            <Link href="/previsibilidade-de-caixa" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Previsibilidade de Caixa</Link>
          </div>
        </div>
      </section>
    </InstitutionalLayout>
  );
}
