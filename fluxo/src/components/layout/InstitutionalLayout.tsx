'use client';

import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import logoLogin from "@/assets/logo_dashboard.png";
import logoFluxeer from "@/assets/logo_fluxeer.png";
import logoIcon from "@/assets/logo-icone2.png";

export function InstitutionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-slate-950 px-6 py-6 flex justify-center sticky top-0 z-50">
        <div className="max-w-4xl w-full flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src={logoLogin} alt="Fluxeer" width={148} height={32} className="w-auto h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              className="inline-flex items-center justify-center py-2 px-5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
              href="/login"
            >
              Entrar na plataforma
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 bg-[#fcfcfd]">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#f3f7f9] border-t border-slate-200/60 py-24 relative overflow-hidden mt-auto">
        {/* Background decoration */}
        <div className="absolute -bottom-20 -right-20 p-20 opacity-[0.03] pointer-events-none grayscale">
          <Image src={logoIcon} alt="Fluxeer Icon" className="w-96 h-auto" />
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-16 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image src={logoFluxeer} alt="Fluxeer" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed">
              Inteligência e controle para operações de cobrança B2B que buscam previsibilidade real.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-24 w-full md:w-auto">
            <div className="space-y-6">
                <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Produto</h5>
                <div className="flex flex-col gap-4">
                  <Link href="/#problema" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Desafio</Link>
                  <Link href="/#solucao" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Solução</Link>
                  <Link href="/#plataforma" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Plataforma</Link>
                  <Link href="/#faq" className="text-sm text-slate-500 hover:text-brand-green transition-colors">FAQ</Link>
                </div>
            </div>
            <div className="space-y-6">
                <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Soluções</h5>
                <div className="flex flex-col gap-4">
                  <Link href="/software-de-cobranca" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Software de Cobrança</Link>
                  <Link href="/regua-de-cobranca" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Régua de Cobrança</Link>
                  <Link href="/contas-a-receber" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Contas a Receber</Link>
                  <Link href="/previsibilidade-de-caixa" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Previsibilidade de Caixa</Link>
                  <Link href="/cobranca-b2b" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Cobrança B2B</Link>
                </div>
            </div>
            <div className="space-y-6">
                <h5 className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">Suporte</h5>
                <div className="flex flex-col gap-4">
                  <Link href="/suporte" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Suporte</Link>
                  <Link href="/privacidade" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Privacidade</Link>
                  <Link href="/termos" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Termos</Link>
                  <Link href="/contato" className="text-sm text-slate-500 hover:text-brand-green transition-colors">Contato</Link>
                </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1280px] mx-auto px-6 lg:px-14 mt-20 pt-8 border-t border-slate-200/40 flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span>© 2024 Fluxeer Systems</span>
            <span className="opacity-40">Desenvolvido por Studio Elephill.</span>
        </div>
      </footer>
    </div>
  );
}
