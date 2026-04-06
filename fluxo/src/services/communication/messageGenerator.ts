/**
 * messageGenerator.ts
 * Generates professional pt-BR messages for each collection stage.
 *
 * Variables supported:
 *   {nome}         → customer name
 *   {empresa}      → company/tenant name
 *   {fatura}       → invoice number
 *   {valor}        → formatted amount (R$ X,XX)
 *   {vencimento}   → due date (dd/mm/yyyy)
 *   {dias_atraso}  → days overdue
 *   {pix_copia_cola} → pix key or copy-paste string
 */

import type { RuleType } from './collectionRules';

export interface MessageVars {
  nome: string;
  empresa: string;
  fatura: string;
  valor: string;
  vencimento: string;
  dias_atraso?: number;
  pix_copia_cola?: string;
}

const TEMPLATES: Record<RuleType, string> = {
  pre_due_3d: `Olá, *{nome}*! 👋

Passando para lembrá-lo de que a fatura *#{fatura}* da *{empresa}*, no valor de *{valor}*, vence em *3 dias* ({vencimento}).

Para evitar encargos, efetue o pagamento antecipadamente.{pix_block}

Qualquer dúvida, estamos à disposição. 😊`,

  due_today: `Olá, *{nome}*! ⚠️

A fatura *#{fatura}* da *{empresa}*, no valor de *{valor}*, vence *hoje* ({vencimento}).

Realize o pagamento hoje para evitar juros e multas.{pix_block}

Agradecemos sua atenção!`,

  overdue_1d: `Olá, *{nome}*.

Verificamos que a fatura *#{fatura}* da *{empresa}*, no valor de *{valor}*, está com *1 dia de atraso* (vencimento: {vencimento}).

Pedimos que regularize o pagamento o quanto antes para evitar o acúmulo de encargos.{pix_block}

Qualquer imprevisto, fale conosco.`,

  overdue_3d: `Olá, *{nome}*.

A fatura *#{fatura}* da *{empresa}* (R$ *{valor}*) está em aberto há *3 dias*.
Vencimento original: {vencimento}.

Pedimos que regularize sua pendência com urgência para manter seu cadastro em dia.{pix_block}

Estamos à disposição para negociar.`,

  overdue_7d: `Prezado(a) *{nome}*,

Sua fatura *#{fatura}* referente à *{empresa}* permanece em aberto há *7 dias*.
Valor: *{valor}* | Vencimento: {vencimento}.

⚠️ Solicitamos a regularização imediata para evitar medidas administrativas.{pix_block}

Contate-nos para encontrar a melhor solução.`,

  overdue_15d: `Prezado(a) *{nome}*,

*AVISO FINAL* — A fatura *#{fatura}* da *{empresa}*, no valor de *{valor}*, encontra-se em aberto há *15 dias* (vencimento: {vencimento}).

Caso não haja regularização nos próximos dias, serão adotadas medidas de recuperação de crédito.{pix_block}

Entre em contato *imediatamente* para evitar maiores transtornos.`,

  custom: `Olá, *{nome}*.

Passamos para falar sobre a fatura *#{fatura}* da *{empresa}* no valor de *{valor}* (vencimento: {vencimento}).{pix_block}

Qualquer dúvida, estamos à disposição.`,
};

function formatPix(pix?: string): string {
  if (!pix) return '';
  return `\n\n💳 *Pix (Copia e Cola):*\n\`${pix}\``;
}

function interpolate(template: string, vars: MessageVars): string {
  const pixBlock = formatPix(vars.pix_copia_cola);
  return template
    .replace(/{nome}/g, vars.nome)
    .replace(/{empresa}/g, vars.empresa)
    .replace(/{fatura}/g, vars.fatura)
    .replace(/{valor}/g, vars.valor)
    .replace(/{vencimento}/g, vars.vencimento)
    .replace(/{dias_atraso}/g, String(vars.dias_atraso ?? 0))
    .replace(/{pix_copia_cola}/g, vars.pix_copia_cola ?? '')
    .replace(/{pix_block}/g, pixBlock);
}

/**
 * Generate a collection message for the given rule and variables.
 */
export function generateMessage(ruleType: RuleType, vars: MessageVars): string {
  const template = TEMPLATES[ruleType] ?? TEMPLATES.custom;
  return interpolate(template, vars);
}

/**
 * Format a number as Brazilian currency (R$ 1.234,56)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format a date as dd/mm/yyyy
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
