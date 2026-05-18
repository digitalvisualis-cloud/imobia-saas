import { PropertyCard } from './PropertyCard';
import type { TenantPublic, ImovelPublic } from '../types';

export function TemplateHome({
  tenant,
  imoveis,
}: {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
}) {
  const slogan = tenant.marca?.slogan || 'Encontre o imóvel ideal para você';
  const descricao =
    tenant.marca?.descricao ||
    'Imóveis selecionados com curadoria especial. Confiança, transparência e excelência em cada negociação.';

  return (
    <>
      {/* Hero — fundo forest com radial gradients sutis */}
      <section className="relative bg-secondary text-secondary-foreground py-24 md:py-32 px-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.18), transparent 50%),
              radial-gradient(circle at 80% 80%, hsl(var(--primary) / 0.12), transparent 50%)
            `,
          }}
        />
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
            {slogan}
          </h1>
          <p className="mt-6 text-base md:text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
            {descricao}
          </p>
        </div>
      </section>

      {/* Search bar — encavalada sobre o hero */}
      <section className="px-4 -mt-16 md:-mt-20 mb-16 relative z-20">
        <div className="container mx-auto">
          <div className="bg-card border rounded-2xl shadow-2xl p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl mb-4 text-card-foreground">
              Buscar imóveis
            </h2>
            <form
              action="#imoveis"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
            >
              <select
                name="tipo"
                defaultValue=""
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tipo</option>
                <option value="CASA">Casa</option>
                <option value="APARTAMENTO">Apartamento</option>
                <option value="COBERTURA">Cobertura</option>
                <option value="STUDIO">Studio</option>
                <option value="TERRENO">Terreno</option>
                <option value="SALA_COMERCIAL">Sala Comercial</option>
                <option value="LOJA">Loja</option>
                <option value="GALPAO">Galpão</option>
                <option value="CHACARA">Chácara</option>
                <option value="SITIO">Sítio</option>
              </select>
              <select
                name="operacao"
                defaultValue=""
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Finalidade</option>
                <option value="VENDA">Venda</option>
                <option value="ALUGUEL">Aluguel</option>
                <option value="TEMPORADA">Temporada</option>
              </select>
              <input
                name="local"
                type="text"
                placeholder="Bairro ou cidade"
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                name="quartos"
                type="number"
                min={0}
                placeholder="Quartos"
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Grid de imóveis */}
      <section id="imoveis" className="container mx-auto px-4 pb-20">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10 text-foreground">
          Nossos imóveis
        </h2>

        {imoveis.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhum imóvel publicado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.map((imv) => (
              <PropertyCard key={imv.id} imovel={imv} slug={tenant.slug} />
            ))}
          </div>
        )}
      </section>

      <div id="contato" aria-hidden />
    </>
  );
}
