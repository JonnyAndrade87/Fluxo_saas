'use server';

import fs from 'fs';
import path from 'path';

export interface HelpContext {
  title: string;
  category: string;
  content: string;
}

const contextMap: Record<string, { title: string; category: string; file: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    category: 'dashboard',
    file: 'dashboard.md',
  },
  '/clientes': {
    title: 'Clientes',
    category: 'clientes',
    file: 'clientes.md',
  },
  '/cobrancas': {
    title: 'Cobranças',
    category: 'cobrancas',
    file: 'faturas.md',
  },
  '/historico': {
    title: 'Histórico',
    category: 'historico',
    file: 'historico.md',
  },
  '/automacao': {
    title: 'Régua de Cobrança',
    category: 'regua-de-cobranca',
    file: 'regua-de-cobranca.md',
  },
  '/forecast': {
    title: 'Previsibilidade de Caixa',
    category: 'previsibilidade-de-caixa',
    file: 'previsibilidade-de-caixa.md',
  },
  '/importar': {
    title: 'Importar Lote',
    category: 'importar',
    file: 'importar-lote.md',
  },
  '/comunicacoes': {
    title: 'Comunicações',
    category: 'comunicacoes',
    file: 'comunicacoes.md',
  },
  '/relatorios': {
    title: 'Relatórios',
    category: 'relatorios',
    file: 'relatorios.md',
  },
  '/fila': {
    title: 'Monitor de Fila',
    category: 'motor-de-fila',
    file: 'motor-de-fila.md',
  },
  '/configuracoes': {
    title: 'Configurações',
    category: 'configuracoes',
    file: 'configuracoes.md',
  },
  '/planos': {
    title: 'Planos e Assinatura',
    category: 'planos-e-assinatura',
    file: 'planos-e-assinatura.md',
  },
  '/ajuda': {
    title: 'Central de Ajuda',
    category: 'ajuda',
    file: 'perguntas-frequentes.md',
  },
  'default': {
    title: 'Primeiros Passos',
    category: 'primeiros-passos',
    file: 'primeiros-passos.md',
  }
};

export async function getHelpContext(pathname: string): Promise<HelpContext> {
  // Encontrar o mapeamento base pela rota, ou usar default
  const key = Object.keys(contextMap).find(k => pathname.startsWith(k)) || 'default';
  const meta = contextMap[key];

  let content = '';
  try {
    const filePath = path.join(process.cwd(), 'src/content/help', meta.file);
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    content = 'Onde você está:\nTela não mapeada no momento.\n\nO que fazer agora:\nContinue navegando.\n\nPasso a passo:\n1. Tente acessar outra tela.\n\nDepois disso:\nEm breve adicionaremos orientações aqui.';
  }

  return {
    title: meta.title,
    category: meta.category,
    content,
  };
}
