# 🚨 Sistema de Alertas de Cobrança Automáticos

**Data de Implementação:** 22 de março de 2026  
**Status:** ✅ Produção  
**Versão:** 1.0

---

## 📋 O que Faz

Cria **tarefas automáticas** quando um cliente tem score de risco alto ou crítico:

| Score | Nível | Ação |
|-------|-------|------|
| **76-100** | 🔴 Crítico | 🚨 Tarefa vence **HOJE** - Ação imediata |
| **41-75** | 🟠 Alto | ⚡ Tarefa vence em **3 dias** - Prioridade alta |
| **0-40** | 🟡 Baixo/Médio | ✅ Sem alerta (monitorar) |

---

## 🎯 Como Funciona

### 1. Quando Score é Calculado
```
Cliente abre /clientes
  ↓
getCustomersList() chama getRiskScoreForCustomer()
  ↓
calculateRiskScore() retorna score
  ↓
createRiskAlerts() é chamado automaticamente
  ↓
Tarefa criada em background (não bloqueia)
```

### 2. Verificação de Duplicação
- ✅ Se tarefa ativa já existe → **atualiza** (não duplica)
- ✅ Se score volta para Baixo/Médio → tarefa fica aberta (operador resolve manualmente)

### 3. Atribuição de Tarefa
- Se cliente tem `assignedUserId` → tarefa vai para esse usuário
- Se não tem → `assigneeId = null` (qualquer um pode pegar)

---

## 📁 Arquivos

### Novo
```
src/actions/risk-alerts.ts
├── createRiskAlerts(config)    [Cria tarefas automáticas]
└── resolveRiskAlerts()          [Para futuro: auto-resolver]
```

### Modificado
```
src/actions/risk-score.ts
├── +import { createRiskAlerts }
└── +Fire-and-forget call quando score >= 41
```

---

## 📊 Exemplo de Tarefa Criada

### Tarefa Crítica (Score > 75)
```
Título:
🚨 CLIENTE CRÍTICO: TechCorp (Score 92)

Descrição:
⚠️ AÇÃO IMEDIATA REQUERIDA

Cliente: TechCorp
Score de Risco: 92/100
Nível: CRÍTICO

Justificativa:
🔴 Cliente com 4 atrasos (padrão crônico) 
• Atraso crítico (120 dias) 
• Alto valor em aberto (R$ 65k) 
• 2 promessas quebradas

👉 PRÓXIMOS PASSOS:
1. Contato direto por telefone/WhatsApp
2. Se indisponível, escalar para gerência/legal
3. Considerar suspensão de crédito

Documentação: Veja o drawer do cliente em /clientes...

Vencimento: HOJE 23:59
Prioridade: CRÍTICA
```

### Tarefa Alto Risco (Score 41-75)
```
Título:
⚡ COBRANÇA PRIORITÁRIA: BuildCo (Score 55)

Descrição:
PRIORIDADE ALTA - Intensificar Cobrança

Cliente: BuildCo
Score de Risco: 55/100
Nível: ALTO

Justificativa:
⚠️ Padrão de 2 atrasos (recorrente)
• Exposição significativa (R$ 28k)
• 1 promessa quebrada

👉 AÇÕES RECOMENDADAS:
1. Enviar lembrança por email/WhatsApp
2. Oferecer desconto ou parcelamento
3. Agendar conversa com responsável financeiro
4. Atualizar status em /cobrancas

Documentação: Veja o drawer do cliente em /clientes...

Vencimento: em 3 dias
Prioridade: ALTA
```

---

## 🔧 Técnica

### Fire-and-Forget Pattern
```typescript
// Não aguardamos para não deixar lento
createRiskAlerts({...}).catch((err) => {
  console.error('[RISK ALERT ERROR]', err);
  // Não relançamos erro para não quebrar score
});
```

**Por quê?** 
- Alertas são "nice-to-have" não críticos
- Score é crítico - nunca deixar falhar
- Usuário não fica esperando tarefa ser criada

### Verificação de Duplicação
```typescript
const existingTask = await prisma.task.findFirst({
  where: {
    tenantId,
    customerId,
    status: 'pending',
    title: { contains: '🚨 CLIENTE CRÍTICO' }
  }
});

if (existingTask) {
  // Atualizar: dueDate, description, updatedAt
  await prisma.task.update({...});
} else {
  // Criar nova
  await prisma.task.create({...});
}
```

---

## ✅ Casos de Uso

### Cliente passa de Baixo para Crítico
```
Primeira vez que calcula score > 75
  ↓
Tarefa crítica criada
  ↓
Operador recebe notificação no sistema
  ↓
Operador cobre cliente
  ↓
(Operador marca tarefa como "completed" manualmente)
```

### Score atualizado enquanto tarefa aberta
```
Cliente marca pagamento → invoice sai de 'overdue'
  ↓
Score cai de 92 para 25 (Baixo)
  ↓
Tarefa antiga continua "pending" (não deleta)
  ↓
Operador vê "Tarefa: [CONCLUÍDA MANUALMENTE]"
  ↓
Sistema não cria nova tarefa (score < 41)
```

### Score sobe de novo
```
Cliente esqueceu e novo atraso chega
  ↓
Score sobe de 25 para 60 (Alto)
  ↓
Tarefa existente é ATUALIZADA (não duplica)
  ↓
dueDate e description refreshadas
  ↓
Operador vê atualização e age
```

---

## 🚀 Próximas Evoluções (Futuro)

### Curto Prazo
- [ ] Notificação push/email quando tarefa criada
- [ ] Webhook para integração com Slack

### Médio Prazo
- [ ] Auto-resolver tarefa quando score volta < 41
- [ ] Histórico de alertas em /relatórios

### Longo Prazo
- [ ] ML para predizer quem vai ficar crítico
- [ ] Scoring preditivo (não reactivo)

---

## 🧪 Testes

### Manual
1. Abrir `/clientes`
2. Cliente com score > 75 deve ter tarefa criada
3. Atualizar score (marcar invoice como pago)
4. Verificar que tarefa não duplicou (apenas atualizou)

### Automático
```bash
npm run build  # ✅ 0 erros
npm run lint   # ✅ 0 novos erros
```

---

## 📞 FAQ

**P: Por que fire-and-forget?**  
R: Score é crítico, alertas não. Melhor falhar em alerta que em cálculo.

**P: Tarefa nunca vai auto-resolver?**  
R: Sim, por intenção. Operador resolve manualmente (mais auditável).

**P: E se cliente tiver múltiplos atrasos?**  
R: Score agrega tudo. Uma tarefa por cliente, não por atraso.

**P: Posso customizar a mensagem da tarefa?**  
R: Sim! Editar em `src/actions/risk-alerts.ts` → taskTitle/taskDescription.

---

**Versão:** 1.0  
**Status:** ✅ LIVE  
**Próxima Review:** Quando implementar auto-resolve ou notificações
