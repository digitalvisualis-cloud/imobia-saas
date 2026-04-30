'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  Check,
  Loader2,
  ImageOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  TIPO_LABELS,
  FINALIDADE_LABELS,
  formatBRL,
} from '@/app/_templates/types';

type Imovel = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  operacao: string;
  preco: number;
  bairro: string | null;
  cidade: string;
  estado: string;
  capaUrl: string | null;
  imagens: string[];
  publicado: boolean;
  destaque: boolean;
  status: string;
  statusGeracao: string | null;
};

export default function ImoveisClient({ imoveis }: { imoveis: Imovel[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFinalidade, setFilterFinalidade] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = imoveis.filter((im) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${im.titulo} ${im.bairro ?? ''} ${im.cidade} ${im.codigo}`
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filterTipo && im.tipo !== filterTipo) return false;
    if (filterFinalidade && im.operacao !== filterFinalidade) return false;
    return true;
  });

  async function copyCode(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  }

  async function patchImovel(id: string, body: Record<string, unknown>) {
    setPendingId(id);
    try {
      const r = await fetch(`/api/imoveis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('PATCH failed');
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar imóvel');
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      const r = await fetch(`/api/imoveis/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('DELETE failed');
      setConfirmDeleteId(null);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir imóvel');
    } finally {
      setPendingId(null);
    }
  }

  const imovelEmConfirma = imoveis.find((i) => i.id === confirmDeleteId);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Imóveis
        </h1>
        <Button asChild>
          <Link href="/imoveis/novo">
            <Plus className="h-4 w-4 mr-2" /> Adicionar imóvel
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, bairro, cidade ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="md:w-[170px]"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={filterFinalidade}
          onChange={(e) => setFilterFinalidade(e.target.value)}
          className="md:w-[170px]"
        >
          <option value="">Todas finalidades</option>
          {Object.entries(FINALIDADE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {imoveis.length === 0
              ? 'Você ainda não tem imóveis cadastrados.'
              : 'Nenhum imóvel encontrado para esse filtro.'}
          </p>
          {imoveis.length === 0 && (
            <Button asChild>
              <Link href="/imoveis/novo">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar primeiro imóvel
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((im) => {
            const isLoading = pendingId === im.id;
            return (
              <div
                key={im.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow"
              >
                {/* Thumb */}
                <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {im.capaUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={im.capaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground/60" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm truncate text-foreground">
                      {im.titulo}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 font-normal"
                    >
                      {TIPO_LABELS[im.tipo] ?? im.tipo}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 font-normal"
                    >
                      {FINALIDADE_LABELS[im.operacao] ?? im.operacao}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate">
                      {[im.bairro, im.cidade].filter(Boolean).join(', ')}
                    </span>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {formatBRL(im.preco)}
                    </span>
                  </div>
                </div>

                {/* Código + copy */}
                <button
                  onClick={() => copyCode(im.codigo, im.id)}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-muted hover:bg-muted/80 font-mono shrink-0"
                  type="button"
                  title="Copiar código"
                >
                  {im.codigo}
                  {copiedId === im.id ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>

                {/* Toggles Pub/Dest */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Pub.</span>
                    <Switch
                      checked={im.publicado}
                      disabled={isLoading}
                      onCheckedChange={() =>
                        patchImovel(im.id, { publicado: !im.publicado })
                      }
                      aria-label="Publicado"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Dest.</span>
                    <Switch
                      checked={im.destaque}
                      disabled={isLoading}
                      onCheckedChange={() =>
                        patchImovel(im.id, { destaque: !im.destaque })
                      }
                      aria-label="Destaque"
                    />
                  </div>
                </div>

                {/* Ações inline */}
                <div className="flex items-center gap-1 shrink-0">
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar"
                  >
                    <Link href={`/imoveis/${im.id}/editar`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Excluir"
                    onClick={() => setConfirmDeleteId(im.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de delete */}
      {imovelEmConfirma && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-card border rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold mb-2 text-foreground">
              Excluir imóvel
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-foreground">
                {imovelEmConfirma.titulo}
              </span>
              ? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={pendingId === imovelEmConfirma.id}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(imovelEmConfirma.id)}
                disabled={pendingId === imovelEmConfirma.id}
              >
                {pendingId === imovelEmConfirma.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
