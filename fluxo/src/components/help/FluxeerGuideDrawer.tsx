'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { getHelpContext, type HelpContext } from '@/actions/help';
import { getOnboardingStatus, type OnboardingStatus } from '@/actions/onboarding';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FluxeerGuideDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<HelpContext | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const pathname = usePathname();

  const loadContext = useCallback(async () => {
    try {
      const data = await getHelpContext(pathname);
      startTransition(() => setContext(data));
      if (data.category === 'dashboard' || data.category === 'primeiros-passos') {
        const obs = await getOnboardingStatus();
        startTransition(() => setOnboardingStatus(obs));
      }
    } catch (error) {
      console.error('Failed to load help context:', error);
    }
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [pathname, isOpen, loadContext]);

  const renderContent = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-2 mb-4 text-sm text-slate-600">
            {listItems.map((li, i) => (
              <li key={i}>{li.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      if (line.startsWith('Onde você está:')) {
        flushList();
        elements.push(<h4 key={`h-${index}`} className="font-semibold text-indigo-900 mt-4 mb-2">Onde você está:</h4>);
      } else if (line.startsWith('O que fazer agora:')) {
        flushList();
        elements.push(<h4 key={`h-${index}`} className="font-semibold text-indigo-900 mt-4 mb-2">O que fazer agora:</h4>);
      } else if (line.startsWith('Passo a passo:')) {
        flushList();
        elements.push(<h4 key={`h-${index}`} className="font-semibold text-indigo-900 mt-4 mb-2">Passo a passo:</h4>);
      } else if (line.startsWith('Depois disso:')) {
        flushList();
        elements.push(<h4 key={`h-${index}`} className="font-semibold text-indigo-900 mt-4 mb-2">Depois disso:</h4>);
      } else if (/^\d+\./.test(line)) {
        listItems.push(line);
      } else if (line.trim() !== '') {
        elements.push(<p key={`p-${index}`} className="text-sm text-slate-600 mb-3">{line}</p>);
      }
    });

    flushList();
    return elements;
  };

  return (
    <>
      {/* Fixed Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Abrir guia contextual"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline-block">Me guia nessa tela</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Guia Oficial Fluxeer"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Guia Oficial Fluxeer</h2>
              <p className="text-xs text-slate-500 font-medium">Ajuda contextual e Inteligência</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Fechar guia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Persona intro */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10" aria-hidden="true">
              <Sparkles className="w-16 h-16 text-indigo-600" />
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed relative z-10 font-medium italic">
              &quot;Sou o Guia Oficial do Fluxeer. Vou te ajudar a configurar sua operação de cobrança passo a passo. Meu objetivo é te mostrar exatamente o que fazer agora, sem termos técnicos desnecessários.&quot;
            </p>
          </div>

          {!context ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  Tela atual
                </span>
                <span className="text-sm font-semibold text-slate-900">{context.title}</span>
              </div>

              {/* Parsed Markdown Context */}
              <div>
                {renderContent(context.content)}
              </div>

              {/* Onboarding Injection */}
              {onboardingStatus && !onboardingStatus.isComplete && (
                <div className="mt-8">
                  <h4 className="font-bold text-slate-900 mb-3">Seus próximos passos no sistema:</h4>
                  <OnboardingChecklist status={onboardingStatus} />
                </div>
              )}

              {/* Central de Ajuda Link */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link href="/ajuda" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-between group">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      Acessar Central de Ajuda
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
