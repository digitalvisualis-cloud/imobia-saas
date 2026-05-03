'use client';

import { useState } from 'react';
import { Search, MapPin, Home as HomeIcon, DollarSign } from 'lucide-react';

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'SALA_COMERCIAL', label: 'Sala Comercial' },
  { value: 'LOJA', label: 'Loja' },
  { value: 'GALPAO', label: 'Galpão' },
  { value: 'CHACARA', label: 'Chácara' },
  { value: 'SITIO', label: 'Sítio' },
];

const FAIXAS = [
  { value: '', label: 'Qualquer preço' },
  { value: '0-300000', label: 'Até R$ 300 mil' },
  { value: '300000-500000', label: 'R$ 300 — 500 mil' },
  { value: '500000-1000000', label: 'R$ 500 mil — 1 milhão' },
  { value: '1000000-3000000', label: 'R$ 1 — 3 milhões' },
  { value: '3000000-', label: 'Acima de R$ 3 milhões' },
];

const OPERACOES = ['Comprar', 'Alugar', 'Lançamentos'] as const;

export function BrisaSearchCard() {
  const [operacao, setOperacao] = useState<(typeof OPERACOES)[number]>('Comprar');
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [faixa, setFaixa] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (operacao === 'Alugar') params.set('op', 'aluguel');
    else if (operacao === 'Lançamentos') params.set('op', 'lancamento');
    else params.set('op', 'venda');
    if (busca) params.set('q', busca);
    if (tipo) params.set('tipo', tipo);
    if (faixa) params.set('faixa', faixa);
    // Redireciona pra própria home com query string — listagem filtrada
    // pode ser implementada depois; por enquanto preserva a busca.
    window.location.search = params.toString();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl p-4 shadow-2xl backdrop-blur sm:p-6"
      style={{ background: 'rgb(255 255 255 / 0.96)', color: 'var(--t-fg)' }}
    >
      <h3
        style={{ fontFamily: 'var(--t-font-heading)' }}
        className="text-lg font-semibold leading-tight sm:text-2xl"
      >
        Encontre seu próximo imóvel
      </h3>
      <p className="mt-1.5 text-xs opacity-70 sm:text-sm">
        Busque por bairro, tipo e faixa de preço
      </p>

      <div className="mt-5 flex gap-1.5">
        {OPERACOES.map((t) => {
          const active = operacao === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setOperacao(t)}
              className="rounded-full border px-4 py-1.5 text-xs font-medium transition-all"
              style={
                active
                  ? {
                      background: 'var(--t-primary)',
                      color: 'var(--t-bg)',
                      borderColor: 'var(--t-primary)',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--t-fg)',
                      borderColor: 'rgb(var(--t-fg-rgb) / 0.2)',
                    }
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2.5">
        <FieldInput
          icon={MapPin}
          placeholder="Cidade, bairro ou empreendimento"
          value={busca}
          onChange={setBusca}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FieldSelect
            icon={HomeIcon}
            value={tipo}
            onChange={setTipo}
            options={TIPOS}
          />
          <FieldSelect
            icon={DollarSign}
            value={faixa}
            onChange={setFaixa}
            options={FAIXAS}
          />
        </div>
      </div>

      <button
        type="submit"
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
    </form>
  );
}

function FieldInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
}: {
  icon: typeof Search;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
      style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.12)' }}
    >
      <Icon className="h-4 w-4 opacity-50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
      />
    </div>
  );
}

function FieldSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon: typeof Search;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
      style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.12)' }}
    >
      <Icon className="h-4 w-4 opacity-50" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 cursor-pointer bg-transparent text-sm outline-none"
        style={{ color: 'var(--t-fg)' }}
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
