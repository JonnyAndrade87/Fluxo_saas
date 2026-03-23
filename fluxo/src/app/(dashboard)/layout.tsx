import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import NewInvoiceModal from "@/components/finance/NewInvoiceModal"
import { DashboardGuard } from "@/components/layout/DashboardGuard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify auth before rendering dashboard
  await DashboardGuard();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Injected Modals */}
      <NewInvoiceModal />
    </div>
  )
}
