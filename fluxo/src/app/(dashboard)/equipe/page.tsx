import { getTeamMembers } from '@/actions/users';
import TeamClient from './TeamClient';
import { requireTenant } from '@/lib/safe-auth';

export const metadata = { title: 'Equipe — Fluxo' };

export default async function TeamPage() {
  const { user } = await requireTenant();
  const isAdmin = user.role === 'admin';

  if (!isAdmin) {
    // A segurança de role pode ser feita aqui ou dentro do action
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const members = await getTeamMembers().catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <TeamClient members={members} />
    </div>
  );
}
