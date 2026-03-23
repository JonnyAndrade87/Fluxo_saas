'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para login
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Fluxo</h1>
        <p className="text-gray-600 mb-8">Carregando...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
