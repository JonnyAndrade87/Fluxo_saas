/**
 * ROTA REMOVIDA — /api/register
 *
 * Este endpoint de registro público legado foi desativado permanentemente.
 *
 * Motivos da remoção:
 * 1. Criava usuários sem verificação de e-mail (emailVerified hardcoded como false, isActive como false).
 * 2. Enviava e-mail de boas-vindas diferente do fluxo oficial (welcome vs. activation).
 * 3. Existência paralela ao fluxo oficial criava superfície desnecessária de ataque.
 * 4. Não aplicava as mesmas validações de senha forte do fluxo principal.
 *
 * Fluxo oficial de cadastro: POST /register (página web) → Server Action register() em src/actions/auth.ts
 *   → E-mail de ativação → GET /api/activate?token= → Login → Onboarding
 *
 * HTTP 410 Gone informa ao cliente e a crawlers que este recurso foi removido permanentemente.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint foi removido. Use o fluxo de cadastro oficial em /register.' },
    { status: 410 } // 410 Gone — permanent removal
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Este endpoint foi removido.' },
    { status: 410 }
  );
}
