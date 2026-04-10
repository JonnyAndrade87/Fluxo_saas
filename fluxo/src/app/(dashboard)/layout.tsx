import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import NewInvoiceModal from "@/components/finance/NewInvoiceModal"
import prisma from "@/lib/prisma"
import { requireTenant } from '@/lib/safe-auth'

// Force dynamic rendering - cannot cache dashboard with user-specific data
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect dashboard routes - require authenticated user with tenant
  const { user, tenantId } = await requireTenant();

  // Extract tenant name
  let tenantName = "Sua Empresa";

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

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar tenantName={tenantName} user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 relative min-w-0">
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Injected Modals */}
      <NewInvoiceModal />
    </div>
  )
}
