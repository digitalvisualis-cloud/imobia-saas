'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ImageIcon, ImageOff, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PostPreview } from '@/components/conteudo/PostPreview';
import { GerarPostModal } from '@/components/conteudo/GerarPostModal';
import { toast } from '@/lib/toast';
import type {
  ImovelLite,
  PostLite,
  Customizacao,
} from '@/components/conteudo/types';
import { ratioFromFormato } from '@/components/conteudo/types';

export default function ConteudoClient(props: {
  imoveis: ImovelLite[];
  posts: PostLite[];
  customizacao: Customizacao;
}) {
  const { imoveis, customizacao } = props;
  const [pickerOpen, setPickerOpen] = useState(false);
  // posts em estado local — remove da grid na hora apos DELETE
  const [posts, setPosts] = useState<PostLite[]>(props.posts);
  const [apagandoId, setApagandoId] = useState<string | null>(null);

  async function apagarPost(id: string) {
    if (!confirm('Apagar este post? Essa ação não pode ser desfeita.')) return;
    try {
      setApagandoId(id);
      const res = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Post apagado');
    } catch {
      toast.error('Não consegui apagar o post');
    } finally {
      setApagandoId(null);
    }
  }

  const grupos = useMemo(() => {
    const byImovel = new Map<string, PostLite[]>();
    for (const p of posts) {
      const list = byImovel.get(p.imovelId) ?? [];
      list.push(p);
      byImovel.set(p.imovelId, list);
    }
    return imoveis
      .map((imv) => ({ imovel: imv, posts: byImovel.get(imv.id) ?? [] }))
      .filter((g) => g.posts.length > 0);
  }, [imoveis, posts]);

  const empty = grupos.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Marketing"
        icon={Sparkles}
        title="Criador de Posts"
        description="Posts gerados pela IA, organizados por imóvel da tua carteira."
        actions={
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" /> Gerar novo post
          </button>
        }
      />

      {empty && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-12 text-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold">Nenhum post ainda</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Clica em "Gerar novo post" pra criar a primeira peça com IA a partir de um
            imóvel da tua carteira.
          </p>
          <Button
            onClick={() => setPickerOpen(true)}
            className="mt-2 bg-primary text-primary-foreground"
            disabled={imoveis.length === 0}
          >
            {imoveis.length === 0 ? 'Cadastra um imóvel primeiro' : 'Gerar primeiro post'}
          </Button>
          {imoveis.length === 0 && (
            <Button asChild variant="outline" className="mt-1">
              <Link href="/imoveis/novo">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar imóvel
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="space-y-10">
        {grupos.map(({ imovel, posts }) => (
          <ImovelGroup
            key={imovel.id}
            imovel={imovel}
            posts={posts}
            customizacao={customizacao}
            onApagar={apagarPost}
            apagandoId={apagandoId}
          />
        ))}
      </div>

      <GerarPostModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        imoveis={imoveis}
        customizacao={customizacao}
      />
    </div>
  );
}

function ImovelGroup({
  imovel,
  posts,
  customizacao,
  onApagar,
  apagandoId,
}: {
  imovel: ImovelLite;
  posts: PostLite[];
  customizacao: Customizacao;
  onApagar: (id: string) => void;
  apagandoId: string | null;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {imovel.capaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imovel.capaUrl}
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-md bg-muted text-muted-foreground/50">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase text-muted-foreground">
              {imovel.codigo}
            </div>
            <h2 className="truncate font-display text-lg font-bold leading-tight">
              {imovel.titulo}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
              {' · '}
              <span className="font-semibold text-foreground">{posts.length}</span>{' '}
              {posts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
        <Link
          href={`/conteudo/imovel/${imovel.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          Abrir Media Kit <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {posts.map((p) => (
          <div key={p.id} className="group relative">
            <Link
              href={`/conteudo/imovel/${imovel.id}`}
              className="flex items-center justify-center overflow-hidden rounded-lg bg-muted/30 p-3 transition-transform hover:-translate-y-0.5"
            >
              <PostPreview
                imovel={imovel}
                variant={p.template}
                scale={0.5}
                custom={customizacao}
                ratio={ratioFromFormato(p.formato)}
              />
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onApagar(p.id);
              }}
              disabled={apagandoId === p.id}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-red-600 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100 disabled:opacity-60"
              aria-label="Apagar post"
            >
              {apagandoId === p.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
