import Link from 'next/link';
import { PropertyCard } from './PropertyCard';
import type { TenantPublic, ImovelPublic } from '../types';
import {
  Home,
  Building2,
  Mountain,
  Store,
  Calculator,
  Star,
  User,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

/**
 * IDs de seção que esse template renderiza condicional.
 * Mantém em sincronia com `lib/site-config.ts > SectionId`.
 */
type SectionId =
  | 'hero'
  | 'busca'
  | 'destaques'
  | 'categorias'
  | 'todos-imoveis'
  | 'calculadora'
  | 'depoimentos'
  | 'bio-corretor'
  | 'avaliacao-cta'
  | 'contato-cta';

export function TemplateHome({
  tenant,
  imoveis,
  enabledSections,
}: {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  /**
   * Lista de IDs de seção habilitadas (em ordem). Se omitido, renderiza tudo
   * (compat com chamadas legadas).
   */
  enabledSections?: SectionId[];
}) {
  const sections: SectionId[] =
    enabledSections ?? [
      'hero',
      'busca',
      'destaques',
      'todos-imoveis',
      'contato-cta',
    ];

  const enabled = (id: SectionId) => sections.includes(id);
  const destaques = imoveis.filter((i) => i.destaque);

  return (
    <>
      {enabled('hero') && <HeroSection tenant={tenant} />}
      {enabled('busca') && <BuscaSection withOverlap={enabled('hero')} />}
      {enabled('categorias') && <CategoriasSection />}
      {enabled('destaques') && destaques.length > 0 && (
        <DestaquesSection imoveis={destaques} slug={tenant.slug} />
      )}
      {enabled('todos-imoveis') && (
        <TodosImoveisSection imoveis={imoveis} slug={tenant.slug} />
      )}
      {enabled('calculadora') && <CalculadoraSection />}
      {enabled('depoimentos') && <DepoimentosSection tenant={tenant} />}
      {enabled('bio-corretor') && <BioCorretorSection tenant={tenant} />}
      {enabled('avaliacao-cta') && <AvaliacaoCTASection tenant={tenant} />}
      {enabled('contato-cta') && <ContatoCTASection tenant={tenant} />}

      <div id="contato" aria-hidden />
    </>
  );
}

/* ───────────── Seções ───────────── */

function HeroSection({ tenant }: { tenant: TenantPublic }) {
  const sloganRaw =
    tenant.marca?.slogan || 'Encontre o imóvel dos seus sonhos';
  const descricao =
    tenant.marca?.descricao ||
    'Confiança, transparência e excelência em cada negociação.';

  // Destaca a última palavra do slogan na cor primária (efeito "sonhos" no Lovable)
  const palavras = sloganRaw.trim().split(' ');
  const inicio = palavras.slice(0, -1).join(' ');
  const ultima = palavras[palavras.length - 1];

  return (
    <section
      data-section="hero"
      className="relative bg-secondary text-secondary-foreground pt-24 md:pt-32 pb-32 md:pb-40 px-4 overflow-hidden"
    >
      {/* Gradient luminoso de fundo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.25), transparent 55%),
            radial-gradient(circle at 80% 80%, hsl(var(--primary) / 0.18), transparent 55%)
          `,
        }}
      />
      <div className="container mx-auto text-center relative z-10 max-w-4xl">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight">
          {inicio && <span>{inicio} </span>}
          <span className="text-primary italic font-normal">{ultima}</span>
        </h1>
        <p className="mt-6 text-base md:text-lg opacity-80 max-w-xl mx-auto leading-relaxed font-light">
          {descricao}
        </p>
      </div>
    </section>
  );
}

function BuscaSection({ withOverlap }: { withOverlap: boolean }) {
  return (
    <section
      data-section="busca"
      className={`px-4 ${withOverlap ? '-mt-16 md:-mt-20' : 'pt-12'} mb-16 relative z-20`}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="bg-card border rounded-2xl shadow-2xl p-6 md:p-8">
          {/* Header com toggles tipo Lovable */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="font-display text-2xl md:text-3xl text-card-foreground">
              Buscar Imóveis
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/30"
                title="Filtros avançados (em breve)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                  <circle cx="9" cy="6" r="2" fill="currentColor" />
                  <circle cx="15" cy="12" r="2" fill="currentColor" />
                  <circle cx="9" cy="18" r="2" fill="currentColor" />
                </svg>
                Filtros
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-card border border-border text-foreground/80 hover:bg-muted text-xs font-medium"
                title="Buscar com linguagem natural (em breve)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
                </svg>
                Busca IA
              </button>
            </div>
          </div>

          {/* Grid: 3 colunas com 2 linhas */}
          <form
            action="#imoveis"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {/* Linha 1: Tipo · Finalidade · Local */}
            <SelectField name="tipo" placeholder="Tipo" options={[
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
            ]} />
            <SelectField name="operacao" placeholder="Finalidade" options={[
              { v: 'VENDA', l: 'Venda' },
              { v: 'ALUGUEL', l: 'Aluguel' },
              { v: 'TEMPORADA', l: 'Temporada' },
            ]} />
            <input
              name="local"
              type="text"
              placeholder="Bairro ou Cidade"
              className="h-11 px-4 rounded-md bg-muted/40 border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {/* Linha 2: Preço mín · Preço máx · Quartos */}
            <input
              name="precoMin"
              type="text"
              inputMode="numeric"
              placeholder="Preço mín."
              className="h-11 px-4 rounded-md bg-muted/40 border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              name="precoMax"
              type="text"
              inputMode="numeric"
              placeholder="Preço máx."
              className="h-11 px-4 rounded-md bg-muted/40 border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <SelectField name="quartos" placeholder="Quartos" options={[
              { v: '1', l: '1 quarto' },
              { v: '2', l: '2 quartos' },
              { v: '3', l: '3 quartos' },
              { v: '4', l: '4 quartos' },
              { v: '5', l: '5+ quartos' },
            ]} />
          </form>

          {/* Botão Buscar grande */}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              form="busca-form"
              onClick={(e) => {
                e.preventDefault();
                const form = (e.target as HTMLElement).closest('section')?.querySelector('form');
                form?.requestSubmit();
              }}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Buscar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectField({
  name,
  placeholder,
  options,
}: {
  name: string;
  placeholder: string;
  options: Array<{ v: string; l: string }>;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue=""
        className="appearance-none w-full h-11 pl-4 pr-9 rounded-md bg-muted/40 border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function CategoriasSection() {
  const cats = [
    { nome: 'Casas', icon: Home, query: 'CASA' },
    { nome: 'Apartamentos', icon: Building2, query: 'APARTAMENTO' },
    { nome: 'Coberturas', icon: Mountain, query: 'COBERTURA' },
    { nome: 'Comercial', icon: Store, query: 'SALA_COMERCIAL' },
  ];
  return (
    <section
      data-section="categorias"
      className="container mx-auto px-4 py-12"
    >
      <h2 className="font-display text-3xl md:text-4xl text-center mb-10 text-foreground">
        Encontre por tipo
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cats.map(({ nome, icon: Icon }) => (
          <div
            key={nome}
            className="rounded-lg border border-border bg-card p-6 text-center hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 mx-auto rounded-md bg-primary/10 text-primary grid place-items-center mb-3">
              <Icon className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">
              {nome}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DestaquesSection({
  imoveis,
  slug,
}: {
  imoveis: ImovelPublic[];
  slug: string;
}) {
  return (
    <section
      data-section="destaques"
      className="container mx-auto px-4 py-12"
    >
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
            ⭐ Destaques
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            Imóveis selecionados pra você
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {imoveis.slice(0, 6).map((imv) => (
          <PropertyCard key={imv.id} imovel={imv} slug={slug} />
        ))}
      </div>
    </section>
  );
}

function TodosImoveisSection({
  imoveis,
  slug,
}: {
  imoveis: ImovelPublic[];
  slug: string;
}) {
  return (
    <section
      id="imoveis"
      data-section="todos-imoveis"
      className="container mx-auto px-4 pb-20 pt-12"
    >
      <h2 className="font-display text-3xl md:text-4xl text-center mb-10 text-foreground">
        Todos os imóveis
      </h2>
      {imoveis.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhum imóvel publicado no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveis.map((imv) => (
            <PropertyCard key={imv.id} imovel={imv} slug={slug} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalculadoraSection() {
  return (
    <section
      data-section="calculadora"
      className="bg-secondary text-secondary-foreground py-16 px-4"
    >
      <div className="container mx-auto max-w-3xl text-center">
        <Calculator className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="font-display text-3xl md:text-4xl mb-3">
          Simulador de financiamento
        </h2>
        <p className="opacity-80 mb-6">
          Descubra quanto pagaria de prestação no imóvel dos seus sonhos.
        </p>
        <div className="rounded-2xl bg-card text-card-foreground p-6 md:p-8 text-left">
          <p className="text-sm text-muted-foreground text-center">
            🚧 Calculadora chega em breve.
          </p>
        </div>
      </div>
    </section>
  );
}

function DepoimentosSection({ tenant }: { tenant: TenantPublic }) {
  const empresa = tenant.marca?.nomeEmpresa ?? 'nossa imobiliária';
  return (
    <section
      data-section="depoimentos"
      className="container mx-auto px-4 py-16"
    >
      <h2 className="font-display text-3xl md:text-4xl text-center mb-10 text-foreground">
        Quem confia em nós
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            nome: 'Mariana Costa',
            texto:
              'Atendimento impecável do começo ao fim. Encontrei meu apartamento dos sonhos.',
          },
          {
            nome: 'Pedro Almeida',
            texto: `Profissionalismo e transparência. Recomendo a ${empresa} de olhos fechados.`,
          },
          {
            nome: 'Ana Souza',
            texto:
              'Eles entenderam exatamente o que eu queria e me apresentaram opções perfeitas.',
          },
        ].map((d) => (
          <div
            key={d.nome}
            className="rounded-lg border border-border bg-card p-6"
          >
            <Star className="h-5 w-5 text-primary mb-3 fill-current" />
            <p className="text-sm text-foreground/80 italic mb-4 leading-relaxed">
              &ldquo;{d.texto}&rdquo;
            </p>
            <p className="text-sm font-semibold">{d.nome}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BioCorretorSection({ tenant }: { tenant: TenantPublic }) {
  const nome = tenant.marca?.nomeEmpresa ?? tenant.nome;
  const desc = tenant.marca?.descricao ?? '';
  return (
    <section
      data-section="bio-corretor"
      className="bg-card border-y border-border py-16 px-4"
    >
      <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 items-center">
        <div className="h-44 w-44 mx-auto md:mx-0 rounded-full bg-secondary text-secondary-foreground grid place-items-center">
          {tenant.marca?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.marca.logoUrl}
              alt=""
              className="h-32 w-32 object-contain"
            />
          ) : (
            <User className="h-16 w-16" />
          )}
        </div>
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
            Quem te atende
          </p>
          <h2 className="font-display text-3xl md:text-4xl mb-3 text-foreground">
            {nome}
          </h2>
          {desc && (
            <p className="text-foreground/80 leading-relaxed">{desc}</p>
          )}
          {tenant.marca?.whatsapp && (
            <a
              href={`https://wa.me/${tenant.marca.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-5 h-11 rounded-md bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Fale comigo
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function AvaliacaoCTASection({ tenant }: { tenant: TenantPublic }) {
  return (
    <section
      data-section="avaliacao-cta"
      className="container mx-auto px-4 py-16"
    >
      <div className="rounded-2xl bg-secondary text-secondary-foreground p-10 md:p-14 text-center max-w-4xl mx-auto">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="font-display text-3xl md:text-4xl mb-3">
          Quer avaliar seu imóvel?
        </h2>
        <p className="opacity-80 mb-6 max-w-2xl mx-auto">
          Avaliação gratuita e profissional. Em até 24h você recebe uma proposta
          de preço de mercado.
        </p>
        {tenant.marca?.whatsapp && (
          <a
            href={`https://wa.me/${tenant.marca.whatsapp.replace(/\D/g, '')}?text=Olá!%20Quero%20avaliar%20meu%20imóvel.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" /> Solicitar avaliação
          </a>
        )}
      </div>
    </section>
  );
}

function ContatoCTASection({ tenant }: { tenant: TenantPublic }) {
  return (
    <section
      data-section="contato-cta"
      className="bg-secondary text-secondary-foreground py-16 px-4"
    >
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-3">
          Vamos conversar?
        </h2>
        <p className="opacity-80 mb-6">
          Atendimento direto pelo WhatsApp. Tire dúvidas sobre qualquer imóvel.
        </p>
        {tenant.marca?.whatsapp ? (
          <a
            href={`https://wa.me/${tenant.marca.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-green-500 text-white font-semibold hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
          </a>
        ) : tenant.marca?.email ? (
          <a
            href={`mailto:${tenant.marca.email}`}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold"
          >
            Entrar em contato
          </a>
        ) : null}
      </div>
    </section>
  );
}
