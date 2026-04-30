import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  TrendingUp, 
  Settings, 
  CreditCard,
  HelpCircle,
  Clock
} from 'lucide-react';

const categories = [
  {
    title: 'Primeiros passos',
    icon: BookOpen,
    href: '/dashboard',
    description: 'Aprenda o básico e configure sua operação.',
  },
  {
    title: 'Clientes',
    icon: Users,
    href: '/clientes',
    description: 'Como cadastrar e gerenciar seus sacados.',
  },
  {
    title: 'Faturas',
    icon: FileText,
    href: '/cobrancas',
    description: 'Crie cobranças e envie links de pagamento.',
  },
  {
    title: 'Régua de cobrança',
    icon: Clock,
    href: '/automacao',
    description: 'Configure quando e como os alertas de cobrança devem ser acionados.',
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'Entenda seus indicadores financeiros principais.',
  },
  {
    title: 'Previsibilidade de caixa',
    icon: TrendingUp,
    href: '/forecast',
    description: 'Projete seus recebimentos e gerencie riscos.',
  },
  {
    title: 'Comunicações',
    icon: MessageSquare,
    href: '/comunicacoes',
    description: 'Histórico de mensagens enviadas aos clientes.',
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
    description: 'Ajuste dados da empresa e integrações.',
  },
  {
    title: 'Planos e assinatura',
    icon: CreditCard,
    href: '/planos',
    description: 'Gerencie seu plano atual e limites.',
  },
  {
    title: 'Dúvidas comuns',
    icon: HelpCircle,
    href: '#',
    description: 'Respostas rápidas para problemas do dia a dia.',
  }
];

export const metadata = {
  title: 'Central de Ajuda | Fluxeer',
  description: 'Guia Oficial do Fluxeer para aprender a configurar e usar o sistema',
};

export default function HelpCenterPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Central de Ajuda Fluxeer
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Aprenda a configurar sua operação de cobrança passo a passo. 
          Use o botão flutuante <strong>&quot;Me guia nessa tela&quot;</strong> em qualquer parte do sistema para orientações contextuais.
        </p>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Link 
              key={idx} 
              href={cat.href}
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                <Icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Call to action suporte */}
      <div className="mt-12 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Não encontrou o que procurava?</h3>
          <p className="text-slate-600">Nossa equipe de suporte está pronta para ajudar com dúvidas específicas.</p>
        </div>
        <button className="whitespace-nowrap px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors">
          Falar com Suporte
        </button>
      </div>
    </div>
  );
}
