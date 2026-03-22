/**
 * Módulo Centralizado de Score de Risco (0-100)
 * 
 * NOTA: Esta é uma função pura (não um Server Action).
 * Exportada de lib/ para ser usada em actions, components e APIs.
 * 
 * Fórmula auditável e explicável baseada em 5 critérios:
 * 1. Número de atrasos (delayCount)
 * 2. Atraso máximo em dias (maxDelayDays)
 * 3. Atraso médio em dias (avgDelayDays)
 * 4. Valor total em aberto (openAmount)
 * 5. Reincidência de promessas quebradas (promisesBrokenCount)
 * 
 * Faixas de Risco:
 * 0-25:  🟢 Baixo
 * 26-50: 🟡 Médio
 * 51-75: 🟠 Alto
 * 76-100: 🔴 Crítico
 */

export interface RiskScoreComponent {
  name: string;
  value: number;
  weight: number; // Peso na fórmula final (0-1)
  maxPoints: number; // Pontos máximos que pode contribuir
  contribution: number; // Pontos efetivamente contribuindo
  explanation: string; // Explicação clara para auditoria
}

export interface RiskScoreResult {
  score: number; // 0-100
  level: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  components: RiskScoreComponent[];
  justification: string; // Explicação amigável em português
  recommendation: string; // Ação sugerida
  calculatedAt: Date;
  
  // Dados brutos para análise
  metadata: {
    delayCount: number;
    maxDelayDays: number;
    avgDelayDays: number;
    openAmount: number;
    promisesBrokenCount: number;
    recurrenceLevel: 'isolado' | 'recorrente' | 'crônico';
  };
}

/**
 * Calcula o score de risco de um cliente baseado em seus histórico de pagamentos
 */
export function calculateRiskScore(data: {
  delayCount: number; // Quantidade de faturas atrasadas (histórico)
  maxDelayDays: number; // Maior atraso em dias
  avgDelayDays: number; // Atraso médio
  openAmount: number; // Valor total em aberto (pendente + atrasado)
  promisesBrokenCount: number; // Quantas promessas de pagamento foram quebradas
  totalInvoices: number; // Total de faturas (para contexto de reincidência)
}): RiskScoreResult {
  const components: RiskScoreComponent[] = [];
  let totalPoints = 0;
  const maxPossible = 100;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTE 1: Número de Atrasos (Reincidência)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const delayComponent = (() => {
    const weight = 0.20; // 20% do peso
    const maxPoints = 20;
    
    // Curva: 0 atrasos = 0, 1-2 = 5, 3+ = 20
    let contribution = 0;
    if (data.delayCount === 0) contribution = 0;
    else if (data.delayCount === 1) contribution = 5;
    else if (data.delayCount === 2) contribution = 10;
    else contribution = Math.min(20, 5 + data.delayCount * 3); // Cresce com mais atrasos

    totalPoints += contribution;

    return {
      name: 'Número de Atrasos',
      value: data.delayCount,
      weight,
      maxPoints,
      contribution,
      explanation: `Cliente tem ${data.delayCount} ${data.delayCount === 1 ? 'atraso' : 'atrasos'} no histórico (${data.totalInvoices} faturas)`
    };
  })();
  components.push(delayComponent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTE 2: Atraso Máximo (Intensidade)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const maxDelayComponent = (() => {
    const weight = 0.25; // 25% do peso
    const maxPoints = 25;
    
    // Escala: 0-10 dias = 0, 10-30 = 5, 30-60 = 15, 60-90 = 20, 90+ = 25
    let contribution = 0;
    if (data.maxDelayDays <= 10) contribution = 0;
    else if (data.maxDelayDays <= 30) contribution = 5;
    else if (data.maxDelayDays <= 60) contribution = 15;
    else if (data.maxDelayDays <= 90) contribution = 20;
    else contribution = 25; // 90+ dias = crítico

    totalPoints += contribution;

    return {
      name: 'Atraso Máximo',
      value: data.maxDelayDays,
      weight,
      maxPoints,
      contribution,
      explanation: `Maior atraso em ${data.maxDelayDays} dias${data.maxDelayDays > 60 ? ' (crítico)' : ''}`
    };
  })();
  components.push(maxDelayComponent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTE 3: Atraso Médio (Padrão de Comportamento)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const avgDelayComponent = (() => {
    const weight = 0.15; // 15% do peso
    const maxPoints = 15;
    
    // Escala: 0-15 dias = 0, 15-30 = 5, 30-45 = 10, 45+ = 15
    let contribution = 0;
    if (data.avgDelayDays <= 15) contribution = 0;
    else if (data.avgDelayDays <= 30) contribution = 5;
    else if (data.avgDelayDays <= 45) contribution = 10;
    else contribution = 15;

    totalPoints += contribution;

    return {
      name: 'Atraso Médio',
      value: parseFloat(data.avgDelayDays.toFixed(1)),
      weight,
      maxPoints,
      contribution,
      explanation: `Padrão de atraso médio: ${data.avgDelayDays.toFixed(1)} dias`
    };
  })();
  components.push(avgDelayComponent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTE 4: Valor em Aberto (Exposição Financeira)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const openAmountComponent = (() => {
    const weight = 0.25; // 25% do peso
    const maxPoints = 25;
    
    // Escala baseada em faixas de valor (em reais)
    // 0-5k = 0, 5k-15k = 5, 15k-35k = 15, 35k-50k = 20, 50k+ = 25
    let contribution = 0;
    if (data.openAmount <= 5000) contribution = 0;
    else if (data.openAmount <= 15000) contribution = 5;
    else if (data.openAmount <= 35000) contribution = 15;
    else if (data.openAmount <= 50000) contribution = 20;
    else contribution = 25;

    totalPoints += contribution;

    return {
      name: 'Valor em Aberto',
      value: data.openAmount,
      weight,
      maxPoints,
      contribution,
      explanation: `Exposição financeira: R$ ${data.openAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  })();
  components.push(openAmountComponent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTE 5: Promessas Quebradas (Confiabilidade)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const promisesBrokenComponent = (() => {
    const weight = 0.15; // 15% do peso
    const maxPoints = 15;
    
    // Escala: 0 quebradas = 0, 1 = 5, 2 = 10, 3+ = 15
    let contribution = 0;
    if (data.promisesBrokenCount === 0) contribution = 0;
    else if (data.promisesBrokenCount === 1) contribution = 5;
    else if (data.promisesBrokenCount === 2) contribution = 10;
    else contribution = 15; // 3+ é crítico

    totalPoints += contribution;

    return {
      name: 'Promessas Quebradas',
      value: data.promisesBrokenCount,
      weight,
      maxPoints,
      contribution,
      explanation: `${data.promisesBrokenCount === 0 ? 'Sem promessas quebradas' : `${data.promisesBrokenCount} ${data.promisesBrokenCount === 1 ? 'promessa' : 'promessas'} não cumpridas`}`
    };
  })();
  components.push(promisesBrokenComponent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CÁLCULO FINAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const score = Math.min(100, Math.round(totalPoints));

  // Definir nível de risco
  let level: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  if (score <= 25) level = 'Baixo';
  else if (score <= 50) level = 'Médio';
  else if (score <= 75) level = 'Alto';
  else level = 'Crítico';

  // Determinar nível de reincidência
  const recurrenceLevel: 'isolado' | 'recorrente' | 'crônico' =
    data.delayCount === 0 ? 'isolado' :
    data.delayCount <= 2 ? 'recorrente' :
    'crônico';

  // Gerar justificativa amigável
  const justification = (() => {
    const parts: string[] = [];

    // Análise de atrasos
    if (data.delayCount === 0) {
      parts.push('✅ Sem atrasos registrados');
    } else if (data.delayCount === 1) {
      parts.push('⚠️ Atraso isolado');
    } else if (data.delayCount <= 3) {
      parts.push(`⚠️ Padrão de ${data.delayCount} atrasos (recorrente)`);
    } else {
      parts.push(`🔴 Cliente com ${data.delayCount} atrasos (padrão crônico)`);
    }

    // Análise de valor
    if (data.openAmount > 50000) {
      parts.push(`⚠️ Alto valor em aberto (R$ ${(data.openAmount / 1000).toFixed(0)}k)`);
    } else if (data.openAmount > 20000) {
      parts.push(`Exposição significativa (R$ ${(data.openAmount / 1000).toFixed(0)}k)`);
    }

    // Análise de máximo atraso
    if (data.maxDelayDays > 90) {
      parts.push(`🔴 Atraso crítico (${data.maxDelayDays} dias)`);
    } else if (data.maxDelayDays > 60) {
      parts.push(`⚠️ Atraso prolongado (${data.maxDelayDays} dias)`);
    }

    // Análise de promessas
    if (data.promisesBrokenCount > 0) {
      parts.push(`❌ ${data.promisesBrokenCount} ${data.promisesBrokenCount === 1 ? 'promessa' : 'promessas'} quebrada(s)`);
    }

    return parts.join(' • ');
  })();

  // Gerar recomendação acionável
  const recommendation = (() => {
    if (level === 'Crítico') {
      return '🚨 AÇÃO IMEDIATA: Escalar para legal ou gerência. Considerar contato direto.';
    } else if (level === 'Alto') {
      return '⚡ PRIORIDADE: Intensificar cobrança. Negociar parcelamento ou desconto.';
    } else if (level === 'Médio') {
      return '📞 ACOMPANHAMENTO: Manter contato periódico. Monitorar próximas datas.';
    } else {
      return '✅ MANUTENÇÃO: Cliente com bom histórico. Renovar contato periodicamente.';
    }
  })();

  return {
    score,
    level,
    components,
    justification,
    recommendation,
    calculatedAt: new Date(),
    metadata: {
      delayCount: data.delayCount,
      maxDelayDays: data.maxDelayDays,
      avgDelayDays: parseFloat(data.avgDelayDays.toFixed(1)),
      openAmount: data.openAmount,
      promisesBrokenCount: data.promisesBrokenCount,
      recurrenceLevel
    }
  };
}
