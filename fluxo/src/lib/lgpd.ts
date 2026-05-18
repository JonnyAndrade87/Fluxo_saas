import { prisma } from "./prisma";

/**
 * Anonimiza os dados de um cliente (devedor/sacado) para cumprir o direito ao esquecimento (LGPD).
 * Mantém o ID e registros financeiros intactos para integridade referencial e auditoria,
 * mas apaga Informações Pessoais Identificáveis (PII).
 *
 * @param tenantId - O ID do Tenant (isolamento multi-tenant)
 * @param customerId - O ID do Customer a ser anonimizado
 * @returns boolean indicando sucesso
 */
export async function anonymizeCustomer(tenantId: string, customerId: string): Promise<boolean> {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      return false;
    }

    const hash = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Anonimiza o Customer
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: `Anonimizado ${hash}`,
        documentNumber: `00000000000-${hash.substring(0, 4)}`, // Máscara segura
        email: `${hash}@anon.local`,
        phone: null,
        address: null,
        notes: null,
        tags: null,
        customData: null,
      },
    });

    // Apaga os contatos financeiros vinculados
    await prisma.financialContact.deleteMany({
      where: { customerId, tenantId },
    });

    // Apaga as notas do cliente (que podem ter PII não estruturada)
    await prisma.customerNote.deleteMany({
      where: { customerId, tenantId },
    });

    return true;
  } catch (error) {
    console.error(`[LGPD] Falha ao anonimizar cliente ${customerId}:`, error);
    return false;
  }
}

/**
 * Remove o conteúdo sensível (`message` e `content`) de logs de comunicação antigos,
 * mantendo apenas o metadado (prova de envio) por questões de auditoria.
 *
 * @param tenantId - O ID do Tenant
 * @param daysOld - Apagar conteúdo de mensagens mais antigas que 'daysOld' dias (ex: 90 dias)
 * @returns Número de registros limpos
 */
export async function cleanOldCommunicationLogs(tenantId: string, daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Limpa conteúdo na tabela Communication
    const commsResult = await prisma.communication.updateMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
        content: { not: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]" },
      },
      data: {
        content: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]",
      },
    });

    // Limpa conteúdo na tabela CommunicationLog
    const logsResult = await prisma.communicationLog.updateMany({
      where: {
        tenantId,
        createdAt: { lt: cutoffDate },
        message: { not: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]" },
      },
      data: {
        message: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]",
      },
    });

    return commsResult.count + logsResult.count;
  } catch (error) {
    console.error(`[LGPD] Falha ao limpar logs antigos do tenant ${tenantId}:`, error);
    return 0;
  }
}
