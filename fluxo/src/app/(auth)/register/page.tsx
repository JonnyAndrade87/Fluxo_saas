'use client';

import { useActionState, useEffect, useState } from 'react';
import { register } from '@/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [state, dispatch, isPending] = useActionState(register, undefined);
  const [cnpj, setCnpj] = useState('');
  const router = useRouter();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove no-digits
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      // mask CPF
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // mask CNPJ
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCnpj(value);
  };

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push('/login?callbackUrl=/onboarding');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [router, state?.success]);

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <label className="text-sm font-semibold text-obsidian select-none" htmlFor="companyName">Empresa</label>
              <Input
                id="companyName"
                type="text"
                name="companyName"
                placeholder="Acme Ltda."
                required
                className="h-11 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-obsidian select-none" htmlFor="cnpj">CNPJ da Empresa</label>
            <Input
              id="cnpj"
              type="text"
              name="cnpj"
              placeholder="00.000.000/0001-00"
              required
              value={cnpj}
              onChange={handleCnpjChange}
              className="h-11 font-mono text-sm tracking-wider"
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
          className="w-full h-12 text-base font-bold tracking-wide disabled:hover:translate-y-0 disabled:hover:shadow-none" 
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
