import { getCommunicationLogs, triggerCollectionLogs } from '@/actions/communicationLog.actions';
import { CommunicationsClient } from './CommunicationsClient';

export const dynamic = 'force-dynamic';

export default async function ComunicacoesPage() {
  // Auth is enforced by the DashboardGuard in (dashboard)/layout.tsx
  // Generate fresh collection logs idempotently on page load
  await triggerCollectionLogs();
  const logs = await getCommunicationLogs();
  
  return <CommunicationsClient initialLogs={logs} />;
}
