import Link from 'next/link';
import type { ImovelPublic } from '@/app/_templates/types';
import { formatPriceBRL, imageUrl, imovelHref } from '../_shared';

interface Props {
  imovel: ImovelPublic;
  slug: string;
}

/**
 * Aura Card — mesma estrutura do BrisaCard mas com refinamento editorial:
 * - tipografia serif no titulo
 * - badge transparente menos colorido (.uppercase tracking)
 * - photo 16:10 + body 14px
 *
 * Compartilha o contrato visual do lab. Diferenca pra Brisa: o accent
 * (--t-primary) eh gold em vez de green; chrome mais sofisticado.
 */
export function AuraCard({ imovel, slug }: Props) {
  const operacao = imovel.operacao.toLowerCase();
  const specs: string[] = [];
  if (imovel.areaM2 != null) specs.push(`${imovel.areaM2} m²`);
  if (imovel.quartos > 0) specs.push(`${imovel.quartos} quartos`);
  if (imovel.banheiros > 0) specs.push(`${imovel.banheiros} banh.`);

  return (
    <Link
      href={imovelHref(slug, imovel.codigo)}
      className="group block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.1)' }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={imageUrl(imovel.capaUrl ?? imovel.imagens[0])}
          alt={imovel.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
        />
        <span
          className="absolute left-2.5 top-2.5 rounded-sm bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-900 backdrop-blur"
        >
          {operacao}
        </span>
        <span className="absolute right-2.5 top-2.5 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] text-white">
          {imovel.codigo}
        </span>
      </div>
      <div className="p-3.5">
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'rgb(var(--t-fg-rgb) / 0.55)' }}
        >
          {imovel.bairro ?? '—'}
          {imovel.cidade && ` · ${imovel.cidade}`}
        </p>
        <h4
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="mt-1.5 line-clamp-2 text-base leading-tight"
        >
          {imovel.titulo}
        </h4>
        {specs.length > 0 && (
          <div
            className="mt-2 flex gap-2 text-xs"
            style={{ color: 'rgb(var(--t-fg-rgb) / 0.55)' }}
          >
            {specs.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        )}
        <div
          className="mt-3 text-lg font-extrabold"
          style={{ color: 'var(--t-primary)' }}
        >
          {formatPriceBRL(imovel.preco, imovel.operacao)}
        </div>
      </div>
    </Link>
  );
}
