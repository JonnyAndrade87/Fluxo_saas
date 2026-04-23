import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Encontre informações institucionais do Fluxeer e os canais para contato.",
  alternates: { canonical: "https://www.fluxeer.com.br/suporte" }
};

import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import Link from "next/link";
import { ShieldCheck, FileText, MessageCircle, ArrowRight } from "lucide-react";

export default function SuportePage() {
  return (
    <InstitutionalLayout>
      <div className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
            Central de Ajuda
          </div>
          <h1 className="text-4xl lg:text-5xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tight">
            Suporte
          </h1>
          <p className="text-lg text-slate-500 font-geist max-w-2xl leading-relaxed">
            Encontre aqui as informações institucionais do Fluxeer e os canais para entrar em contato com nossa equipe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/privacidade" className="group premium-card p-8 rounded-[2rem] flex flex-col items-start bg-white hover:border-brand-green/30 relative overflow-hidden transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-manrope font-bold text-slate-950 mb-3">Política de Privacidade</h3>
            <p className="text-sm text-slate-500 font-geist mb-8 flex-1">
              Entenda como tratamos dados, informações de navegação e o uso da plataforma.
            </p>
            <span className="text-sm font-semibold text-brand-green flex items-center gap-2 mt-auto">
              Ler política de privacidade
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link href="/termos" className="group premium-card p-8 rounded-[2rem] flex flex-col items-start bg-white hover:border-brand-green/30 relative overflow-hidden transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-manrope font-bold text-slate-950 mb-3">Termos de Uso</h3>
            <p className="text-sm text-slate-500 font-geist mb-8 flex-1">
              Consulte as condições gerais de acesso, uso da plataforma e responsabilidades das partes.
            </p>
            <span className="text-sm font-semibold text-brand-green flex items-center gap-2 mt-auto">
              Ler termos de uso
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link href="/contato" className="group premium-card p-8 rounded-[2rem] flex flex-col items-start bg-white hover:border-brand-green/30 relative overflow-hidden transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-manrope font-bold text-slate-950 mb-3">Contato</h3>
            <p className="text-sm text-slate-500 font-geist mb-8 flex-1">
              Fale com nossa equipe para tirar dúvidas, solicitar ajuda ou tratar assuntos institucionais.
            </p>
            <span className="text-sm font-semibold text-brand-green flex items-center gap-2 mt-auto">
              Entrar em contato
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
