export const landingFaqs = [
  {
    question: "O que é um software de cobrança e como o Fluxeer ajuda?",
    answer:
      "Um software de cobrança como o Fluxeer automatiza o acompanhamento de faturas. Ele organiza seu contas a receber, automatiza a régua de cobrança e traz previsibilidade real para o seu caixa.",
  },
  {
    question: "Como organizar uma régua de cobrança B2B eficiente?",
    answer:
      "No Fluxeer, você estrutura etapas lógicas de contato antes, no dia e após o vencimento. Isso reduz a inadimplência e profissionaliza o relacionamento comercial com seus clientes.",
  },
  {
    question: "Como o Fluxeer ajuda a reduzir a inadimplência e o DSO?",
    answer:
      "Através da priorização por risco e da automação dos lembretes, o Fluxeer ajuda sua equipe a agir antes que o atraso cresça e pressione o caixa.",
  },
  {
    question: "Qual a vantagem da cobrança automática sobre o processo manual?",
    answer:
      "A cobrança automática garante consistência no processo, reduz esquecimentos, centraliza histórico e libera o time financeiro para tratar exceções e negociações críticas.",
  },
  {
    question: "O Fluxeer é indicado para gestão de contas a receber complexas?",
    answer:
      "Sim. O Fluxeer foi desenhado para operações B2B com múltiplos vencimentos, faturas relevantes e necessidade de previsibilidade de caixa mais rigorosa.",
  },
] as const;

export const moneyPages = [
  {
    href: "/software-de-cobranca",
    title: "Software de Cobrança",
    description: "Automação da cobrança com mais visibilidade para o contas a receber.",
  },
  {
    href: "/regua-de-cobranca",
    title: "Régua de Cobrança",
    description: "Fluxos automáticos para agir no momento certo, sem improviso.",
  },
  {
    href: "/contas-a-receber",
    title: "Contas a Receber",
    description: "Acompanhamento operacional com histórico, aging e contexto por cliente.",
  },
  {
    href: "/previsibilidade-de-caixa",
    title: "Previsibilidade de Caixa",
    description: "Mais clareza sobre o que tende a entrar e quando agir primeiro.",
  },
  {
    href: "/cobranca-b2b",
    title: "Cobrança B2B",
    description: "Processo de cobrança pensado para relacionamento e recorrência no B2B.",
  },
] as const;

export const landingSections = ["hero", "problema", "solucao", "plataforma", "faq", "demonstracao"] as const;

export type LandingSectionId = (typeof landingSections)[number];
