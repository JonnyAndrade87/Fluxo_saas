import type { ReportMetrics } from '@/actions/reports';

// pdfmake is browser-only — dynamic import only on client side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfMakeModule = any;

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
const fileDate = () => new Date().toISOString().slice(0, 10);

// ─── Design tokens ─────────────────────────────────────────────────────────
const OBSIDIAN   = '#111111';
const INDIGO     = '#4F46E5';
const EMERALD    = '#059669';
const ROSE       = '#E11D48';
const AMBER      = '#D97706';
const GRAY_100   = '#F4F4F5';
const GRAY_300   = '#D4D4D8';
const GRAY_500   = '#71717A';
const GRAY_700   = '#3F3F46';
const WHITE      = '#FFFFFF';

const RISK_COLORS: Record<string, string> = {
  'Crítico': ROSE,
  'Alto':    AMBER,
  'Médio':   '#B45309',
  'Baixo':   EMERALD,
};

// ─── Builder ───────────────────────────────────────────────────────────────
export async function generateReportPdf(
  data: ReportMetrics,
  tenantName: string = 'Empresa',
  period: string = '6m'
): Promise<void> {
  const pdfmake: PdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFonts: PdfMakeModule = await import('pdfmake/build/vfs_fonts');
  pdfmake.default.vfs = pdfFonts.default.vfs;
  const pdfMake = pdfmake.default;

  const generatedAt = nowLabel();
  const filename = `relatorio_fluxo_${fileDate()}.pdf`;

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const H1 = (text: string) => ({
    text, fontSize: 20, bold: true, color: OBSIDIAN,
    margin: [0, 0, 0, 4],
  });
  const H2 = (text: string) => ({
    text, fontSize: 13, bold: true, color: OBSIDIAN,
    margin: [0, 16, 0, 6],
  });
  const label = (text: string) => ({ text, fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 });
  const value = (text: string, color = OBSIDIAN) => ({ text, fontSize: 18, bold: true, color, margin: [0, 2, 0, 0] });
  const divider = (marginV = 12) => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: GRAY_300 }], margin: [0, marginV, 0, marginV] });

  /* ── KPI block ────────────────────────────────────────────────────────── */
  const kpiGrid = {
    columns: [
      {
        width: '*', stack: [
          { text: 'FATURAMENTO BRUTO', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: fmtShort(data.totalBilled), fontSize: 18, bold: true, color: OBSIDIAN, margin: [0, 2, 0, 0] },
        ]
      },
      {
        width: '*', stack: [
          { text: 'CAIXA REALIZADO', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: fmtShort(data.totalPaid), fontSize: 18, bold: true, color: EMERALD, margin: [0, 2, 0, 0] },
        ]
      },
      {
        width: '*', stack: [
          { text: 'INADIMPLÊNCIA', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: fmtShort(data.totalOverdue), fontSize: 18, bold: true, color: data.totalOverdue > 0 ? ROSE : EMERALD, margin: [0, 2, 0, 0] },
        ]
      },
    ],
    columnGap: 20,
    margin: [0, 0, 0, 0],
  };

  const kpiGrid2 = {
    columns: [
      {
        width: '*', stack: [
          { text: 'A RECEBER', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: fmtShort(data.totalPending), fontSize: 18, bold: true, color: INDIGO, margin: [0, 2, 0, 0] },
        ]
      },
      {
        width: '*', stack: [
          { text: 'TICKET MÉDIO', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: fmtShort(data.avgTicket), fontSize: 18, bold: true, color: OBSIDIAN, margin: [0, 2, 0, 0] },
        ]
      },
      {
        width: '*', stack: [
          { text: '% INADIMPLÊNCIA', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: pct(data.defaultRate), fontSize: 18, bold: true, color: data.defaultRate > 10 ? ROSE : OBSIDIAN, margin: [0, 2, 0, 0] },
        ]
      },
    ],
    columnGap: 20,
    margin: [0, 12, 0, 0],
  };

  const kpiGrid3 = {
    columns: [
      {
        width: '*', stack: [
          { text: 'TAXA DE RECUPERAÇÃO', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: pct(data.recoveryRate), fontSize: 18, bold: true, color: data.recoveryRate > 70 ? EMERALD : AMBER, margin: [0, 2, 0, 0] },
        ]
      },
      {
        width: '*', stack: [
          { text: 'CLIENTES EM ATRASO', fontSize: 8, color: GRAY_500, bold: true, characterSpacing: 1 },
          { text: `${data.customersWithOverdue} / ${data.totalCustomers}`, fontSize: 18, bold: true, color: data.customersWithOverdue > 0 ? ROSE : EMERALD, margin: [0, 2, 0, 0] },
        ]
      },
      { width: '*', stack: [] },
    ],
    columnGap: 20,
    margin: [0, 12, 0, 0],
  };

  /* ── Monthly cashflow table ──────────────────────────────────────────── */
  const hasCashflow = data.monthlyCashflow.length > 0;
  const cashflowTableBody = [
    [
      { text: 'MÊS', style: 'tableHeader' },
      { text: 'FATURADO', style: 'tableHeader', alignment: 'right' },
      { text: 'RECEBIDO', style: 'tableHeader', alignment: 'right' },
      { text: 'ATRASADO', style: 'tableHeader', alignment: 'right' },
    ],
    ...data.monthlyCashflow.map((row, i) => [
      { text: row.month, fontSize: 9, color: GRAY_700, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: fmtShort(row.faturado), fontSize: 9, color: OBSIDIAN, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: fmtShort(row.recebido), fontSize: 9, color: EMERALD, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: fmtShort(row.atrasado), fontSize: 9, color: row.atrasado > 0 ? ROSE : GRAY_500, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
    ]),
  ];

  /* ── Per-client table ────────────────────────────────────────────────── */
  const sortedClients = [...data.clientRanking].sort((a, b) => b.totalOverdue - a.totalOverdue);
  const clientTableBody = [
    [
      { text: '#', style: 'tableHeader' },
      { text: 'CLIENTE', style: 'tableHeader' },
      { text: 'FATURADO', style: 'tableHeader', alignment: 'right' },
      { text: 'RECEBIDO', style: 'tableHeader', alignment: 'right' },
      { text: 'EM ATRASO', style: 'tableHeader', alignment: 'right' },
      { text: 'FATURAS', style: 'tableHeader', alignment: 'center' },
      { text: 'RISCO', style: 'tableHeader', alignment: 'center' },
    ],
    ...sortedClients.map((c, i) => [
      { text: `${i + 1}`, fontSize: 8, color: GRAY_500, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { stack: [
        { text: c.name, fontSize: 9, bold: true, color: OBSIDIAN },
        { text: c.documentNumber || '–', fontSize: 7, color: GRAY_500, marginTop: 1 },
      ], fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: fmtShort(c.totalBilled), fontSize: 9, color: OBSIDIAN, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: fmtShort(c.totalPaid), fontSize: 9, color: EMERALD, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: c.totalOverdue > 0 ? fmtShort(c.totalOverdue) : '–', fontSize: 9, color: c.totalOverdue > 0 ? ROSE : GRAY_500, alignment: 'right', bold: c.totalOverdue > 0, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: `${c.invoiceCount}`, fontSize: 9, color: GRAY_700, alignment: 'center', fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
      { text: c.riskLevel, fontSize: 8, bold: true, color: RISK_COLORS[c.riskLevel] ?? GRAY_500, alignment: 'center', fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
    ]),
  ];

  /* ── Critical clients ────────────────────────────────────────────────── */
  const criticalClients = sortedClients.filter(c => c.riskLevel === 'Crítico' || c.riskLevel === 'Alto');

  /* ── Auto text analysis ──────────────────────────────────────────────── */
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

  /* ── Document definition ─────────────────────────────────────────────── */
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [42, 60, 42, 56] as [number, number, number, number],

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: OBSIDIAN,
    },

    styles: {
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: WHITE,
        fillColor: OBSIDIAN,
        alignment: 'left',
      },
    },

    header: (currentPage: number) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: `RELATÓRIO FINANCEIRO – ${tenantName.toUpperCase()}`, fontSize: 7, color: GRAY_500, margin: [42, 16, 0, 0] },
          { text: `Gerado em ${generatedAt}`, fontSize: 7, color: GRAY_500, alignment: 'right', margin: [0, 16, 42, 0] },
        ],
      };
    },

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Documento gerado automaticamente pelo sistema Fluxo • ${tenantName}`, fontSize: 7, color: GRAY_500, margin: [42, 0, 0, 0] },
        { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: GRAY_500, alignment: 'right', margin: [0, 0, 42, 0] },
      ],
    }),

    content: [
      // ── CAPA ──────────────────────────────────────────────────────────
      {
        canvas: [{
          type: 'rect', x: 0, y: 0, w: 515, h: 4,
          color: INDIGO, lineColor: INDIGO,
        }],
        margin: [0, 0, 0, 28],
      },
      {
        columns: [
          {
            stack: [
              { text: 'FLUXO', fontSize: 24, bold: true, color: INDIGO, characterSpacing: 3 },
              { text: 'Sistema de Gestão Financeira', fontSize: 9, color: GRAY_500, margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: tenantName, fontSize: 11, bold: true, color: OBSIDIAN, alignment: 'right' },
              { text: `Período: ${data.periodLabel}`, fontSize: 9, color: GRAY_500, alignment: 'right', margin: [0, 2, 0, 0] },
              { text: `Gerado: ${generatedAt}`, fontSize: 8, color: GRAY_500, alignment: 'right', margin: [0, 1, 0, 0] },
            ],
          },
        ],
      },
      { ...divider(20) },
      H1('Relatório Financeiro de Cobrança e Recebíveis'),
      { text: `Análise consolidada da carteira de cobranças B2B – ${data.periodLabel}`, fontSize: 10, color: GRAY_500, margin: [0, 2, 0, 0] },

      // ── RESUMO EXECUTIVO ───────────────────────────────────────────────
      H2('1. Resumo Executivo'),
      {
        fillColor: GRAY_100,
        table: { widths: ['*'], body: [[{ border: [false,false,false,false], stack: [kpiGrid, kpiGrid2, kpiGrid3], margin: [16, 16, 16, 16] }]] },
        layout: 'noBorders',
        margin: [0, 0, 0, 0],
      },

      // ── EVOLUÇÃO MENSAL ────────────────────────────────────────────────
      ...(hasCashflow ? [
        H2('2. Evolução Mensal do Fluxo de Caixa'),
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: cashflowTableBody,
          },
          layout: {
            hLineWidth: () => 0.3,
            vLineWidth: () => 0,
            hLineColor: () => GRAY_300,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ] : []),

      // ── CARTEIRA POR CLIENTE ───────────────────────────────────────────
      H2('3. Carteira por Cliente'),
      { text: 'Ordenação: maior valor em atraso primeiro.', fontSize: 8, color: GRAY_500, margin: [0, 0, 0, 6] },
      sortedClients.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: clientTableBody,
        },
        layout: {
          hLineWidth: () => 0.3,
          vLineWidth: () => 0,
          hLineColor: () => GRAY_300,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      } : { text: 'Nenhuma fatura no período selecionado.', fontSize: 9, color: GRAY_500 },

      // ── CLIENTES CRÍTICOS ──────────────────────────────────────────────
      ...(criticalClients.length > 0 ? [
        H2('4. Clientes Críticos – Ranking de Risco'),
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'CLIENTE', style: 'tableHeader' },
                { text: 'EM ATRASO', style: 'tableHeader', alignment: 'right' },
                { text: 'RISCO', style: 'tableHeader', alignment: 'center' },
              ],
              ...criticalClients.map((c, i) => [
                { text: `${i + 1}`, fontSize: 9, color: GRAY_500, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
                { text: c.name, fontSize: 9, bold: true, color: OBSIDIAN, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
                { text: fmtShort(c.totalOverdue), fontSize: 9, color: ROSE, alignment: 'right', bold: true, fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
                { text: c.riskLevel, fontSize: 8, bold: true, color: RISK_COLORS[c.riskLevel], alignment: 'center', fillColor: i % 2 === 0 ? WHITE : GRAY_100 },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.3,
            vLineWidth: () => 0,
            hLineColor: () => GRAY_300,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ] : []),

      // ── ANÁLISE DE INADIMPLÊNCIA ───────────────────────────────────────
      H2('5. Análise de Inadimplência'),
      {
        fillColor: data.totalOverdue > 0 ? '#FFF1F2' : '#ECFDF5',
        table: {
          widths: ['*'],
          body: [[{
            border: [true, false, false, false],
            borderColor: [data.totalOverdue > 0 ? ROSE : EMERALD, '', '', ''],
            text: analysisText,
            fontSize: 10,
            color: GRAY_700,
            margin: [12, 10, 12, 10],
            lineHeight: 1.5,
          }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 0],
      },

      // ── ASSINATURA ─────────────────────────────────────────────────────
      { ...divider(24) },
      {
        columns: [
          {
            stack: [
              { text: 'Este documento foi gerado automaticamente pelo sistema Fluxo.', fontSize: 8, color: GRAY_500 },
              { text: 'Dados reais — sem interferência manual.', fontSize: 8, color: GRAY_500 },
            ],
          },
          {
            stack: [
              { text: generatedAt, fontSize: 8, color: GRAY_500, alignment: 'right' },
              { text: tenantName, fontSize: 8, bold: true, color: OBSIDIAN, alignment: 'right' },
            ],
          },
        ],
      },
    ],
  };

  pdfMake.createPdf(docDefinition).download(filename);
}
