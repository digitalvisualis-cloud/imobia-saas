'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'SALA_COMERCIAL', label: 'Sala' },
  { value: 'LOJA', label: 'Loja' },
];

const QUARTOS = [
  { value: '', label: 'Qualquer' },
  { value: '1', label: '1+ quartos' },
  { value: '2', label: '2+ quartos' },
  { value: '3', label: '3+ quartos' },
  { value: '4', label: '4+ quartos' },
];

const FAIXAS = [
  { value: '', label: 'Qualquer preço' },
  { value: '0-300000', label: 'Até R$ 300 mil' },
  { value: '300000-500000', label: 'R$ 300 — 500 mil' },
  { value: '500000-1000000', label: 'R$ 500 mil — 1 mi' },
  { value: '1000000-3000000', label: 'R$ 1 — 3 mi' },
  { value: '3000000-', label: 'Acima de R$ 3 mi' },
];

/**
 * Search card baseado no visual-lab (.site-search):
 * - bg branco + shadow grande
 * - h3 + 2 selects (op/tipo) + input cidade + 2 selects (quartos/preco) + botao
 * - inputs em bg-stone-50 borda fina
 *
 * Fica posicionado no hero pra dar peso visual de "comeca aqui" (estilo
 * Booking/AirBnb-like que e a pegada Brisa).
 */
export function BrisaSearchCard() {
  const [op, setOp] = useState<'Comprar' | 'Alugar'>('Comprar');
  const [tipo, setTipo] = useState('');
  const [cidade, setCidade] = useState('');
  const [quartos, setQuartos] = useState('');
  const [faixa, setFaixa] = useState('');

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('op', op === 'Alugar' ? 'aluguel' : 'venda');
    if (tipo) params.set('tipo', tipo);
    if (cidade.trim()) params.set('cidade', cidade.trim());
    if (quartos) params.set('quartos', quartos);
    if (faixa) params.set('faixa', faixa);
    window.location.search = params.toString();
  }

  return (
    <form
      onSubmit={submeter}
      className="grid w-full max-w-sm gap-2 rounded-lg bg-white p-4 text-stone-900 shadow-[0_18px_48px_rgba(15,23,42,0.25)]"
    >
      <h3
        style={{ fontFamily: 'var(--t-font-heading)' }}
        className="text-lg font-semibold leading-tight"
      >
        Encontre seu próximo imóvel
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={op}
          onChange={(e) => setOp(e.target.value as 'Comprar' | 'Alugar')}
          className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
        >
          <option>Comprar</option>
          <option>Alugar</option>
        </select>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Cidade ou bairro"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm placeholder:text-stone-400"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={quartos}
          onChange={(e) => setQuartos(e.target.value)}
          className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
        >
          {QUARTOS.map((q) => (
            <option key={q.value} value={q.value}>{q.label}</option>
          ))}
        </select>
        <select
          value={faixa}
          onChange={(e) => setFaixa(e.target.value)}
          className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
        >
          {FAIXAS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-bold text-white"
        style={{ background: 'var(--t-primary)' }}
      >
        <Search className="h-4 w-4" /> Buscar imóveis
      </button>
    </form>
  );
}
