import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Consulte as condições gerais de acesso e utilização da plataforma Fluxeer.",
  alternates: { canonical: "https://www.fluxeer.com.br/termos" }
};

import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TermosPage() {
  return (
    <InstitutionalLayout>
      <div className="max-w-3xl mx-auto px-6 py-20 lg:py-32">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
            Documento Oficial
          </div>
          <h1 className="text-4xl lg:text-5xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-lg text-slate-500 font-geist leading-relaxed">
            Estes Termos de Uso estabelecem as condições gerais de acesso e utilização da plataforma Fluxeer. Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com estas condições.
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none font-geist space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">1. Objeto da plataforma</h2>
            <p className="text-slate-600 leading-relaxed">
              O Fluxeer é uma plataforma voltada à organização da operação de cobrança, visibilidade do contas a receber, apoio à priorização de ações e aumento da previsibilidade da operação financeira.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">2. Acesso e uso</h2>
            <p className="text-slate-600 leading-relaxed">
              O acesso à plataforma poderá depender de cadastro, autenticação e aceite das condições aplicáveis. O usuário se compromete a utilizar o serviço de forma adequada, lícita e compatível com a finalidade da plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">3. Responsabilidades do usuário</h2>
            <p className="text-slate-600 leading-relaxed">
              O usuário é responsável pelas informações inseridas na plataforma, pela guarda de suas credenciais de acesso e pelo uso adequado do ambiente, respeitando a legislação aplicável e as condições do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">4. Disponibilidade e melhorias</h2>
            <p className="text-slate-600 leading-relaxed">
              O Fluxeer poderá atualizar, evoluir, corrigir ou ajustar funcionalidades, interfaces e fluxos da plataforma a qualquer momento, visando melhoria contínua, segurança e estabilidade do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">5. Propriedade intelectual</h2>
            <p className="text-slate-600 leading-relaxed">
              Os elementos da plataforma, incluindo marca, interface, conteúdo visual, fluxos, software e demais materiais relacionados ao serviço, são protegidos pela legislação aplicável e não podem ser utilizados sem autorização adequada.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">6. Limitações e uso adequado</h2>
            <p className="text-slate-600 leading-relaxed">
              É vedado utilizar a plataforma de forma abusiva, indevida, fraudulenta, ou com finalidade que comprometa o funcionamento do serviço, a segurança da aplicação ou os direitos do Fluxeer e de terceiros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">7. Suspensão ou encerramento</h2>
            <p className="text-slate-600 leading-relaxed">
              O acesso poderá ser suspenso ou encerrado em caso de descumprimento destes Termos, exigência legal, risco operacional, uso indevido da plataforma ou necessidade técnica relevante.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">8. Alterações nos termos</h2>
            <p className="text-slate-600 leading-relaxed">
              Os presentes Termos de Uso poderão ser atualizados periodicamente para refletir mudanças legais, operacionais, técnicas ou comerciais relacionadas ao serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">9. Contato</h2>
            <p className="text-slate-600 leading-relaxed">
              Em caso de dúvidas sobre estes Termos, o usuário poderá entrar em contato pelos canais institucionais do Fluxeer.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-sm font-mono text-slate-400">
            Última atualização: Abril de 2026
          </p>
          <Link href="/contato" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green/10 text-brand-green font-semibold text-sm hover:bg-brand-green/20 transition-colors">
            Entrar em contato
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
