'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, LogOut, LifeBuoy, Settings, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
// ► Single source of truth: reuses the same navGroups as the desktop Sidebar
import { navGroups } from './Sidebar';

interface MobileSidebarProps {
  user?: { name?: string | null; email?: string | null; role?: string | null; isSuperAdmin?: boolean | null } | null;
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const displayName = user?.name || 'Usuário';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const displayRole = user?.role === 'admin' ? 'Administrador' : 'Operador';

  return (
    <>
      {/* ── Hamburger button (mobile / tablet only) ─────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegação"
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#1A3A5F] hover:bg-slate-100 transition-colors"
      >
        <Menu className="w-6 h-6" strokeWidth={2} />
      </button>

      {/* ── Drawer (two separate fixed elements to avoid h-full bugs) ────────── */}
      {open && (
        <>
          {/* Backdrop — separate fixed layer */}
          <div
            className="fixed inset-0 z-[9998] lg:hidden bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel — fixed, full viewport height, above backdrop */}
          <div
            className="fixed top-0 left-0 z-[9999] lg:hidden h-screen w-72 max-w-[85vw] bg-[#1A3A5F] flex flex-col shadow-[6px_0_40px_rgba(0,0,0,0.5)]"
            style={{ animation: 'mobileDrawerIn 280ms cubic-bezier(0.32, 0.72, 0, 1) both' }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            {/* ── Header: Logo + Close ───────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5 shrink-0">
              <img
                src="/logo_fluxeer_dashboard.png"
                alt="Fluxeer"
                className="h-9 object-contain object-left drop-shadow-lg"
              />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Navigation (flex-1 so it fills available space, scrollable) ── */}
            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 space-y-6 pb-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                            isActive
                              ? 'bg-[#234b7a] text-[#00D2C8] border-[#2e5b8e]/50'
                              : 'text-white/60 hover:bg-[#234b7a]/50 hover:text-white border-transparent'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'w-5 h-5 shrink-0 transition-transform duration-200',
                              isActive
                                ? 'text-[#00D2C8]'
                                : 'text-white/50 group-hover:text-white group-hover:scale-110'
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* ── Footer: Suporte + Configurações + User card ───────────────── */}
            <div className="shrink-0 px-4 pt-4 pb-6 border-t border-white/10 space-y-1">
              <a
                href="mailto:suporte@fluxeer.com"
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-[#234b7a]/50 hover:text-white transition-all duration-200"
              >
                <LifeBuoy className="w-5 h-5 group-hover:text-[#00D2C8] transition-colors shrink-0" />
                <span>Suporte</span>
              </a>
              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-[#234b7a]/50 hover:text-white transition-all duration-200"
              >
                <Settings className="w-5 h-5 group-hover:text-[#00D2C8] transition-colors shrink-0" />
                <span>Configurações</span>
              </Link>

              {user?.isSuperAdmin && (
                <Link
                  href="/superadmin"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-200"
                >
                  <ShieldAlert className="w-5 h-5 group-hover:text-rose-400 transition-colors shrink-0" />
                  <span>Painel Super Admin</span>
                </Link>
              )}

              {/* User card / logout — identical to desktop Sidebar footer */}
              <div
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sair do sistema"
                className="mt-3 p-3 bg-[#112740] border border-white/5 rounded-xl shadow-sm hover:border-rose-400/50 hover:bg-rose-500/10 transition-colors cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D2C8]/20 to-[#00D2C8]/10 border border-[#00D2C8]/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#00D2C8]">{initials}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white leading-none truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-white/50 mt-1 truncate">{displayRole}</span>
                  </div>
                </div>
                <LogOut className="w-4 h-4 text-white/30 group-hover:text-rose-400 transition-colors shrink-0" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Keyframe for drawer slide-in ───────────────────────────────────── */}
      <style>{`
        @keyframes mobileDrawerIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
