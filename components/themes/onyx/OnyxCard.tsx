import Link from 'next/link';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { formatPriceBRL, imageUrl } from '../_shared';

/**
 * Card de imovel compacto — foto 16:10, dados sobrepostos (codigo no topo
 * sobre badge escura), preco em destaque na cor primaria. Estilo Douglas
 * Navarro. Densidade alta, leitura rapida.
 */
export function OnyxCard({
  imovel,
  tenant,
}: {
  imovel: ImovelPublic;
  tenant: TenantPublic;
}) {
  const localizacao = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const subtitulo = imovel.titulo ?? '';
  const fotos = imovel.imagens?.length ? imovel.imagens : imovel.capaUrl ? [imovel.capaUrl] : [];
  const capa = fotos[0] ?? null;

  return (
    <Link
      href={`/s/${tenant.slug}/imovel/${imovel.codigo}`}
      className="group block overflow-hidden rounded-md border border-black/5 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(capa)}
          alt={imovel.titulo}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Tag operacao */}
        <span
          className="absolute top-2 left-2 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black"
          style={{ background: 'var(--t-primary)' }}
        >
          {imovel.operacao}
        </span>
        {/* Codigo */}
        <span className="absolute top-2 right-2 rounded-sm bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white/90">
          {imovel.codigo}
        </span>
      </div>
      <div className="px-3 py-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
          {imovel.tipo.replace('_', ' ')}
        </div>
        <h3 className="mt-0.5 line-clamp-1 font-semibold text-sm">{subtitulo}</h3>
        {localizacao && (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{localizacao}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-600">
          {imovel.quartos > 0 && <span>{imovel.quartos} <span className="text-gray-400">quartos</span></span>}
          {imovel.banheiros > 0 && <span>{imovel.banheiros} <span className="text-gray-400">banh.</span></span>}
          {imovel.vagas > 0 && <span>{imovel.vagas} <span className="text-gray-400">vagas</span></span>}
          {imovel.areaM2 && <span>{imovel.areaM2}m²</span>}
        </div>
        <div
          className="mt-2 pt-2 border-t border-black/5 text-base font-bold"
          style={{ color: 'var(--t-primary)' }}
        >
          {formatPriceBRL(imovel.preco, imovel.operacao)}
        </div>
      </div>
    </Link>
  );
}
