'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ImageIcon, X, ImageOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

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

type PostLite = {
  id: string;
  imovelId: string;
  tipo: string;
  imageUrl: string | null;
  createdAt: string;
};

const TIPO_TAG: Record<string, string> = {
  INSTAGRAM_FEED: 'Feed',
  INSTAGRAM_STORIES: 'Story',
  WHATSAPP: 'WhatsApp',
  FICHA_PDF: 'PDF',
};

export default function ConteudoClient({
  imoveis,
  posts,
}: {
  imoveis: ImovelLite[];
  posts: PostLite[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Agrupa posts por imovel; só mostra imóveis que têm post.
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
            Clica em "Gerar novo post" pra criar a primeira peça com IA a partir de
            um imóvel da tua carteira.
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
          <ImovelGroup key={imovel.id} imovel={imovel} posts={posts} />
        ))}
      </div>

      {pickerOpen && (
        <ImovelPickerModal
          imoveis={imoveis}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ImovelGroup({
  imovel,
  posts,
}: {
  imovel: ImovelLite;
  posts: PostLite[];
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
          <Link
            key={p.id}
            href={`/conteudo/imovel/${imovel.id}`}
            className="group relative block aspect-square overflow-hidden rounded-lg bg-muted/30 transition-transform hover:-translate-y-0.5"
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : imovel.capaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imovel.capaUrl}
                alt=""
                className="h-full w-full object-cover opacity-90 transition-transform group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                <ImageOff className="h-8 w-8" />
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
              {TIPO_TAG[p.tipo] ?? p.tipo}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ImovelPickerModal({
  imoveis,
  onClose,
}: {
  imoveis: ImovelLite[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Escolha um imóvel</h2>
            <p className="text-xs text-muted-foreground">
              Vai abrir o Media Kit pra você gerar posts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {imoveis.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não cadastrou nenhum imóvel.
              </p>
              <Button asChild>
                <Link href="/imoveis/novo">
                  <Plus className="h-4 w-4 mr-2" /> Cadastrar imóvel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {imoveis.map((i) => (
                <Link
                  key={i.id}
                  href={`/conteudo/imovel/${i.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {i.capaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.capaUrl}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-md bg-muted text-muted-foreground/50">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">
                      {i.codigo}
                    </div>
                    <div className="truncate text-sm font-semibold">{i.titulo}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[i.bairro, i.cidade].filter(Boolean).join(' · ')}
                      {i.postsCount > 0 && (
                        <>
                          {' · '}
                          <span className="text-primary">
                            {i.postsCount} {i.postsCount === 1 ? 'post' : 'posts'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
