import { prisma } from '@/lib/prisma';
import { Building2, Users2, Receipt, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  const [tenants, users, imoveis, recentTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.imovel.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { marca: true, _count: { select: { imoveis: true, users: true } } },
    }),
  ]);

  const cards = [
    { label: 'Tenants ativos', value: tenants, Icon: Building2 },
    { label: 'Usuários totais', value: users, Icon: Users2 },
    { label: 'Imóveis publicados', value: imoveis, Icon: Sparkles },
    { label: 'MRR estimado', value: '— em breve', Icon: Receipt, soft: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard Plataforma</h1>
        <p className="text-sm text-zinc-400">
          Visão consolidada de todos os tenants, IA e infra.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, Icon, soft }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <Icon className="h-4 w-4 text-zinc-600" />
            </div>
            <p
              className={
                'mt-2 font-display text-3xl font-semibold ' +
                (soft ? 'text-zinc-500' : 'text-zinc-100')
              }
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Últimos tenants */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-3">
          Últimos tenants criados
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-500 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Slug</th>
                <th className="text-left px-4 py-2 font-medium">Nome</th>
                <th className="text-left px-4 py-2 font-medium">Plano</th>
                <th className="text-right px-4 py-2 font-medium">Imóveis</th>
                <th className="text-right px-4 py-2 font-medium">Users</th>
                <th className="text-right px-4 py-2 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum tenant ainda.
                  </td>
                </tr>
              ) : (
                recentTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
                      {t.slug}
                    </td>
                    <td className="px-4 py-2.5">
                      {t.marca?.nomeEmpresa ?? t.slug}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs uppercase">
                      {t.plano ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">{t._count.imoveis}</td>
                    <td className="px-4 py-2.5 text-right">{t._count.users}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-zinc-500">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
