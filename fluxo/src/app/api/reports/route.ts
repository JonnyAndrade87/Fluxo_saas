/**
 * Reports API endpoint
 * GET /api/reports
 * Query params: type (overdue|pending|delay|risk|executive), period, customerId, export (csv)
 */

import { auth } from '../../../../auth';
import {
  getOverdueReport,
  getPendingReport,
  getCustomerDelayReport,
  getRiskRankingReport,
  getExecutiveReport,
} from '@/actions/reports-extended';
import {
  overdueTitlesCSV,
  pendingTitlesCSV,
  customerDelayCSV,
  riskRankingCSV,
  executiveSummaryCSV,
  generateCSVWithBOM,
} from '@/lib/export-utils';

type ReportType = 'overdue' | 'pending' | 'delay' | 'risk' | 'executive';
type PeriodType = '30d' | '60d' | '90d' | '180d';

export async function GET(req: Request) {
  try {
    // ── Authentication ──────────────────────────────────────────────────
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;
    if (!tenantId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse query parameters ──────────────────────────────────────────
    const url = new URL(req.url);
    const type = (url.searchParams.get('type') || 'executive') as ReportType;
    const period = (url.searchParams.get('period') || '90d') as PeriodType;
    const customerId = url.searchParams.get('customerId') || undefined;
    const exportFormat = url.searchParams.get('export');

    // ── Validate inputs ─────────────────────────────────────────────────
    const validTypes: ReportType[] = ['overdue', 'pending', 'delay', 'risk', 'executive'];
    const validPeriods: PeriodType[] = ['30d', '60d', '90d', '180d'];

    if (!validTypes.includes(type)) {
      return Response.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    if (!validPeriods.includes(period)) {
      return Response.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

    // ── Fetch report data ───────────────────────────────────────────────
    let reportData: any;
    let reportName: string;

    switch (type) {
      case 'overdue':
        reportData = await getOverdueReport(period, customerId);
        reportName = 'Títulos Vencidos';
        break;
      case 'pending':
        reportData = await getPendingReport(customerId);
        reportName = 'Carteira a Vencer';
        break;
      case 'delay':
        reportData = await getCustomerDelayReport(period, customerId);
        reportName = 'Clientes com Maior Atraso';
        break;
      case 'risk':
        reportData = await getRiskRankingReport(period, customerId);
        reportName = 'Ranking por Risco';
        break;
      case 'executive':
        reportData = await getExecutiveReport(period);
        reportName = 'Resumo Executivo';
        break;
      default:
        return Response.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // ── If requesting CSV export ────────────────────────────────────────
    if (exportFormat === 'csv') {
      let csvContent: string;

      switch (type) {
        case 'overdue':
          csvContent = overdueTitlesCSV(reportData);
          break;
        case 'pending':
          csvContent = pendingTitlesCSV(reportData);
          break;
        case 'delay':
          csvContent = customerDelayCSV(reportData);
          break;
        case 'risk':
          csvContent = riskRankingCSV(reportData);
          break;
        case 'executive':
          csvContent = executiveSummaryCSV(reportData);
          break;
        default:
          csvContent = '';
      }

      const csvWithBOM = generateCSVWithBOM(csvContent);
      const filename = `${reportName}-${new Date().toISOString().split('T')[0]}.csv`;

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment;filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // ── Return JSON ─────────────────────────────────────────────────────
    return Response.json({
      type,
      period,
      reportName,
      data: reportData,
      generatedAt: new Date().toISOString(),
      rowCount: Array.isArray(reportData) ? reportData.length : 1,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return Response.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
