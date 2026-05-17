import type { ImovelPublic } from '@/app/_templates/types';

export interface ImovelFilters {
  q?: string;
  op?: string; // venda | aluguel | lancamento
  tipo?: string; // CASA | APARTAMENTO | ...
  cidade?: string;
  faixa?: string; // "min-max" em reais, ex "300000-500000" ou "3000000-"
  dorm?: string; // "1" "2" "3" "4" — mínimo de quartos
  suites?: string; // mínimo
  banheiros?: string; // mínimo
  vagas?: string; // mínimo
  areaMin?: string; // m² mínimo
}

/** True se algum filtro está aplicado. */
export function hasFilters(f: ImovelFilters): boolean {
  return Boolean(
    f.q ||
      f.op ||
      f.tipo ||
      f.cidade ||
      f.faixa ||
      f.dorm ||
      f.suites ||
      f.banheiros ||
      f.vagas ||
      f.areaMin,
  );
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ImovelFilters {
  const get = (k: string) => {
    const v = searchParams[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  // Aceita 'quartos' como alias de 'dorm' (search bars novos)
  const dorm = get('dorm') ?? get('quartos');
  return {
    q: get('q'),
    op: get('op'),
    tipo: get('tipo'),
    cidade: get('cidade'),
    faixa: get('faixa'),
    dorm,
    suites: get('suites'),
    banheiros: get('banheiros'),
    vagas: get('vagas'),
    areaMin: get('areaMin'),
  };
}

function minOf(value: string | undefined): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
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

  if (f.cidade) {
    const needle = f.cidade.toLowerCase().trim();
    out = out.filter((i) => (i.cidade ?? '').toLowerCase() === needle);
  }

  const minDorm = minOf(f.dorm);
  if (minDorm != null) out = out.filter((i) => (i.quartos ?? 0) >= minDorm);

  const minSuites = minOf(f.suites);
  if (minSuites != null) out = out.filter((i) => ((i as any).suites ?? 0) >= minSuites);

  const minBanheiros = minOf(f.banheiros);
  if (minBanheiros != null) out = out.filter((i) => ((i as any).banheiros ?? 0) >= minBanheiros);

  const minVagas = minOf(f.vagas);
  if (minVagas != null) out = out.filter((i) => ((i as any).vagas ?? 0) >= minVagas);

  const minArea = minOf(f.areaMin);
  if (minArea != null) {
    out = out.filter((i) => {
      const a = (i as any).areaM2 ?? (i as any).areaTotal ?? 0;
      return Number(a) >= minArea;
    });
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
  if (f.cidade) out.push(f.cidade);
  if (f.dorm) out.push(`${f.dorm}+ dorm.`);
  if (f.suites) out.push(`${f.suites}+ suíte${f.suites === '1' ? '' : 's'}`);
  if (f.banheiros) out.push(`${f.banheiros}+ banh.`);
  if (f.vagas) out.push(`${f.vagas}+ vaga${f.vagas === '1' ? '' : 's'}`);
  if (f.areaMin) out.push(`${f.areaMin}m²+`);
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
