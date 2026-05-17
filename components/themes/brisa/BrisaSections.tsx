'use client';

import { useState } from 'react';
import { ChevronRight, Star, Plus, Minus } from 'lucide-react';
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
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=86';

/** Hero — foto + overlay diagonal + copy esq + search card dir */
export function BrisaHero({ tenant, imoveis, config }: SectionProps) {
  const heroImg =
    config?.hero?.imageUrl?.trim() ||
    (imoveis.length > 0 ? heroImage(imoveis[0]) : HERO_FALLBACK);
  const slogan =
    tenant.marca?.slogan ?? 'Imóveis que combinam\ncom a sua próxima fase.';
  const descricao =
    tenant.marca?.descricao ??
    'Curadoria de imóveis com atendimento humano, fotos bem apresentadas e negociação acompanhada do começo ao fim.';

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8 sm:pt-8">
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt=""
          className="h-[440px] w-full object-cover sm:h-[520px] lg:h-[570px]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,27,22,0.72), rgba(8,27,22,0.18) 58%, rgba(8,27,22,0.45))',
          }}
        />
        <div className="absolute inset-0 grid items-center gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1fr_390px] lg:gap-10 lg:px-14">
          <div
            style={{
              color: tenant.marca?.corTextoHero || '#FFFFFF',
              textShadow: '0 2px 12px rgba(0,0,0,0.55)',
            }}
            className="max-w-xl"
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: 'var(--t-primary)' }}
            >
              Curadoria local
            </p>
            <h1
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-3 whitespace-pre-line text-3xl font-semibold leading-[0.96] sm:text-4xl lg:text-5xl"
            >
              {slogan}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-90 sm:text-base">
              {descricao}
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <BrisaSearchCard />
          </div>
        </div>
      </div>

      <BarraConfianca total={imoveis.length} />
    </div>
  );
}

function BarraConfianca({ total }: { total: number }) {
  const items = [
    total > 0 ? `+${total} imóveis na carteira` : 'Imóveis selecionados',
    'Atendimento por especialista',
    'Curadoria fotográfica',
    'Resposta pelo WhatsApp',
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map((label) => (
        <div
          key={label}
          className="rounded-md border px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: 'var(--t-card)',
            borderColor: 'var(--t-line)',
            color: 'var(--t-muted)',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/**
 * Destaques — bloco com fundo CARD (contraste com page bg).
 * Padding generoso + border = bloco bem demarcado.
 */
export function BrisaDestaques({ tenant, imoveis }: SectionProps) {
  if (imoveis.length === 0) return null;
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <div
        className="rounded-2xl border p-6 sm:p-10"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        <SectionHead
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
    </section>
  );
}

/** Categorias — bloco transparente (page bg) com fotos full-bleed */
export function BrisaCategorias({ imoveis }: SectionProps) {
  const counts = new Map<string, number>();
  imoveis.forEach((i) => {
    if (i.bairro) counts.set(i.bairro, (counts.get(i.bairro) ?? 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;

  const fallbackImgs = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=84',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=84',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=84',
  ];

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <SectionHead titulo="Explore por região" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {top.map(([nome, count], idx) => (
          <a
            key={nome}
            className="group relative block h-44 overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackImgs[idx % fallbackImgs.length]}
              alt={nome}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 28%, rgba(0,0,0,0.74))',
              }}
            />
            <div className="absolute inset-x-0 bottom-3 px-4 text-white">
              <div
                style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
                className="text-xl"
              >
                {nome}
              </div>
              <div className="text-xs opacity-85">
                {count} imóve{count > 1 ? 'is' : 'l'}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Sobre — bloco CARD destacado, editorial-row 2 fotos staggered + copy */
export function BrisaSobre({ tenant }: SectionProps) {
  const nome = tenant.marca?.nomeEmpresa ?? tenant.nome;
  const desc =
    tenant.marca?.descricao ??
    `Há anos a ${nome} conecta famílias a lares pensados em cada detalhe. Trabalhamos com poucos imóveis por corretor, garantindo conhecimento profundo de cada negociação.`;

  return (
    <section
      id="sobre"
      className="mx-auto mt-12 max-w-7xl scroll-mt-24 px-4 sm:px-8"
    >
      <div
        className="rounded-2xl border p-6 sm:p-10"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=86"
              alt=""
              className="h-64 w-full rounded-lg object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=86"
              alt=""
              className="mt-10 h-64 w-full rounded-lg object-cover"
            />
          </div>
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: 'var(--t-primary)' }}
            >
              Sobre nós
            </p>
            <h2
              style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
              className="mt-2 text-3xl leading-[0.98] sm:text-4xl md:text-[42px]"
            >
              Imóveis com curadoria, atendimento sem pressa.
            </h2>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--t-muted)' }}
            >
              {desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const DEPS = [
  {
    nome: 'Larissa M.',
    txt: 'Acharam o apê dos meus sonhos em 3 visitas. Atendimento de outro nível.',
  },
  {
    nome: 'Rafael e Júlia',
    txt: 'Vendemos nossa casa em 22 dias pelo valor que pedimos. Recomendo demais.',
  },
  {
    nome: 'Camila S.',
    txt: 'Sentimos cuidado em cada etapa. Entenderam o que a gente queria.',
  },
];

export function BrisaDepoimentos() {
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <SectionHead titulo="Quem comprou com a gente" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {DEPS.map((d) => (
          <div
            key={d.nome}
            className="rounded-lg border p-5"
            style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
          >
            <div className="flex gap-0.5" style={{ color: 'var(--t-primary)' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p
              style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
              className="mt-3 text-base leading-snug"
            >
              "{d.txt}"
            </p>
            <div
              className="mt-3 text-xs"
              style={{ color: 'var(--t-muted)' }}
            >
              — {d.nome}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: 'Como funciona a primeira visita?',
    a: 'Agendamos pelo WhatsApp e um corretor te acompanha pessoalmente, sem compromisso.',
  },
  {
    q: 'Vocês ajudam com financiamento?',
    a: 'Sim, temos parceria com os principais bancos e fazemos toda simulação para você.',
  },
  {
    q: 'Posso anunciar meu imóvel com vocês?',
    a: 'Sim. Fazemos avaliação gratuita e plano de divulgação personalizado.',
  },
];

export function BrisaFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto mt-12 max-w-3xl px-4 sm:px-8">
      <SectionHead titulo="Perguntas frequentes" center />
      <div
        className="mt-6 divide-y overflow-hidden rounded-lg border"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="block w-full px-5 py-4 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
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
              {isOpen && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--t-muted)' }}
                >
                  {f.a}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * CTA Anuncie — bloco com bg em --t-secondary (cor band, travada por tema).
 * Form em card branco com sombra.
 */
export function BrisaCTA({ tenant }: { tenant?: TenantPublic }) {
  return (
    <section id="anuncie" className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <div
        className="grid items-center gap-6 rounded-2xl p-6 sm:p-10 md:grid-cols-[0.9fr_1.1fr]"
        style={{
          background: 'var(--t-secondary)',
          color: 'var(--t-secondary-ink)',
        }}
      >
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--t-primary)' }}
          >
            Anuncie
          </p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-2xl leading-tight sm:text-3xl md:text-4xl"
          >
            Venda seu imóvel com avaliação gratuita.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80 sm:text-base">
            Receba uma avaliação profissional em 48h e um plano de divulgação
            com fotos, site e posts prontos.
          </p>
        </div>
        {tenant?.slug && (
          <div
            className="rounded-lg p-4 shadow-lg sm:p-5"
            style={{ background: 'var(--t-card)', color: 'var(--t-fg)' }}
          >
            <LeadForm
              slug={tenant.slug}
              tipoLead="VENDEDOR"
              defaultMessage="Olá, quero uma avaliação gratuita do meu imóvel."
              ctaLabel="Quero avaliar meu imóvel"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export function BrisaContato() {
  return (
    <section className="mx-auto mt-12 max-w-3xl px-4 text-center sm:px-8">
      <div
        className="rounded-2xl border p-8 sm:p-10"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'var(--t-primary)' }}
        >
          Newsletter
        </p>
        <h2
          style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
          className="mt-2 text-2xl leading-tight sm:text-3xl md:text-4xl"
        >
          Receba imóveis novos antes de ir ao site
        </h2>
        <form
          className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            placeholder="seu@email.com"
            className="flex-1 rounded-md border px-4 py-2.5 text-sm"
            style={{ borderColor: 'var(--t-line)', background: 'var(--t-bg)' }}
          />
          <button
            type="submit"
            className="rounded-md px-5 py-2.5 text-sm font-bold"
            style={{
              background: 'var(--t-primary)',
              color: 'var(--t-primary-ink)',
            }}
          >
            Inscrever
          </button>
        </form>
      </div>
    </section>
  );
}

function SectionHead({
  titulo,
  cta,
  ctaTo,
  center,
}: {
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
      <h2
        style={{ fontFamily: 'var(--t-font-heading)' }}
        className="text-2xl leading-none sm:text-3xl md:text-[35px]"
      >
        {titulo}
      </h2>
      {cta && ctaTo && (
        <a
          href={ctaTo}
          className="hidden items-center gap-1 text-sm font-bold md:inline-flex"
          style={{ color: 'var(--t-primary)' }}
        >
          {cta} <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
