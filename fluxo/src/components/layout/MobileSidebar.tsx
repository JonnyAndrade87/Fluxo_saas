'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, LogOut, LifeBuoy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroups } from './Sidebar';

interface MobileSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.name || "Usuário";
  const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const displayRole = user?.role === 'admin' ? 'Administrador' : 'Operador';

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Hamburger Button (visible only on mobile/tablet) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-obsidian hover:bg-muted/50 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <aside className="relative w-[280px] max-w-[80vw] h-full bg-[#1A3A5F] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 ease-out z-10">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="h-20 px-6 flex items-center">
              <img
                src="/logo_fluxeer_dashboard.png"
                alt="Fluxeer Logo"
                className="h-8 object-contain object-left drop-shadow-lg"
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-8 pb-8 custom-scrollbar">
              {navGroups.map((group, idx) => (
                <div key={idx}>
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 font-mono">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border",
                            isActive
                              ? "bg-[#234b7a] text-[#00D2C8] shadow-sm border-[#2e5b8e]/50"
                              : "text-white/60 hover:bg-[#234b7a]/50 hover:text-white border-transparent"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 transition-transform duration-300",
                              isActive ? "text-[#00D2C8]" : "text-white/50 group-hover:text-white group-hover:scale-110"
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

            {/* Footer / User Profile */}
            <div className="mt-auto px-4 space-y-1 pt-6 pb-6 border-t border-white/10 shrink-0">
              <a
                href="mailto:suporte@fluxeer.com"
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-[#234b7a]/50 hover:text-white transition-all duration-300"
              >
                <LifeBuoy className="w-5 h-5 group-hover:text-[#00D2C8] transition-colors" />
                <span>Suporte</span>
              </a>
              <Link
                href="/configuracoes"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-[#234b7a]/50 hover:text-white transition-all duration-300"
              >
                <Settings className="w-5 h-5 group-hover:text-[#00D2C8] transition-colors" />
                <span>Configurações</span>
              </Link>

              {/* User Card */}
              <div
                onClick={handleLogout}
                className="mt-4 p-3 bg-[#112740] border border-white/5 rounded-xl shadow-sm hover:border-rose-400/50 hover:bg-rose-500/10 transition-colors cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D2C8]/20 to-[#00D2C8]/10 border border-[#00D2C8]/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#00D2C8]">{initials}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white leading-none truncate">{displayName}</span>
                    <span className="text-[10px] text-white/50 mt-1 truncate">{displayRole}</span>
                  </div>
                </div>
                <LogOut className="w-4 h-4 text-white/30 group-hover:text-rose-400 transition-colors shrink-0" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
