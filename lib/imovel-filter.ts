import type { ImovelPublic } from '@/app/_templates/types';

export interface ImovelFilters {
  q?: string;
  op?: string; // venda | aluguel | lancamento
  tipo?: string; // CASA | APARTAMENTO | ...
  faixa?: string; // "min-max" em reais, ex "300000-500000" ou "3000000-"
  dorm?: string; // "1" "2" "3" "4" — mínimo
}

/** True se algum filtro está aplicado. */
export function hasFilters(f: ImovelFilters): boolean {
  return Boolean(f.q || f.op || f.tipo || f.faixa || f.dorm);
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ImovelFilters {
  const get = (k: string) => {
    const v = searchParams[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  return {
    q: get('q'),
    op: get('op'),
    tipo: get('tipo'),
    faixa: get('faixa'),
    dorm: get('dorm'),
  };
}

export function applyFilters(
  imoveis: ImovelPublic[],
  f: ImovelFilters,
): ImovelPublic[] {
  let out = imoveis;

  if (f.op) {
    const opMap: Record<string, string> = {
      venda: 'VENDA',
      aluguel: 'ALUGUEL',
      lancamento: 'VENDA', // lançamento = venda destacada
    };
    const target = opMap[f.op.toLowerCase()];
    if (target) {
      out = out.filter((i) => i.operacao === target);
    }
  }

  if (f.tipo) {
    out = out.filter((i) => i.tipo === f.tipo);
  }

  if (f.dorm) {
    const min = parseInt(f.dorm, 10);
    if (Number.isFinite(min)) {
      out = out.filter((i) => i.quartos >= min);
    }
  }

  if (f.faixa) {
    const parts = f.faixa.split('-');
    const min = parts[0] ? parseInt(parts[0], 10) : 0;
    const max = parts[1] ? parseInt(parts[1], 10) : Number.POSITIVE_INFINITY;
    out = out.filter((i) => i.preco >= min && i.preco <= max);
  }

  if (f.q) {
    const needle = f.q.toLowerCase().trim();
    out = out.filter((i) => {
      const haystack = [
        i.titulo,
        i.bairro,
        i.cidade,
        i.estado,
        i.endereco,
        i.codigo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  return out;
}

export function filtersSummary(f: ImovelFilters): string[] {
  const out: string[] = [];
  const TIPOS: Record<string, string> = {
    CASA: 'Casa',
    APARTAMENTO: 'Apartamento',
    COBERTURA: 'Cobertura',
    STUDIO: 'Studio',
    TERRENO: 'Terreno',
    SALA_COMERCIAL: 'Sala Comercial',
    LOJA: 'Loja',
    GALPAO: 'Galpão',
    CHACARA: 'Chácara',
    SITIO: 'Sítio',
  };
  if (f.q) out.push(`"${f.q}"`);
  if (f.op) {
    const ops: Record<string, string> = {
      venda: 'Venda',
      aluguel: 'Aluguel',
      lancamento: 'Lançamentos',
    };
    out.push(ops[f.op.toLowerCase()] ?? f.op);
  }
  if (f.tipo) out.push(TIPOS[f.tipo] ?? f.tipo);
  if (f.dorm) out.push(`${f.dorm}+ dorm.`);
  if (f.faixa) {
    const parts = f.faixa.split('-');
    const min = parts[0] ? parseInt(parts[0], 10) : 0;
    const max = parts[1] ? parseInt(parts[1], 10) : null;
    const fmt = (n: number) =>
      n >= 1_000_000
        ? `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}Mi`
        : `R$ ${(n / 1000).toLocaleString('pt-BR')}k`;
    if (max == null) out.push(`Acima de ${fmt(min)}`);
    else if (min === 0) out.push(`Até ${fmt(max)}`);
    else out.push(`${fmt(min)} — ${fmt(max)}`);
  }
  return out;
}
