'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Search, MapPin } from 'lucide-react';
import { LeadForm } from '../LeadForm';
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
  const cidades = Array.from(
    new Set(imoveis.map((i) => i.cidade).filter(Boolean) as string[]),
  ).sort();

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

        <OnyxSearchBar cidades={cidades} />
      </div>
    </div>
  );
}

/**
 * Search bar inspirada no Douglas Navarro. 3 modos:
 *  - simples (default): tipo · cidade · bairro/empreend · buscar
 *  - avançada (aberto): + chips de quartos/suites/banheiros/vagas + faixas
 *  - por código: input mono + buscar
 *
 * Submete via window.location.search → page.tsx parsea com parseFilters().
 */
function OnyxSearchBar({ cidades }: { cidades: string[] }) {
  const [op, setOp] = useState<'venda' | 'aluguel'>('venda');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [quartos, setQuartos] = useState('');
  const [suites, setSuites] = useState('');
  const [banheiros, setBanheiros] = useState('');
  const [vagas, setVagas] = useState('');
  const [faixa, setFaixa] = useState('');
  const [areaMin, setAreaMin] = useState('');
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
      if (cidade) params.set('cidade', cidade);
      if (quartos) params.set('quartos', quartos);
      if (suites) params.set('suites', suites);
      if (banheiros) params.set('banheiros', banheiros);
      if (vagas) params.set('vagas', vagas);
      if (faixa) params.set('faixa', faixa);
      if (areaMin) params.set('areaMin', areaMin);
    }
    window.location.search = params.toString();
  }

  const tipos = [
    { v: '', l: 'Tipo' },
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

  const areas = [
    { v: '', l: 'Área (qualquer)' },
    { v: '50', l: '50m²+' },
    { v: '100', l: '100m²+' },
    { v: '200', l: '200m²+' },
    { v: '300', l: '300m²+' },
    { v: '500', l: '500m²+' },
  ];

  return (
    <form
      onSubmit={submeter}
      className={`mt-8 w-full rounded-lg bg-white p-3 shadow-2xl ${aberto && !modoCodigo ? 'max-w-5xl' : 'max-w-3xl'}`}
    >
      {/* Tabs VENDA / ALUGUEL */}
      <div className="mb-2 flex gap-1 rounded-md bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => { setOp('venda'); setModoCodigo(false); }}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            !modoCodigo && op === 'venda'
              ? 'text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
          style={!modoCodigo && op === 'venda' ? { background: 'var(--t-primary)', color: '#000' } : undefined}
        >
          Venda
        </button>
        <button
          type="button"
          onClick={() => { setOp('aluguel'); setModoCodigo(false); }}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            !modoCodigo && op === 'aluguel'
              ? 'bg-gray-800 text-white shadow-sm'
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
          {/* Linha principal: tipo · cidade · buscar */}
          <div className="grid gap-1.5 sm:grid-cols-[1fr_1fr_auto] sm:gap-2">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none uppercase tracking-wide font-semibold text-gray-700"
            >
              {tipos.map((t) => (
                <option key={t.v} value={t.v}>{t.l}</option>
              ))}
            </select>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="rounded-md border-0 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-300 focus:outline-none uppercase tracking-wide font-semibold text-gray-700"
            >
              <option value="">Cidade</option>
              {cidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-md px-6 py-2 text-sm font-bold text-black uppercase tracking-wider"
              style={{ background: 'var(--t-primary)' }}
            >
              <Search className="h-4 w-4" /> Buscar
            </button>
          </div>

          {/* Painel avancado — chips de comodos + areaMin + faixaPreco */}
          {aberto && (
            <div className="mt-3 space-y-3 rounded-md bg-gray-50/50 p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ChipGroup label="Quartos" value={quartos} onChange={setQuartos} options={['1', '2', '3', '4']} suffixLast="+" />
                <ChipGroup label="Suítes" value={suites} onChange={setSuites} options={['1', '2', '3', '4']} suffix="+" />
                <ChipGroup label="Banheiros" value={banheiros} onChange={setBanheiros} options={['1', '2', '3', '4']} suffix="+" />
                <ChipGroup label="Vagas" value={vagas} onChange={setVagas} options={['1', '2', '3', '4']} suffix="+" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  Preço
                  <select
                    value={faixa}
                    onChange={(e) => setFaixa(e.target.value)}
                    className="rounded-md border-0 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:ring-1 focus:ring-gray-300 focus:outline-none"
                  >
                    {faixas.map((f) => (
                      <option key={f.v} value={f.v}>{f.l}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  Área
                  <select
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                    className="rounded-md border-0 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:ring-1 focus:ring-gray-300 focus:outline-none"
                  >
                    {areas.map((a) => (
                      <option key={a.v} value={a.v}>{a.l}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toggles secundarios — pill solido pra ficar legivel sobre foto do hero */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => { setAberto((v) => !v); setModoCodigo(false); }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            aberto && !modoCodigo
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {aberto && !modoCodigo ? '− Busca simples' : '+ Busca avançada'}
        </button>
        <button
          type="button"
          onClick={() => { setModoCodigo((v) => !v); setAberto(false); }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            modoCodigo
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          # Por código
        </button>
      </div>
    </form>
  );
}

/**
 * Grupo de chips estilo Douglas Navarro pra filtros numericos mínimos
 * (quartos/suítes/banheiros/vagas). Clique no chip ativo desmarca.
 */
function ChipGroup({
  label,
  value,
  onChange,
  options,
  suffix,
  suffixLast,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  /** Sufixo aplicado a todos os chips, ex "+" → "1+","2+","3+","4+" */
  suffix?: string;
  /** Sufixo aplicado apenas ao ultimo chip (caso Quartos: 1,2,3,4+) */
  suffixLast?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-left">
        {label}
      </span>
      <div className="grid grid-cols-4 gap-1">
        {options.map((opt, idx) => {
          const isLast = idx === options.length - 1;
          const sfx = suffix ?? (isLast ? suffixLast ?? '' : '');
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? '' : opt)}
              className={`rounded border px-2 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-transparent text-black'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
              style={active ? { background: 'var(--t-primary)' } : undefined}
            >
              {opt}
              {sfx}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Destaques: carrossel horizontal com setas (igual sites de imobiliaria
 * boutique). Centra o conteudo quando ha poucos itens. Scroll-snap pra
 * o card ancorar limpo em cada movimento.
 */
export function OnyxDestaques({ tenant, imoveis }: SectionProps) {
  const lista = imoveis.slice(0, 12);
  const trackRef = useRef<HTMLDivElement>(null);

  if (lista.length === 0) return null;

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    // largura do primeiro card + gap como passo
    const card = el.querySelector<HTMLElement>('[data-onyx-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

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

      <div className="relative">
        {/* Setas */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 shadow-md hover:shadow-lg sm:flex"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Próximo"
          className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 shadow-md hover:shadow-lg sm:flex"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start sm:justify-center"
        >
          {lista.map((imv) => (
            <div
              key={imv.id}
              data-onyx-card
              className="w-[280px] shrink-0 snap-start sm:w-[320px] md:w-[340px]"
            >
              <OnyxCard imovel={imv} tenant={tenant} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * "Anuncie seu imovel" — faixa cinza-claro com form de captura.
 * Ancora: #anuncie (link do menu aponta pra ca).
 */
export function OnyxAnuncie({ tenant }: SectionProps) {
  return (
    <section id="anuncie" className="bg-gray-50 py-16">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-6 md:grid-cols-2 md:items-center md:gap-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Anuncie seu imóvel
          </p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-2xl font-semibold sm:text-3xl md:text-4xl"
          >
            Venda ou alugue rápido com a {tenant.marca?.nomeEmpresa ?? tenant.nome}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Avaliação profissional, divulgação nos principais portais e atendimento
            personalizado pra cada cliente. Conte com a gente do começo ao fim.
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <LeadForm
            slug={tenant.slug}
            defaultMessage="Olá, quero anunciar meu imóvel."
            ctaLabel="Quero anunciar"
          />
        </div>
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
      <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-16 md:grid-cols-[280px_1fr] md:items-center md:gap-12">
        <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
          {tenant.marca?.logoUrl ? (
            // Sem foto de equipe — usa logo como placeholder visual.
            // O user pode trocar com uma foto custom no editor depois.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.marca.logoUrl}
              alt={nomeEmpresa}
              className="h-full w-full object-contain p-6"
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

/**
 * Newsletter — faixa preta com email signup que dispara WhatsApp pro
 * corretor com a mensagem "Quero receber novidades". Evita backend extra
 * e ja entrega o lead direto pro funil principal (WA).
 */
export function OnyxContato({ tenant }: { tenant?: TenantPublic }) {
  const whatsapp = tenant?.marca?.whatsapp?.replace(/\D/g, '') ?? '';

  function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    if (!email) return;
    const msg = encodeURIComponent(
      `Olá! Gostaria de receber novidades sobre imóveis. Meu e-mail: ${email}`,
    );
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    } else {
      window.location.href = `mailto:${tenant?.marca?.email ?? ''}?subject=Quero receber novidades&body=${msg}`;
    }
    form.reset();
  }

  return (
    <section className="bg-black text-white py-14">
      <div className="mx-auto max-w-[1100px] px-6 grid gap-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--t-primary)' }}>
            Newsletter
          </p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-2xl font-semibold sm:text-3xl"
          >
            Receba novidades de imóveis em primeira mão
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Lançamentos, oportunidades e dicas direto no seu e-mail.
          </p>
        </div>
        <form onSubmit={submeter} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            className="flex-1 rounded-md border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <button
            type="submit"
            className="rounded-md px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
            style={{ background: 'var(--t-primary)' }}
          >
            Quero receber
          </button>
        </form>
      </div>
    </section>
  );
}
