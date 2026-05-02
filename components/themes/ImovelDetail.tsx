'use client';

import { useState } from 'react';
import { Bed, Bath, Car, Maximize2, MapPin, Phone, MessageCircle } from 'lucide-react';
import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { ThemeScope } from './ThemeScope';
import { BrisaHeader, BrisaFooter } from './brisa/BrisaChrome';
import { AuraHeader, AuraFooter } from './aura/AuraChrome';
import { formatPriceBRL, imageUrl } from './_shared';

interface Props {
  theme: ThemeId;
  config: Customization;
  tenant: TenantPublic;
  imovel: ImovelPublic;
}

export function ImovelDetail({ theme, config, tenant, imovel }: Props) {
  const Header = theme === 'aura' ? AuraHeader : BrisaHeader;
  const Footer = theme === 'aura' ? AuraFooter : BrisaFooter;

  return (
    <ThemeScope config={config}>
      <Header config={config} tenant={tenant} />
      <main className={theme === 'aura' ? 'pt-32' : ''}>
        <ImovelGallery imagens={imovel.imagens} capa={imovel.capaUrl} titulo={imovel.titulo} />
        <ImovelInfo imovel={imovel} tenant={tenant} />
      </main>
      <Footer config={config} tenant={tenant} />
    </ThemeScope>
  );
}

function ImovelGallery({
  imagens,
  capa,
  titulo,
}: {
  imagens: string[];
  capa: string | null;
  titulo: string;
}) {
  const all = [capa, ...imagens].filter((x): x is string => Boolean(x));
  const [active, setActive] = useState(0);
  const main = all[active] ?? imageUrl(null);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-8">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-3">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl">
            <img src={main} alt={titulo} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 md:grid-cols-1">
          {all.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-[4/3] overflow-hidden rounded-lg ring-2 ${
                active === i ? 'ring-[var(--t-primary)]' : 'ring-transparent'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImovelInfo({
  imovel,
  tenant,
}: {
  imovel: ImovelPublic;
  tenant: TenantPublic;
}) {
  const wppNumber = (tenant.marca?.whatsapp ?? '').replace(/\D/g, '');
  const wppText = encodeURIComponent(
    `Olá! Tenho interesse no imóvel [${imovel.codigo}] — ${imovel.titulo}.`,
  );
  const wppHref = wppNumber
    ? `https://wa.me/${wppNumber}?text=${wppText}`
    : '#contato';

  return (
    <div className="mx-auto mt-12 max-w-7xl px-6 pb-24">
      <div className="grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
            {imovel.tipo.replace(/_/g, ' ').toLowerCase()} · {imovel.operacao.toLowerCase()}
          </p>
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-3xl font-semibold leading-tight md:text-5xl"
          >
            {imovel.titulo}
          </h1>
          {(imovel.bairro || imovel.cidade) && (
            <p className="mt-3 flex items-center gap-1.5 text-sm opacity-75">
              <MapPin className="h-4 w-4" />
              {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(' · ')}
            </p>
          )}

          <div
            className="mt-7 flex flex-wrap gap-6 border-y py-5 text-sm"
            style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.1)' }}
          >
            {imovel.quartos > 0 && (
              <Spec icon={Bed} label="Quartos" value={imovel.quartos} />
            )}
            {imovel.banheiros > 0 && (
              <Spec icon={Bath} label="Banheiros" value={imovel.banheiros} />
            )}
            {imovel.vagas > 0 && (
              <Spec icon={Car} label="Vagas" value={imovel.vagas} />
            )}
            {imovel.areaM2 != null && (
              <Spec icon={Maximize2} label="Área útil" value={`${imovel.areaM2}m²`} />
            )}
          </div>

          {imovel.descricao && (
            <div className="mt-8">
              <h2
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-2xl font-semibold"
              >
                Sobre este imóvel
              </h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed opacity-80">
                {imovel.descricao}
              </p>
            </div>
          )}

          {imovel.amenidades.length > 0 && (
            <div className="mt-10">
              <h2
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-2xl font-semibold"
              >
                Comodidades
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {imovel.amenidades.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'rgb(var(--t-fg-rgb) / 0.04)' }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--t-primary)' }}
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="md:col-span-1">
          <div
            className="sticky top-24 rounded-2xl border p-6"
            style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.1)' }}
          >
            <p className="text-xs uppercase tracking-wider opacity-60">
              {imovel.operacao.toUpperCase() === 'ALUGUEL' ? 'Aluguel mensal' : 'Valor de venda'}
            </p>
            <p
              style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-primary)' }}
              className="mt-1 text-3xl font-bold"
            >
              {formatPriceBRL(imovel.preco, imovel.operacao)}
            </p>
            <p className="mt-1 text-xs opacity-60">Cód. {imovel.codigo}</p>

            <a
              href={wppHref}
              target="_blank"
              rel="noopener"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
            >
              <MessageCircle className="h-4 w-4" /> Tenho interesse
            </a>

            {tenant.marca?.telefone && (
              <a
                href={`tel:${tenant.marca.telefone.replace(/\D/g, '')}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium"
                style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.15)' }}
              >
                <Phone className="h-4 w-4" /> {tenant.marca.telefone}
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bed;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-5 w-5 opacity-60" />
      <div>
        <div className="text-base font-semibold">{value}</div>
        <div className="text-[11px] uppercase tracking-wider opacity-60">{label}</div>
      </div>
    </div>
  );
}
