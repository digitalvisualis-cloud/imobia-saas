import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Mail, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

/**
 * /newsletter — Lista de inscritos em "Alertas de novos imoveis".
 *
 * Diferente do Kanban de Negocios: aqui ficam pessoas que so deixaram email
 * pra ser avisado quando um imovel novo bater com o filtro delas. Util pra
 * disparo em massa (F2) ou pra exportar pra Mailchimp/Resend.
 */
export default async function NewsletterPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const inscricoes = await prisma.newsletterInscricao.findMany({
    where: { tenantId, ativo: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Alertas de imóveis novos"
        description={`${inscricoes.length} inscrito${inscricoes.length === 1 ? '' : 's'} pra receber imóveis em primeira mão. Disparamos email automático quando você cadastra um imóvel que bate com o filtro de cada um.`}
        icon={Mail}
      />

      {inscricoes.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum inscrito ainda"
          description="Quando alguém preencher o formulário 'Receba imóveis em primeira mão' no seu site, vai aparecer aqui."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Lista enxuta — F2 vai trazer disparo em massa e integração com Resend.
            </p>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                [
                  ['email', 'nome', 'cidade', 'tipo', 'operacao', 'precoMax', 'inscritoEm'].join(','),
                  ...inscricoes.map((i) =>
                    [
                      i.email,
                      i.nome ?? '',
                      i.cidadeInteresse ?? '',
                      i.tipoInteresse ?? '',
                      i.operacaoInteresse ?? '',
                      i.precoMax?.toString() ?? '',
                      i.createdAt.toISOString(),
                    ]
                      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                      .join(','),
                  ),
                ].join('\n'),
              )}`}
              download={`alertas-${new Date().toISOString().slice(0, 10)}.csv`}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">E-mail</th>
                <th className="px-4 py-2.5">Nome</th>
                <th className="px-4 py-2.5">Interesse</th>
                <th className="px-4 py-2.5">Último alerta</th>
                <th className="px-4 py-2.5 text-right">Inscrito em</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-muted/10">
                  <td className="px-4 py-2.5 font-mono text-xs">{i.email}</td>
                  <td className="px-4 py-2.5">{i.nome ?? <span className="opacity-40">—</span>}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {[i.cidadeInteresse, i.tipoInteresse, i.operacaoInteresse].filter(Boolean).join(' · ') || <span className="opacity-40">qualquer</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {i.ultimoEnvio ? i.ultimoEnvio.toLocaleDateString('pt-BR') : <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {i.createdAt.toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
