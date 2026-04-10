'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Sistema de Alertas de Cobrança Baseado em Score de Risco
 * 
 * Cria tarefas automáticas quando:
 * - Score > 75 (Crítico): Ação imediata
 * - Score 51-75 (Alto): Prioridade alta
 */

export interface AlertConfig {
  customerId: string;
  tenantId: string;
  riskScore: number;
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  riskJustification: string;
  userId?: string; // ID do usuário que deve receber a tarefa
}

/**
 * Cria alertas/tarefas automáticas baseado no score de risco
 */
export async function createRiskAlerts(config: AlertConfig) {
  const {
    customerId,
    tenantId,
    riskScore,
    riskLevel,
    riskJustification,
    userId
  } = config;

  // ────────────────────────────────────────────────────────────────────────────
  // Determinar se deve criar alerta
  // ────────────────────────────────────────────────────────────────────────────

  if (riskLevel === 'Baixo' || riskLevel === 'Médio') {
    // Sem alertas para Baixo/Médio
    return { created: false, reason: 'Score baixo/médio - sem alerta necessário' };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Buscar cliente para contexto
  // ────────────────────────────────────────────────────────────────────────────

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    select: { id: true, name: true, assignedUserId: true }
  });

  if (!customer) {
    return { created: false, reason: 'Cliente não encontrado' };
  }

  // Determinar quem vai receber a tarefa
  const assigneeId = userId || customer.assignedUserId;

  // ────────────────────────────────────────────────────────────────────────────
  // Criar tarefa automática
  // ────────────────────────────────────────────────────────────────────────────

  const dueDate = new Date();
  let taskTitle = '';
  let taskDescription = '';
  let priority = 'normal';

  if (riskLevel === 'Crítico') {
    // Crítico: devido hoje mesmo
    taskTitle = `🚨 CLIENTE CRÍTICO: ${customer.name} (Score ${riskScore})`;
    taskDescription = `
⚠️ AÇÃO IMEDIATA REQUERIDA

Cliente: ${customer.name}
Score de Risco: ${riskScore}/100
Nível: CRÍTICO

Justificativa:
${riskJustification}

👉 PRÓXIMOS PASSOS:
1. Contato direto por telefone/WhatsApp
2. Se indisponível, escalar para gerência/legal
3. Considerar suspensão de crédito

Documentação: Veja o drawer do cliente em /clientes para mais detalhes.
    `.trim();
    priority = 'critical';
    dueDate.setHours(23, 59, 59, 999); // Vence hoje

  } else if (riskLevel === 'Alto') {
    // Alto: vence em 3 dias
    taskTitle = `⚡ COBRANÇA PRIORITÁRIA: ${customer.name} (Score ${riskScore})`;
    taskDescription = `
PRIORIDADE ALTA - Intensificar Cobrança

Cliente: ${customer.name}
Score de Risco: ${riskScore}/100
Nível: ALTO

Justificativa:
${riskJustification}

👉 AÇÕES RECOMENDADAS:
1. Enviar lembrança por email/WhatsApp
2. Oferecer desconto ou parcelamento
3. Agendar conversa com responsável financeiro
4. Atualizar status em /cobrancas

Documentação: Veja o drawer do cliente em /clientes para análise completa.
    `.trim();
    priority = 'high';
    dueDate.setDate(dueDate.getDate() + 3); // Vence em 3 dias
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Verificar se já existe tarefa ativa para este cliente (evitar duplicação)
  // ────────────────────────────────────────────────────────────────────────────

  const existingTask = await prisma.task.findFirst({
    where: {
      tenantId,
      customerId,
      status: 'pending',
      title: { contains: riskLevel === 'Crítico' ? '🚨 CLIENTE CRÍTICO' : '⚡ COBRANÇA PRIORITÁRIA' }
    }
  });

  if (existingTask) {
    // Atualizar tarefa existente em vez de criar nova
    await prisma.task.update({
      where: { id: existingTask.id },
      data: {
        description: taskDescription,
        dueDate: dueDate,
        updatedAt: new Date()
      }
    });

    return {
      created: false,
      reason: 'Tarefa existente atualizada',
      taskId: existingTask.id
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Criar nova tarefa
  // ────────────────────────────────────────────────────────────────────────────

  const task = await prisma.task.create({
    data: {
      tenantId,
      customerId,
      assigneeId,
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      dueDate,
      createdAt: new Date()
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Log da ação
  // ────────────────────────────────────────────────────────────────────────────

  console.log(`[RISK ALERT] Tarefa criada para ${customer.name} (Score ${riskScore}):`, task.id);

  // Revalidar para mostrar tarefa imediatamente
  revalidatePath('/');
  revalidatePath('/configuracoes');
  revalidatePath('/clientes');

  return {
    created: true,
    taskId: task.id,
    reason: `Tarefa ${riskLevel === 'Crítico' ? 'crítica' : 'prioritária'} criada`
  };
}

/**
 * Limpar alertas quando cliente volta para Baixo/Médio
 * (opcional: manter histórico ou auto-resolver tarefas)
 */
export async function resolveRiskAlerts(customerId: string, tenantId: string) {
  // Opcional: Auto-marcar como "completed" ou apenas deixar como referência histórica
  // Por enquanto, vamos deixar para operador resolver manualmente (mais auditável)
  
  return {
    resolved: false,
    reason: 'Alertas são resolvidos manualmente pelo operador'
  };
}
