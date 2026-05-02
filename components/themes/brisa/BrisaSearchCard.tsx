import { Search, MapPin, Home as HomeIcon, DollarSign } from 'lucide-react';

export function BrisaSearchCard() {
  return (
    <div
      className="w-full max-w-md rounded-2xl p-6 shadow-2xl backdrop-blur"
      style={{ background: 'rgb(255 255 255 / 0.96)', color: 'var(--t-fg)' }}
    >
      <h3
        style={{ fontFamily: 'var(--t-font-heading)' }}
        className="text-2xl font-semibold leading-tight"
      >
        Encontre seu próximo imóvel
      </h3>
      <p className="mt-1.5 text-sm opacity-70">
        Busque por bairro, tipo e faixa de preço
      </p>

      <div className="mt-5 flex gap-1.5">
        {(['Comprar', 'Alugar', 'Lançamentos'] as const).map((t, i) => (
          <button
            key={t}
            type="button"
            className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
            style={
              i === 0
                ? { background: 'var(--t-primary)', color: 'var(--t-bg)' }
                : { background: 'rgb(var(--t-fg-rgb) / 0.06)', color: 'var(--t-fg)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        <Field icon={MapPin} placeholder="Cidade, bairro ou empreendimento" />
        <div className="grid grid-cols-2 gap-2.5">
          <Field icon={HomeIcon} placeholder="Tipo" select />
          <Field icon={DollarSign} placeholder="Preço" select />
        </div>
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
        style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
      >
        <Search className="h-4 w-4" /> Buscar imóveis
      </button>
      <button
        type="button"
        className="mt-2 w-full text-center text-xs opacity-60 hover:opacity-100"
      >
        Buscar por código
      </button>
    </div>
  );
}

function Field({
  icon: Icon,
  placeholder,
  select,
}: {
  icon: typeof Search;
  placeholder: string;
  select?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
      style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.12)' }}
    >
      <Icon className="h-4 w-4 opacity-50" />
      <span className="flex-1 text-sm opacity-50">{placeholder}</span>
      {select && <span className="text-xs opacity-40">▾</span>}
    </div>
  );
}
