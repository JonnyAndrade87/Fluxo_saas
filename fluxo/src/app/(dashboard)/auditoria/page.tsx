/**
 * FOCO 4 — Página de Auditoria
 * Acesso restrito a admin
 */

import { redirect } from 'next/navigation';
import { auth } from '../../../../auth';
import { getAuditLogs, countAuditLogs } from '@/lib/audit';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auditoria | Fluxo',
  description: 'Trilha de auditoria de ações críticas do sistema',
};

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Apenas admin pode acessar auditoria
  if (!user?.tenantId || user?.role !== 'admin') {
    redirect('/cobrancas');
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    userName: user.name || user.email,
  };
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await requireAdmin();
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    getAuditLogs(user.tenantId, limit, offset),
    countAuditLogs(user.tenantId),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
              <p className="mt-1 text-sm text-gray-500">
                Trilha de ações críticas do sistema (deletar, modificar, exportar)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4 sm:p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-sm font-medium text-gray-600">Total de Ações</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{total}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-sm font-medium text-gray-600">Usuário</div>
              <div className="mt-2 text-sm font-medium text-gray-900">{user.userName}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-sm font-medium text-gray-600">Página</div>
              <div className="mt-2 text-sm font-medium text-gray-900">
                {page} de {totalPages}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {logs.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Entidade
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        <span className="text-xs text-gray-600">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {log.user || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          {log.actionLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {log.entity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-600">
                        <code className="text-xs">{log.entityId.slice(0, 8)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-gray-600">Nenhuma ação registrada</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {offset + 1} até {Math.min(offset + limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <a
                  href={`?page=${Math.max(1, page - 1)}`}
                  className={`rounded border px-3 py-1 text-sm ${
                    page === 1
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </a>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => (
                    <div key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-2 text-gray-400">…</span>
                      )}
                      <a
                        href={`?page=${p}`}
                        className={`rounded border px-3 py-1 text-sm ${
                          p === page
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </a>
                    </div>
                  ))}
                <a
                  href={`?page=${Math.min(totalPages, page + 1)}`}
                  className={`rounded border px-3 py-1 text-sm ${
                    page === totalPages
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Próxima
                </a>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Ações Auditadas:</strong> Deletar, Exportar, Alterar Configurações.
                  Todas as ações incluem data, hora, usuário e detalhes da operação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
