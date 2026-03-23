import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side redirect - no client hydration issues
  redirect('/login');
}
