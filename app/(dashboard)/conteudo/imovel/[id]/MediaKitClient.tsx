'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Sparkles,
  ImageIcon,
  Paintbrush,
  Type,
  X,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { PostPreview } from '@/components/conteudo/PostPreview';
import { CarrosselPreview } from '@/components/conteudo/CarrosselPreview';
import { GerarPostModal } from '@/components/conteudo/GerarPostModal';
import type { ImovelLite, PostLite, Customizacao } from '@/components/conteudo/types';
import { FORMATOS } from '@/components/conteudo/types';

type CustomTab = 'logo' | 'cor-principal' | 'cor-texto' | 'fonte' | null;

const PALETA = [
  '#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#EA580C',
  '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981',
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899',
  '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6',
  '#1E40AF', '#1E3A8A', '#172554', '#0F172A', '#020617',
  '#717BBC', '#5B6CCC', '#4F46E5', '#4338CA', '#3730A3',
];

const FONTES = ['Inter', 'Playfair Display', 'Poppins', 'Manrope', 'DM Serif Display', 'Space Grotesk'];

// URL Google Fonts pra carregar todas as fontes do picker de uma vez.
// O <link> é injetado no head no mount do componente.
const FONTES_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Inter:wght@400;500;600;700;800',
    'family=Playfair+Display:wght@400;500;600;700;800',
    'family=Poppins:wght@400;500;600;700;800',
    'family=Manrope:wght@400;500;600;700;800',
    'family=DM+Serif+Display',
    'family=Space+Grotesk:wght@400;500;600;700',
  ].join('&') +
  '&display=swap';

interface MarcaInicial {
  logoUrl: string | null;
  corPrimaria: string;
  corTexto: string;
  fonte: string;
}

export default function MediaKitClient({
  imovel,
  marca,
  postsExistentes,
  allImoveis,
}: {
  imovel: ImovelLite;
  marca: MarcaInicial;
  postsExistentes: PostLite[];
  allImoveis: ImovelLite[];
}) {
  const [openGerar, setOpenGerar] = useState(false);
  const [tab, setTab] = useState<CustomTab>(null);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Carrega Google Fonts das opcoes do picker no head
  useEffect(() => {
    const id = 'media-kit-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = FONTES_GOOGLE_URL;
    document.head.appendChild(link);
  }, []);

  const [custom, setCustom] = useState<Customizacao>({
    corPrincipal: marca.corPrimaria,
    corTexto: marca.corTexto,
    fonte: marca.fonte,
    logoUrl: marca.logoUrl,
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const setCorPrincipal = (v: string) => setCustom((c) => ({ ...c, corPrincipal: v }));
  const setCorTexto = (v: string) => setCustom((c) => ({ ...c, corTexto: v }));
  const setFonte = (v: string) => setCustom((c) => ({ ...c, fonte: v }));

  // Persiste cor primaria + fonte + logo no tenant.marca com debounce.
  // corTexto fica local — nao tem campo proprio em ConfigMarca ainda.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/configuracoes/marca', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            corPrimaria: custom.corPrincipal,
            fonteTitulo: custom.fonte,
            // logoUrl: omitido aqui — upload usa endpoint proprio
          }),
        });
        if (!res.ok) throw new Error('save failed');
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1500);
      } catch {
        setSaveState('error');
      }
    }, 700);
    return () => clearTimeout(t);
  }, [custom.corPrincipal, custom.fonte]);

  async function baixarPost(post: PostLite) {
    const node = previewRefs.current[post.id];
    if (!node) return;
    const baseName = `${imovel.codigo}-${post.template}`;

    try {
      setBaixandoId(post.id);

      if (post.carrossel) {
        // CarrosselPreview renderiza N slides com snap-start. Captura cada
        // slide separadamente e baixa um PNG por slide.
        const slides = node.querySelectorAll<HTMLElement>('.snap-start');
        if (slides.length === 0) throw new Error('Slides nao encontrados');
        for (let i = 0; i < slides.length; i++) {
          const canvas = await html2canvas(slides[i], {
            scale: 3,
            backgroundColor: null,
            useCORS: true,
          });
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${baseName}-slide-${String(i + 1).padStart(2, '0')}.png`;
          link.href = dataUrl;
          link.click();
          // Pequeno delay entre downloads pro browser nao engasgar
          await new Promise((r) => setTimeout(r, 150));
        }
        toast.success(`${slides.length} slides baixados`);
      } else {
        const canvas = await html2canvas(node, {
          scale: 3,
          backgroundColor: null,
          useCORS: true,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${baseName}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('PNG baixado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Não consegui gerar o PNG');
    } finally {
      setBaixandoId(null);
    }
  }

  const TABS: { id: NonNullable<CustomTab>; label: string; icon: React.ElementType }[] = [
    { id: 'logo', label: 'Logo', icon: ImageIcon },
    { id: 'cor-principal', label: 'Cor do post', icon: Paintbrush },
    { id: 'cor-texto', label: 'Cor de texto', icon: Type },
    { id: 'fonte', label: 'Fonte', icon: Type },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <Link
          href="/conteudo"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar pro Criador de Posts
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {imovel.titulo}
        </h1>
        <p className="text-sm text-muted-foreground">
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
          {imovel.estado && ` / ${imovel.estado}`} · Cód {imovel.codigo}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenGerar(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" /> Gerar novo post
            <span className="rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">IA</span>
          </button>
          <span className="text-sm text-muted-foreground">
            {postsExistentes.length} {postsExistentes.length === 1 ? 'post' : 'posts'}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-fit flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(active ? null : t.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
        {saveState !== 'idle' && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
              saveState === 'saving' && 'bg-muted text-muted-foreground',
              saveState === 'saved' && 'bg-emerald-50 text-emerald-700',
              saveState === 'error' && 'bg-red-50 text-red-700',
            )}
          >
            {saveState === 'saving' && (<><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</>)}
            {saveState === 'saved' && (<><Check className="h-3 w-3" /> Salvo no brand kit</>)}
            {saveState === 'error' && 'Erro ao salvar'}
          </span>
        )}
      </div>

      {/* Side panel + posts grid */}
      <div className={cn('grid gap-6', tab ? 'lg:grid-cols-[280px_1fr]' : 'grid-cols-1')}>
        {tab && (
          <aside className="h-fit rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 font-display text-base font-bold">
                {tab === 'logo' && (<><ImageIcon className="h-4 w-4" /> Logo</>)}
                {tab === 'cor-principal' && (<><Paintbrush className="h-4 w-4" /> Cor do post</>)}
                {tab === 'cor-texto' && (<><Type className="h-4 w-4" /> Cor de texto</>)}
                {tab === 'fonte' && (<><Type className="h-4 w-4" /> Fonte</>)}
              </h3>
              <button
                onClick={() => setTab(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {tab === 'logo' && (
              <div className="space-y-3">
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-input bg-muted/30 text-xs text-muted-foreground">
                  {custom.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={custom.logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    'Sem logo'
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure o logo da sua marca em{' '}
                  <Link href="/configuracoes" className="text-primary hover:underline">
                    Configurações
                  </Link>
                  . Aparecerá em alguns templates.
                </p>
              </div>
            )}

            {(tab === 'cor-principal' || tab === 'cor-texto') && (
              <ColorPicker
                value={tab === 'cor-principal' ? custom.corPrincipal : custom.corTexto}
                onChange={(v) =>
                  tab === 'cor-principal' ? setCorPrincipal(v) : setCorTexto(v)
                }
              />
            )}

            {tab === 'fonte' && (
              <div className="space-y-2">
                {FONTES.map((f) => {
                  const active = custom.fonte === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFonte(f)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-input bg-background hover:bg-muted',
                      )}
                      style={{ fontFamily: f }}
                    >
                      <span>{f}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* Posts grid */}
        <section>
          {postsExistentes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-12 text-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">Nenhum post ainda</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Clica em "Gerar novo post" pra criar tua primeira peça com IA.
              </p>
              <button
                onClick={() => setOpenGerar(true)}
                className="mt-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Gerar novo post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {postsExistentes.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="relative flex items-center justify-center bg-muted/30 p-6">
                    <div ref={(el) => { previewRefs.current[p.id] = el; }}>
                      {p.carrossel ? (
                        <CarrosselPreview
                          imovel={imovel}
                          variant={p.template}
                          scale={0.75}
                          custom={custom}
                        />
                      ) : (
                        <PostPreview
                          imovel={imovel}
                          variant={p.template}
                          scale={0.75}
                          custom={custom}
                          ratio={p.formato.includes('story') ? '9/16' : '1/1'}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => baixarPost(p)}
                      disabled={baixandoId === p.id}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/90 shadow-sm hover:bg-background disabled:opacity-60"
                      aria-label="Baixar"
                    >
                      {baixandoId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 border-t border-border p-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
                      <span>{getFormatoLabel(p.formato)}</span>
                      <span>·</span>
                      <span>{p.template}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-foreground/80">{p.legenda}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(p.legenda);
                        toast.success('Texto copiado');
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copiar texto
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <GerarPostModal
        open={openGerar}
        onClose={() => setOpenGerar(false)}
        imoveis={allImoveis}
        imovelIdProp={imovel.id}
        customizacao={custom}
      />
    </div>
  );
}

function getFormatoLabel(id: string) {
  return FORMATOS.find((f) => f.id === id)?.nome ?? id;
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border border-input bg-background p-1.5">
        <span
          className="h-7 w-7 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          Cores padrões
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PALETA.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                'h-8 w-8 rounded-md border transition-transform hover:scale-110',
                value.toLowerCase() === c.toLowerCase()
                  ? 'border-foreground ring-2 ring-primary/40'
                  : 'border-border',
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
