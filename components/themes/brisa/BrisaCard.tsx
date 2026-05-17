import Link from 'next/link';
import { Bed, Bath, Car, Maximize2 } from 'lucide-react';
import type { ImovelPublic } from '@/app/_templates/types';
import { formatPriceBRL, imageUrl, imovelHref } from '../_shared';

interface Props {
  imovel: ImovelPublic;
  slug: string;
}

export function BrisaCard({ imovel, slug }: Props) {
  return (
    <Link
      href={imovelHref(slug, imovel.codigo)}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200/60 transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl(imovel.capaUrl ?? imovel.imagens[0])}
          alt={imovel.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: 'var(--t-secondary)', color: 'var(--t-fg)' }}
        >
          {imovel.operacao.toLowerCase()}
        </span>
        <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur">
          {imovel.codigo}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">
          {imovel.bairro ?? '—'} {imovel.cidade && `· ${imovel.cidade}`}
        </p>
        <h3
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="mt-1 text-sm font-semibold leading-snug line-clamp-1"
        >
          {imovel.titulo}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[11px] opacity-70">
          {imovel.quartos > 0 && <Spec icon={Bed} v={imovel.quartos} />}
          {imovel.banheiros > 0 && <Spec icon={Bath} v={imovel.banheiros} />}
          {imovel.vagas > 0 && <Spec icon={Car} v={imovel.vagas} />}
          {imovel.areaM2 != null && <Spec icon={Maximize2} v={`${imovel.areaM2}m²`} />}
        </div>
        <div
          className="mt-3 border-t pt-2.5"
          style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.08)' }}
        >
          <span
            style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-primary)' }}
            className="text-base font-bold"
          >
            {formatPriceBRL(imovel.preco, imovel.operacao)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon: Icon, v }: { icon: typeof Bed; v: number | string }) {
  return (
    <span className="flex items-center gap-1">
      <Icon className="h-3.5 w-3.5" /> {v}
    </span>
  );
}
