import Link from 'next/link';
import type { ImovelPublic } from '@/app/_templates/types';
import { formatPriceBRL, imageUrl, imovelHref } from '../_shared';

interface Props {
  imovel: ImovelPublic;
  slug: string;
  large?: boolean;
}

export function AuraCard({ imovel, slug, large = false }: Props) {
  return (
    <Link href={imovelHref(slug, imovel.codigo)} className="group block">
      <div
        className={`relative overflow-hidden ${large ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}
      >
        <img
          src={imageUrl(imovel.capaUrl ?? imovel.imagens[0])}
          alt={imovel.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute right-4 top-4 rounded-sm bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-black backdrop-blur">
          {imovel.tipo.toLowerCase()}
        </div>
      </div>
      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.35em] opacity-60">
            {imovel.bairro ?? '—'} {imovel.cidade && `· ${imovel.cidade}`}
          </p>
          <h3
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-2xl leading-[1.15] md:text-3xl"
          >
            {imovel.titulo}
          </h3>
          <p className="mt-2 text-sm opacity-65">
            {imovel.areaM2 != null && `${imovel.areaM2} m²`}
            {imovel.quartos > 0 && ` · ${imovel.quartos} dormitórios`}
            {imovel.vagas > 0 && ` · ${imovel.vagas} vagas`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div
            style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-secondary)' }}
            className="text-xl"
          >
            {formatPriceBRL(imovel.preco, imovel.operacao)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] opacity-50">
            {imovel.codigo}
          </div>
        </div>
      </div>
    </Link>
  );
}
