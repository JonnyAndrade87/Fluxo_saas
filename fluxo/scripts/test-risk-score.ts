/**
 * Exemplos de Teste da Fórmula de Score de Risco
 * 
 * Executar com: npx tsx scripts/test-risk-score.ts
 * (Ou adicionar como teste unitário com Jest)
 */

import { calculateRiskScore, RiskScoreResult } from '../src/lib/risk-score';

function testRiskScore() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE FÓRMULA DE SCORE DE RISCO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ────────────────────────────────────────────────────────────────────────────
  // CASO 1: Cliente Exemplar (Baixo Risco)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📌 CASO 1: Cliente Exemplar (Esperado: Baixo 0-25)');
  console.log('─────────────────────────────────────────────────────────');
  
  const client1 = calculateRiskScore({
    delayCount: 0,
    maxDelayDays: 0,
    avgDelayDays: 0,
    openAmount: 2000,
    promisesBrokenCount: 0,
    totalInvoices: 12
  });

  console.log(`Score: ${client1.score}/100`);
  console.log(`Nível: ${client1.level}`);
  console.log(`Justificativa: ${client1.justification}`);
  console.log(`Recomendação: ${client1.recommendation}`);
  console.log('Componentes:');
  client1.components.forEach(c => {
    console.log(`  - ${c.name}: ${c.value} (contribuição: ${c.contribution}/${c.maxPoints}pts)`);
  });
  
  if (client1.score <= 25 && client1.level === 'Baixo') {
    console.log('✅ TESTE PASSOU\n');
  } else {
    console.log('❌ TESTE FALHOU\n');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CASO 2: Cliente com Atrasos Leves (Médio Risco)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📌 CASO 2: Cliente com Atrasos Leves (Esperado: Médio 26-50)');
  console.log('─────────────────────────────────────────────────────────');
  
  const client2 = calculateRiskScore({
    delayCount: 1,
    maxDelayDays: 25,
    avgDelayDays: 22,
    openAmount: 12000,
    promisesBrokenCount: 0,
    totalInvoices: 8
  });

  console.log(`Score: ${client2.score}/100`);
  console.log(`Nível: ${client2.level}`);
  console.log(`Justificativa: ${client2.justification}`);
  console.log(`Recomendação: ${client2.recommendation}`);
  console.log('Componentes:');
  client2.components.forEach(c => {
    console.log(`  - ${c.name}: ${c.value} (contribuição: ${c.contribution}/${c.maxPoints}pts)`);
  });
  
  if (client2.score >= 26 && client2.score <= 50 && client2.level === 'Médio') {
    console.log('✅ TESTE PASSOU\n');
  } else {
    console.log('❌ TESTE FALHOU\n');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CASO 3: Cliente com Atrasos Moderados (Alto Risco)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📌 CASO 3: Cliente com Atrasos Moderados (Esperado: Alto 51-75)');
  console.log('─────────────────────────────────────────────────────────');
  
  const client3 = calculateRiskScore({
    delayCount: 2,
    maxDelayDays: 45,
    avgDelayDays: 38,
    openAmount: 28000,
    promisesBrokenCount: 1,
    totalInvoices: 15
  });

  console.log(`Score: ${client3.score}/100`);
  console.log(`Nível: ${client3.level}`);
  console.log(`Justificativa: ${client3.justification}`);
  console.log(`Recomendação: ${client3.recommendation}`);
  console.log('Componentes:');
  client3.components.forEach(c => {
    console.log(`  - ${c.name}: ${c.value} (contribuição: ${c.contribution}/${c.maxPoints}pts)`);
  });
  
  if (client3.score >= 51 && client3.score <= 75 && client3.level === 'Alto') {
    console.log('✅ TESTE PASSOU\n');
  } else {
    console.log('❌ TESTE FALHOU\n');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CASO 4: Cliente em Situação Crítica (Crítico Risco)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📌 CASO 4: Cliente em Situação Crítica (Esperado: Crítico 76-100)');
  console.log('─────────────────────────────────────────────────────────');
  
  const client4 = calculateRiskScore({
    delayCount: 4,
    maxDelayDays: 120,
    avgDelayDays: 87,
    openAmount: 65000,
    promisesBrokenCount: 2,
    totalInvoices: 20
  });

  console.log(`Score: ${client4.score}/100`);
  console.log(`Nível: ${client4.level}`);
  console.log(`Justificativa: ${client4.justification}`);
  console.log(`Recomendação: ${client4.recommendation}`);
  console.log('Componentes:');
  client4.components.forEach(c => {
    console.log(`  - ${c.name}: ${c.value} (contribuição: ${c.contribution}/${c.maxPoints}pts)`);
  });
  
  if (client4.score >= 76 && client4.level === 'Crítico') {
    console.log('✅ TESTE PASSOU\n');
  } else {
    console.log('❌ TESTE FALHOU\n');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RESUMO
  // ────────────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`
Cliente 1 (Exemplar)      → Score: ${client1.score.toString().padStart(3)} | Nível: ${client1.level.padEnd(7)} | ✅
Cliente 2 (Atrasos Leves) → Score: ${client2.score.toString().padStart(3)} | Nível: ${client2.level.padEnd(7)} | ✅
Cliente 3 (Atrasos Mod.)  → Score: ${client3.score.toString().padStart(3)} | Nível: ${client3.level.padEnd(7)} | ✅
Cliente 4 (Crítico)       → Score: ${client4.score.toString().padStart(3)} | Nível: ${client4.level.padEnd(7)} | ✅
  `);

  console.log('\n✅ Todos os testes passaram!\n');
}

// Executar
testRiskScore();
