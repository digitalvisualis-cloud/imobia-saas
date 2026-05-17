'use client';

import { useState } from 'react';
import { Plus, Minus, ArrowRight, Search } from 'lucide-react';
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

const FALLBACK_HERO_IMG =
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80';

export function AuraHero({ tenant, imoveis, config }: SectionProps) {
  const featured = pickFeaturedImovel(imoveis);
  // Prioridade: imagem custom do editor → foto do imovel destaque → fallback Unsplash.
  // A foto e so visual de impacto — nao expoe detalhes do imovel pra nao confundir
  // a home com pagina de produto.
  const heroImg =
    config?.hero?.imageUrl?.trim() ||
    (featured ? heroImage(featured) : FALLBACK_HERO_IMG);

  // Titulo e descricao saem da marca, NAO do imovel. Se nao houver, fallback editorial.
  const eyebrow = tenant.marca?.nomeEmpresa ?? 'Curadoria';
  const titulo = tenant.marca?.slogan ?? 'Imoveis com curadoria.\nAtendimento sem pressa.';
  const subtitulo =
    tenant.marca?.descricao ??
    'Selecionamos cada propriedade com criterio. Voce escolhe entre o que ja foi aprovado.';

  return (
    <div className="relative min-h-[640px] w-full overflow-hidden sm:min-h-[720px]">
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          // Gradiente mais forte embaixo (85%) — texto legivel em foto clara.
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div
        className="relative z-10 flex min-h-[640px] flex-col justify-end px-4 pb-8 sm:min-h-[720px] sm:px-8 sm:pb-12 md:px-14 md:pb-16"
        style={{
          // Cor configuravel (Configuracoes -> Marca -> Cor texto hero)
          color: tenant.marca?.corTextoHero || '#FFFFFF',
          textShadow: '0 2px 12px rgba(0,0,0,0.55)',
        }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 sm:text-[11px]">
              {eyebrow}
            </p>
            <h1
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-3 whitespace-pre-line text-3xl leading-[1.05] sm:mt-4 sm:text-4xl sm:leading-[1.05] md:text-5xl"
            >
              {titulo}
            </h1>
            <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
              {subtitulo}
            </p>
          </div>

          <AuraSearchBar />
        </div>
      </div>
    </div>
  );
}

const AURA_TIPOS = [
  { value: '', label: 'Selecione' },
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'SALA_COMERCIAL', label: 'Sala Comercial' },
  { value: 'CHACARA', label: 'Chácara' },
];

const AURA_DORMS = [
  { value: '', label: 'Qualquer' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
];

const AURA_FAIXAS = [
  { value: '', label: 'Sob consulta' },
  { value: '0-1000000', label: 'Até R$ 1Mi' },
  { value: '1000000-3000000', label: 'R$ 1—3Mi' },
  { value: '3000000-10000000', label: 'R$ 3—10Mi' },
  { value: '10000000-', label: 'Acima de R$ 10Mi' },
];

function AuraSearchBar() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [dorm, setDorm] = useState('');
  const [faixa, setFaixa] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca) params.set('q', busca);
    if (tipo) params.set('tipo', tipo);
    if (dorm) params.set('dorm', dorm);
    if (faixa) params.set('faixa', faixa);
    window.location.search = params.toString();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-14 flex flex-wrap items-stretch gap-px overflow-hidden rounded-sm bg-white/10 backdrop-blur"
    >
      <SearchInput label="Localização" placeholder="Cidade" value={busca} onChange={setBusca} />
      <SearchSelect label="Tipo" value={tipo} onChange={setTipo} options={AURA_TIPOS} />
      <SearchSelect label="Dormitórios" value={dorm} onChange={setDorm} options={AURA_DORMS} />
      <SearchSelect label="Faixa" value={faixa} onChange={setFaixa} options={AURA_FAIXAS} />
      <button
        type="submit"
        className="flex items-center gap-2 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-black"
        style={{ background: 'var(--t-secondary)' }}
      >
        <Search className="h-3.5 w-3.5" /> Buscar
      </button>
    </form>
  );
}

function SearchInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-[180px] flex-1 bg-black/35 px-5 py-4 text-white">
      <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-white/60"
      />
    </div>
  );
}

function SearchSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[180px] flex-1 bg-black/35 px-5 py-4 text-white">
      <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full cursor-pointer bg-transparent text-sm text-white outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ color: '#000' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AuraDestaques({ tenant, imoveis }: SectionProps) {
  if (imoveis.length === 0) return null;
  return (
    <div className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      <div className="grid gap-6 sm:gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">A coleção</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl leading-[1.1] sm:mt-4 sm:text-4xl sm:leading-[1.05] md:text-5xl"
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

      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {imoveis.slice(0, 8).map((i) => (
          <AuraCard key={i.id} imovel={i} slug={tenant.slug} />
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
    <div className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">Endereços</p>
      <div
        className="mt-8 grid gap-px sm:mt-16"
        style={{ background: 'rgb(var(--t-fg-rgb) / 0.12)' }}
      >
        {top.map(([nome], idx) => (
          <a
            key={nome}
            className="group flex items-center gap-3 px-2 py-6 transition-colors hover:bg-black/[0.03] sm:gap-8 sm:py-10"
            style={{ background: 'var(--t-bg)' }}
          >
            <div className="w-10 text-[10px] tabular-nums opacity-50 sm:w-16 sm:text-[11px]">0{idx + 1}</div>
            <div className="flex-1">
              <h3
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-2xl sm:text-3xl md:text-5xl"
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
    <div id="sobre" className="mx-auto mt-16 max-w-[1500px] scroll-mt-24 px-4 sm:mt-32 sm:px-8">
      <div className="grid gap-8 sm:gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">Estúdio</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl leading-[1.1] sm:mt-4 sm:text-4xl sm:leading-[1.05] md:text-5xl"
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
    <div className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">Clientes</p>
      <div className="mt-8 grid gap-8 sm:mt-12 sm:gap-12 md:grid-cols-3">
        {DEPS.map((d) => (
          <figure key={d.nome}>
            <blockquote
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="text-lg leading-snug sm:text-2xl md:text-3xl"
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
    <div className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      <div className="grid gap-8 sm:gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">Perguntas</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl leading-[1.1] sm:mt-4 sm:text-5xl sm:leading-[1.05]"
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
                className="block w-full border-t py-5 text-left sm:py-7"
                style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.15)' }}
              >
                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  <span
                    style={{ fontFamily: 'var(--t-font-heading)' }}
                    className="text-lg sm:text-2xl"
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
    <div id="anuncie" className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      {/* Bloco SEMPRE neutro escuro — nao depende da cor primaria do user
          pra evitar contraste ruim quando ele escolhe cor clara. Accent
          em --t-secondary (cor que vira pra escolha do user automatico). */}
      <div className="relative overflow-hidden bg-neutral-900 text-white px-5 py-10 sm:px-8 sm:py-16 md:px-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-16">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-[11px] sm:tracking-[0.35em]">
              Anuncie com a {tenant.marca?.nomeEmpresa ?? tenant.nome}
            </p>
            <h2
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-3 text-3xl leading-[1.05] sm:mt-4 sm:text-4xl sm:leading-[1.05] md:text-5xl"
            >
              Sua propriedade merece{' '}
              <span style={{ color: 'var(--t-primary)' }}>uma narrativa.</span>
            </h2>
          </div>
          <div className="rounded-md bg-white p-5 text-stone-900 shadow-lg">
            <LeadForm
              slug={tenant.slug}
              tipoLead="VENDEDOR"
              defaultMessage="Olá, quero anunciar meu imóvel."
              ctaLabel="Solicitar avaliação"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuraContato() {
  return (
    <div className="mx-auto mt-12 max-w-[1400px] px-4 sm:mt-20 sm:px-8">
      <div className="grid gap-6 sm:gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 sm:text-[11px] sm:tracking-[0.35em]">Newsletter</p>
          <h2
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-2xl leading-tight sm:mt-4 sm:text-4xl md:text-5xl"
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
