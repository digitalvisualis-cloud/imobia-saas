import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * /s/[slug]/newsletter/cancelar?id=<inscricaoId>
 *
 * Marca a inscricao como inativa (ativo=false). Sem login — o id da
 * inscricao funciona como token de cancelamento (mesmo padrao de
 * unsubscribe link do Resend/Mailchimp).
 */
export default async function CancelarNewsletter({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;

  let status: 'ok' | 'erro' | 'naoencontrado' = 'erro';
  let email = '';

  if (id) {
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, marca: { select: { nomeEmpresa: true } } } });
    if (tenant) {
      const inscricao = await prisma.newsletterInscricao.findFirst({
        where: { id, tenantId: tenant.id },
      });
      if (inscricao) {
        email = inscricao.email;
        await prisma.newsletterInscricao.update({
          where: { id: inscricao.id },
          data: { ativo: false },
        });
        status = 'ok';
      } else {
        status = 'naoencontrado';
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg bg-white shadow-sm p-8 text-center">
        {status === 'ok' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 grid place-items-center mb-4 text-green-700 text-2xl">✓</div>
            <h1 className="text-xl font-semibold mb-2">Inscrição cancelada</h1>
            <p className="text-sm text-stone-600">
              O e-mail <span className="font-mono">{email}</span> não receberá mais alertas.
            </p>
            <a href={`/s/${slug}`} className="mt-6 inline-block text-sm text-stone-500 hover:text-stone-900 underline">
              Voltar ao site
            </a>
          </>
        )}
        {status === 'naoencontrado' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Inscrição não encontrada</h1>
            <p className="text-sm text-stone-600">
              Esse link pode estar inválido ou a inscrição já foi removida.
            </p>
          </>
        )}
        {status === 'erro' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Link inválido</h1>
            <p className="text-sm text-stone-600">
              Faltam parâmetros para identificar sua inscrição.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
