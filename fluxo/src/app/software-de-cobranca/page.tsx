import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, BarChart3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Software de Cobrança B2B | Controle Seus Recebíveis",
  description: "O Fluxeer é o software de cobrança definitivo para empresas B2B. Organize contas a receber, automatize réguas e tenha controle total do seu caixa.",
  alternates: { canonical: "https://www.fluxeer.com.br/software-de-cobranca" }
};

export default function SoftwareCobrancaPage() {
  return (
    <InstitutionalLayout>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#fcfcfd]">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
              Solução Especializada
            </div>
            <h1 className="text-4xl lg:text-6xl font-manrope font-extrabold text-slate-950 mb-8 tracking-tighter leading-[0.95]">
              Software de cobrança inteligente para <span className="text-brand-green">operações complexas.</span>
            </h1>
            <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mb-10">
              Sua empresa não pode depender de processos manuais. O Fluxeer é o software de cobrança que traz automação, visibilidade e método para o seu contas a receber.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#demonstracao" className="btn-shimmer bg-brand-green text-white px-8 py-4 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 transition-all text-center">
                Ver demonstração do software
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Automação de ponta a ponta</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Substitua planilhas e tarefas repetitivas por um sistema que trabalha sozinho, lembrando seus clientes e organizando suas prioridades.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Gestão de Contas a Receber</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Tenha uma visão clara de todo o seu aging e saiba exatamente quem cobrar, quando cobrar e como priorizar cada ação comercial.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-[3rem] p-10 lg:p-16 text-center text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] rounded-full" />
            <h2 className="text-3xl lg:text-4xl font-manrope font-extrabold mb-8 relative z-10">
              Pronto para profissionalizar sua cobrança?
            </h2>
            <p className="text-white/60 mb-10 max-w-xl mx-auto relative z-10">
              Junte-se a empresas que já transformaram seu financeiro com o Fluxeer.
            </p>
            <Link href="/#demonstracao" className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-full font-manrope font-bold text-base hover:bg-gray-100 transition-all relative z-10">
              Solicitar acesso agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <Link href="/regua-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Régua de Cobrança</Link>
            <Link href="/contas-a-receber" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Contas a Receber</Link>
            <Link href="/cobranca-b2b" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Cobrança B2B</Link>
          </div>
        </div>
      </section>
    </InstitutionalLayout>
  );
}
