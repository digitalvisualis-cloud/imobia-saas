'use client';

import { useState } from 'react';
import { ChevronRight, Plus, Minus, Search } from 'lucide-react';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import type { Customization } from '@/types/site-customization';
import { AuraCard } from './AuraCard';
import { heroImage, pickFeaturedImovel } from '../_shared';
import { LeadForm } from '../LeadForm';

interface SectionProps {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  config?: Customization;
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=86';

/** Hero — foto full bleed + gradient + editorial bottom */
export function AuraHero({ tenant, imoveis, config }: SectionProps) {
  const featured = pickFeaturedImovel(imoveis);
  const heroImg =
    config?.hero?.imageUrl?.trim() ||
    (featured ? heroImage(featured) : HERO_FALLBACK);

  const eyebrow = tenant.marca?.nomeEmpresa
    ? `Coleção · ${tenant.marca.nomeEmpresa}`
    : 'Coleção privada';
  const titulo =
    tenant.marca?.slogan ?? 'Arquitetura, endereço e silêncio visual.';
  const subtitulo =
    tenant.marca?.descricao ??
    'Selecionamos cada propriedade com critério. Você escolhe entre o que já foi aprovado.';

  return (
    <div className="relative h-[520px] w-full overflow-hidden sm:h-[620px] lg:h-[720px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.54), rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.7))',
        }}
      />
      <div
        className="absolute inset-x-4 bottom-6 grid items-end gap-6 sm:inset-x-10 sm:bottom-10 lg:inset-x-14 lg:bottom-12 lg:grid-cols-[1fr_520px] lg:gap-14"
        style={{
          color: tenant.marca?.corTextoHero || '#FFFFFF',
          textShadow: '0 2px 12px rgba(0,0,0,0.55)',
        }}
      >
        <div className="max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-80 sm:text-[11px] sm:tracking-[0.4em]">
            {eyebrow}
          </p>
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-4 text-3xl leading-[0.95] sm:text-5xl lg:text-[68px]"
          >
            {titulo}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-[1.7] opacity-90 sm:text-base">
            {subtitulo}
          </p>
        </div>
        <AuraSearchCard />
      </div>
    </div>
  );
}

function AuraSearchCard() {
  const [op, setOp] = useState<'Comprar' | 'Alugar'>('Comprar');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [faixa, setFaixa] = useState('');

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('op', op === 'Alugar' ? 'aluguel' : 'venda');
    if (tipo) params.set('tipo', tipo);
    if (cidade.trim()) params.set('cidade', cidade.trim());
    if (faixa) params.set('faixa', faixa);
    window.location.search = params.toString();
  }

  const inputCls =
    'w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/50 backdrop-blur';

  return (
    <form
      onSubmit={submeter}
      className="grid w-full gap-2 rounded-lg border border-white/25 bg-white/10 p-4 backdrop-blur-xl"
    >
      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/90">
        Agende uma curadoria
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={op}
          onChange={(e) => setOp(e.target.value as 'Comprar' | 'Alugar')}
          className={inputCls}
        >
          <option>Comprar</option>
          <option>Alugar</option>
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
          <option value="">Tipo</option>
          <option value="CASA">Casa</option>
          <option value="APARTAMENTO">Apartamento</option>
          <option value="COBERTURA">Cobertura</option>
          <option value="TERRENO">Terreno</option>
        </select>
      </div>
      <input
        type="text"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        placeholder="Cidade ou bairro"
        className={inputCls}
      />
      <select value={faixa} onChange={(e) => setFaixa(e.target.value)} className={inputCls}>
        <option value="">Preço</option>
        <option value="0-1000000">Até R$ 1Mi</option>
        <option value="1000000-3000000">R$ 1 — 3Mi</option>
        <option value="3000000-10000000">R$ 3 — 10Mi</option>
        <option value="10000000-">Acima de R$ 10Mi</option>
      </select>
      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-bold"
        style={{
          background: 'var(--t-primary)',
          color: 'var(--t-primary-ink)',
        }}
      >
        <Search className="h-4 w-4" /> Ver seleção
      </button>
    </form>
  );
}

export function AuraDestaques({ tenant, imoveis }: SectionProps) {
  if (imoveis.length === 0) return null;
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <div
        className="rounded-2xl border p-6 sm:p-10"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        <SectionHead titulo="Residências escolhidas a dedo" cta="Ver todos" ctaTo={`/s/${tenant.slug}`} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {imoveis.slice(0, 8).map((i) => (
            <AuraCard key={i.id} imovel={i} slug={tenant.slug} marca={tenant.marca} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function AuraCategorias({ imoveis }: SectionProps) {
  const counts = new Map<string, number>();
  imoveis.forEach((i) => {
    if (i.bairro) counts.set(i.bairro, (counts.get(i.bairro) ?? 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;

  const fallback = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=84',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=84',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=84',
  ];

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <SectionHead titulo="Endereços com procura qualificada" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {top.map(([nome, count], idx) => (
          <a key={nome} className="group relative block h-44 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallback[idx % fallback.length]}
              alt={nome}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 28%, rgba(0,0,0,0.74))' }}
            />
            <div className="absolute inset-x-0 bottom-3 px-4 text-white">
              <div style={{ fontFamily: 'var(--t-font-heading)' }} className="text-xl">
                {nome}
              </div>
              <div className="text-xs opacity-85">{count} imóve{count > 1 ? 'is' : 'l'}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function AuraSobre({ tenant }: SectionProps) {
  const nome = tenant.marca?.nomeEmpresa ?? tenant.nome;
  const desc =
    tenant.marca?.descricao ??
    `Há anos a ${nome} apresenta imóveis com critério. Precisão para comprar, vender e apresentar imóveis únicos.`;
  return (
    <section id="sobre" className="mx-auto mt-12 max-w-7xl scroll-mt-24 px-4 sm:px-8">
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
              Precisão para comprar, vender e apresentar imóveis únicos.
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

export function AuraDepoimentos() {
  const deps = [
    { nome: 'Família Tavares', txt: 'Apresentaram propriedades que jamais chegariam ao mercado público. Outro nível.' },
    { nome: 'M. Andrade, investidor', txt: 'Vendi três ativos em seis meses, sempre acima do preço pedido.' },
    { nome: 'C. Bertolini', txt: 'Discrição e precisão. Foi assim do começo ao fim.' },
  ];
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-8">
      <SectionHead titulo="Quem confiou na coleção" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {deps.map((d) => (
          <div
            key={d.nome}
            className="rounded-lg border p-5"
            style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
          >
            <p style={{ fontFamily: 'var(--t-font-heading)' }} className="text-base leading-snug">
              "{d.txt}"
            </p>
            <div
              className="mt-3 text-[11px] font-bold uppercase tracking-wider"
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
  { q: 'Posso ver imóveis off-market?', a: 'Sim. Trabalhamos com inventário privado mediante curadoria.' },
  { q: 'Como funcionam as visitas?', a: 'Visitas guiadas por especialista, com calendário acordado pelo WhatsApp.' },
  { q: 'Posso anunciar um imóvel?', a: 'Sim, mediante avaliação prévia. Apresentamos plano editorial e fotografia.' },
];

export function AuraFAQ() {
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
                <span style={{ fontFamily: 'var(--t-font-heading)' }} className="text-base">
                  {f.q}
                </span>
                {isOpen ? <Minus className="h-4 w-4 opacity-60" /> : <Plus className="h-4 w-4 opacity-60" />}
              </div>
              {isOpen && (
                <p className="mt-2 text-sm" style={{ color: 'var(--t-muted)' }}>
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

export function AuraCTA({ tenant }: SectionProps) {
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
            className="text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: 'var(--t-primary)' }}
          >
            Anuncie
          </p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl leading-[1] sm:text-4xl md:text-[42px]"
          >
            Seu imóvel pode entrar na próxima coleção.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80 sm:text-base">
            Receba uma avaliação profissional e plano de divulgação com fotos,
            site e posts prontos.
          </p>
        </div>
        <div
          className="rounded-lg p-4 shadow-lg sm:p-5"
          style={{ background: 'var(--t-card)', color: 'var(--t-fg)' }}
        >
          <LeadForm
            slug={tenant.slug}
            tipoLead="VENDEDOR"
            defaultMessage="Olá, quero anunciar meu imóvel."
            ctaLabel="Solicitar avaliação"
          />
        </div>
      </div>
    </section>
  );
}

export function AuraContato() {
  return (
    <section className="mx-auto mt-12 max-w-3xl px-4 text-center sm:px-8">
      <div
        className="rounded-2xl border p-8 sm:p-10"
        style={{ background: 'var(--t-card)', borderColor: 'var(--t-line)' }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: 'var(--t-primary)' }}
        >
          Newsletter
        </p>
        <h2
          style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-ink)' }}
          className="mt-2 text-2xl leading-tight sm:text-3xl md:text-4xl"
        >
          Estreias e bastidores, uma vez por mês
        </h2>
        <form
          className="mx-auto mt-6 flex max-w-md border-b py-3 text-sm"
          style={{ borderColor: 'var(--t-line)' }}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            placeholder="seu@email.com"
            className="flex-1 bg-transparent text-base outline-none placeholder:opacity-40"
          />
          <button
            type="submit"
            className="text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: 'var(--t-primary)' }}
          >
            Inscrever →
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
    <div className={`flex items-end justify-between gap-6 ${center ? 'flex-col items-center text-center' : ''}`}>
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
