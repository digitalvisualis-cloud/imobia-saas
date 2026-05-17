import Link from 'next/link';
import type { ImovelPublic } from '@/app/_templates/types';
import { formatPriceBRL, imageUrl, imovelHref } from '../_shared';

interface Props {
  imovel: ImovelPublic;
  slug: string;
}

/**
 * Card baseado no visual-lab (.site-card):
 * - photo 16:10 com badge "venda/aluguel" canto sup-esq
 * - body: eyebrow bairro/cidade · titulo · specs muted · preco em accent
 * - bordo + radius compactos (8px)
 */
export function BrisaCard({ imovel, slug }: Props) {
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
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: 'var(--t-primary)' }}
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
