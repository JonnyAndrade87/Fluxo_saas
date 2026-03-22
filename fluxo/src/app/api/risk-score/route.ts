/**
 * API Endpoint para Score de Risco
 * GET /api/risk-score?customerId=:customerId
 * 
 * Retorna o score numérico (0-100), nível de risco, componentes auditáveis e justificativa.
 * Pronto para integração com webhooks, integrações externas e relatórios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getRiskScoreForCustomer } from '@/actions/risk-score';

interface SessionUser {
  tenantId: string | null;
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter is required' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AUTENTICAÇÃO E AUTORIZAÇÃO
    // ────────────────────────────────────────────────────────────────────────────
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    const tenantId = user?.tenantId;

    if (!tenantId || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: No active tenant' },
        { status: 401 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // BUSCAR SCORE
    // ────────────────────────────────────────────────────────────────────────────
    const riskScore = await getRiskScoreForCustomer(customerId, tenantId);

    if (!riskScore) {
      return NextResponse.json(
        { error: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────────
    // RESPOSTA ESTRUTURADA
    // ────────────────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: riskScore,
      // Meta informações sobre o cálculo
      meta: {
        calculatedAt: new Date().toISOString(),
        version: '1.0',
        formula: 'Weighted sum of 5 components: delayCount(20%) + maxDelayDays(25%) + avgDelayDays(15%) + openAmount(25%) + promisesBroken(15%)'
      }
    });
  } catch (error) {
    console.error('[RISK-SCORE API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
