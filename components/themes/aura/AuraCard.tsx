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
        className={`relative overflow-hidden ${large ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
      >
        <img
          src={imageUrl(imovel.capaUrl ?? imovel.imagens[0])}
          alt={imovel.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute right-3 top-3 rounded-sm bg-white/90 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black backdrop-blur">
          {imovel.tipo.toLowerCase()}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60">
            {imovel.bairro ?? '—'} {imovel.cidade && `· ${imovel.cidade}`}
          </p>
          <h3
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-1.5 text-base leading-[1.2] sm:text-lg line-clamp-1"
          >
            {imovel.titulo}
          </h3>
          <p className="mt-1.5 text-xs opacity-65">
            {imovel.areaM2 != null && `${imovel.areaM2} m²`}
            {imovel.quartos > 0 && ` · ${imovel.quartos} dorm`}
            {imovel.vagas > 0 && ` · ${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div
            style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-secondary)' }}
            className="text-base sm:text-lg"
          >
            {formatPriceBRL(imovel.preco, imovel.operacao)}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.2em] opacity-50 font-mono">
            {imovel.codigo}
          </div>
        </div>
      </div>
    </Link>
  );
}
