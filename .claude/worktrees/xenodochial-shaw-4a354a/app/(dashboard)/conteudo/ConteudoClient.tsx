'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  ImageOff,
  ArrowRight,
  Plus,
  ImageIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ImovelLite = {
  id: string;
  codigo: string;
  titulo: string;
  capaUrl: string | null;
  cidade: string;
  bairro: string | null;
  tipo: string;
  operacao: string;
  preco: number;
  publicado: boolean;
  postsCount: number;
};

const TIPO_LABELS: Record<string, string> = {
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
  OUTRO: 'Outro',
};

const OP_LABELS: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  TEMPORADA: 'Temporada',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ConteudoClient({ imoveis }: { imoveis: ImovelLite[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return imoveis;
    return imoveis.filter((i) =>
      `${i.titulo} ${i.codigo} ${i.cidade} ${i.bairro ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [imoveis, search]);

  const totalPosts = imoveis.reduce((acc, i) => acc + i.postsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Conteúdo
          </h1>
          <p className="text-sm text-muted-foreground">
            Gere posts visuais a partir dos seus imóveis. Cores e logo da sua
            marca aplicados automaticamente.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/imoveis/novo">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar imóvel
          </Link>
        </Button>
      </div>

      {/* KPIs simples */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Imóveis cadastrados" value={String(imoveis.length)} />
        <KpiCard label="Posts gerados" value={String(totalPosts)} />
        <KpiCard
          label="Imóveis no ar"
          value={String(imoveis.filter((i) => i.publicado).length)}
        />
      </div>

      {/* Como funciona */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-10 w-10 rounded-md bg-primary/15 grid place-items-center text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <p className="font-display text-lg font-semibold text-foreground">
              Como funciona
            </p>
            <p className="text-sm text-muted-foreground">
              Escolha um imóvel → escolha o formato (post quadrado, story,
              Facebook) → escolha um dos 3 templates visuais → o post é gerado
              instantaneamente com sua marca aplicada. Baixe em PNG e copie a
              legenda pronta.
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar imóvel por título, código, cidade ou bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de imóveis */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">
            {imoveis.length === 0
              ? 'Você ainda não tem imóveis cadastrados.'
              : 'Nenhum imóvel encontrado pra esse filtro.'}
          </p>
          {imoveis.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/imoveis/novo">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro imóvel
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((i) => (
            <ImovelCard key={i.id} imovel={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImovelCard({ imovel }: { imovel: ImovelLite }) {
  return (
    <Link
      href={`/conteudo/imovel/${imovel.id}`}
      className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="aspect-[4/3] bg-muted relative">
        {imovel.capaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imovel.capaUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <ImageOff className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {imovel.postsCount > 0 && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground shadow">
            <Sparkles className="h-2.5 w-2.5" />
            {imovel.postsCount} {imovel.postsCount === 1 ? 'post' : 'posts'}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-normal">
            {TIPO_LABELS[imovel.tipo] ?? imovel.tipo}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            {OP_LABELS[imovel.operacao] ?? imovel.operacao}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            {imovel.codigo}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-foreground truncate">
          {imovel.titulo}
        </h3>
        <p className="text-xs text-muted-foreground truncate mb-2">
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-display text-lg font-bold text-primary">
            {formatBRL(imovel.preco)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Gerar posts <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
