import { describe, expect, it } from 'vitest';

import { normalizeBillingFlowConfig } from '@/lib/billing-flow';

describe('normalizeBillingFlowConfig', () => {
  it('preserva o contrato atual da UI da regua', () => {
    const config = normalizeBillingFlowConfig({
      presetType: 'friendly',
      stages: [
        {
          id: 'pre',
          active: true,
          days: -3,
          time: '09:00',
          channels: { email: true, whatsapp: false },
          templates: { email: 'Email {nome}', whatsapp: 'Zap {nome}' },
        },
      ],
    });

    expect(config.stages[0]).toMatchObject({
      id: 'pre',
      active: true,
      days: -3,
      time: '09:00',
      channels: { email: true, whatsapp: false },
      templates: { email: 'Email {nome}', whatsapp: 'Zap {nome}' },
    });
  });

  it('migra payload legado do cron para o contrato normalizado da UI', () => {
    const config = normalizeBillingFlowConfig({
      stages: [
        {
          id: 'pre',
          isActive: true,
          days: 3,
          channels: {
            email: { active: true, template: 'Legacy email' },
            whatsapp: { active: false, template: 'Legacy zap' },
          },
        },
      ],
    });

    expect(config.stages[0]).toMatchObject({
      id: 'pre',
      active: true,
      days: -3,
      channels: { email: true, whatsapp: false },
      templates: { email: 'Legacy email', whatsapp: 'Legacy zap' },
    });
  });
});
