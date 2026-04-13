import { getCommunicationLogs } from '@/actions/communicationLog.actions';
import { CommunicationsClient } from './CommunicationsClient';

export const dynamic = 'force-dynamic';

export default async function ComunicacoesPage() {
  // Auth is enforced by the DashboardGuard in (dashboard)/layout.tsx
  const logs = await getCommunicationLogs();
  
  return <CommunicationsClient initialLogs={logs} />;
}
