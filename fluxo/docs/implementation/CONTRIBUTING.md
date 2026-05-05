# 👥 CONTRIBUTING - Guia para Desenvolvimento

**Obrigado por contribuir para o Fluxo!**

---

## 🎯 Como Começar

### 1. Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/yourusername/fluxo.git
cd fluxo

# Instale dependências
npm install

# Configure .env.local
cp .env.example .env.local

# Configure banco de dados
npx prisma migrate dev

# Inicie servidor de desenvolvimento
npm run dev

# Visite http://localhost:3000
```

### 2. Estrutura do Projeto

```
src/
├── app/              # Next.js App Router (páginas, layouts, API routes)
├── actions/          # Server Actions (RPC Server-side)
├── components/       # React Components (UI reutilizáveis)
├── lib/              # Business Logic (domínio-específico)
├── hooks/            # Custom React Hooks
├── types/            # TypeScript Interfaces (centralizadas)
├── constants/        # Application Constants
└── utils/            # Utility Functions (genéricas)
```

---

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ BOM: Tipos explícitos
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

function updateUser(user: User): Promise<User> {
  // ...
}

// ❌ RUIM: any implícito
function updateUser(user: any): Promise<any> {
  // ...
}
```

### Imports

```typescript
// ✅ BOM: Imports organizados por categoria
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import prisma from '@/lib/db';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';

import type { User } from '@/types';

// ❌ RUIM: Imports desorganizados
import { Button } from '@/components/ui/button';
import prisma from '@/lib/db';
import { useState } from 'react';
```

### Componentes React

```typescript
// ✅ BOM: Bem estruturado e tipado
interface UserCardProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export function UserCard({ user, onUpdate }: UserCardProps) {
  return (
    <div className="card">
      <h2>{user.email}</h2>
      <p>Role: {user.role}</p>
    </div>
  );
}

// ❌ RUIM: Props implícitas
export function UserCard(props: any) {
  return <div>{props.user.email}</div>;
}
```

### Server Actions

```typescript
// ✅ BOM: Tipado e com error handling
'use server';

import { logger } from '@/utils/logger';
import prisma from '@/lib/db';

export async function updateUser(
  userId: string,
  data: { email: string; name: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    logger.info('updateUser', `Updated user ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('updateUser', `Failed to update user`, error);
    return { success: false, error: 'Failed to update user' };
  }
}

// ❌ RUIM: Sem tipos, sem log
export async function updateUser(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return user;
}
```

### Naming Conventions

```typescript
// ✅ BOM: Nomes descritivos
const MAX_RETRIES = 3;
function fetchCustomerWithRetry() {}
interface PaginatedResponse<T> {}
const useCustomerForm = () => {};

// ❌ RUIM: Nomes genéricos
const x = 3;
function fetch() {}
interface Response {}
const useCF = () => {};
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Modo watch
npm run test -- --watch

# Com coverage
npm run test -- --coverage
```

### Escrever Testes

```typescript
// src/lib/__tests__/risk-score.test.ts

import { calculateRiskScore } from '@/lib/risk-score';

describe('calculateRiskScore', () => {
  it('should return low risk for new customer', () => {
    const score = calculateRiskScore({ invoices: [], days_late: 0 });
    expect(score).toBeLessThan(25);
  });

  it('should return high risk for overdue invoices', () => {
    const score = calculateRiskScore({ invoices: [{ status: 'overdue' }], days_late: 30 });
    expect(score).toBeGreaterThan(75);
  });
});
```

---

## 🔍 Linting e Formatting

### Antes de Commit

```bash
# Lint apenas arquivos modificados
npm run lint -- --fix

# Format com Prettier
npx prettier --write src/

# Type check
npx tsc --noEmit
```

### Pre-commit Hook

O projeto usa Husky para rodar checks automáticos:

```bash
# Instalar hooks (uma vez)
npx husky install

# Hooks executam automaticamente no git commit
```

---

## 🚀 Workflow de Desenvolvimento

### 1. Criar Feature Branch

```bash
git checkout -b feature/sua-feature-name
# Exemplos: feature/risk-score-improvements, feature/export-pdf
```

### 2. Fazer Commits Significativos

```bash
git add .
git commit -m "feat: adicionar validação de CNPJ"
# Usar conventional commits: feat, fix, docs, refactor, test, chore
```

### 3. Testar Localmente

```bash
npm run lint      # Sem erros
npm run build     # Build funciona
npm run test      # Testes passam
npm run dev       # Funciona em localhost:3000
```

### 4. Fazer Pull Request

```bash
git push origin feature/sua-feature-name
# Abrir PR no GitHub com descrição clara
```

### 5. Code Review

- Revisor avalia código
- Fazer ajustes conforme feedback
- Merge após aprovação

---

## 📋 Checklist para Pull Requests

Antes de fazer submit:

- [ ] Feature funciona localmente
- [ ] `npm run lint` (0 erros)
- [ ] `npm run build` (sucesso)
- [ ] Testes escritos (se aplicável)
- [ ] Tipos TypeScript corretos
- [ ] Sem `console.log` em produção
- [ ] Documentação atualizada
- [ ] `.env.example` atualizado (se novos secrets)
- [ ] Commit messages claras

---

## 🐛 Reportar Bugs

### Issue Template

```markdown
# Bug Report

## Descrição
Descreva o problema brevemente.

## Passos para Reproduzir
1. Clique em...
2. Preencha...
3. Veja o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que realmente acontece.

## Informações do Ambiente
- SO: macOS 14.0
- Node: v20.0.0
- npm: 10.0.0

## Logs/Screenshots
Anexe logs ou imagens se relevante.
```

---

## 🎨 Código Profissional: Exemplos

### ❌ ANTES: Código Desorganizado

```typescript
// src/app/(dashboard)/clientes/ClientesClient.tsx
'use client'

import { useState, useEffect } from "react"
import { updateCustomer } from "@/actions/customers"

export default function ClientesClient() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/customers')
        const data = await response.json()
        console.log('Loaded customers:', data) // ❌ console.log
        setCustomers(data)
      } catch (error) {
        console.error(error) // ❌ console.error
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div>
      {customers.map((c: any) => ( // ❌ any implícito
        <div key={c.id}>
          <h3>{c.name}</h3>
          <button onClick={async () => { // ❌ button inline async
            await updateCustomer(c.id, { name: 'Updated' })
          }}>
            Update
          </button>
        </div>
      ))}
    </div>
  )
}
```

### ✅ DEPOIS: Código Profissional

```typescript
// src/app/(dashboard)/clientes/ClientesClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';

import { fetchCustomers, updateCustomer } from '@/actions/customers';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

import type { Customer } from '@/types';

interface ClientesClientProps {
  tenantId: string;
}

export function ClientesClient({ tenantId }: ClientesClientProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomers(tenantId);
      setCustomers(data);
      logger.info('ClientesClient', `Loaded ${data.length} customers`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMsg);
      logger.error('ClientesClient', 'Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const handleUpdate = useCallback(
    async (customerId: string, name: string) => {
      try {
        await updateCustomer(customerId, { name });
        await loadCustomers();
      } catch (err) {
        logger.error('ClientesClient', 'Failed to update customer', err);
      }
    },
    [loadCustomers]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  onUpdate: (customerId: string, name: string) => Promise<void>;
}

function CustomerCard({ customer, onUpdate }: CustomerCardProps) {
  const [name, setName] = useState(customer.name);
  const [updating, setUpdating] = useState(false);

  const handleUpdateClick = async () => {
    try {
      setUpdating(true);
      await onUpdate(customer.id, name);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{customer.name}</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={updating}
      />
      <Button onClick={handleUpdateClick} disabled={updating}>
        {updating ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
}
```

---

## 📚 Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ❓ Dúvidas?

- Abra uma issue no GitHub
- Verifique issues existentes
- Procure na documentação
- Entre em contato com mantenedores

**Obrigado por contribuir! 🎉**
