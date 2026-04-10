'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../auth';

const DEFAULT_FLOW_CONFIG = {
  stages: [
    {
      id: "pre",
      name: "Pré-Vencimento",
      description: "Lembrete amigável antes do vencimento",
      active: true,
      days: -3,
      time: "09:00",
      channels: { email: true, whatsapp: true },
      templates: {
        whatsapp: "Olá {nome}, tudo bem? Aqui é da {empresa}. Passando apenas para enviar a sua fatura nº {fatura} que vence no dia {vencimento}. O valor é de R$ {valor}. Caso já queira deixar programado, o Pix Copia e Cola está logo abaixo:\n\n{pix_copia_cola}\n\nQualquer dúvida sobre a nota fiscal ou o serviço, estou à disposição!",
        email: "Olá {nome}. Gostaríamos de lembrar que sua fatura {fatura} referente aos serviços da {empresa} vencerá no dia {vencimento}.\n\nValor: R$ {valor}\n\nPix Copia e Cola:\n{pix_copia_cola}\n\nSe o pagamento já foi efetuado, por favor desconsidere este aviso."
      }
    },
    {
       id: "dia",
       name: "Dia do Vencimento",
       description: "Aviso no dia exato do vencimento",
       active: true,
       days: 0,
       time: "08:30",
       channels: { email: true, whatsapp: true },
       templates: {
          whatsapp: "Oi {nome}, passando para lembrar que hoje é o dia do vencimento da sua fatura {fatura} no valor de R$ {valor}. Se você já efetuou o pagamento, por favor, desconsidere essa mensagem!\nMas se precisar da chave Pix novamente, é só usar o código abaixo:\n\n{pix_copia_cola}\n\nUm ótimo dia para você!",
          email: "Oi {nome}, passando para lembrar que hoje é o dia do vencimento da sua fatura {fatura} no valor de R$ {valor}. Se você já efetuou o pagamento, por favor, desconsidere essa mensagem!\nMas se precisar da chave Pix novamente, é só usar o código abaixo:\n\n{pix_copia_cola}\n\nUm ótimo dia para você!"
       }
    },
    {
       id: "pos1",
       name: "Atraso Inicial",
       description: "Cobrança tolerante pós-vencimento",
       active: true,
       days: 2,
       time: "10:00",
       channels: { email: true, whatsapp: true },
       templates: {
          whatsapp: "Olá {nome}, tudo bem? Não identificamos o pagamento da fatura {fatura} que venceu no dia {vencimento}. Sabemos que a correria do dia a dia acontece! Estou enviando novamente o Pix de R$ {valor} para facilitar. Se teve algum problema com o boleto, me avisa aqui!\n\n{pix_copia_cola}",
          email: "Olá {nome}, tudo bem? Não identificamos o pagamento da fatura {fatura} que venceu no dia {vencimento}. Sabemos que a correria do dia a dia acontece! Estou enviando novamente o Pix de R$ {valor} para facilitar. Se teve algum problema com o boleto, me avisa aqui!\n\n{pix_copia_cola}"
       }
    },
    {
       id: "pos2",
       name: "Atraso Médio",
       description: "Notificação firme de pendência (D+7)",
       active: true,
       days: 7,
       time: "14:00",
       channels: { email: true, whatsapp: true },
       templates: {
          whatsapp: "Olá {nome}. Nosso departamento financeiro acusa a falta de pagamento da fatura {fatura}, no valor de R$ {valor}, vencida desde {vencimento}. É imprescindível a regularização do débito para evitar a suspensão dos serviços ou juros adicionais.\n\nSegue código: {pix_copia_cola}\n\nPor favor, nos envie o comprovante após a quitação.",
          email: "Olá {nome}. Nosso departamento financeiro acusa a falta de pagamento da fatura {fatura}, no valor de R$ {valor}, vencida desde {vencimento}. É imprescindível a regularização do débito para evitar a suspensão dos serviços ou juros adicionais.\n\nSegue código: {pix_copia_cola}\n\nPor favor, nos envie o comprovante após a quitação."
       }
    },
    {
       id: "pos3",
       name: "Atraso Crítico",
       description: "Último aviso antes de bloqueio legal (D+15)",
       active: false,
       days: 15,
       time: "16:00",
       channels: { email: true, whatsapp: false },
       templates: {
          whatsapp: "Prezado(a) {nome}. Após sucessivas tentativas de contato, seu débito da fatura {fatura} (R$ {valor}) completou {dias_atraso} dias de atraso.\n\nNotificamos que a ausência de pagamento nos próximos 2 dias úteis acarretará no bloqueio automático dos serviços da {empresa} e encaminhamento aos órgãos de proteção ao crédito.\n\nRegularize imediatamente:\n{pix_copia_cola}",
          email: "Prezado(a) {nome}. Após sucessivas tentativas de contato, seu débito da fatura {fatura} (R$ {valor}) completou {dias_atraso} dias de atraso.\n\nNotificamos que a ausência de pagamento nos próximos 2 dias úteis acarretará no bloqueio automático dos serviços da {empresa} e encaminhamento aos órgãos de proteção ao crédito.\n\nRegularize imediatamente:\n{pix_copia_cola}"
       }
    }
  ],
  presetType: "friendly"
};

export async function saveBillingFlow(rulesData: any) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const existingFlow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (existingFlow) {
    return await prisma.billingFlow.update({
      where: { id: existingFlow.id },
      data: { rules: JSON.stringify(rulesData) }
    });
  } else {
    return await prisma.billingFlow.create({
      data: {
        tenantId,
        name: 'Régua Global de Automação',
        isActive: true,
        rules: JSON.stringify(rulesData)
      }
    });
  }
}

export async function getBillingFlow() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    throw new Error('Unauthorized');
  }

  const flow = await prisma.billingFlow.findFirst({
    where: { tenantId }
  });

  if (!flow) return DEFAULT_FLOW_CONFIG;

  try {
    const data = JSON.parse(flow.rules);
    // Migration: If the payload is old format (missing 'stages' array), overwrite with default
    if (!data.stages) return DEFAULT_FLOW_CONFIG;
    return data;
  } catch {
    return DEFAULT_FLOW_CONFIG;
  }
}
