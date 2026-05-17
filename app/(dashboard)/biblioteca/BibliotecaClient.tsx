'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Library,
  Trash2,
  Edit3,
  Copy as CopyIcon,
  Check,
  Sparkles,
  ImageIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type LibItem = {
  id: string;
  imovelId: string | null;
  imovelTitulo: string;
  imovelLocal: string | null;
  templateId: string;
  templateNome: string;
  formato: string;
  formatoLabel: string;
  thumbUrl: string;
  copy: string | null;
  createdAt: string;
};

export default function BibliotecaClient({ items }: { items: LibItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [editingCopy, setEditingCopy] = useState<{ id: string; value: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group by imovel
  const grupos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (i) =>
            i.imovelTitulo.toLowerCase().includes(q) ||
            (i.imovelLocal ?? '').toLowerCase().includes(q) ||
            i.templateNome.toLowerCase().includes(q),
        )
      : items;

    const map = new Map<
      string,
      { imovelId: string | null; imovelTitulo: string; imovelLocal: string | null; items: LibItem[] }
    >();
    for (const it of filtered) {
      const key = it.imovelId ?? `_avulso_${it.imovelTitulo}`;
      const g =
        map.get(key) ??
        {
          imovelId: it.imovelId,
          imovelTitulo: it.imovelTitulo,
          imovelLocal: it.imovelLocal,
          items: [] as LibItem[],
        };
      g.items.push(it);
      map.set(key, g);
    }
    return Array.from(map.values());
  }, [items, search]);

  async function handleDelete(id: string) {
    if (!confirm('Apagar essa arte? Não dá pra desfazer.')) return;
    try {
      const r = await fetch(`/api/posts-lib/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Arte excluída');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao excluir', { description: (e as Error).message });
    }
  }

  async function handleSaveCopy(id: string, copy: string) {
    try {
      const r = await fetch(`/api/posts-lib/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy }),
      });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Copy atualizada');
      setEditingCopy(null);
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  function handleCopyToClipboard(id: string, copy: string) {
    navigator.clipboard.writeText(copy).then(() => {
      setCopiedId(id);
      toast.success('Copy copiada!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Conteúdo"
        icon={Library}
        title="Biblioteca de posts"
        description={`${items.length} arte(s) salva(s)`}
        actions={
          <Link href="/conteudo" passHref legacyBehavior>
            <Button asChild>
              <a>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar novo post
              </a>
            </Button>
          </Link>
        }
      />

      {items.length > 0 && (
        <Input
          placeholder="Buscar por imóvel, bairro ou template…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {grupos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={
            items.length === 0
              ? 'Sua biblioteca está vazia'
              : 'Nenhuma arte com esse filtro'
          }
          description={
            items.length === 0
              ? 'Crie posts no editor e clique em "Salvar na biblioteca" pra guardar aqui pra reusar depois.'
              : undefined
          }
          action={
            items.length === 0
              ? { label: 'Ir pro editor', icon: Sparkles, onClick: () => router.push('/conteudo') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {grupos.map((g) => (
            <section key={g.imovelTitulo}>
              <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-border">
                <div>
                  <h3 className="font-display text-lg font-semibold">{g.imovelTitulo}</h3>
                  {g.imovelLocal && (
                    <p className="text-xs text-muted-foreground">{g.imovelLocal}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {g.items.length} arte{g.items.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbUrl}
                        alt={item.templateNome}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <Badge
                        variant="outline"
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur text-[10px]"
                      >
                        {item.formatoLabel}
                      </Badge>
                    </div>

                    <div className="p-3 flex-1 flex flex-col gap-2">
                      <div>
                        <p className="font-medium text-xs text-foreground">{item.templateNome}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Copy */}
                      {editingCopy?.id === item.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={editingCopy.value}
                            onChange={(e) =>
                              setEditingCopy({ id: item.id, value: e.target.value })
                            }
                            rows={4}
                            className="w-full text-[11px] rounded border border-input bg-background p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSaveCopy(item.id, editingCopy.value)}
                              className="text-[11px] text-primary font-medium hover:underline"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingCopy(null)}
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : item.copy ? (
                        <p className="text-[11px] text-muted-foreground line-clamp-4 whitespace-pre-line">
                          {item.copy}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">Sem copy</p>
                      )}

                      <div className="mt-auto flex items-center gap-1 pt-2 border-t border-border/50">
                        {item.copy && (
                          <button
                            onClick={() => handleCopyToClipboard(item.id, item.copy!)}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                            title="Copiar texto"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <CopyIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setEditingCopy({ id: item.id, value: item.copy ?? '' })
                          }
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                          title="Editar copy"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={item.thumbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted text-[10px]"
                          title="Abrir imagem em nova aba"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </a>
                        <Link
                          href={`/conteudo?imovel=${item.imovelId ?? ''}`}
                          className="text-[11px] text-primary hover:underline ml-auto"
                          title="Criar novo post pra esse imóvel"
                        >
                          Novo
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        ℹ️ Os thumbs ficam no Supabase Storage. A copy é editável a qualquer momento.
        Clica em "Novo" pra abrir o editor pré-carregado com o imóvel.
      </div>
    </div>
  );
}
