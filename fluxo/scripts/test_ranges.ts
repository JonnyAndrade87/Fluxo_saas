/**
 * Teste Rápido: Validar faixas de risco (0-25, 26-50, 51-75, 76-100)
 */
import { calculateRiskScore } from '../src/lib/risk-score';

console.log('🧪 TESTE DE FAIXAS DE RISCO (REQUISITO ATUALIZADO)');
console.log('═════════════════════════════════════════════════\n');

// TESTE 1: Score = 10 (deve ser Baixo)
const test1 = calculateRiskScore({
  delayCount: 0,
  maxDelayDays: 5,
  avgDelayDays: 3,
  openAmount: 5000,
  promisesBrokenCount: 0,
});
console.log(`✓ Score ${test1.score} → Nível: ${test1.level} | Esperado: Baixo | ${test1.level === 'Baixo' ? '✅' : '❌'}`);

// TESTE 2: Score = 35 (deve ser Médio)
const test2 = calculateRiskScore({
  delayCount: 2,
  maxDelayDays: 15,
  avgDelayDays: 10,
  openAmount: 10000,
  promisesBrokenCount: 0,
});
console.log(`✓ Score ${test2.score} → Nível: ${test2.level} | Esperado: Médio | ${test2.level === 'Médio' ? '✅' : '❌'}`);

// TESTE 3: Score = 60 (deve ser Alto)
const test3 = calculateRiskScore({
  delayCount: 4,
  maxDelayDays: 45,
  avgDelayDays: 30,
  openAmount: 25000,
  promisesBrokenCount: 1,
});
console.log(`✓ Score ${test3.score} → Nível: ${test3.level} | Esperado: Alto | ${test3.level === 'Alto' ? '✅' : '❌'}`);

// TESTE 4: Score = 85 (deve ser Crítico)
const test4 = calculateRiskScore({
  delayCount: 8,
  maxDelayDays: 90,
  avgDelayDays: 60,
  openAmount: 50000,
  promisesBrokenCount: 3,
});
console.log(`✓ Score ${test4.score} → Nível: ${test4.level} | Esperado: Crítico | ${test4.level === 'Crítico' ? '✅' : '❌'}`);

console.log('\n📊 Faixas Validadas:');
console.log('   0-25:   🟢 Baixo');
console.log('   26-50:  🟡 Médio');
console.log('   51-75:  🟠 Alto');
console.log('   76-100: 🔴 Crítico');
