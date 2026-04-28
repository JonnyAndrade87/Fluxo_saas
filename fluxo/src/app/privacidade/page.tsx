import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Entenda como o Fluxeer coleta, utiliza e protege suas informações.",
  alternates: { canonical: "https://www.fluxeer.com.br/privacidade" }
};

import { InstitutionalLayout } from "@/components/layout/InstitutionalLayout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PrivacidadePage() {
  return (
    <InstitutionalLayout>
      <div className="max-w-3xl mx-auto px-6 py-20 lg:py-32">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-[10px] font-mono font-bold text-brand-green tracking-[0.25em] uppercase mb-6">
            Documento Oficial
          </div>
          <h1 className="text-4xl lg:text-5xl font-manrope font-extrabold text-slate-950 mb-6 tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-lg text-slate-500 font-geist leading-relaxed">
            A sua privacidade é importante para o Fluxeer. Esta Política de Privacidade explica, de forma clara e objetiva, como coletamos, utilizamos, armazenamos e protegemos informações relacionadas ao uso da plataforma.
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none font-geist space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">1. Dados que podemos coletar</h2>
            <p className="text-slate-600 leading-relaxed">
              Podemos coletar informações fornecidas diretamente por você, como nome, e-mail, empresa, telefone e outros dados necessários para cadastro, contato, demonstrações e uso da plataforma. Também podemos registrar informações técnicas, como navegação, dispositivo, endereço IP, data e horário de acesso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">2. Como usamos essas informações</h2>
            <p className="text-slate-600 leading-relaxed">
              Utilizamos essas informações para operar a plataforma, responder solicitações, melhorar a experiência de uso, prestar suporte, enviar comunicações relacionadas ao serviço e cumprir obrigações legais e operacionais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">3. Compartilhamento e Sub-processadores</h2>
            <p className="text-slate-600 leading-relaxed">
              O Fluxeer utiliza fornecedores e parceiros essenciais para a prestação do serviço. Para o estágio Beta, nossos principais sub-processadores incluem:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Vercel:</strong> Hospedagem e infraestrutura de servidor.</li>
              <li><strong>Provedor de Banco de Dados:</strong> Armazenamento seguro de dados operacionais.</li>
              <li><strong>Stripe:</strong> Processamento de pagamentos, assinaturas e gestão de faturamento.</li>
              <li><strong>Resend:</strong> Disparo de comunicações transacionais via e-mail.</li>
              <li><strong>Meta (WhatsApp Business API):</strong> Disparo de notificações de cobrança via WhatsApp.</li>
              <li><strong>Google (GTM, GA4, Ads):</strong> Analytics e marketing (<strong>apenas em páginas públicas</strong>).</li>
              <li><strong>Microsoft (Clarity):</strong> Análise de experiência de usuário (<strong>apenas em páginas públicas</strong>).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">4. Armazenamento e Proteção</h2>
            <p className="text-slate-600 leading-relaxed">
              Adotamos medidas técnicas como criptografia, isolamento multi-tenant rigoroso e firewalls para proteger as informações. Durante o Beta, realizamos auditorias periódicas para garantir a integridade dos dados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">5. Retenção e Exclusão</h2>
            <p className="text-slate-600 leading-relaxed">
              Mantemos os dados enquanto a conta estiver ativa. Em conformidade com a LGPD, o usuário pode solicitar a exclusão total de seus dados a qualquer momento. Para o Beta, este procedimento é manual e realizado em até 5 dias úteis após a solicitação.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">6. Seus Direitos e Contato</h2>
            <p className="text-slate-600 leading-relaxed">
              Você possui direito de acesso, correção, anonimização ou exclusão de seus dados. Para exercer esses direitos ou relatar um incidente de segurança, entre em contato através do e-mail: <strong>privacidade@fluxeer.com.br</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">7. Procedimento em Caso de Incidentes</h2>
            <p className="text-slate-600 leading-relaxed">
              Em caso de qualquer incidente de segurança que possa acarretar risco ou dano relevante aos titulares, o Fluxeer comunicará os usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) em prazo razoável, detalhando a natureza do incidente e as medidas de mitigação adotadas.
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
