'use client';

import { useState } from 'react';
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
    <div className="relative min-h-[640px] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-[640px] max-w-[1200px] flex-col items-center justify-center px-4 py-16 text-center">
        <div
          style={{
            color: tenant.marca?.corTextoHero || '#FFFFFF',
            textShadow: '0 2px 14px rgba(0,0,0,0.6)',
          }}
        >
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="whitespace-pre-line text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-5xl"
          >
            {slogan}
          </h1>
          {descricao && (
            <p className="mx-auto mt-4 max-w-xl text-base opacity-95">
              {descricao}
            </p>
          )}
        </div>

        <OnyxSearchBar slug={tenant.slug} />
      </div>
    </div>
  );
}

/**
 * Search bar com mesma logica do BrisaSearchCard (recarrega URL com
 * query string filtrando a listagem). Layout horizontal compacto +
 * tabs Venda/Aluguel + 4 campos + busca avancada que abre filtros
 * extras (quartos, faixa de preco).
 */
function OnyxSearchBar({ slug: _slug }: { slug: string }) {
  const [op, setOp] = useState<'venda' | 'aluguel'>('venda');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [busca, setBusca] = useState('');
  const [quartos, setQuartos] = useState('');
  const [faixa, setFaixa] = useState('');
  const [codigo, setCodigo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [modoCodigo, setModoCodigo] = useState(false);

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (modoCodigo && codigo.trim()) {
      params.set('q', codigo.trim());
    } else {
      params.set('op', op);
      if (tipo) params.set('tipo', tipo);
      if (cidade.trim()) params.set('cidade', cidade.trim());
      if (busca.trim()) params.set('q', busca.trim());
      if (quartos) params.set('quartos', quartos);
      if (faixa) params.set('faixa', faixa);
    }
    window.location.search = params.toString();
  }

  const tipos = [
    { v: '', l: 'Todos os tipos' },
    { v: 'CASA', l: 'Casa' },
    { v: 'APARTAMENTO', l: 'Apartamento' },
    { v: 'COBERTURA', l: 'Cobertura' },
    { v: 'STUDIO', l: 'Studio' },
    { v: 'TERRENO', l: 'Terreno' },
    { v: 'SALA_COMERCIAL', l: 'Sala Comercial' },
    { v: 'LOJA', l: 'Loja' },
    { v: 'GALPAO', l: 'Galpão' },
    { v: 'CHACARA', l: 'Chácara' },
    { v: 'SITIO', l: 'Sítio' },
  ];

  const faixas = [
    { v: '', l: 'Qualquer preço' },
    { v: '0-300000', l: 'Até R$ 300 mil' },
    { v: '300000-500000', l: 'R$ 300 — 500 mil' },
    { v: '500000-1000000', l: 'R$ 500 mil — 1 mi' },
    { v: '1000000-3000000', l: 'R$ 1 — 3 mi' },
    { v: '3000000-', l: 'Acima de R$ 3 mi' },
  ];

  return (
    <form
      onSubmit={submeter}
      className="mt-8 w-full max-w-3xl rounded-lg bg-white/97 p-2 shadow-2xl backdrop-blur"
    >
      {/* Tabs VENDA / ALUGUEL */}
      <div className="mb-2 flex gap-1 rounded-md bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => { setOp('venda'); setModoCodigo(false); }}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            !modoCodigo && op === 'venda'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Venda
        </button>
        <button
          type="button"
          onClick={() => { setOp('aluguel'); setModoCodigo(false); }}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            !modoCodigo && op === 'aluguel'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Aluguel
        </button>
      </div>

      {modoCodigo ? (
        <div className="grid gap-1.5 sm:grid-cols-[1fr_auto] sm:gap-2">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código do imóvel (ex: IMV-1234)"
            autoFocus
            className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold text-black"
            style={{ background: 'var(--t-primary)' }}
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </div>
      ) : (
        <>
          {/* Linha principal: tipo · busca · buscar */}
          <div className="grid gap-1.5 sm:grid-cols-[auto_1fr_auto] sm:gap-2">
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
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Cidade, bairro ou empreendimento"
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

          {/* Busca avancada — abre quartos + faixa de preco */}
          {aberto && (
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
              <select
                value={quartos}
                onChange={(e) => setQuartos(e.target.value)}
                className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
              >
                <option value="">Quartos (qualquer)</option>
                <option value="1">1+ quartos</option>
                <option value="2">2+ quartos</option>
                <option value="3">3+ quartos</option>
                <option value="4">4+ quartos</option>
              </select>
              <select
                value={faixa}
                onChange={(e) => setFaixa(e.target.value)}
                className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none"
              >
                {faixas.map((f) => (
                  <option key={f.v} value={f.v}>{f.l}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* Toggles secundarios funcionais */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <button
          type="button"
          onClick={() => { setAberto((v) => !v); setModoCodigo(false); }}
          className={`inline-flex items-center gap-1 hover:text-gray-900 ${aberto && !modoCodigo ? 'text-gray-900 font-semibold' : ''}`}
        >
          {aberto && !modoCodigo ? '−' : '+'} Busca avançada
        </button>
        <span className="opacity-30">·</span>
        <button
          type="button"
          onClick={() => { setModoCodigo((v) => !v); setAberto(false); }}
          className={`inline-flex items-center gap-1 hover:text-gray-900 ${modoCodigo ? 'text-gray-900 font-semibold' : ''}`}
        >
          # Por código
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
