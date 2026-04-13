import { auth } from '../../../../auth';
import { getTeamMembers } from '@/actions/users';
import ReguaClient from './ReguaClient';
import TeamClient from './TeamClient';

export const metadata = { title: 'Configurações — Fluxo' };

export default async function ConfiguracoesPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const members = await getTeamMembers().catch(() => []);

  return (
    <div className="space-y-0">
      {isAdmin && <ReguaClient />}
      {isAdmin && <TeamClient members={members} />}
    </div>
  );
}
