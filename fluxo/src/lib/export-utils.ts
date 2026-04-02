/**
 * Export utilities for CSV and print-friendly formats
 * Pure functions that convert data to CSV strings
 */

// ════════════════════════════════════════════════════════════════════════
// CSV CONVERSION
// ════════════════════════════════════════════════════════════════════════

/**
 * Escape CSV values and handle special characters
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format currency for CSV
 */
export function formatCurrencyCSV(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate CSV with UTF-8 BOM (for Excel compatibility)
 */
export function generateCSVWithBOM(csvContent: string): string {
  // UTF-8 BOM
  const BOM = '\ufeff';
  return BOM + csvContent;
}

// ════════════════════════════════════════════════════════════════════════
// REPORT-SPECIFIC CSV GENERATORS
// ════════════════════════════════════════════════════════════════════════

export function overdueTitlesCSV(
  data: Array<{
    invoiceNumber: string;
    customerName: string;
    dueDate: string;
    daysOverdue: number;
    updatedAmount: number;
    riskLevel: string;
  }>
): string {
  const headers = ['Nota Fiscal', 'Cliente', 'Data Vencimento', 'Dias Vencido', 'Saldo Devedor', 'Risco'];
  const rows = data.map(item => [
    escapeCSV(item.invoiceNumber),
    escapeCSV(item.customerName),
    escapeCSV(item.dueDate),
    escapeCSV(item.daysOverdue),
    escapeCSV(formatCurrencyCSV(item.updatedAmount)),
    escapeCSV(item.riskLevel),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function pendingTitlesCSV(
  data: Array<{
    invoiceNumber: string;
    customerName: string;
    dueDate: string;
    daysUntilDue: number;
    amount: number;
    riskLevel: string;
  }>
): string {
  const headers = ['Nota Fiscal', 'Cliente', 'Data Vencimento', 'Dias para Vencer', 'Valor', 'Risco'];
  const rows = data.map(item => [
    escapeCSV(item.invoiceNumber),
    escapeCSV(item.customerName),
    escapeCSV(item.dueDate),
    escapeCSV(item.daysUntilDue),
    escapeCSV(formatCurrencyCSV(item.amount)),
    escapeCSV(item.riskLevel),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function customerDelayCSV(
  data: Array<{
    customerName: string;
    overdueCount: number;
    overdueValue: number;
    maxDaysOverdue: number;
    oldestOverdueDate: string;
    riskLevel: string;
  }>
): string {
  const headers = ['Cliente', 'Quantidade Vencida', 'Valor Vencido', 'Dias Máximo', 'Título Mais Antigo', 'Risco'];
  const rows = data.map(item => [
    escapeCSV(item.customerName),
    escapeCSV(item.overdueCount),
    escapeCSV(formatCurrencyCSV(item.overdueValue)),
    escapeCSV(item.maxDaysOverdue),
    escapeCSV(item.oldestOverdueDate),
    escapeCSV(item.riskLevel),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function riskRankingCSV(
  data: Array<{
    customerName: string;
    documentNumber: string;
    riskLevel: string;
    riskScore: number;
    totalBilled: number;
    totalOverdue: number;
    overdueTitles: number;
  }>
): string {
  const headers = [
    'Cliente',
    'CNPJ/CPF',
    'Nível Risco',
    'Score Risco',
    'Total Faturado',
    'Total Vencido',
    'Títulos Vencidos',
  ];
  const rows = data.map(item => [
    escapeCSV(item.customerName),
    escapeCSV(item.documentNumber),
    escapeCSV(item.riskLevel),
    escapeCSV(item.riskScore),
    escapeCSV(formatCurrencyCSV(item.totalBilled)),
    escapeCSV(formatCurrencyCSV(item.totalOverdue)),
    escapeCSV(item.overdueTitles),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function executiveSummaryCSV(data: {
  generatedAt: string;
  periodLabel: string;
  totalBilled: number;
  totalRecovered: number;
  totalOverdue: number;
  totalPending: number;
  avgDaysOverdue: number;
  defaultRate: number;
  recoveryRate: number;
  totalCustomers: number;
  customersWithOverdue: number;
  topOverdueCustomer: { name: string; value: number } | null;
  healthStatus: string;
}): string {
  const lines = [
    ['RESUMO EXECUTIVO'],
    [],
    ['Gerado em', data.generatedAt],
    ['Período', data.periodLabel],
    [],
    ['MÉTRICAS PRINCIPAIS'],
    ['Total Faturado', formatCurrencyCSV(data.totalBilled)],
    ['Total Recuperado', formatCurrencyCSV(data.totalRecovered)],
    ['Total em Atraso', formatCurrencyCSV(data.totalOverdue)],
    ['Total a Vencer', formatCurrencyCSV(data.totalPending)],
    [],
    ['INDICADORES'],
    ['Taxa de Inadimplência (%)', data.defaultRate.toString()],
    ['Taxa de Recuperação (%)', data.recoveryRate.toString()],
    ['Dias Médio de Atraso', data.avgDaysOverdue.toString()],
    [],
    ['CLIENTES'],
    ['Total de Clientes', data.totalCustomers.toString()],
    ['Clientes com Atraso', data.customersWithOverdue.toString()],
    [],
    ['DESTAQUE'],
    [
      'Cliente com Maior Atraso',
      data.topOverdueCustomer
        ? `${data.topOverdueCustomer.name} - ${formatCurrencyCSV(data.topOverdueCustomer.value)}`
        : 'Nenhum',
    ],
    ['Status de Saúde', data.healthStatus],
  ];

  return lines.map(row => row.map(escapeCSV).join(',')).join('\n');
}

// ════════════════════════════════════════════════════════════════════════
// DOWNLOAD TRIGGER
// ════════════════════════════════════════════════════════════════════════

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const csv = generateCSVWithBOM(csvContent);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ════════════════════════════════════════════════════════════════════════
// PRINT UTILITIES (Prepare data for print layout)
// ════════════════════════════════════════════════════════════════════════

/**
 * Timestamp for report header
 */
export function getPrintTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate print CSS styles
 */
export function getPrintStyles(): string {
  return `
    @media print {
      body {
        font-family: Arial, sans-serif;
        color: #000;
        background: #fff;
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        page-break-inside: avoid;
      }
      th, td {
        border: 1px solid #999;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .page-break {
        page-break-after: always;
      }
    }
  `;
}
