'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Menu, X, LogOut, LifeBuoy, Settings,
  LayoutDashboard, Receipt, Users, BarChart3,
  CloudUpload, Inbox, Layers, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Operacional',
    items: [
      { name: 'Visão Geral', href: '/', icon: LayoutDashboard },
      { name: 'Cobranças', href: '/cobrancas', icon: Receipt },
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Histórico', href: '/historico', icon: Inbox },
      { name: 'Comunicações', href: '/comunicacoes', icon: MessageCircle },
      { name: 'Importar Lote', href: '/importar', icon: CloudUpload },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { name: 'Monitor de Fila', href: '/fila', icon: Layers },
    ],
  },
];

interface MobileSidebarProps {
  user?: { name?: string | null; email?: string | null; role?: string | null } | null;
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Travar o scroll do body quando o menu estiver aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const displayName = user?.name || 'Usuário';
  const initials = displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const displayRole = user?.role === 'admin' ? 'Administrador' : 'Operador';

  return (
    <>
      {/* ── Botão Hamburger ──────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-obsidian hover:bg-muted/60 transition-colors"
      >
        <Menu className="w-6 h-6" strokeWidth={2} />
      </button>

      {/* ── Overlay Portal ────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Panel — posição fixed, independe do layout pai */}
          <div
            className={cn(
              'fixed top-0 left-0 h-full w-72 max-w-[85vw] z-[101]',
              'bg-[#1A3A5F] flex flex-col',
              'shadow-[4px_0_40px_0_rgba(0,0,0,0.45)]',
              'animate-in slide-in-from-left-full duration-300 ease-out'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
              <img
                src="/logo_fluxeer_dashboard.png"
                alt="Fluxeer"
                className="h-8 object-contain object-left drop-shadow-lg"
              />
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav — scrollável */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                            active
                              ? 'bg-[#234b7a] text-[#00D2C8]'
                              : 'text-white/65 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <item.icon
                            className={cn('w-5 h-5 shrink-0', active ? 'text-[#00D2C8]' : 'text-white/50')}
                            strokeWidth={active ? 2.5 : 2}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="shrink-0 px-3 pb-6 pt-4 border-t border-white/10 space-y-0.5">
              <a
                href="mailto:suporte@fluxeer.com"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <LifeBuoy className="w-5 h-5 text-white/50 shrink-0" />
                Suporte
              </a>
              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Settings className="w-5 h-5 text-white/50 shrink-0" />
                Configurações
              </Link>

              {/* User card */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full mt-2 p-3 flex items-center gap-3 bg-[#112740] border border-white/5 rounded-xl hover:border-rose-500/50 hover:bg-rose-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D2C8]/30 to-[#00D2C8]/10 border border-[#00D2C8]/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#00D2C8]">{initials}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-white/50 truncate">{displayRole}</p>
                </div>
                <LogOut className="w-4 h-4 text-white/30 group-hover:text-rose-400 shrink-0 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
