/**
 * Centralized TypeScript Type Definitions
 * 
 * Consolidate todas as interfaces e types utilizadas em todo o projeto
 * para evitar duplicação e facilitar manutenção
 */

// ============================================================================
// AUTH & SESSION
// ============================================================================

export interface SessionUser {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  role?: string;
}

// ============================================================================
// REPORTS
// ============================================================================

export type ReportType = 'overdue' | 'pending' | 'delay' | 'risk' | 'executive';
export type PeriodType = '30d' | '60d' | '90d' | '180d';
export type PeriodFilter = '1m' | '3m' | '6m' | '12m';

export interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  loading?: boolean;
}

export interface ReportFilters {
  period?: PeriodType;
  search?: string;
  status?: string;
}

export interface ReportTableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: unknown) => React.ReactNode;
}

export interface ReportTableProps {
  columns: ReportTableColumn[];
  data: unknown[];
  loading?: boolean;
  onRowClick?: (row: unknown) => void;
}

// ============================================================================
// FORECAST
// ============================================================================

export interface ForecastData {
  date: string;
  optimistic: number;
  realistic: number;
  conservative: number;
}

// ============================================================================
// CHARTS & VISUALIZATION
// ============================================================================

export type ChartsProps = {
  data: unknown[];
  height?: number;
  color?: string;
};

// ============================================================================
// FORMS
// ============================================================================

export interface CustomerFormProps {
  customerId?: string;
  onClose: () => void;
}

export interface ContactFormProps {
  customerId: string;
  onClose: () => void;
}

export interface TimelineProps {
  customerId: string;
}

// ============================================================================
// CONFIGURATION & TEAM
// ============================================================================

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
};

// ============================================================================
// QUEUE & MESSAGING
// ============================================================================

export interface QueueClientProps {
  tenantId: string;
  autoRefresh?: boolean;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================================================
// LOGGING
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  data?: unknown;
}
