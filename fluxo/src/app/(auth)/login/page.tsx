'use client';

import { useActionState } from 'react';
import { authenticate } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="premium-card bg-white p-8 rounded-2xl shadow-xl border border-border/60 relative overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-700">
      {/* Decorative gradient blur */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-2xl font-heading font-extrabold tracking-tight text-obsidian">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground mt-1">Acesse sua plataforma financeira</p>
      </div>

      <form action={dispatch} className="space-y-6 relative z-10">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="seu@dominio.com"
              required
              className="h-11 font-mono text-sm tracking-tight"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-obsidian select-none" htmlFor="password">Senha</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">Esqueceu a senha?</Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-11 font-mono text-sm tracking-widest px-4"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <Button 
          variant="beam" 
          type="submit" 
          className="w-full h-12 text-base font-bold tracking-wide" 
          disabled={isPending}
        >
          {isPending ? (
             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando</>
          ) : (
             'Entrar no Sistema'
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Nova empresa? </span>
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
