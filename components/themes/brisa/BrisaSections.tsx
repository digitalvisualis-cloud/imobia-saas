'use client';

import { useState } from 'react';
import { Award, Users, Home as HomeIcon, ChevronRight, Star, Plus, Minus } from 'lucide-react';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import type { Customization } from '@/types/site-customization';
import { BrisaCard } from './BrisaCard';
import { BrisaSearchCard } from './BrisaSearchCard';
import { heroImage } from '../_shared';
import { LeadForm } from '../LeadForm';

interface SectionProps {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  config?: Customization;
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80';

export function BrisaHero({ tenant, imoveis, config }: SectionProps) {
  // Prioridade: imagem custom do editor → foto do primeiro imovel → fallback Unsplash
  const heroImg =
    config?.hero?.imageUrl?.trim() ||
    (imoveis.length > 0 ? heroImage(imoveis[0]) : HERO_FALLBACK);
  const slogan =
    tenant.marca?.slogan ?? 'Onde sua próxima\nhistória começa.';
  const descricao =
    tenant.marca?.descricao ??
    'Curadoria de casas e apartamentos com atendimento humano, do primeiro filtro à entrega das chaves.';

  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
          <img src={heroImg} alt="" className="h-[440px] w-full object-cover sm:h-[520px] lg:h-[580px]" />
          <div
            className="absolute inset-0"
            style={{
              // Gradiente mais forte embaixo (75%) pra texto legivel em qualquer foto.
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.75) 100%)',
            }}
          />
          {/* Mobile/tablet: H1 centralizado em cima, search card abaixo. Desktop (lg+): grid 2-col. */}
          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6 sm:px-8 sm:pb-8 lg:flex-row lg:items-center lg:px-14 lg:pb-0">
            <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div
                style={{
                  // Cor configuravel pelo user (Configuracoes -> Marca -> Cor texto hero).
                  // Default branco. text-shadow garante leitura em foto clara.
                  color: tenant.marca?.corTextoHero || '#FFFFFF',
                  textShadow: '0 2px 12px rgba(0,0,0,0.55)',
                }}
              >
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider backdrop-blur">
                  Imóveis selecionados
                </span>
                <h1
                  style={{ fontFamily: 'var(--t-font-heading)' }}
                  className="mt-3 whitespace-pre-line text-3xl font-semibold leading-[1.05] sm:text-4xl lg:text-5xl"
                >
                  {slogan}
                </h1>
                <p className="mt-3 max-w-md text-sm opacity-95 sm:text-base">{descricao}</p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <BrisaSearchCard />
              </div>
            </div>
          </div>
        </div>
      </div>
      <BarraConfianca total={imoveis.length} />
    </div>
  );
}

function BarraConfianca({ total }: { total: number }) {
  const items = [
    { icon: HomeIcon, label: `${total > 0 ? `+${total} imóveis` : 'Imóveis'} na carteira` },
    { icon: Users, label: 'Atendimento personalizado' },
    { icon: Award, label: 'Curadoria especializada' },
    { icon: Star, label: 'Suporte humano' },
  ];
  return (
    <div className="mx-auto mt-6 max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200/80 shadow-sm md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5 px-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: 'rgb(var(--t-primary-rgb) / 0.12)',
                color: 'var(--t-primary)',
              }}
            >
              <it.icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium text-stone-700">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrisaDestaques({ tenant, imoveis }: SectionProps) {
  if (imoveis.length === 0) return null;
  return (
    <div className="mx-auto mt-12 max-w-7xl px-6 md:mt-16">
      <SectionHeader
        sub="Vitrine"
        titulo="Imóveis em destaque"
        cta="Ver todos"
        ctaTo={`/s/${tenant.slug}`}
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {imoveis.slice(0, 8).map((i) => (
          <BrisaCard key={i.id} imovel={i} slug={tenant.slug} />
        ))}
      </div>
    </div>
  );
}

export function BrisaCategorias({ imoveis }: SectionProps) {
  // agrupa por bairro
  const counts = new Map<string, number>();
  imoveis.forEach((i) => {
    if (i.bairro) counts.set(i.bairro, (counts.get(i.bairro) ?? 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (top.length === 0) return null;

  const fallbackImgs = [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
  ];

  return (
    <div className="mx-auto mt-12 max-w-7xl px-6 md:mt-16">
      <SectionHeader sub="Bairros" titulo="Explore por região" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {top.map(([nome, count], idx) => (
          <a
            key={nome}
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl"
          >
            <img
              src={fallbackImgs[idx % fallbackImgs.length]}
              alt={nome}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-2xl font-semibold"
              >
                {nome}
              </div>
              <div className="mt-1 text-xs opacity-80">{count} imóveis</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function BrisaSobre({ tenant }: SectionProps) {
  const nome = tenant.marca?.nomeEmpresa ?? tenant.nome;
  const desc =
    tenant.marca?.descricao ??
    `Há anos a ${nome} conecta famílias a lares pensados em cada detalhe. Trabalhamos com poucos imóveis por corretor, garantindo conhecimento profundo de cada negociação.`;

  return (
    <div id="sobre" className="mx-auto mt-12 max-w-7xl scroll-mt-24 px-6 md:mt-16">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="grid grid-cols-2 gap-4">
          <img
            src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=700&q=80"
            className="aspect-[4/5] w-full rounded-2xl object-cover"
            alt=""
          />
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80"
            className="mt-10 aspect-[4/5] w-full rounded-2xl object-cover"
            alt=""
          />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
            Sobre nós
          </span>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl font-semibold leading-[1.1] sm:text-4xl md:text-5xl"
          >
            Imóveis com curadoria, atendimento sem pressa.
          </h2>
          <p className="mt-5 text-base opacity-75">{desc}</p>
        </div>
      </div>
    </div>
  );
}

const DEPS = [
  { nome: 'Larissa M.', txt: 'Acharam o apê dos meus sonhos em 3 visitas. Atendimento de outro nível.' },
  { nome: 'Rafael e Júlia', txt: 'Vendemos nossa casa em 22 dias pelo valor que pedimos. Recomendo demais.' },
  { nome: 'Camila S.', txt: 'Sentimos cuidado em cada etapa. Entenderam o que a gente queria.' },
];

export function BrisaDepoimentos() {
  return (
    <div className="mx-auto mt-12 max-w-7xl px-6 md:mt-16">
      <SectionHeader sub="Depoimentos" titulo="Quem comprou com a gente" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {DEPS.map((d) => (
          <div
            key={d.nome}
            className="rounded-xl bg-white p-5 ring-1 ring-stone-200/60 shadow-sm"
          >
            <div className="flex gap-0.5" style={{ color: 'var(--t-primary)' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-3 text-base leading-snug text-stone-900"
            >
              "{d.txt}"
            </p>
            <div className="mt-3 text-xs text-stone-500">— {d.nome}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  { q: 'Como funciona a primeira visita?', a: 'Agendamos pelo WhatsApp e um corretor te acompanha pessoalmente, sem compromisso.' },
  { q: 'Vocês ajudam com financiamento?', a: 'Sim, temos parceria com os principais bancos e fazemos toda simulação para você.' },
  { q: 'Posso anunciar meu imóvel com vocês?', a: 'Sim. Fazemos avaliação gratuita e plano de divulgação personalizado.' },
];

export function BrisaFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto mt-16 max-w-4xl px-6 md:mt-24">
      <SectionHeader sub="Dúvidas" titulo="Perguntas frequentes" center />
      <div
        className="mt-10 divide-y rounded-2xl border"
        style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.1)' }}
      >
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="block w-full px-6 py-5 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  style={{ fontFamily: 'var(--t-font-heading)' }}
                  className="text-base font-medium"
                >
                  {f.q}
                </span>
                {isOpen ? (
                  <Minus className="h-4 w-4 opacity-60" />
                ) : (
                  <Plus className="h-4 w-4 opacity-60" />
                )}
              </div>
              {isOpen && <p className="mt-3 text-sm opacity-70">{f.a}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BrisaCTA({ tenant }: { tenant?: TenantPublic }) {
  return (
    <div id="anuncie" className="mx-auto mt-12 max-w-7xl px-6 md:mt-16">
      {/* Bloco neutro escuro fixo — independente da cor primaria do user */}
      <div className="relative overflow-hidden rounded-2xl bg-stone-900 text-white px-8 py-12 md:px-14 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--t-primary)' }}
            >
              Anuncie seu imóvel
            </span>
            <h2
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-2 text-2xl font-semibold leading-[1.15] sm:text-3xl md:text-4xl"
            >
              Avaliação gratuita em 48h
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Plano de divulgação personalizado e atendimento humano do começo ao fim.
            </p>
          </div>
          {tenant?.slug && (
            <div className="rounded-xl bg-white p-4 text-stone-900 shadow-lg">
              <LeadForm
                slug={tenant.slug}
                tipoLead="VENDEDOR"
                defaultMessage="Olá, quero uma avaliação gratuita do meu imóvel."
                ctaLabel="Quero avaliar"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrisaContato() {
  return (
    <div className="mx-auto mt-16 max-w-3xl px-6 text-center md:mt-24">
      <SectionHeader
        sub="Newsletter"
        titulo="Receba imóveis novos antes de ir ao site"
        center
      />
      <form
        className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          placeholder="seu@email.com"
          className="flex-1 rounded-full border bg-transparent px-5 py-3.5 text-sm outline-none"
          style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.2)' }}
        />
        <button
          type="submit"
          className="rounded-full px-7 py-3.5 text-sm font-semibold"
          style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
        >
          Inscrever
        </button>
      </form>
    </div>
  );
}

function SectionHeader({
  sub,
  titulo,
  cta,
  ctaTo,
  center,
}: {
  sub: string;
  titulo: string;
  cta?: string;
  ctaTo?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`flex items-end justify-between gap-6 ${
        center ? 'flex-col items-center text-center' : ''
      }`}
    >
      <div>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--t-primary)' }}
        >
          {sub}
        </span>
        <h2
          style={{ fontFamily: 'var(--t-font-heading)' }}
          className="mt-1.5 text-2xl font-semibold leading-[1.15] sm:text-3xl md:text-4xl"
        >
          {titulo}
        </h2>
      </div>
      {cta && ctaTo && (
        <a
          href={ctaTo}
          className="hidden items-center gap-1 text-sm font-medium opacity-80 hover:opacity-100 md:inline-flex"
          style={{ color: 'var(--t-primary)' }}
        >
          {cta} <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
