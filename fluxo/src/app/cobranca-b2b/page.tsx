import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Cobrança B2B Especializada",
  description: "O Fluxeer é especialista em cobrança B2B. Gerencie faturas complexas, trate com empresas e mantenha seu recebimento em dia com tecnologia.",
  alternates: { canonical: "https://www.fluxeer.com.br/cobranca-b2b" }
};

export default function CobrancaB2BPage() {
  return (
    <InstitutionalLayout>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#fcfcfd]">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
              B2B Business Solutions
            </div>
            <h1 className="text-4xl lg:text-6xl font-manrope font-extrabold text-slate-950 mb-8 tracking-tighter leading-[0.95]">
              Cobrança B2B feita para <span className="text-brand-green">quem entende de negócio.</span>
            </h1>
            <p className="text-xl text-slate-500 font-geist leading-relaxed max-w-2xl mb-10">
              Negociar com empresas exige método e profissionalismo. O Fluxeer oferece a infraestrutura técnica para que sua cobrança B2B seja impecável, do lembrete à baixa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#demonstracao" className="btn-shimmer bg-brand-green text-white px-8 py-4 rounded-full font-manrope font-bold text-base shadow-[0_15px_40px_rgba(0,176,179,0.25)] hover:scale-105 transition-all text-center" data-track-cta="true" data-section="cobranca-b2b" data-cta-label="profissionalizar minha cobranca">
                Profissionalizar minha cobrança
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Foco em Relacionamento</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                No B2B, a cobrança é uma extensão do comercial. O Fluxeer ajuda a manter a elegância e o processo, preservando a relação com o cliente.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-manrope font-bold text-slate-950">Controle de Faturas</h3>
              <p className="text-slate-500 font-geist leading-relaxed">
                Gerencie múltiplas faturas por cliente, trate divergências com facilidade e tenha o controle total de cada CNPJ da sua base.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[3rem] p-10 lg:p-16 border border-slate-200 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-manrope font-extrabold text-slate-950 mb-6">Desenvolvido para operações corporativas.</h2>
                <p className="text-slate-500 mb-10 max-w-xl font-geist">
                   O Fluxeer resolve as dores reais do financeiro B2B: falta de histórico, processos manuais e inadimplência oculta.
                </p>
                <div className="flex flex-wrap gap-4">
                   {["Régua Customizada", "Histórico de Ações", "Visão por Cliente", "Previsão de Caixa"].map((tag, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600">{tag}</span>
                   ))}
                </div>
            </div>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <Link href="/software-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Software de Cobrança</Link>
            <Link href="/regua-de-cobranca" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Régua de Cobrança</Link>
            <Link href="/contas-a-receber" className="text-xs font-mono font-bold uppercase tracking-widest hover:text-brand-green transition-colors">Contas a Receber</Link>
          </div>
        </div>
      </section>
    </InstitutionalLayout>
  );
}
