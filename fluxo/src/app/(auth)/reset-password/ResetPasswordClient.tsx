'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { resetPassword } from '@/actions/auth.actions';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        setError("Token não identificado na URL.");
        return;
    }
    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não batem.');
      return;
    }
    setError(null);
    
    startTransition(async () => {
      const resp = await resetPassword(token, password);
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
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-obsidian">Senha Redefinida!</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Sua conta está novamente protegida e vinculada sob a nova credencial criptografada com sucesso.
          </p>
        </div>
        <div className="mt-8 relative z-20 flex justify-center">
            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push('/login')}>
               Acessar o Painel Agora
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-obsidian mb-2">Configure sua Nova Senha</h2>
        <p className="text-muted-foreground text-sm">
          Este link está autenticado. Crie agora uma senha forte e memorize-a.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {error && (
          <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-600 animate-in fade-in">
             {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-obsidian">Nova Senha Segura</label>
          <Input 
            type="password" 
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending || !token}
            className="h-12 border-border/60 bg-[#FAFAFB] focus-visible:ring-indigo-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-obsidian">Confirme a Nova Senha</label>
          <Input 
            type="password" 
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending || !token}
            className="h-12 border-border/60 bg-[#FAFAFB] focus-visible:ring-indigo-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={isPending || !token}
          className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white mt-4 relative"
        >
          {isPending ? (
            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Verificando Token...</span>
          ) : !token ? (
            'Link Inativo'
          ) : (
            'Salvar e Autenticar'
          )}
        </Button>

      </form>
    </div>
  );
}
