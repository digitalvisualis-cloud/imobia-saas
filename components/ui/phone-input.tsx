'use client';

import { useMemo } from 'react';

// Top 7 paises mais provaveis pro mercado imobiliario BR. Se faltar
// algum, o usuario edita o valor cru no banco — nao vale fazer dropdown
// com 200 paises.
const COUNTRIES = [
  { code: '55', flag: '🇧🇷', name: 'Brasil' },
  { code: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: '1', flag: '🇺🇸', name: 'EUA / Canadá' },
  { code: '54', flag: '🇦🇷', name: 'Argentina' },
  { code: '598', flag: '🇺🇾', name: 'Uruguai' },
  { code: '34', flag: '🇪🇸', name: 'Espanha' },
  { code: '49', flag: '🇩🇪', name: 'Alemanha' },
];

/**
 * Formata digitos locais BR como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * (suporta mobile 11 digitos e fixo 10).
 *
 * Pra paises nao-BR, so retorna os digitos com espacos a cada 4 chars —
 * simples e funciona razoavelmente bem visualmente.
 */
function formatLocal(digits: string, country: string): string {
  const d = digits.replace(/\D/g, '');
  if (!d) return '';
  if (country !== '55') {
    // formato genérico: XXXX XXXX XX...
    return d.match(/.{1,4}/g)?.join(' ') ?? d;
  }
  // formato BR
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/**
 * Input de telefone com pais (DDI) + formato automatico.
 *
 * Storage: string crua, tudo digito, com pais na frente.
 *   Ex: "5511997289707"
 *
 * UI: split em select de pais + input formatado.
 *
 * Se `value` esta vazio, exibe Brasil por default.
 */
export function PhoneInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  // Detecta pais do prefixo (testa do mais longo pro mais curto pra
  // evitar match prematuro de "1" quando o valor é "5511...").
  const { country, local } = useMemo(() => {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) return { country: '55', local: '' };
    const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
    const match = sorted.find((c) => digits.startsWith(c.code));
    if (match) {
      return { country: match.code, local: digits.slice(match.code.length) };
    }
    // Sem match — assume BR e o numero todo eh local
    return { country: '55', local: digits };
  }, [value]);

  function handleCountryChange(newCountry: string) {
    onChange(newCountry + local);
  }

  function handleLocalChange(input: string) {
    const digits = input.replace(/\D/g, '').slice(0, country === '55' ? 11 : 15);
    onChange(country + digits);
  }

  return (
    <div className={`flex gap-2 ${className ?? ''}`}>
      <select
        value={country}
        onChange={(e) => handleCountryChange(e.target.value)}
        className="input flex-shrink-0"
        style={{ width: 'auto' }}
        aria-label="Código do país"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} +{c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        className="input flex-1 min-w-0"
        value={formatLocal(local, country)}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder={placeholder ?? (country === '55' ? '(11) 99999-9999' : 'Número')}
      />
    </div>
  );
}
