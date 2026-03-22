# 📊 Módulo de Score de Risco - Documentação Técnica

**Data de Implementação:** 22 de março de 2026  
**Status:** ✅ Produção  
**Versão:** 1.0

---

## 🎯 Objetivo

Priorizar clientes que representam maior risco financeiro através de um score numérico auditável (0-100) com explicação clara e recomendações acionáveis.

---

## 📐 Fórmula de Cálculo

### Componentes (5 fatores ponderados)

| # | Componente | Peso | Max Pts | Escala | Descrição |
|---|-----------|------|---------|--------|-----------|
| 1 | **Número de Atrasos** | 20% | 20 | 0→1→2→3+ atrasos | Reincidência de inadimplência (histórico completo) |
| 2 | **Atraso Máximo (dias)** | 25% | 25 | 10→30→60→90+ dias | Intensidade: quanto tempo está atrasado |
| 3 | **Atraso Médio (dias)** | 15% | 15 | 15→30→45+ dias | Padrão comportamental |
| 4 | **Valor em Aberto** | 25% | 25 | 5k→15k→35k→50k+ | Exposição financeira |
| 5 | **Promessas Quebradas** | 15% | 15 | 0→1→2→3+ | Confiabilidade: compromissos não cumpridos |

### Fórmula Matemática

```
SCORE = MIN(100, Σ(componente_i.contribuição_i)) × fator_recência
```

Cada componente contribui seus pontos de acordo com sua escala:

#### Componente 1: Atrasos (20%)
```
0 atrasos     → 0 pts
1 atraso      → 5 pts
2 atrasos     → 10 pts
3+ atrasos    → 20 pts (máximo)
```

#### Componente 2: Atraso Máximo (25%)
```
≤ 10 dias     → 0 pts
11-30 dias    → 5 pts
31-60 dias    → 15 pts
61-90 dias    → 20 pts
> 90 dias     → 25 pts (crítico)
```

#### Componente 3: Atraso Médio (15%)
```
≤ 15 dias     → 0 pts
16-30 dias    → 5 pts
31-45 dias    → 10 pts
> 45 dias     → 15 pts
```

#### Componente 4: Valor em Aberto (25%)
```
≤ 5.000       → 0 pts
5k-15k        → 5 pts
15k-35k       → 15 pts
35k-50k       → 20 pts
> 50.000      → 25 pts (crítico)
```

#### Componente 5: Promessas Quebradas (15%)
```
0 quebradas   → 0 pts
1 quebrada    → 5 pts
2 quebradas   → 10 pts
3+ quebradas  → 15 pts (crítico)
```

---

## 🎨 Faixas de Risco

| Faixa | Score | Cor | Emoji | Ação |
|-------|-------|-----|-------|------|
| **Baixo** | 0-15 | 🟢 Verde | ✅ | Manutenção periódica |
| **Médio** | 16-40 | 🟡 Amarelo | ⚠️ | Acompanhamento mensal |
| **Alto** | 41-70 | 🟠 Laranja | ⚡ | Cobrança intensificada |
| **Crítico** | 71-100 | 🔴 Vermelho | 🚨 | Ação imediata / Legal |

---

## 📁 Arquitetura

### Arquivos Criados/Modificados

```
src/
├── lib/
│   └── risk-score.ts                    ✨ NOVO
│       └── calculateRiskScore(data)     [Pura, sem async]
│       └── RiskScoreResult interface
│
├── actions/
│   ├── risk-score.ts                    ✨ NOVO
│   │   ├── getRiskScoreForCustomer()    [Busca dados + calcula]
│   │   └── getRiskScoresForTenant()     [Ranking para tenant]
│   ├── customers.ts                     ✏️ MODIFICADO
│   │   └── getCustomersList()           [Integra novo serviço]
│   ├── dashboard.ts                     ✏️ MODIFICADO
│   │   └── getDashboardMetrics()        [Ranking com score]
│   └── reports.ts                       ✏️ MODIFICADO
│       └── getReportMetrics()           [Ranking com score]
│
├── app/
│   ├── api/
│   │   └── risk-score/
│   │       └── route.ts                 ✨ NOVO
│   │           └── GET /?customerId=X   [API RESTful]
│   └── (dashboard)/
│       ├── page.tsx                     ✏️ MODIFICADO [Ranking visual]
│       └── clientes/
│           └── ClientesClient.tsx       ✏️ MODIFICADO [Score na tabela + drawer]
```

---

## 🔌 Pontos de Integração

### 1. **Lista de Clientes** (`/clientes`)
- ✅ Coluna visual com score 0-100 e badge de nível
- ✅ Card no drawer com justificativa completa
- ✅ Cores dinâmicas por faixa de risco

### 2. **Dashboard Principal** (`/`)
- ✅ Ranking de Risco com top 10 por score
- ✅ Cada linha mostra: nome | score | nível | justificativa | valor atrasado
- ✅ Ordenação por score decrescente

### 3. **Relatórios** (`/relatorios`)
- ✅ Ranking de clientes inclui score numérico
- ✅ Justificativas textuais para auditoria
- ✅ Exportável em PDF/CSV (compatível com formato)

### 4. **API REST** (`GET /api/risk-score?customerId=X`)
```json
{
  "success": true,
  "data": {
    "score": 68,
    "level": "Alto",
    "components": [
      { "name": "Número de Atrasos", "value": 2, "contribution": 10 },
      { "name": "Atraso Máximo", "value": 45, "contribution": 15 },
      // ... outros componentes
    ],
    "justification": "⚠️ Padrão de 2 atrasos (recorrente) • Exposição significativa (R$ 28k) • Ação de cobrança necessária",
    "recommendation": "⚡ PRIORIDADE: Intensificar cobrança. Negociar parcelamento ou desconto.",
    "metadata": {
      "delayCount": 2,
      "maxDelayDays": 45,
      "avgDelayDays": 38.5,
      "openAmount": 28000,
      "promisesBrokenCount": 0,
      "recurrenceLevel": "recorrente"
    }
  },
  "meta": {
    "calculatedAt": "2026-03-22T14:30:00Z",
    "version": "1.0",
    "formula": "Weighted sum of 5 components..."
  }
}
```

---

## 🧮 Exemplos de Cálculo

### Cliente 1: Score 12 (Baixo) ✅
- 0 atrasos → 0 pts
- 5 dias max → 0 pts
- 3 dias médio → 0 pts
- R$ 2.000 aberto → 0 pts
- 0 promessas quebradas → 0 pts
- **Score = 0** → Baixo

**Justificativa:** ✅ Sem atrasos registrados

---

### Cliente 2: Score 48 (Médio) ⚠️
- 1 atraso → 5 pts
- 25 dias max → 5 pts
- 22 dias médio → 5 pts
- R$ 12.000 aberto → 5 pts
- 1 promessa quebrada → 5 pts
- **Score = 25** → Médio

**Justificativa:** ⚠️ Atraso isolado • Exposição moderada (R$ 12k) • 1 promessa quebrada

---

### Cliente 3: Score 82 (Crítico) 🚨
- 3 atrasos → 20 pts
- 95 dias max → 25 pts
- 62 dias médio → 15 pts
- R$ 55.000 aberto → 25 pts
- 2 promessas quebradas → 10 pts
- **Score = 95** → Crítico (capped at 100)

**Justificativa:** 🔴 Cliente com 3 atrasos (padrão crônico) • Atraso crítico (95 dias) • Alto valor em aberto (R$ 55k) • 2 promessas quebradas

**Recomendação:** 🚨 AÇÃO IMEDIATA: Escalar para legal ou gerência. Considerar contato direto.

---

## 🛡️ Auditoria e Transparência

### Dados Retornados
1. **Score** (0-100): Número auditável
2. **Level** (4 faixas): Classificação clara
3. **Components**: Breakdown de cada critério
   - Nome, valor, peso, máximo, contribuição, explicação
4. **Justification**: Texto amigável em português
5. **Recommendation**: Ação sugerida por faixa
6. **Metadata**: Dados brutos para análise histórica

### Rastreabilidade
- ✅ Cálculo determinístico (mesmo input = mesmo output)
- ✅ Totalmente explicável ("por que 68?")
- ✅ Sem machine learning (fórmula simples)
- ✅ Compatível com auditoria financeira

---

## 🚀 Performance

- **Cálculo:** O(1) puro
- **Busca de dados:** O(n) onde n = invoices por cliente
- **Ranking de tenant:** O(m × n) onde m = clientes, n = invoices médio
- **Cache:** Não implementado (dado atualizado em cada chamada)
- **TTL sugerido:** 6-12 horas se cachear

---

## 🔄 Ciclo de Vida dos Dados

1. **Cliente abre /clientes** → API chama `getCustomersList()`
2. **getCustomersList()** chama `getRiskScoreForCustomer()` para cada cliente
3. **getRiskScoreForCustomer()** busca faturas + promessas quebradas
4. **calculateRiskScore()** aplica fórmula
5. **Resultado exibido** com score, nível, cores e justificativa

---

## 📝 Recomendações por Faixa

### 🟢 Baixo (0-25)
```
✅ MANUTENÇÃO: Cliente com bom histórico. 
Renovar contato periodicamente.
```

### 🟡 Médio (26-50)
```
📞 ACOMPANHAMENTO: Manter contato periódico. 
Monitorar próximas datas.
```

### 🟠 Alto (51-75)
```
⚡ PRIORIDADE: Intensificar cobrança. 
Negociar parcelamento ou desconto.
```

### 🔴 Crítico (76-100)
```
🚨 AÇÃO IMEDIATA: Escalar para legal ou gerência. 
Considerar contato direto.
```

---

## 🔮 Preparação para Futuro

### Extensões Possíveis (sem breaking changes)
1. **Machine Learning**: Regressão logística para pesos adaptativos
2. **Histórico**: Tabela `risk_scores` com snapshots diários
3. **Alertas**: Webhook quando score > limiar ou sobe 20+ pontos
4. **Segmentação**: Agrupar clientes por risco para campanhas
5. **Comparativo**: "Sua cobrança vs média do setor"

### Compatibilidade
- ✅ Função pura `calculateRiskScore()` pode ser testada offline
- ✅ Interface `RiskScoreResult` extensível
- ✅ API RESTful preparada para rate limiting + caching
- ✅ Metadata contém dados brutos para reprocessamento

---

## ✅ Validação de Implementação

### Sem Regressões
- ✅ Build: 0 erros TypeScript
- ✅ Lint: 0 novos erros (110 warnings pré-existentes)
- ✅ Cobrança: Nenhuma lógica alterada
- ✅ Automação: Cron continua funcionando
- ✅ Webhooks: Sem mudanças em resend/zapi

### Testes Manuais
- ✅ `/clientes`: Score visível na tabela e drawer
- ✅ Dashboard: Ranking ordenado por score
- ✅ API: `GET /api/risk-score?customerId=XXX` retorna estrutura completa
- ✅ Relatórios: Score incluído em exports

---

## 📞 Suporte

**Questão:** "Como mudo a fórmula?"  
**Resposta:** Editar `src/lib/risk-score.ts` → função `calculateRiskScore()`. É pura e testável.

**Questão:** "Posso integrar com sistema X?"  
**Resposta:** Use `GET /api/risk-score?customerId=X` ou chame `getRiskScoreForCustomer()` direto.

**Questão:** "Por que o cliente Y tem score Z?"  
**Resposta:** Abra drawer no `/clientes`, veja justificativa. Ou chame API com `?customerId=Y`.

---

**Versão:** 1.0  
**Autor:** Sistema Fluxo  
**Data:** 22 de março de 2026
