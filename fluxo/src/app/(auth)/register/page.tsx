'use client';

import { useActionState, useEffect } from 'react';
import { register } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  const [state, dispatch, isPending] = useActionState(register, undefined);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        redirect('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  if (state?.success) {
    return (
       <div className="premium-card bg-white p-8 rounded-2xl shadow-xl border border-border/60 text-center animate-in zoom-in-95 duration-500">
         <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
         </div>
         <h2 className="text-2xl font-heading font-extrabold text-obsidian tracking-tight">Cadastro Concluído!</h2>
         <p className="text-sm text-muted-foreground mt-2">Sua conta corporativa foi provisionada. Redirecionando para o login...</p>
       </div>
    )
  }

  return (
    <div className="premium-card bg-white p-8 rounded-2xl shadow-xl border border-border/60 relative overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-700">
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">Abrir Empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure seu acesso corporativo Fluxo</p>
      </div>

      <form action={dispatch} className="space-y-6 relative z-10">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="name">Seu Nome</label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Jane Doe"
              required
              className="h-11 text-sm tracking-tight"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="email">Email Corporativo</label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="admin@empresa.com"
              required
              className="h-11 font-mono text-sm tracking-tight"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="password">Criar Senha Segura</label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Min. 6 caracteres"
              required
              minLength={6}
              className="h-11 font-mono text-sm tracking-widest px-4"
            />
          </div>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <Button 
          variant="default" // Using solid obsidian for registration vs Beam for signin
          type="submit" 
          className="w-full h-12 text-base font-bold tracking-wide" 
          disabled={isPending}
        >
          {isPending ? (
             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisionando Criptografia</>
          ) : (
             'Criar Conta Corporativa'
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Já possui ambiente? </span>
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Fazer login
          </Link>
        </div>
      </form>
    </div>
  );
}
