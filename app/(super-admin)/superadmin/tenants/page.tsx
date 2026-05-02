import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TenantsAdminPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      marca: { select: { nomeEmpresa: true, whatsapp: true, email: true } },
      _count: { select: { imoveis: true, users: true, leads: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Tenants</h1>
          <p className="text-sm text-zinc-400">
            Todas as imobiliárias cadastradas na plataforma.
          </p>
        </div>
        <span className="text-sm text-zinc-500">
          {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
        </span>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-500 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Slug</th>
              <th className="text-left px-4 py-2.5 font-medium">Imobiliária</th>
              <th className="text-left px-4 py-2.5 font-medium">Plano</th>
              <th className="text-right px-4 py-2.5 font-medium">Imóveis</th>
              <th className="text-right px-4 py-2.5 font-medium">Users</th>
              <th className="text-right px-4 py-2.5 font-medium">Leads</th>
              <th className="text-right px-4 py-2.5 font-medium">Criado</th>
              <th className="text-right px-4 py-2.5 font-medium">Agente IA</th>
              <th className="text-right px-4 py-2.5 font-medium">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                  Nenhum tenant cadastrado ainda.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
                    {t.slug}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.marca?.nomeEmpresa ?? (
                      <span className="text-zinc-500 italic">— sem marca</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {t.plano}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {t._count.imoveis}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {t._count.users}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {t._count.leads}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-500">
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/superadmin/tenants/${t.id}/agente`}
                      className="text-red-400 hover:text-red-300 text-xs underline"
                    >
                      configurar →
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/s/${t.slug}`}
                      target="_blank"
                      className="text-red-400 hover:text-red-300 text-xs underline"
                    >
                      abrir →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
