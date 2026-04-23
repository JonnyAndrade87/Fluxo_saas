"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3, 
  LifeBuoy,
  CloudUpload,
  Inbox,
  Layers,
  MessageCircle,
  ShieldAlert,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export const navGroups = [
  {
    label: "Operacional",
    items: [
      { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
      { name: "Cobranças", href: "/cobrancas", icon: Receipt },
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Histórico", href: "/historico", icon: Inbox },
      { name: "Comunicações", href: "/comunicacoes", icon: MessageCircle },
      { name: "Importar Lote", href: "/importar", icon: CloudUpload },
    ]
  },
  {
    label: "Financeiro",
    items: [
      { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
      { name: "Monitor de Fila", href: "/fila", icon: Layers },
      { name: "Planos e Billing", href: "/planos", icon: CreditCard },
      { name: "Configurações", href: "/configuracoes", icon: Settings },
    ]
  }
]

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    isSuperAdmin?: boolean | null;
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const displayName = user?.name || "Usuário";
  const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const displayRole = user?.role === 'admin' ? 'Administrador' : 'Operador';

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col h-full py-6 relative transition-all duration-300 ease-in-out z-20",
        "border-r",
        isCollapsed ? "w-[88px]" : "w-[280px]"
      )}
      style={{ 
        background: 'var(--sidebar-bg)', 
        borderColor: 'var(--sidebar-border)' 
      }}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-[#1c2129] border border-white/10 w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-[#2d3748] transition-colors z-50 shadow-md dark:bg-[#2a2a2d] dark:border-[#050505] dark:shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn("flex items-center px-6 mb-10 h-10 transition-all", isCollapsed ? "justify-center px-0" : "justify-start")}>
        <div 
          className={cn(
            "relative shrink-0 transition-all duration-700 ease-in-out cursor-pointer group-hover:drop-shadow-xl", 
            isCollapsed ? "w-[30px] h-[30px] hover:rotate-[360deg]" : "w-32 h-10 hover:scale-105"
          )}
        >
          {/* Logo Extensa */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
            <img 
              src="/logo_fluxeer_dashboard.png" 
              alt="Fluxeer Logo" 
              className="w-full h-full object-contain object-left drop-shadow-lg dark:neu-glow-white"
            />
          </div>
          {/* Logo Ícone */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none")}>
             <img 
              src="/logo_fluxeer_icone.png" 
              alt="Fluxeer Icone" 
              className="w-full h-full object-contain object-center drop-shadow-lg dark:neu-glow-white"
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-8 pb-8 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 font-mono dark:text-zinc-500">
                {group.label}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                      isActive 
                        ? "bg-[#2d3748] text-[#00D2C8] shadow-sm border-white/5 dark:bg-[#0a0a0c] dark:text-brand dark:border-brand/30 dark:shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)]" 
                        : "text-white/60 hover:bg-white/5 hover:text-white border-transparent dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-gradient-to-b dark:from-[#2a2a2d] dark:to-[#1c1c1f] dark:hover:border-[#050505]",
                      isCollapsed ? "justify-center" : "justify-start"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "w-5 h-5 transition-transform duration-300", 
                        isActive ? "text-[#00D2C8] dark:text-brand dark:neu-glow-blue" : "text-white/50 group-hover:text-white group-hover:scale-110 dark:text-zinc-500"
                      )} strokeWidth={isActive ? 2.5 : 2} />
                      {!isCollapsed && <span className={isActive ? "dark:screen-glow" : ""}>{item.name}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-4 space-y-1 pt-6 border-t border-white/10">
        <a 
          href="mailto:suporte@fluxeer.com" 
          title={isCollapsed ? "Suporte" : undefined}
          className={cn(
            "group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-[#234b7a]/50 hover:text-white transition-all duration-300",
            isCollapsed ? "justify-center px-0" : "px-3"
          )}
        >
          <LifeBuoy className="w-5 h-5 group-hover:text-[#00D2C8] transition-colors" />
          {!isCollapsed && <span>Suporte</span>}
        </a>

        
        {user?.isSuperAdmin && (
          <Link 
            href="/superadmin" 
            title={isCollapsed ? "Painel Super Admin" : undefined}
            className={cn(
              "group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-300",
              isCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <ShieldAlert className="w-5 h-5 group-hover:text-rose-400 transition-colors" />
            {!isCollapsed && <span>Painel Super Admin</span>}
          </Link>
        )}
        
      </div>
    </aside>
  )
}
