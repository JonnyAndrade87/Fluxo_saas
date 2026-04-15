'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateMfaSecret, verifyAndEnableMfa } from '@/actions/mfa.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';

export default function MfaSetupPage() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadSecret() {
      try {
        const data = await generateMfaSecret();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (err) {
        console.error(err);
        setError('Falha ao gerar segredo MFA');
      } finally {
        setLoading(false);
      }
    }
    loadSecret();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const result = await verifyAndEnableMfa(secret, token);
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error || 'Falha na verificação');
      }
    } catch (err) {
      console.error(err);
      setError('Erro interno do servidor');
    } finally {
      setVerifying(false);
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Preparando configuração segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 technical-grid">
      <Card className="max-w-md w-full premium-card animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Segurança Obrigatória</CardTitle>
          <CardDescription>
            Como administrador, você deve configurar a autenticação de dois fatores antes de prosseguir.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-2 bg-white rounded-lg shadow-inner">
              {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Escaneie o QR Code acima com seu app de autenticação (Google Authenticator, Authy, etc).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ou insira o código manualmente
            </label>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm break-all font-mono border border-border">
                {secret}
              </code>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Digite o código de 6 dígitos</label>
              <Input
                type="text"
                placeholder="000 000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={verifying || token.length < 6}
            >
              {verifying ? 'Verificando...' : 'Ativar MFA e Entrar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-muted/50 py-4 flex justify-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            Sua chave secreta é pessoal e nunca deve ser compartilhada.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
