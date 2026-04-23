import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com a equipe do Fluxeer para dúvidas, suporte ou demonstrações.",
  alternates: { canonical: "https://www.fluxeer.com.br/contato" }
};

import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import Link from "next/link";
import { Mail, Clock, Presentation, ArrowRight } from "lucide-react";

export default function ContatoPage() {
  return (
    <InstitutionalLayout>
      <div className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
            Fale conosco
          </div>
          <h1 className="text-4xl lg:text-5xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tight">
            Contato
          </h1>
          <p className="text-lg text-slate-500 font-geist max-w-2xl leading-relaxed">
            Se você precisa falar com a equipe do Fluxeer, use os canais abaixo. Retornaremos o mais breve possível.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="premium-card p-8 rounded-[2rem] flex flex-col items-start bg-white border border-slate-200/60">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 text-brand-green">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-manrope font-bold text-slate-950 mb-3">E-mail institucional</h3>
            <p className="text-sm text-slate-500 font-geist mb-6 flex-1">
              Para dúvidas gerais, solicitações e assuntos institucionais, entre em contato por e-mail.
            </p>
            <a href="mailto:contato@fluxeer.com.br" className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-4 py-2 rounded-lg">
              contato@fluxeer.com.br
            </a>
          </div>

          <div className="premium-card p-8 rounded-[2rem] flex flex-col items-start bg-white border border-slate-200/60">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 text-brand-green">
              <Presentation className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-manrope font-bold text-slate-950 mb-3">Suporte comercial</h3>
            <p className="text-sm text-slate-500 font-geist mb-8 flex-1">
              Se você quer entender como o Fluxeer pode se encaixar na sua operação, fale com nosso time.
            </p>
            <Link href="/#demonstracao" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-800 transition-colors">
              Quero ver o Fluxeer funcionando
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="premium-card p-8 rounded-[2rem] flex flex-row items-center gap-6 bg-white border border-slate-200/60 w-full">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-manrope font-bold text-slate-950 mb-1">Prazo de retorno</h3>
            <p className="text-sm text-slate-500 font-geist">
              Nosso time busca responder solicitações em até 24 horas úteis.
            </p>
          </div>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
