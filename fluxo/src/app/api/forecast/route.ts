/**
 * API Endpoint: Previsão de Caixa (Receivables Forecast)
 * 
 * GET /api/forecast?type=weekly&days=60
 * 
 * Query params:
 * - type: 'weekly' | 'monthly' (default: weekly)
 * - days: number (default: 60, max: 365)
 * 
 * Resposta: CashFlowForecast JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getReceivablesForecast, getCustomerForecastImpact } from '@/actions/forecast';

interface SessionUser {
  tenantId: string | null;
  id: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = (session.user as SessionUser)?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'weekly') as 'weekly' | 'monthly';
    const daysParam = parseInt(searchParams.get('days') || '60', 10);
    const impact = searchParams.get('impact') === 'true';

    // Validar params
    const days = Math.min(Math.max(7, daysParam), 365);
    if (!['weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "weekly" or "monthly"' },
        { status: 400 }
      );
    }

    // Calcular forecast
    const forecast = await getReceivablesForecast(type, days);

    // Incluir impacto por cliente se solicitado
    const response: any = { forecast };  // Changed from let to const since never reassigned after initial set
    if (impact) {
      const customerImpact = await getCustomerForecastImpact();
      response.customerImpact = customerImpact;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[FORECAST API ERROR]', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
