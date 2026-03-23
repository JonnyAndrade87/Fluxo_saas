/**
 * Application Constants
 * 
 * Centralize todas as constantes da aplicação para fácil manutenção
 * e evitar magic numbers/strings espalhados no código
 */

// ============================================================================
// ENVIRONMENT
// ============================================================================

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ============================================================================
// PAGINATION
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// ============================================================================
// PERIODS & TIME
// ============================================================================

export const REPORT_PERIODS = {
  THIRTY_DAYS: '30d',
  SIXTY_DAYS: '60d',
  NINETY_DAYS: '90d',
  ONE_EIGHTY_DAYS: '180d',
} as const;

export const PERIOD_LABELS: Record<string, string> = {
  '30d': 'Últimos 30 dias',
  '60d': 'Últimos 60 dias',
  '90d': 'Últimos 90 dias',
  '180d': 'Últimos 180 dias',
};

export const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// ============================================================================
// REPORTS
// ============================================================================

export const REPORT_TYPES = {
  OVERDUE: 'overdue',
  PENDING: 'pending',
  DELAY: 'delay',
  RISK: 'risk',
  EXECUTIVE: 'executive',
} as const;

export const REPORT_TYPE_LABELS: Record<string, string> = {
  overdue: 'Faturas Vencidas',
  pending: 'Carteira de Cobrança',
  delay: 'Atraso por Cliente',
  risk: 'Ranking de Risco',
  executive: 'Relatório Executivo',
};

// ============================================================================
// RISK SCORE
// ============================================================================

export const RISK_SCORE_RANGES = {
  LOW: { min: 0, max: 25, label: 'Baixo', color: '#10b981' },
  MEDIUM: { min: 26, max: 50, label: 'Médio', color: '#f59e0b' },
  HIGH: { min: 51, max: 75, label: 'Alto', color: '#ef4444' },
  CRITICAL: { min: 76, max: 100, label: 'Crítico', color: '#7c2d12' },
} as const;

// ============================================================================
// INVOICE STATUS
// ============================================================================

export const INVOICE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  PARTIAL: 'partial',
} as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  paid: 'Paga',
  pending: 'Pendente',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  partial: 'Parcial',
};

// ============================================================================
// COMMUNICATION CHANNELS
// ============================================================================

export const COMMUNICATION_CHANNELS = {
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
} as const;

export const COMMUNICATION_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  DELIVERED: 'delivered',
} as const;

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  FINANCEIRO: 'financeiro',
  COBRANCA: 'cobranca',
  GESTOR: 'gestor',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  cobranca: 'Cobrança',
  gestor: 'Gestor',
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  FORECAST: '/api/forecast',
  RISK_SCORE: '/api/risk-score',
  REPORTS: '/api/reports',
  CRON: '/api/cron',
  SEND_QUEUE: '/api/send-queue',
  WEBHOOKS: {
    RESEND: '/api/webhooks/resend',
    ZAPI: '/api/webhooks/zapi',
  },
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso proibido',
  NOT_FOUND: 'Recurso não encontrado',
  SERVER_ERROR: 'Erro no servidor',
  NETWORK_ERROR: 'Erro de rede',
  VALIDATION_ERROR: 'Erro de validação',
  UNKNOWN_ERROR: 'Erro desconhecido',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso',
  UPDATED: 'Atualizado com sucesso',
  DELETED: 'Deletado com sucesso',
  IMPORTED: 'Importado com sucesso',
  EXPORTED: 'Exportado com sucesso',
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_FILE_SIZE_MB: 10,
} as const;

// ============================================================================
// RETRY & RATE LIMITING
// ============================================================================

export const RATE_LIMIT = {
  DEFAULT_REQUESTS_PER_MINUTE: 60,
  WEBHOOK_REQUESTS_PER_MINUTE: 100,
  API_REQUESTS_PER_MINUTE: 100,
} as const;

export const RETRY_POLICY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// CACHE
// ============================================================================

export const CACHE_TTL = {
  REPORTS: 5 * 60, // 5 minutes
  RISK_SCORE: 10 * 60, // 10 minutes
  CUSTOMERS: 15 * 60, // 15 minutes
  SESSION: 30 * 60, // 30 minutes
} as const;

// ============================================================================
// PAGINATION (API)
// ============================================================================

export const API_LIMITS = {
  MAX_RECEIVABLES_PER_REQUEST: 500,
  MAX_CUSTOMERS_PER_REQUEST: 200,
  MAX_COMMUNICATIONS_PER_REQUEST: 1000,
} as const;
