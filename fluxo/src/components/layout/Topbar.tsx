'use client';

import { Bell, Search, Command, X, CheckCircle2, AlertTriangle, Clock, LogOut, Sun, Moon } from "lucide-react";
import { MobileSidebar } from "./MobileSidebar";
import { useRouter } from "next/navigation";
import { logout } from "@/actions/auth";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const QUICK_LINKS = [
  { label: "Clientes", href: "/clientes", description: "Listar e gerenciar clientes" },
  { label: "Cobranças / Faturas", href: "/cobrancas", description: "Nova fatura ou historico de cobranças" },
  { label: "Histórico", href: "/historico", description: "Timeline de ações e tarefas" },
  { label: "Relatórios", href: "/relatorios", description: "Exportar e analisar dados" },
  { label: "Configurações e Plano", href: "/configuracoes#billing", description: "Plano, assinatura, Stripe e configurações administrativas" },
  { label: "Importar dados", href: "/importar", description: "Importar planilhas de clientes e faturas" },
];

type TopbarUser = {
  name?: string | null;
};

type NotificationItem = {
  id: string;
  type: 'alert' | 'warning' | 'success';
  title: string;
  description: string;
  time: string;
  href: string;
};

export function Topbar({ 
  tenantName = "Sua Empresa",
  user,
  logoUrl
}: { 
  tenantName?: string;
  user?: TopbarUser;
  logoUrl?: string | null;
}) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]); // Real notifications go here
  const [hasUnread, setHasUnread] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setNotifOpen(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredLinks = QUICK_LINKS.filter(l =>
    searchQuery === "" || l.label.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <>
      <header data-topbar className="h-16 w-full flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-all gap-4 bg-background/80 backdrop-blur-md border-b border-border/50 dark:bg-gradient-to-b dark:from-[#222225] dark:to-[#151517] dark:border-[#050505] dark:shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(255,255,255,0.02)]">
        {/* Left: Hamburger & Context badge */}
        <div className="flex items-center gap-3">
          <MobileSidebar user={user} />
          
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
            {tenantName} (Produção)
          </div>
        </div>

        {/* Center: Command Search (click to open modal) - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="w-full relative group flex items-center"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="block w-full pl-10 pr-16 py-2 border border-border rounded-xl text-sm bg-muted/30 hover:bg-accent hover:ring-2 hover:ring-brand/20 hover:border-brand transition-all text-muted-foreground text-left dark:bg-[#0a0a0c] dark:border-[#1a1a1c] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] dark:text-zinc-500">
              Buscar clientes, faturas ou relatórios...
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded shadow-sm">
                <Command className="w-3 h-3" /> K
              </div>
            </div>
          </button>
        </div>

        {/* Right: Notifications & Mobile Search */}
        <div className="flex items-center gap-3 md:gap-4 relative" ref={notifRef}>
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors relative"
            title="Alternar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </button>

          {/* Mobile Search Icon */}
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="md:hidden w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted/50 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-10 h-10 rounded-xl bg-fluxeer-blue flex items-center justify-center text-white/80 hover:text-white transition-all group shadow-md shrink-0 dark:bg-gradient-to-b dark:from-[#2a2a2d] dark:to-[#1c1c1f] dark:border dark:border-[#050505] dark:shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform dark:text-zinc-400 group-hover:dark:text-brand dark:neu-glow-blue" />
            {hasUnread && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border border-[#050505] shadow-[0_0_8px_rgba(244,63,94,0.8),inset_0_1px_1px_rgba(255,255,255,0.6)]"></span>
            )}
          </button>

          {/* Notifications panel */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-[280px] max-w-[calc(100vw-32px)] bg-popover border border-border shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Notificações</h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {notifications.length} novas
                </span>
              </div>
              <div className="divide-y divide-border">
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 border-b">Nenhuma notificação nova. ✅</p>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setNotifOpen(false); router.push(n.href); }}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/50 cursor-pointer transition-colors text-left"
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === "alert" ? "bg-rose-50" : n.type === "warning" ? "bg-amber-50" : "bg-emerald-50"
                    }`}>
                      {n.type === "alert" && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      {n.type === "warning" && <Clock className="w-4 h-4 text-amber-500" />}
                      {n.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border bg-muted/30">
                <button
                  onClick={() => { setNotifications([]); setHasUnread(false); setNotifOpen(false); }}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors w-full text-center"
                  disabled={notifications.length === 0}
                >
                  Marcar tudo como lido
                </button>
              </div>
            </div>
          )}
          
          {/* User Profile / Logout */}
          <form action={logout}>
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground border border-border hover:bg-muted transition-all shadow-sm group relative cursor-pointer overflow-hidden dark:bg-[#1c1c1f] dark:border-2 dark:border-[#2a2a2d] dark:shadow-[0_4px_8px_rgba(0,0,0,0.6),0_0_0_1px_#050505]"
              title="Sair do sistema"
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={tenantName} 
                  className="w-full h-full object-cover group-hover:opacity-0 transition-opacity grayscale hover:grayscale-0 transition-all" 
                />
              ) : (
                <span className="text-sm font-bold tracking-tight group-hover:opacity-0 transition-opacity dark:text-zinc-400">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
                </span>
              )}
              <LogOut className="w-4 h-4 text-rose-500 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>
        </div>
      </header>

      {/* Command Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          />
          <div className="relative w-full max-w-xl bg-popover rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="w-5 h-5 text-indigo-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar páginas, clientes ou faturas..."
                className="flex-1 text-sm outline-none placeholder:text-muted-foreground text-foreground bg-transparent"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="py-2 max-h-72 overflow-y-auto">
              {filteredLinks.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado encontrado.</p>
              ) : (
                <>
                  <p className="px-5 pb-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Navegar</p>
                  {filteredLinks.map(link => (
                    <button
                      key={link.href}
                      onClick={() => handleSelect(link.href)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center group-hover:border-brand/30 group-hover:bg-accent transition-colors">
                        <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.description}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
              <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">↵</kbd> selecionar</span>
              <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">Esc</kbd> fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
