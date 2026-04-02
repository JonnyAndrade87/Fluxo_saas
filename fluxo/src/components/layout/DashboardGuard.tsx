import { redirect } from 'next/navigation';
import { getSessionSafe } from '@/lib/safe-auth';

export async function DashboardGuard() {
  const session = await getSessionSafe();
  
  if (!session?.user) {
    console.log('No user in session, redirecting to login');
    redirect('/login');
  }
  
  console.log('Dashboard access granted for user:', session.user.email);
  return session;
}
