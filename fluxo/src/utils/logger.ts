/**
 * Logger utility for production-safe logging
 * 
 * Exemplo de uso:
 * import { logger } from '@/utils/logger';
 * logger.error('[WEBHOOK/RESEND]', err);
 * logger.warn('[QUEUE]', message);
 * logger.info('[EMAIL]', data);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  data?: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];

  private formatLog(level: LogLevel, context: string, message: string, data?: unknown): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      context,
      message,
      data,
    };
  }

  private output(logEntry: LogEntry) {
    // Em produção: apenas erros críticos
    // Em desenvolvimento: todos os logs
    
    if (!this.isDev && logEntry.level === 'debug') {
      return;
    }

    // Adicionar ao array de logs (útil para debugging)
    this.logs.push(logEntry);

    // Manter buffer pequeno (últimos 100 logs)
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Logar para stdout em produção
    if (!this.isDev || logEntry.level === 'error') {
      const baseMessage = `[${logEntry.context}] ${logEntry.message}`;

      if (logEntry.level === 'error') {
        if (logEntry.data) {
          console.error(baseMessage, logEntry.data);
        } else {
          console.error(baseMessage);
        }
      } else if (logEntry.level === 'warn') {
        if (logEntry.data) {
          console.warn(baseMessage, logEntry.data);
        } else {
          console.warn(baseMessage);
        }
      } else {
        if (logEntry.data) {
          console.log(baseMessage, logEntry.data);
        } else {
          console.log(baseMessage);
        }
      }
    }
  }

  debug(context: string, message: string, data?: unknown) {
    this.output(this.formatLog('debug', context, message, data));
  }

  info(context: string, message: string, data?: unknown) {
    this.output(this.formatLog('info', context, message, data));
  }

  warn(context: string, message: string, data?: unknown) {
    this.output(this.formatLog('warn', context, message, data));
  }

  error(context: string, message: string, data?: unknown) {
    this.output(this.formatLog('error', context, message, data));
  }

  /**
   * Get recent logs (últimos N) para debugging
   */
  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
