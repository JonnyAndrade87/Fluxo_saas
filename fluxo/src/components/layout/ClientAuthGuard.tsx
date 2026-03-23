'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientAuthGuardProps {
  children: React.ReactNode;
}

export function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user has a session cookie
    const checkAuth = async () => {
      try {
        // Try to get session
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.log('[Auth] No session found, redirecting to login');
          setIsChecking(false);
          router.push('/login');
          return;
        }

        const session = await response.json();
        
        if (!session?.user) {
          console.log('[Auth] Session empty, redirecting to login');
          setIsChecking(false);
          router.push('/login');
          return;
        }

        console.log('[Auth] User authenticated:', session.user.email);
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('[Auth] Error checking authentication:', error);
        setIsChecking(false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // While checking auth, show loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Verificando autenticação...</h2>
          <p className="text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // If authorized, show content
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Otherwise show nothing (redirect is happening)
  return null;
}
