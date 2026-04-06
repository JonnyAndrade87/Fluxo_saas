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
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Operacional",
    items: [
      { name: "Visão Geral", href: "/", icon: LayoutDashboard },
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
    ]
  }
]

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const displayName = user?.name || "Usuário";
  const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const displayRole = user?.role === 'admin' ? 'Administrador' : 'Operador';

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside className="hidden lg:flex flex-col h-full w-[280px] bg-[#FCFCFD] border-r border-border/60 py-6">
      <div className="flex items-center gap-3 px-6 mb-10">
        <div className="w-8 h-8 rounded-lg bg-obsidian flex items-center justify-center shadow-md">
          <span className="text-white font-heading font-bold text-lg leading-none">F</span>
        </div>
        <span className="text-xl font-heading font-bold tracking-tight text-obsidian">Fluxo</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-8 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 font-mono">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                      isActive 
                        ? "bg-indigo-50/80 text-indigo-700 shadow-sm border border-indigo-100/50" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-indigo-600" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-4 space-y-1 pt-6 border-t border-border/60">
        <a 
          href="mailto:suporte@fluxo.com" 
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
        >
          <LifeBuoy className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
          Suporte
        </a>
        <Link 
          href="/configuracoes" 
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
        >
          <Settings className="w-5 h-5 group-hover:text-obsidian transition-colors" />
          Configurações
        </Link>
        
        {/* User Card Miniature */}
        <div 
          onClick={handleLogout}
          className="mt-4 p-3 bg-white border border-border/60 rounded-xl shadow-sm hover:border-rose-200 hover:bg-rose-50/50 transition-colors cursor-pointer group flex items-center justify-between"
          title="Sair do sistema"
        >
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-700">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-obsidian leading-none truncate">{displayName}</span>
              <span className="text-[10px] text-muted-foreground mt-1 truncate">{displayRole}</span>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 transition-colors shrink-0" />
        </div>
      </div>
    </aside>
  )
}
