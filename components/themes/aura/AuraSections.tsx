'use client';

import { useState } from 'react';
import { Plus, Minus, ArrowRight, Search } from 'lucide-react';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { AuraCard } from './AuraCard';
import { heroImage, pickFeaturedImovel } from '../_shared';

interface SectionProps {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
}

const FALLBACK_HERO_IMG =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80';

export function AuraHero({ tenant, imoveis }: SectionProps) {
  const featured = pickFeaturedImovel(imoveis);
  const heroImg = featured ? heroImage(featured) : FALLBACK_HERO_IMG;

  const titulo = featured?.titulo ?? tenant.marca?.slogan ?? 'Curated Estates';
  const subtitulo = featured
    ? `${featured.bairro ?? '—'}, ${featured.cidade ?? ''} ${featured.areaM2 ? `— ${featured.areaM2}m²` : ''}`
    : tenant.marca?.descricao ?? '';
  const codigo = featured?.codigo ?? '—';

  return (
    <div className="relative h-screen min-h-[760px] w-full overflow-hidden">
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-8 pb-16 text-white md:px-14 md:pb-20">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.4em] opacity-80">
                Featured Estate · Cód {codigo}
              </p>
              <h1
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="mt-5 text-5xl leading-[0.98] md:text-[88px]"
              >
                {titulo}.
              </h1>
              <p className="mt-5 max-w-xl text-base opacity-80 md:text-lg">{subtitulo}</p>
            </div>
            {featured && (
              <div className="md:col-span-5 md:text-right">
                <div className="text-[11px] uppercase tracking-[0.3em] opacity-70">
                  {featured.operacao.toUpperCase() === 'ALUGUEL' ? 'Aluguel mensal' : 'Preço sob consulta'}
                </div>
                <div
                  style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-secondary)' }}
                  className="mt-2 text-4xl md:text-5xl"
                >
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(featured.preco)}
                </div>
                <a
                  href={`/s/${tenant.slug}/imovel/${featured.codigo}`}
                  className="mt-6 inline-flex items-center gap-3 border-b border-white/40 pb-1 text-sm uppercase tracking-[0.25em] hover:border-white"
                >
                  Ver propriedade <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          <div className="mt-14 flex flex-wrap items-stretch gap-px overflow-hidden rounded-sm bg-white/10 backdrop-blur">
            <SearchField label="Localização" value="Cidade ou bairro" />
            <SearchField label="Tipo" value="Selecione" />
            <SearchField label="Dormitórios" value="Qualquer" />
            <SearchField label="Faixa" value="Sob consulta" />
            <button
              type="button"
              className="flex items-center gap-2 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-black"
              style={{ background: 'var(--t-secondary)' }}
            >
              <Search className="h-3.5 w-3.5" /> Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[180px] flex-1 bg-black/35 px-5 py-4 text-white">
      <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">{label}</div>
      <div className="mt-1 text-sm opacity-90">{value}</div>
    </div>
  );
}

export function AuraDestaques({ tenant, imoveis }: SectionProps) {
  if (imoveis.length === 0) return null;
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">A coleção</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-4 text-5xl leading-[1.05] md:text-6xl"
          >
            Residências escolhidas a dedo.
          </h2>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <p className="text-base leading-relaxed opacity-75">
            Cada propriedade representa uma posição rara no mercado: arquitetura, localização e
            potencial valorização. Apresentamos novas estreias mensalmente, sempre off-market
            antes de irem ao público.
          </p>
        </div>
      </div>

      <div className="mt-20 grid gap-x-10 gap-y-20 md:grid-cols-2">
        {imoveis.slice(0, 4).map((i, idx) => (
          <div key={i.id} className={idx === 0 ? 'md:col-span-2' : ''}>
            <AuraCard imovel={i} slug={tenant.slug} large={idx === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuraCategorias({ imoveis }: SectionProps) {
  const counts = new Map<string, number>();
  imoveis.forEach((i) => {
    if (i.bairro) counts.set(i.bairro, (counts.get(i.bairro) ?? 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;

  const fallbackImgs = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80',
  ];

  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">Endereços</p>
      <div
        className="mt-16 grid gap-px"
        style={{ background: 'rgb(var(--t-fg-rgb) / 0.12)' }}
      >
        {top.map(([nome], idx) => (
          <a
            key={nome}
            className="group flex items-center gap-8 px-2 py-10 transition-colors hover:bg-black/[0.03]"
            style={{ background: 'var(--t-bg)' }}
          >
            <div className="w-16 text-[11px] tabular-nums opacity-50">0{idx + 1}</div>
            <div className="flex-1">
              <h3
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-4xl md:text-6xl"
              >
                {nome}
              </h3>
            </div>
            <div className="hidden h-32 w-56 overflow-hidden md:block">
              <img
                src={fallbackImgs[idx % fallbackImgs.length]}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={nome}
              />
            </div>
            <ArrowRight className="h-5 w-5 opacity-50 transition-transform group-hover:translate-x-2" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function AuraSobre({ tenant }: SectionProps) {
  const nome = tenant.marca?.nomeEmpresa ?? tenant.nome;
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">Estúdio</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-4 text-5xl leading-[1.05] md:text-7xl"
          >
            Quietos.
            <br />
            Precisos.
            <br />
            <span style={{ color: 'var(--t-secondary)' }}>Discretos.</span>
          </h2>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80"
            className="aspect-[4/5] w-full object-cover"
            alt=""
          />
          <p className="mt-8 text-base leading-relaxed opacity-80">
            {tenant.marca?.descricao ??
              `A ${nome} representa propriedades singulares com um time pequeno e altamente especializado. Conduzimos cada negociação com sigilo e cuidado.`}
          </p>
        </div>
      </div>
    </div>
  );
}

const DEPS = [
  { nome: 'Família Tavares', txt: 'Apresentaram propriedades que jamais chegaram ao mercado público. Outro nível.' },
  { nome: 'M. Andrade, investidor', txt: 'Vendi três ativos em seis meses, sempre acima do preço pedido.' },
  { nome: 'C. Bertolini', txt: 'Discrição e precisão. Foi assim do começo ao fim.' },
];

export function AuraDepoimentos() {
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">Clientes</p>
      <div className="mt-12 grid gap-12 md:grid-cols-3">
        {DEPS.map((d) => (
          <figure key={d.nome}>
            <blockquote
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="text-2xl leading-snug md:text-3xl"
            >
              "{d.txt}"
            </blockquote>
            <figcaption className="mt-6 text-[11px] uppercase tracking-[0.3em] opacity-60">
              — {d.nome}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  { q: 'Trabalham com imóveis off-market?', a: 'Sim. Mais de 40% da nossa carteira nunca chega ao público.' },
  { q: 'Atendem em outras cidades?', a: 'Sim, com escritórios principais e parcerias estendidas.' },
  { q: 'Como funciona a representação?', a: 'Trabalhamos com exclusividade, com plano editorial dedicado.' },
];

export function AuraFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">Perguntas</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-4 text-5xl leading-[1.05]"
          >
            O que perguntam.
          </h2>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="block w-full border-t py-7 text-left"
                style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.15)' }}
              >
                <div className="flex items-center justify-between gap-6">
                  <span
                    style={{ fontFamily: 'var(--t-font-heading)' }}
                    className="text-2xl"
                  >
                    {f.q}
                  </span>
                  {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                {isOpen && <p className="mt-4 max-w-xl opacity-75">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AuraCTA({ tenant }: SectionProps) {
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <div
        className="relative overflow-hidden px-8 py-24 md:px-20 md:py-32"
        style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">
          Anuncie com a {tenant.marca?.nomeEmpresa ?? tenant.nome}
        </p>
        <h2
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="mt-5 max-w-3xl text-5xl leading-[1] md:text-7xl"
        >
          Sua propriedade merece{' '}
          <span style={{ color: 'var(--t-secondary)' }}>uma narrativa.</span>
        </h2>
        <a
          href="#contato"
          className="mt-12 inline-flex items-center gap-4 border-b border-white/30 pb-1.5 text-sm uppercase tracking-[0.3em] hover:border-white"
        >
          Solicitar avaliação <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function AuraContato() {
  return (
    <div className="mx-auto mt-32 max-w-[1500px] px-8">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.35em] opacity-60">Newsletter</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-4 text-4xl leading-tight md:text-5xl"
          >
            Estreias e bastidores, uma vez por mês.
          </h2>
        </div>
        <form
          className="md:col-span-6 md:col-start-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <div
            className="flex border-b py-3"
            style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.4)' }}
          >
            <input
              placeholder="seu@email.com"
              className="flex-1 bg-transparent text-base outline-none placeholder:opacity-40"
            />
            <button type="submit" className="text-[11px] uppercase tracking-[0.3em]">
              Inscrever →
            </button>
          </div>
          <p className="mt-3 text-xs opacity-60">Sem spam. Cancele quando quiser.</p>
        </form>
      </div>
    </div>
  );
}
