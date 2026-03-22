export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FDFDFE] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Distraction-Free Topbar */}
      <header className="h-20 flex items-center justify-center border-b border-border/40 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-obsidian flex items-center justify-center shadow-md">
            <span className="text-white font-heading font-bold text-lg leading-none">F</span>
          </div>
          <span className="text-xl font-heading font-extrabold tracking-tight text-obsidian">Fluxo</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center pt-12 pb-24 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
      
      {/* Decorative Background Blur */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-50/50 blur-3xl opacity-50" />
        <div className="absolute bottom-[0%] -left-[10%] w-[600px] h-[600px] rounded-full bg-sky-50/30 blur-3xl opacity-50" />
      </div>
    </div>
  )
}
