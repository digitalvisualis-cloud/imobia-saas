'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, ExternalLink, Sparkles, X, Eye, EyeOff, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/lib/toast';

interface Artigo {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudoMd: string;
  capaUrl: string | null;
  tags: string[];
  autor: string | null;
  publicado: boolean;
  publicadoEm: string | null;
  visualizacoes: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialArtigos: Artigo[];
  slug: string;
  cidades: string[];
}

const EMPTY_FORM: Partial<Artigo> = {
  titulo: '',
  resumo: '',
  conteudoMd: '',
  capaUrl: '',
  tags: [],
  autor: '',
  publicado: false,
  metaTitle: '',
  metaDescription: '',
};

export default function BlogClient({ initialArtigos, slug, cidades }: Props) {
  const [artigos, setArtigos] = useState<Artigo[]>(initialArtigos);
  const [editing, setEditing] = useState<Partial<Artigo> | null>(null);
  const [saving, setSaving] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [iaTopico, setIaTopico] = useState('');
  const [iaCidade, setIaCidade] = useState(cidades[0] ?? '');

  function abrirNovo() {
    setEditing({ ...EMPTY_FORM });
  }
  function abrirEditar(a: Artigo) {
    setEditing({ ...a });
  }
  function fechar() {
    setEditing(null);
    setIaTopico('');
  }

  async function salvar() {
    if (!editing?.titulo?.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const isUpdate = Boolean((editing as Artigo).id);
      const url = isUpdate ? `/api/blog?id=${(editing as Artigo).id}` : '/api/blog';
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'erro');
      const saved = await res.json();
      setArtigos((prev) => {
        const exists = prev.find((a) => a.id === saved.id);
        const formatted = {
          ...saved,
          publicadoEm: saved.publicadoEm ?? null,
        };
        return exists ? prev.map((a) => (a.id === saved.id ? formatted : a)) : [formatted, ...prev];
      });
      toast.success(isUpdate ? 'Artigo atualizado' : 'Artigo criado');
      fechar();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function deletar(id: string) {
    if (!confirm('Apagar este artigo? Essa ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setArtigos((prev) => prev.filter((a) => a.id !== id));
      toast.success('Artigo apagado');
    } catch {
      toast.error('Erro ao apagar');
    }
  }

  async function togglePublicado(a: Artigo) {
    try {
      const res = await fetch(`/api/blog?id=${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: !a.publicado }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setArtigos((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, ...saved, publicadoEm: saved.publicadoEm ?? null } : x)),
      );
      toast.success(saved.publicado ? 'Publicado' : 'Despublicado');
    } catch {
      toast.error('Erro');
    }
  }

  async function gerarComIA() {
    if (!iaTopico.trim()) {
      toast.error('Digite o tópico do artigo');
      return;
    }
    setGerandoIA(true);
    try {
      const res = await fetch('/api/blog/gerar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topico: iaTopico, cidadeAlvo: iaCidade }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'erro');
      const ia = await res.json();
      setEditing((prev) => ({
        ...(prev ?? {}),
        titulo: ia.titulo,
        resumo: ia.resumo,
        conteudoMd: ia.conteudoMd,
        metaTitle: ia.metaTitle,
        metaDescription: ia.metaDescription,
        tags: ia.tags,
        // Capa so eh setada se usuario ainda nao escolheu uma manualmente
        capaUrl: (prev?.capaUrl?.trim() ? prev.capaUrl : ia.capaUrl) ?? '',
      }));
      toast.success('Rascunho gerado — revise antes de publicar');
      setIaTopico('');
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao gerar');
    } finally {
      setGerandoIA(false);
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Blog"
        description="Conteúdo do seu site pra ranquear no Google. Cada artigo vira uma página em /s/{slug}/blog/{artigoSlug}."
        icon={FileText}
        actions={
          <button
            onClick={abrirNovo}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo artigo
          </button>
        }
      />

      {artigos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum artigo ainda"
          description="Comece criando um artigo. Você pode escrever do zero ou pedir pra IA gerar um rascunho a partir de um tópico."
          action={{
            label: 'Criar primeiro artigo',
            onClick: abrirNovo,
          }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {artigos.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
              {a.capaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.capaUrl} alt={a.titulo} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-muted/40 to-muted/10 grid place-items-center text-muted-foreground/40">
                  <FileText className="h-8 w-8" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2 flex-1">{a.titulo}</h3>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${
                      a.publicado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {a.publicado ? 'No ar' : 'Rascunho'}
                  </span>
                </div>
                {a.resumo && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.resumo}</p>}
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <button
                    onClick={() => abrirEditar(a)}
                    className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 hover:bg-muted"
                  >
                    <Edit3 className="h-3 w-3" /> Editar
                  </button>
                  <button
                    onClick={() => togglePublicado(a)}
                    className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 hover:bg-muted"
                  >
                    {a.publicado ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {a.publicado ? 'Despublicar' : 'Publicar'}
                  </button>
                  {a.publicado && (
                    <a
                      href={`/s/${slug}/blog/${a.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 hover:bg-muted"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver
                    </a>
                  )}
                  <button
                    onClick={() => deletar(a.id)}
                    className="ml-auto inline-flex items-center justify-center rounded border border-input p-1 text-red-600 hover:bg-red-50"
                    aria-label="Apagar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editor — padrao canonico: overlay scrolla + min-h-full pro flex
          centralizar quando cabe e crescer quando nao cabe. Sem max-h interno
          (evita clipar conteudo no topo quando modal eh maior que viewport). */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-3xl w-full my-4">
            <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                {(editing as Artigo).id ? 'Editar artigo' : 'Novo artigo'}
              </h2>
              <button onClick={fechar} className="rounded p-1 hover:bg-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* IA helper */}
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Gerar rascunho com IA
                </p>
                <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                  <input
                    placeholder='Ex: "Como financiar pelo MCMV em 2026"'
                    value={iaTopico}
                    onChange={(e) => setIaTopico(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <select
                    value={iaCidade}
                    onChange={(e) => setIaCidade(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Cidade (opcional)</option>
                    {cidades.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={gerarComIA}
                    disabled={gerandoIA}
                    className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {gerandoIA ? 'Gerando...' : 'Gerar'}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  A IA gera título + resumo + corpo + meta tags. Revise antes de publicar.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
                <input
                  value={editing.titulo ?? ''}
                  onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo (chamada)</label>
                <input
                  value={editing.resumo ?? ''}
                  onChange={(e) => setEditing({ ...editing, resumo: e.target.value })}
                  maxLength={200}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL da capa (https://...)</label>
                <input
                  value={editing.capaUrl ?? ''}
                  onChange={(e) => setEditing({ ...editing, capaUrl: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conteúdo (markdown — use ## pra subtítulo, ** pra negrito)
                </label>
                <textarea
                  value={editing.conteudoMd ?? ''}
                  onChange={(e) => setEditing({ ...editing, conteudoMd: e.target.value })}
                  rows={14}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed"
                />
              </div>

              <details className="rounded-md border border-input p-3">
                <summary className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">SEO avançado</summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Meta title (≤ 60 chars)</label>
                    <input
                      value={editing.metaTitle ?? ''}
                      onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })}
                      maxLength={70}
                      className="mt-0.5 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Meta description (≤ 160 chars)</label>
                    <input
                      value={editing.metaDescription ?? ''}
                      onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                      maxLength={200}
                      className="mt-0.5 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Tags (separadas por vírgula, máx 5)</label>
                    <input
                      value={(editing.tags ?? []).join(', ')}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5),
                        })
                      }
                      className="mt-0.5 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Autor</label>
                    <input
                      value={editing.autor ?? ''}
                      onChange={(e) => setEditing({ ...editing, autor: e.target.value })}
                      className="mt-0.5 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </details>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.publicado ?? false}
                  onChange={(e) => setEditing({ ...editing, publicado: e.target.checked })}
                />
                Publicar agora (vai aparecer em /s/{slug}/blog)
              </label>
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-5 py-3 flex items-center justify-end gap-2">
              <button onClick={fechar} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
