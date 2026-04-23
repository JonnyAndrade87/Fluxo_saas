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
            <h2 className="text-2xl font-manrope font-bold text-slate-900">3. Compartilhamento de dados</h2>
            <p className="text-slate-600 leading-relaxed">
              O Fluxeer não comercializa dados pessoais. Informações poderão ser compartilhadas apenas quando necessário para a operação do serviço, com fornecedores e parceiros essenciais, ou quando houver obrigação legal, regulatória ou ordem de autoridade competente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">4. Armazenamento e proteção</h2>
            <p className="text-slate-600 leading-relaxed">
              Adotamos medidas técnicas e organizacionais adequadas para proteger as informações tratadas na plataforma contra acesso não autorizado, uso indevido, alteração ou divulgação indevida.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">5. Retenção de informações</h2>
            <p className="text-slate-600 leading-relaxed">
              As informações poderão ser mantidas pelo tempo necessário para operar o serviço, cumprir obrigações legais, resolver disputas, preservar registros e garantir a continuidade e segurança da plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">6. Direitos do usuário</h2>
            <p className="text-slate-600 leading-relaxed">
              Sempre que aplicável, o titular poderá solicitar informações sobre o tratamento de seus dados, bem como atualização, correção ou exclusão, observadas as obrigações legais e técnicas aplicáveis.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">7. Cookies e tecnologias similares</h2>
            <p className="text-slate-600 leading-relaxed">
              A plataforma pode utilizar cookies e tecnologias semelhantes para melhorar navegação, desempenho, segurança e análise de uso. Esses recursos ajudam a compreender melhor a interação dos usuários com o serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">8. Alterações nesta política</h2>
            <p className="text-slate-600 leading-relaxed">
              Esta Política de Privacidade poderá ser atualizada periodicamente para refletir melhorias, ajustes operacionais, exigências legais ou mudanças no serviço. Recomendamos a consulta regular desta página.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-manrope font-bold text-slate-900">9. Contato</h2>
            <p className="text-slate-600 leading-relaxed">
              Para dúvidas relacionadas a esta Política de Privacidade, entre em contato pelos canais institucionais do Fluxeer.
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
