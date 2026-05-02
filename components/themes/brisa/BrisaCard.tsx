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
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-xl"
      style={{ background: 'rgb(255 255 255 / 0.6)' }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl(imovel.capaUrl ?? imovel.imagens[0])}
          alt={imovel.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: 'var(--t-secondary)', color: 'var(--t-fg)' }}
        >
          {imovel.operacao.toLowerCase()}
        </span>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] opacity-60">
          {imovel.bairro ?? '—'} {imovel.cidade && `· ${imovel.cidade}`}
        </p>
        <h3
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="mt-1.5 text-lg font-semibold leading-snug"
        >
          {imovel.titulo}
        </h3>
        <div className="mt-3.5 flex items-center gap-4 text-xs opacity-70">
          {imovel.quartos > 0 && <Spec icon={Bed} v={imovel.quartos} />}
          {imovel.banheiros > 0 && <Spec icon={Bath} v={imovel.banheiros} />}
          {imovel.vagas > 0 && <Spec icon={Car} v={imovel.vagas} />}
          {imovel.areaM2 != null && <Spec icon={Maximize2} v={`${imovel.areaM2}m²`} />}
        </div>
        <div
          className="mt-4 flex items-end justify-between border-t pt-4"
          style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.08)' }}
        >
          <span
            style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-primary)' }}
            className="text-xl font-bold"
          >
            {formatPriceBRL(imovel.preco, imovel.operacao)}
          </span>
          <span className="text-[11px] opacity-50">{imovel.codigo}</span>
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
