import { Bell, Search, Command } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-16 w-full flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10 transition-all">
      {/* Context / Breadcrumbs Space */}
      <div className="hidden md:flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-full border border-border bg-canvas text-xs font-semibold text-obsidian flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Acme Corp (Produção)
        </div>
      </div>

      {/* Center: Command Search */}
      <div className="flex-1 max-w-lg mx-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-16 py-2 border border-border rounded-xl text-sm bg-muted/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
            placeholder="Buscar clientes, faturas ou relatórios..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-white border border-border px-1.5 py-0.5 rounded shadow-sm">
              <Command className="w-3 h-3" /> K
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-obsidian transition-colors group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
        </button>
      </div>
    </header>
  )
}
