'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset } from '@/actions/auth.actions';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu email.');
      return;
    }
    setError(null);
    
    startTransition(async () => {
      const resp = await requestPasswordReset(email);
      if (resp.error) {
        setError(resp.error);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-obsidian">Email enviado!</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Se <b>{email}</b> existir em nosso banco de dados, você acabou de receber um link mágico para escolher sua nova senha.
          </p>
        </div>
        <div className="mt-8 relative z-20 flex justify-center">
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Voltar ao Login
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in fade-in duration-500">
      <div className="mb-8">
        <Link href="/login" className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-obsidian mb-2">Esqueceu a senha?</h2>
        <p className="text-muted-foreground text-sm">
          Sem problemas, informe o e-mail atrelado à sua conta e enviaremos instruções de redefinição de segurança.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {error && (
          <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-600 animate-in fade-in">
             {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-obsidian">Endereço de E-mail</label>
          <Input 
            type="email" 
            placeholder="ceo@suaempresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="h-12 border-border/60 bg-[#FAFAFB] focus-visible:ring-indigo-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full h-12 text-base font-semibold bg-obsidian hover:bg-obsidian/90 text-white mt-2 relative overflow-hidden group"
        >
          {isPending ? (
            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</span>
          ) : (
            'Enviar Link de Recuperação'
          )}
        </Button>

      </form>
    </div>
  );
}
