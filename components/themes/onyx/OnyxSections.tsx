'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, MapPin } from 'lucide-react';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import type { Customization } from '@/types/site-customization';
import { OnyxCard } from './OnyxCard';
import { heroImage } from '../_shared';

interface SectionProps {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  config?: Customization;
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80';

/**
 * Hero denso estilo Douglas Navarro. Headline center medio, eyebrow
 * pequeno, search bar horizontal 4 colunas (Tipo · Cidade · Bairro ·
 * Buscar), tabs Venda/Aluguel acima.
 */
export function OnyxHero({ tenant, imoveis, config }: SectionProps) {
  const heroImg =
    config?.hero?.imageUrl?.trim() ||
    (imoveis.length > 0 ? heroImage(imoveis[0]) : HERO_FALLBACK);
  const slogan = tenant.marca?.slogan ?? 'Encontre seu imóvel\nVenha viver o extraordinário!';
  const descricao = tenant.marca?.descricao ?? '';

  return (
    <div className="relative min-h-[560px] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-[560px] max-w-[1200px] flex-col items-center justify-center px-4 py-12 text-center">
        <div
          style={{
            color: tenant.marca?.corTextoHero || '#FFFFFF',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
          }}
        >
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="whitespace-pre-line text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl"
          >
            {slogan}
          </h1>
          {descricao && (
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
              {descricao}
            </p>
          )}
        </div>

        <OnyxSearchBar slug={tenant.slug} />
      </div>
    </div>
  );
}

function OnyxSearchBar({ slug }: { slug: string }) {
  const router = useRouter();
  const [op, setOp] = useState<'venda' | 'aluguel'>('venda');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    sp.set('op', op);
    if (tipo) sp.set('tipo', tipo);
    if (cidade.trim()) sp.set('cidade', cidade.trim());
    if (bairro.trim()) sp.set('bairro', bairro.trim());
    router.push(`/s/${slug}?${sp.toString()}`);
  }

  const tipos = [
    { v: '', l: 'Tipo' },
    { v: 'CASA', l: 'Casa' },
    { v: 'APARTAMENTO', l: 'Apartamento' },
    { v: 'COBERTURA', l: 'Cobertura' },
    { v: 'STUDIO', l: 'Studio' },
    { v: 'TERRENO', l: 'Terreno' },
    { v: 'SALA_COMERCIAL', l: 'Sala Comercial' },
    { v: 'CHACARA', l: 'Chácara' },
  ];

  return (
    <form
      onSubmit={buscar}
      className="mt-8 w-full max-w-3xl rounded-lg bg-white/95 p-2 shadow-2xl backdrop-blur"
    >
      {/* Tabs VENDA / ALUGUEL */}
      <div className="mb-2 flex gap-1 rounded-md bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setOp('venda')}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            op === 'venda'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Venda
        </button>
        <button
          type="button"
          onClick={() => setOp('aluguel')}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            op === 'aluguel'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Aluguel
        </button>
      </div>

      {/* Search row 4-col */}
      <div className="grid gap-1.5 sm:grid-cols-[auto_1fr_1fr_auto] sm:gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
        >
          {tipos.map((t) => (
            <option key={t.v} value={t.v}>{t.l}</option>
          ))}
        </select>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade"
          className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
        />
        <input
          type="text"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro ou empreendimento"
          className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold text-black"
          style={{ background: 'var(--t-primary)' }}
        >
          <Search className="h-4 w-4" /> Buscar
        </button>
      </div>

      {/* Toggles secundarios — mostram que ha mais filtros disponiveis.
          Sem implementacao ainda. */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <button type="button" className="inline-flex items-center gap-1 hover:text-gray-900">
          <span className="opacity-50">⊕</span> Busca avançada
        </button>
        <span className="opacity-30">·</span>
        <button type="button" className="inline-flex items-center gap-1 hover:text-gray-900">
          <span className="opacity-50">#</span> Por código
        </button>
        <span className="opacity-30">·</span>
        <button type="button" className="inline-flex items-center gap-1 hover:text-gray-900">
          <span className="opacity-50">▦</span> Empreendimentos
        </button>
      </div>
    </form>
  );
}

/**
 * Destaques: 3 cards horizontais compactos. Grid responsivo.
 */
export function OnyxDestaques({ tenant, imoveis }: SectionProps) {
  const lista = imoveis.slice(0, 6);
  if (lista.length === 0) return null;
  return (
    <section id="destaques" className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h2
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="text-2xl font-semibold sm:text-3xl"
        >
          Veja nossos destaques de imóveis à venda
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Os melhores imóveis selecionados pra você
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lista.map((imv) => (
          <OnyxCard key={imv.id} imovel={imv} tenant={tenant} />
        ))}
      </div>
    </section>
  );
}

/**
 * Sobre: 2-col foto + texto + botao. Estilo Douglas Navarro.
 */
export function OnyxSobre({ tenant }: SectionProps) {
  const sobre =
    tenant.marca?.descricao ??
    'Construímos nossa reputação atendendo clientes que buscam propriedades de alto padrão, oferecendo um portfólio cuidadosamente selecionado dos melhores empreendimentos da região.';
  const nomeEmpresa = tenant.marca?.nomeEmpresa ?? tenant.nome;
  return (
    <section id="sobre" className="bg-gray-50">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
        <div className="aspect-[4/5] overflow-hidden rounded-md bg-gray-200 md:max-w-md">
          {tenant.marca?.logoUrl ? (
            // Sem foto de equipe — usa logo grande como placeholder visual.
            // O user pode trocar com uma foto custom no editor depois.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.marca.logoUrl}
              alt={nomeEmpresa}
              className="h-full w-full object-contain p-12"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-gray-400">
              <span style={{ fontFamily: 'var(--t-font-heading)' }} className="text-4xl">
                {nomeEmpresa[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Sobre nós
          </p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl"
          >
            Excelência em imóveis de alto padrão
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-gray-600">{sobre}</p>
          <a
            href="#contato"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--t-primary)' }}
          >
            Conheça a {nomeEmpresa} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Categorias: faixa preta com cards de regiões/cidades.
 * Extrai as cidades unicas dos imoveis publicados.
 */
export function OnyxCategorias({ tenant, imoveis }: SectionProps) {
  const cidades = Array.from(new Set(imoveis.map((i) => i.cidade).filter(Boolean) as string[])).slice(0, 3);
  if (cidades.length === 0) return null;
  return (
    <section className="bg-black text-white py-16">
      <div className="mx-auto max-w-[1500px] px-6">
        <div className="mb-8 text-center">
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-2xl font-semibold sm:text-3xl"
          >
            Faça a sua busca pela região que você mais gosta!
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Confira os melhores imóveis na sua cidade favorita
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {cidades.map((cid) => {
            const imovelCid = imoveis.find((i) => i.cidade === cid);
            const img = imovelCid ? heroImage(imovelCid) : null;
            return (
              <a
                key={cid}
                href={`/s/${tenant.slug}?cidade=${encodeURIComponent(cid)}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-md"
              >
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={cid}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold">
                    <MapPin className="h-4 w-4" /> {cid}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * CTA: 2 cards lado a lado — "Anuncie seu Imóvel" + "Buscamos seu Imóvel".
 */
export function OnyxCTA({ tenant }: SectionProps) {
  const nomeEmpresa = tenant.marca?.nomeEmpresa ?? tenant.nome;
  return (
    <section id="contato" className="bg-white py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-8 text-center">
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-2xl font-semibold sm:text-3xl"
          >
            Conheça as soluções da {nomeEmpresa}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Oportunidades pra quem quer vender, alugar ou comprar um imóvel
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-6">
            <p className="text-xs uppercase tracking-wider text-gray-500">Vamos alugar ou vender?</p>
            <h3
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-2 text-xl font-semibold"
            >
              Anuncie seu imóvel!
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Anuncie seu imóvel com a gente — fazemos a consultoria completa,
              da divulgação à entrega das chaves.
            </p>
            <a
              href="#contato"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--t-primary)' }}
            >
              Anunciar imóvel <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-6">
            <p className="text-xs uppercase tracking-wider text-gray-500">Não achou?</p>
            <h3
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-2 text-xl font-semibold"
            >
              Buscamos seu imóvel!
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Ainda não encontrou o imóvel que procurava? Conta o que você
              busca, encontramos rápido pra você.
            </p>
            <a
              href="#contato"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--t-primary)' }}
            >
              Encontrar meu imóvel <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Re-exports pra ThemeRenderer encontrar
export function OnyxDepoimentos() { return null; }
export function OnyxFAQ() { return null; }
export function OnyxContato() { return null; }
