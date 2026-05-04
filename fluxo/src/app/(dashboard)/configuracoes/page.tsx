import { auth } from '../../../../auth';
import ReguaClient from './ReguaClient';

export const metadata = { title: 'Configurações — Fluxo' };

type DashboardSessionUser = {
  role?: string | null;
  tenantId?: string | null;
};

export default async function ConfiguracoesPage() {
  const session = await auth();
  const sessionUser = session?.user as DashboardSessionUser | undefined;
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {isAdmin && <ReguaClient />}
      {!isAdmin && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      )}
    </div>
  );
}
