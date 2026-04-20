export interface BillingFlowStage {
  id: string;
  name: string;
  description: string;
  active: boolean;
  days: number;
  time: string;
  channels: {
    email: boolean;
    whatsapp: boolean;
  };
  templates: {
    email: string;
    whatsapp: string;
  };
}

export interface BillingFlowConfig {
  stages: BillingFlowStage[];
  presetType: string;
}

export const DEFAULT_BILLING_FLOW_CONFIG: BillingFlowConfig = {
  stages: [
    {
      id: 'pre',
      name: 'Pre-Vencimento',
      description: 'Lembrete amigavel antes do vencimento',
      active: true,
      days: -3,
      time: '09:00',
      channels: { email: true, whatsapp: true },
      templates: {
        whatsapp:
          'Ola {nome}, tudo bem? Aqui e da {empresa}. Passando apenas para enviar a sua fatura no {fatura} que vence no dia {vencimento}. O valor e de R$ {valor}. Caso ja queira deixar programado, o Pix Copia e Cola esta logo abaixo:\n\n{pix_copia_cola}\n\nQualquer duvida sobre a nota fiscal ou o servico, estou a disposicao!',
        email:
          'Ola {nome}. Gostariamos de lembrar que sua fatura {fatura} referente aos servicos da {empresa} vencera no dia {vencimento}.\n\nValor: R$ {valor}\n\nPix Copia e Cola:\n{pix_copia_cola}\n\nSe o pagamento ja foi efetuado, por favor desconsidere este aviso.',
      },
    },
    {
      id: 'dia',
      name: 'Dia do Vencimento',
      description: 'Aviso no dia exato do vencimento',
      active: true,
      days: 0,
      time: '08:30',
      channels: { email: true, whatsapp: true },
      templates: {
        whatsapp:
          'Oi {nome}, passando para lembrar que hoje e o dia do vencimento da sua fatura {fatura} no valor de R$ {valor}. Se voce ja efetuou o pagamento, por favor, desconsidere essa mensagem!\nMas se precisar da chave Pix novamente, e so usar o codigo abaixo:\n\n{pix_copia_cola}\n\nUm otimo dia para voce!',
        email:
          'Oi {nome}, passando para lembrar que hoje e o dia do vencimento da sua fatura {fatura} no valor de R$ {valor}. Se voce ja efetuou o pagamento, por favor, desconsidere essa mensagem!\nMas se precisar da chave Pix novamente, e so usar o codigo abaixo:\n\n{pix_copia_cola}\n\nUm otimo dia para voce!',
      },
    },
    {
      id: 'pos1',
      name: 'Atraso Inicial',
      description: 'Cobranca tolerante pos-vencimento',
      active: true,
      days: 2,
      time: '10:00',
      channels: { email: true, whatsapp: true },
      templates: {
        whatsapp:
          'Ola {nome}, tudo bem? Nao identificamos o pagamento da fatura {fatura} que venceu no dia {vencimento}. Sabemos que a correria do dia a dia acontece! Estou enviando novamente o Pix de R$ {valor} para facilitar. Se teve algum problema com o boleto, me avisa aqui!\n\n{pix_copia_cola}',
        email:
          'Ola {nome}, tudo bem? Nao identificamos o pagamento da fatura {fatura} que venceu no dia {vencimento}. Sabemos que a correria do dia a dia acontece! Estou enviando novamente o Pix de R$ {valor} para facilitar. Se teve algum problema com o boleto, me avisa aqui!\n\n{pix_copia_cola}',
      },
    },
    {
      id: 'pos2',
      name: 'Atraso Medio',
      description: 'Notificacao firme de pendencia (D+7)',
      active: true,
      days: 7,
      time: '14:00',
      channels: { email: true, whatsapp: true },
      templates: {
        whatsapp:
          'Ola {nome}. Nosso departamento financeiro acusa a falta de pagamento da fatura {fatura}, no valor de R$ {valor}, vencida desde {vencimento}. E imprescindivel a regularizacao do debito para evitar a suspensao dos servicos ou juros adicionais.\n\nSegue codigo: {pix_copia_cola}\n\nPor favor, nos envie o comprovante apos a quitacao.',
        email:
          'Ola {nome}. Nosso departamento financeiro acusa a falta de pagamento da fatura {fatura}, no valor de R$ {valor}, vencida desde {vencimento}. E imprescindivel a regularizacao do debito para evitar a suspensao dos servicos ou juros adicionais.\n\nSegue codigo: {pix_copia_cola}\n\nPor favor, nos envie o comprovante apos a quitacao.',
      },
    },
    {
      id: 'pos3',
      name: 'Atraso Critico',
      description: 'Ultimo aviso antes de bloqueio legal (D+15)',
      active: false,
      days: 15,
      time: '16:00',
      channels: { email: true, whatsapp: false },
      templates: {
        whatsapp:
          'Prezado(a) {nome}. Apos sucessivas tentativas de contato, seu debito da fatura {fatura} (R$ {valor}) completou {dias_atraso} dias de atraso.\n\nNotificamos que a ausencia de pagamento nos proximos 2 dias uteis acarretara no bloqueio automatico dos servicos da {empresa} e encaminhamento aos orgaos de protecao ao credito.\n\nRegularize imediatamente:\n{pix_copia_cola}',
        email:
          'Prezado(a) {nome}. Apos sucessivas tentativas de contato, seu debito da fatura {fatura} (R$ {valor}) completou {dias_atraso} dias de atraso.\n\nNotificamos que a ausencia de pagamento nos proximos 2 dias uteis acarretara no bloqueio automatico dos servicos da {empresa} e encaminhamento aos orgaos de protecao ao credito.\n\nRegularize imediatamente:\n{pix_copia_cola}',
      },
    },
  ],
  presetType: 'friendly',
};

type RawChannelConfig = boolean | { active?: boolean; template?: string } | undefined;

type RawStage = Partial<BillingFlowStage> & {
  isActive?: boolean;
  channels?: {
    email?: RawChannelConfig;
    whatsapp?: RawChannelConfig;
  };
  templates?: Partial<BillingFlowStage['templates']>;
};

function cloneDefaultStage(stage: BillingFlowStage): BillingFlowStage {
  return {
    ...stage,
    channels: { ...stage.channels },
    templates: { ...stage.templates },
  };
}

function cloneDefaultConfig(): BillingFlowConfig {
  return {
    presetType: DEFAULT_BILLING_FLOW_CONFIG.presetType,
    stages: DEFAULT_BILLING_FLOW_CONFIG.stages.map(cloneDefaultStage),
  };
}

function resolveActive(rawStage: RawStage, fallback: BillingFlowStage): boolean {
  if (typeof rawStage.active === 'boolean') return rawStage.active;
  if (typeof rawStage.isActive === 'boolean') return rawStage.isActive;
  return fallback.active;
}

function resolveDays(stageId: string, rawDays: unknown, fallback: BillingFlowStage): number {
  const parsed = Number(rawDays);
  if (!Number.isFinite(parsed)) return fallback.days;
  if (stageId === 'pre') {
    return parsed > 0 ? -parsed : parsed;
  }
  return parsed < 0 ? Math.abs(parsed) : parsed;
}

function resolveChannelEnabled(rawChannel: RawChannelConfig, fallback: boolean): boolean {
  if (typeof rawChannel === 'boolean') return rawChannel;
  if (rawChannel && typeof rawChannel.active === 'boolean') return rawChannel.active;
  return fallback;
}

function resolveTemplate(
  rawStage: RawStage,
  channel: 'email' | 'whatsapp',
  fallback: BillingFlowStage,
): string {
  const template = rawStage.templates?.[channel];
  if (typeof template === 'string' && template.trim()) return template;

  const rawChannel = rawStage.channels?.[channel];
  if (rawChannel && typeof rawChannel === 'object') {
    const channelObj = rawChannel as { template?: unknown };
    if (typeof channelObj.template === 'string' && channelObj.template.trim()) {
      return channelObj.template;
    }
  }

  return fallback.templates[channel];
}

function normalizeStage(rawStage: RawStage | undefined, fallback: BillingFlowStage): BillingFlowStage {
  if (!rawStage || typeof rawStage !== 'object') return cloneDefaultStage(fallback);

  return {
    id: fallback.id,
    name: typeof rawStage.name === 'string' && rawStage.name.trim() ? rawStage.name : fallback.name,
    description:
      typeof rawStage.description === 'string' && rawStage.description.trim()
        ? rawStage.description
        : fallback.description,
    active: resolveActive(rawStage, fallback),
    days: resolveDays(fallback.id, rawStage.days, fallback),
    time: typeof rawStage.time === 'string' && rawStage.time.trim() ? rawStage.time : fallback.time,
    channels: {
      email: resolveChannelEnabled(rawStage.channels?.email, fallback.channels.email),
      whatsapp: resolveChannelEnabled(rawStage.channels?.whatsapp, fallback.channels.whatsapp),
    },
    templates: {
      email: resolveTemplate(rawStage, 'email', fallback),
      whatsapp: resolveTemplate(rawStage, 'whatsapp', fallback),
    },
  };
}

export function normalizeBillingFlowConfig(input: unknown): BillingFlowConfig {
  const fallback = cloneDefaultConfig();

  if (!input || typeof input !== 'object') return fallback;

  const rawConfig = input as Partial<BillingFlowConfig> & { stages?: unknown[] };
  if (!Array.isArray(rawConfig.stages)) return fallback;

  const rawStagesArr = rawConfig.stages.filter((s) => {
    if (!s || typeof s !== 'object') return false;
    const obj = s as unknown as Record<string, unknown>;
    return 'id' in obj && typeof obj.id === 'string';
  }) as RawStage[];
  const rawStagesById = new Map(rawStagesArr.map((stage) => [stage.id!, stage]));

  return {
    presetType:
      typeof rawConfig.presetType === 'string' && rawConfig.presetType.trim()
        ? rawConfig.presetType
        : fallback.presetType,
    stages: fallback.stages.map((stage) => normalizeStage(rawStagesById.get(stage.id), stage)),
  };
}
