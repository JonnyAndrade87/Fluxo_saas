import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mockamos APENAS o rate limiter globalmente para não sujar o BD no meio dos testes de auth,
// e para não mascarar erros do `next/headers` em outras partes da aplicação.
vi.mock('@/lib/api-rate-limiter', () => ({
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}));
