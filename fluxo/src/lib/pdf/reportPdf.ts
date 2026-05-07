import type { ReportMetrics } from '@/actions/reports';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(2)}k`;
  return fmt.format(v);
};
const pct = (v: number) => `${v.toFixed(1)}%`;
const nowLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Simple HTML escaper
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function generateReportPdf(
  data: ReportMetrics,
  tenantName: string = 'Empresa',
  period: string = '6m'
): Promise<void> {
  const generatedAt = nowLabel();
  const sortedClients = [...data.clientRanking].sort((a, b) => b.totalOverdue - a.totalOverdue);
  const criticalClients = sortedClients.filter(c => c.riskLevel === 'Crítico' || c.riskLevel === 'Alto');

  let analysisText = 'Não há inadimplência registrada no período analisado. A carteira encontra-se saudável.';
  if (data.totalOverdue > 0 && data.totalBilled > 0) {
    const topDebtors = criticalClients.slice(0, 3).map(c => c.name).join(', ');
    analysisText = `A inadimplência no período representa ${pct(data.defaultRate)} do faturamento total (${fmtShort(data.totalOverdue)} em aberto).`;
    if (topDebtors) {
      analysisText += ` Os principais devedores são: ${topDebtors}.`;
    }
    if (data.recoveryRate < 50) {
      analysisText += ` A taxa de recuperação está abaixo de 50%, sinalizando necessidade de ação imediata na régua de cobranças.`;
    } else if (data.recoveryRate >= 80) {
      analysisText += ` A taxa de recuperação de ${pct(data.recoveryRate)} está acima da média de mercado, demonstrando eficiência operacional.`;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - ${escapeHtml(tenantName)}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          color: #111111;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        * { box-sizing: border-box; }
        .header-bar { border-top: 4px solid #4F46E5; margin-bottom: 20px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-indigo { color: #4F46E5; }
        .text-emerald { color: #059669; }
        .text-rose { color: #E11D48; }
        .text-amber { color: #D97706; }
        .text-gray { color: #71717A; }
        .text-light { color: #A1A1AA; }
        .bg-gray { background-color: #F4F4F5; }
        .bg-dark { background-color: #111111; color: #FFFFFF; }
        h1 { font-size: 18pt; margin: 0 0 5px 0; color: #111111; }
        h2 { font-size: 12pt; margin: 20px 0 10px 0; color: #111111; border-bottom: 1px solid #D4D4D8; padding-bottom: 4px; }
        .kpi-grid { display: flex; margin-bottom: 15px; gap: 15px; }
        .kpi-box { flex: 1; padding: 10px; background-color: #F4F4F5; border-radius: 4px; }
        .kpi-title { font-size: 7pt; text-transform: uppercase; color: #71717A; font-weight: bold; margin-bottom: 4px; }
        .kpi-val { font-size: 14pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
        th { background-color: #111111; color: #FFFFFF; padding: 6px; text-align: left; font-size: 8pt; }
        td { padding: 6px; border-bottom: 1px solid #E4E4E7; }
        tr:nth-child(even) td { background-color: #FAFAFA; }
        .analysis-box { padding: 12px; border-left: 4px solid ${data.totalOverdue > 0 ? '#E11D48' : '#059669'}; background-color: ${data.totalOverdue > 0 ? '#FFF1F2' : '#ECFDF5'}; margin-bottom: 20px; }
        .footer { margin-top: 30px; font-size: 7pt; color: #A1A1AA; border-top: 1px solid #E4E4E7; padding-top: 10px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header-bar"></div>

      <div class="flex justify-between" style="margin-bottom: 20px;">
        <div>
          <div style="font-size: 20pt; font-weight: bold; color: #4F46E5; letter-spacing: 2px;">FLUXO</div>
          <div style="font-size: 8pt; color: #71717A;">Sistema de Gestão Financeira</div>
        </div>
        <div class="text-right">
          <div class="font-bold">${escapeHtml(tenantName)}</div>
          <div style="font-size: 8pt; color: #71717A;">Período: ${escapeHtml(data.periodLabel)}</div>
          <div style="font-size: 7pt; color: #A1A1AA;">Gerado: ${escapeHtml(generatedAt)}</div>
        </div>
      </div>

      <h1>Relatório Financeiro de Cobrança e Recebíveis</h1>
      <div style="font-size: 9pt; color: #71717A; margin-bottom: 20px;">Análise consolidada da carteira de cobranças B2B – ${escapeHtml(data.periodLabel)}</div>

      <h2>1. Resumo Executivo</h2>
      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-title">Faturamento Bruto</div>
          <div class="kpi-val">${escapeHtml(fmtShort(data.totalBilled))}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Caixa Realizado</div>
          <div class="kpi-val text-emerald">${escapeHtml(fmtShort(data.totalPaid))}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Inadimplência</div>
          <div class="kpi-val ${data.totalOverdue > 0 ? 'text-rose' : 'text-emerald'}">${escapeHtml(fmtShort(data.totalOverdue))}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-title">A Receber</div>
          <div class="kpi-val text-indigo">${escapeHtml(fmtShort(data.totalPending))}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Ticket Médio</div>
          <div class="kpi-val">${escapeHtml(fmtShort(data.avgTicket))}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">% Inadimplência</div>
          <div class="kpi-val ${data.defaultRate > 10 ? 'text-rose' : ''}">${escapeHtml(pct(data.defaultRate))}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-title">Taxa de Recuperação</div>
          <div class="kpi-val ${data.recoveryRate > 70 ? 'text-emerald' : 'text-amber'}">${escapeHtml(pct(data.recoveryRate))}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Clientes em Atraso</div>
          <div class="kpi-val ${data.customersWithOverdue > 0 ? 'text-rose' : 'text-emerald'}">${escapeHtml(String(data.customersWithOverdue))} / ${escapeHtml(String(data.totalCustomers))}</div>
        </div>
      </div>

      ${data.monthlyCashflow.length > 0 ? `
      <h2>2. Evolução Mensal do Fluxo de Caixa</h2>
      <table>
        <thead>
          <tr>
            <th>MÊS</th>
            <th class="text-right">FATURADO</th>
            <th class="text-right">RECEBIDO</th>
            <th class="text-right">ATRASADO</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyCashflow.map(row => `
            <tr>
              <td>${escapeHtml(row.month)}</td>
              <td class="text-right font-bold">${escapeHtml(fmtShort(row.faturado))}</td>
              <td class="text-right font-bold text-emerald">${escapeHtml(fmtShort(row.recebido))}</td>
              <td class="text-right font-bold ${row.atrasado > 0 ? 'text-rose' : 'text-gray'}">${escapeHtml(fmtShort(row.atrasado))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <h2>3. Carteira por Cliente</h2>
      <div style="font-size: 7pt; color: #71717A; margin-bottom: 5px;">Ordenação: maior valor em atraso primeiro.</div>
      ${sortedClients.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>CLIENTE</th>
            <th class="text-right">FATURADO</th>
            <th class="text-right">RECEBIDO</th>
            <th class="text-right">EM ATRASO</th>
            <th class="text-center">FATURAS</th>
            <th class="text-center">RISCO</th>
          </tr>
        </thead>
        <tbody>
          ${sortedClients.map((c, i) => `
            <tr>
              <td class="text-gray" style="font-size: 7pt;">${i + 1}</td>
              <td>
                <div class="font-bold">${escapeHtml(c.name)}</div>
                <div style="font-size: 7pt; color: #71717A;">${escapeHtml(c.documentNumber || '–')}</div>
              </td>
              <td class="text-right font-bold">${escapeHtml(fmtShort(c.totalBilled))}</td>
              <td class="text-right font-bold text-emerald">${escapeHtml(fmtShort(c.totalPaid))}</td>
              <td class="text-right font-bold ${c.totalOverdue > 0 ? 'text-rose' : 'text-gray'}">${c.totalOverdue > 0 ? escapeHtml(fmtShort(c.totalOverdue)) : '–'}</td>
              <td class="text-center">${escapeHtml(String(c.invoiceCount))}</td>
              <td class="text-center font-bold" style="font-size: 7pt; color: ${c.riskLevel === 'Crítico' ? '#E11D48' : c.riskLevel === 'Alto' ? '#D97706' : c.riskLevel === 'Médio' ? '#B45309' : '#059669'}">${escapeHtml(c.riskLevel)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<div style="font-size: 8pt; color: #71717A;">Nenhuma fatura no período selecionado.</div>'}

      ${criticalClients.length > 0 ? `
      <h2>4. Clientes Críticos – Ranking de Risco</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>CLIENTE</th>
            <th class="text-right">EM ATRASO</th>
            <th class="text-center">RISCO</th>
          </tr>
        </thead>
        <tbody>
          ${criticalClients.map((c, i) => `
            <tr>
              <td class="text-gray" style="font-size: 7pt;">${i + 1}</td>
              <td class="font-bold">${escapeHtml(c.name)}</td>
              <td class="text-right font-bold text-rose">${escapeHtml(fmtShort(c.totalOverdue))}</td>
              <td class="text-center font-bold" style="font-size: 7pt; color: ${c.riskLevel === 'Crítico' ? '#E11D48' : '#D97706'}">${escapeHtml(c.riskLevel)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <h2>5. Análise de Inadimplência</h2>
      <div class="analysis-box">
        ${escapeHtml(analysisText)}
      </div>

      <div class="footer">
        <div>Este documento foi gerado automaticamente pelo sistema Fluxo. Dados reais — sem interferência manual.</div>
        <div class="text-right font-bold" style="color: #111111;">${escapeHtml(tenantName)}</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para gerar o relatório.');
  }
}
