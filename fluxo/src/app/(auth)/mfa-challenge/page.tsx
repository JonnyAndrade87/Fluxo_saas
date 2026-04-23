'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyMfaChallenge } from '@/actions/mfa.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function MfaChallengePage() {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const result = await verifyMfaChallenge(token);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'Código inválido');
      }
    } catch (err: any) {
      setError('Sessão expirada ou erro interno. Tente logar novamente.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 technical-grid">
      <Card className="max-w-sm w-full premium-card animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Verificação em Duas Etapas</CardTitle>
          <CardDescription>
            Insira o código gerado pelo seu aplicativo autenticador.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="000 000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-3xl tracking-[0.6em] font-mono h-16"
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={verifying || token.length < 6}
            >
              {verifying ? 'Verificando...' : 'Verificar e Acessar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="py-4 border-t border-border flex justify-center">
          <Button variant="link" size="sm" onClick={() => router.push('/login')} className="text-muted-foreground">
            Voltar para o login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
