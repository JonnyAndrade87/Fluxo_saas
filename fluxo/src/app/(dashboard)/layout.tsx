import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import NewInvoiceModal from "@/components/finance/NewInvoiceModal"
import { DashboardGuard } from "@/components/layout/DashboardGuard"
import prisma from "@/lib/db"

// Force dynamic rendering - cannot cache dashboard with user-specific data
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await DashboardGuard();
  
  // Extract tenantId and fetch the real tenant name
  const tenantId = (session?.user as any)?.tenantId;
  let tenantName = "Sua Empresa";
  
  if (tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true }
      });
      if (tenant?.name) {
        tenantName = tenant.name;
      }
    } catch (e) {
      console.error("Error fetching tenant name:", e);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar user={session?.user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar tenantName={tenantName} user={session?.user} />
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
