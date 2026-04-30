'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  Crown,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Plus,
  Settings,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { KpiCard } from '@/components/ui/kpi-card';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  type SiteConfig,
  type PageId,
  type SectionId,
  PAGE_CATALOG,
  SECTION_CATALOG,
} from '@/lib/site-config';

type Site = {
  slug: string;
  publicado: boolean;
  titulo: string | null;
  dominio: string | null;
  templateId: string;
  config: SiteConfig;
} | null;

type Marca = {
  nomeEmpresa: string | null;
  slogan: string | null;
  descricao: string | null;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
};

type Template = {
  id: string;
  nome: string;
  descricao: string;
  preview: string;
  vibe: string;
  ativo: boolean;
  premium?: boolean;
};

const TEMPLATES: Template[] = [
  {
    id: 'elegance',
    nome: 'Elegance',
    descricao:
      'Tipografia serif sofisticada. Aplica suas cores automaticamente.',
    preview: 'linear-gradient(135deg, #c5a64f 0%, #1a2e1a 100%)',
    vibe: 'Alto padrão · Boutique',
    ativo: true,
  },
  {
    id: 'cosmic',
    nome: 'Cosmic',
    descricao:
      'Dark mode moderno com gradientes vibrantes e animações suaves.',
    preview: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
    vibe: 'Lançamentos · Imóveis tech',
    ativo: false,
    premium: true,
  },
  {
    id: 'boutique',
    nome: 'Boutique',
    descricao:
      'Clean cream + tipografia delicada. Visual editorial sofisticado.',
    preview: 'linear-gradient(135deg, #f97316 0%, #fef3c7 100%)',
    vibe: 'Residencial · Famílias',
    ativo: false,
    premium: true,
  },
];

export default function SitesClient({
  site,
  marca,
  totalImoveis,
}: {
  site: Site;
  marca: Marca;
  totalImoveis: number;
}) {
  if (!site) return <CriarSiteWizard />;
  return <Editor site={site} marca={marca} totalImoveis={totalImoveis} />;
}

/* ---------- Editor principal ---------- */

function Editor({
  site,
  marca,
  totalImoveis,
}: {
  site: NonNullable<Site>;
  marca: Marca;
  totalImoveis: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [config, setConfig] = useState<SiteConfig>(site.config);
  const [pageActive, setPageActive] = useState<PageId>('inicio');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [publicado, setPublicado] = useState(site.publicado);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // força reload do iframe
  const [previewFullscreen, setPreviewFullscreen] = useState(false); // esconde sidebar de seções
  const [templateAtivo, setTemplateAtivo] = useState(site.templateId);
  const [trocandoTemplate, setTrocandoTemplate] = useState(false);

  // Refs pra autosave com debounce
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const initialMount = useRef(true);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://imobia.io';
  const url = `${origin}/s/${site.slug}`;
  // adiciona timestamp pra forçar reload do iframe sem cache
  const iframeUrl = `${url}?t=${iframeKey}`;

  // Autosave: sempre que `config` muda (toggle de página/seção),
  // espera 500ms e dispara save → reload iframe
  useEffect(() => {
    // Pula a primeira render (mount inicial)
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const r = await fetch('/api/sites/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: configRef.current,
            templateId: site.templateId,
          }),
        });
        if (!r.ok) throw new Error('Erro ao salvar');
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
        // Aguarda 200ms pro DB persistir e força reload do iframe
        setTimeout(() => setIframeKey(Date.now()), 200);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  function togglePagina(id: PageId) {
    setConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    }));
  }

  function toggleSection(pageId: PageId, secId: SectionId) {
    setConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId
          ? p
          : {
              ...p,
              sections: p.sections.map((s) =>
                s.id !== secId ? s : { ...s, enabled: !s.enabled },
              ),
            },
      ),
    }));
  }

  async function togglePublicado() {
    const novo = !publicado;
    setPublicado(novo);
    try {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: site.slug, publicado: novo }),
      });
      startTransition(() => router.refresh());
    } catch {
      setPublicado(!novo);
      toast.error('Erro ao alterar status do site');
    }
  }

  function copiarUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function selecionarTemplate(templateId: string) {
    if (templateId === templateAtivo) return;
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template?.premium) {
      const proceed = window.confirm(
        `${template.nome} ainda está em construção visual.\n\nVocê pode selecionar agora pra reservar — ele será aplicado quando ficar pronto. Por enquanto seu site continua usando o Elegance.\n\nContinuar?`,
      );
      if (!proceed) return;
    }
    setTrocandoTemplate(true);
    try {
      const r = await fetch('/api/sites/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, templateId }),
      });
      if (!r.ok) throw new Error('Erro ao trocar template');
      setTemplateAtivo(templateId);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      setTimeout(() => setIframeKey(Date.now()), 200);
    } catch (e) {
      toast.error('Erro ao trocar template', {
        description: (e as Error).message,
      });
    } finally {
      setTrocandoTemplate(false);
    }
  }

  const paginaAtual = config.pages.find((p) => p.id === pageActive);

  // dimensões do viewport pro iframe
  const previewSize =
    viewport === 'mobile'
      ? { w: 380, h: 800 }
      : { w: '100%' as const, h: 700 };

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Marketing"
        icon={Globe}
        title="Meu Site"
        description="Personalize páginas e seções. As mudanças aplicam automaticamente."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={url} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir site
            </Link>
          </Button>
        }
        compact
      />

      {/* KPIs simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          compact
          label="Status"
          value={publicado ? 'No ar' : 'Fora do ar'}
          icon={publicado ? Eye : EyeOff}
          accent={publicado ? 'green' : 'amber'}
        />
        <KpiCard
          compact
          label="Imóveis publicados"
          value={String(totalImoveis)}
          icon={ImageIcon}
          accent="primary"
        />
        <KpiCard
          compact
          label="Template ativo"
          value="Elegance"
          icon={Palette}
          accent="violet"
        />
        <KpiCard
          compact
          label="URL"
          value={`/s/${site.slug}`}
          icon={Globe}
          accent="blue"
          mono
        />
      </div>

      {/* Editor 3 colunas */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Toolbar do editor */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className={cn(
                'text-[10px] uppercase tracking-wider',
                publicado
                  ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
              )}
            >
              {publicado ? 'Publicado' : 'Rascunho'}
            </Badge>
            <button
              onClick={copiarUrl}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono"
              title="Copiar URL"
            >
              <Globe className="h-3.5 w-3.5" />
              {url}
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Viewport toggle */}
            <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
              <button
                onClick={() => setViewport('desktop')}
                className={cn(
                  'h-8 px-2.5 rounded text-xs flex items-center gap-1.5 transition-colors',
                  viewport === 'desktop'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={cn(
                  'h-8 px-2.5 rounded text-xs flex items-center gap-1.5 transition-colors',
                  viewport === 'mobile'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-input bg-background">
              <span className="text-xs text-muted-foreground">No ar</span>
              <Switch
                checked={publicado}
                onCheckedChange={togglePublicado}
                aria-label="Publicar"
              />
            </div>

            {/* Indicador de autosave */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px]">
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando</span>
                </>
              ) : savedFlash ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">
                    Salvo
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span>Sincronizado</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs de páginas (horizontal, em vez de sidebar) */}
        <div className="border-b border-border bg-card overflow-x-auto">
          <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
            {config.pages.map((p) => {
              const meta = PAGE_CATALOG.find((x) => x.id === p.id);
              if (!meta) return null;
              const active = pageActive === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPageActive(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    !p.enabled && 'opacity-50',
                  )}
                  title={meta.description}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {!p.enabled && <EyeOff className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout: sidebar fina (Seções) + Preview ocupando o resto */}
        <div
          className={cn(
            'grid min-h-[700px]',
            previewFullscreen
              ? 'grid-cols-1'
              : 'grid-cols-1 lg:grid-cols-[280px_1fr]',
          )}
        >
          {/* Coluna Seções (esconde quando fullscreen) */}
          {!previewFullscreen && (
            <div className="border-b lg:border-b-0 lg:border-r border-border bg-muted/20 flex flex-col">
              {paginaAtual && (
                <>
                  {/* Toggle da página inteira */}
                  <div className="px-3 py-2.5 border-b border-border bg-card flex items-center justify-between sticky top-0 z-10">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {PAGE_CATALOG.find((p) => p.id === paginaAtual.id)?.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {paginaAtual.enabled
                          ? 'Visível no menu'
                          : 'Escondida'}
                      </p>
                    </div>
                    <Switch
                      checked={paginaAtual.enabled}
                      disabled={
                        PAGE_CATALOG.find((p) => p.id === paginaAtual.id)?.fixed
                      }
                      onCheckedChange={() => togglePagina(paginaAtual.id)}
                      aria-label="Ativar página"
                    />
                  </div>

                  <div className="p-2 space-y-1 overflow-y-auto flex-1">
                    {paginaAtual.sections.map((sec) => {
                      const meta = SECTION_CATALOG[sec.id];
                      if (!meta) return null;
                      return (
                        <div
                          key={sec.id}
                          className={cn(
                            'flex items-start gap-2 p-2.5 rounded-md border transition-colors',
                            sec.enabled
                              ? 'border-border bg-card'
                              : 'border-dashed border-border/60 bg-muted/30',
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-xs font-semibold truncate',
                                sec.enabled
                                  ? 'text-foreground'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {meta.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                              {meta.description}
                            </p>
                          </div>
                          <Switch
                            checked={sec.enabled}
                            onCheckedChange={() =>
                              toggleSection(paginaAtual.id, sec.id)
                            }
                            aria-label={`Ativar ${meta.label}`}
                            disabled={!paginaAtual.enabled}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-3 py-2 text-[10px] text-muted-foreground/70 border-t border-border">
                    Reordenar e adicionar seções chega em breve.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preview — agora MAIOR */}
          <div className="bg-muted/40 p-3 lg:p-5 flex flex-col items-center justify-start overflow-auto relative">
            {/* Botão Tela cheia (canto sup direito do preview) */}
            <button
              onClick={() => setPreviewFullscreen((v) => !v)}
              className="absolute top-3 right-3 z-10 h-8 px-2.5 rounded-md bg-card border border-border hover:bg-muted text-xs flex items-center gap-1.5 shadow-sm"
              title={
                previewFullscreen
                  ? 'Mostrar painel de seções'
                  : 'Tela cheia (esconder seções)'
              }
            >
              {previewFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sair tela cheia</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tela cheia</span>
                </>
              )}
            </button>

            <div
              className="rounded-md overflow-hidden shadow-md border border-border bg-white w-full"
              style={{
                maxWidth: viewport === 'mobile' ? 380 : '100%',
                height: 760,
              }}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/40">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {url}
                </span>
              </div>
              <iframe
                key={iframeKey}
                src={iframeUrl}
                title="Preview"
                className="w-full bg-white"
                style={{ height: 'calc(100% - 32px)', border: 0 }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-3 text-center">
              ⓘ Toggles atualizam o preview em ~1 segundo.
            </p>
          </div>
        </div>
      </div>

      {/* Brand kit + templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Brand kit */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">
              Identidade aplicada
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 items-start">
            <div
              className="h-20 w-20 rounded-md flex items-center justify-center shadow-inner overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})`,
              }}
            >
              {marca.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={marca.logoUrl}
                  alt=""
                  className="h-12 max-w-[64px] object-contain"
                />
              ) : (
                <Sparkles className="h-7 w-7 text-white/80" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-display text-base font-semibold text-foreground truncate">
                {marca.nomeEmpresa ?? 'Imobiliária sem nome'}
              </p>
              {marca.slogan && (
                <p className="text-sm text-muted-foreground italic truncate">
                  &ldquo;{marca.slogan}&rdquo;
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <ColorChip color={marca.corPrimaria} label="Primária" />
                <ColorChip color={marca.corSecundaria} label="Secundária" />
              </div>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full mt-4"
          >
            <Link href="/configuracoes">
              <Settings className="h-3 w-3 mr-2" />
              Editar marca em Configurações
            </Link>
          </Button>
        </div>

        {/* Templates */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">
              Template visual
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Suas cores e logo são aplicadas automaticamente em qualquer
            template. Click pra selecionar.
          </p>
          {trocandoTemplate && (
            <p className="text-xs text-primary mb-3 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Trocando template...
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selecionado={templateAtivo === t.id}
                onSelect={() => selecionarTemplate(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Wizard inicial ---------- */

function CriarSiteWizard() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function criar() {
    if (!slug.trim()) {
      setError('Digite um endereço pra seu site');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, publicado: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao criar');
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://imobia.io';

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 grid place-items-center text-primary mx-auto">
          <Globe className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Crie o site da sua imobiliária
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Vitrine pública pronta em menos de 1 minuto. Cores e logo da sua
          marca aplicados automaticamente.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">
            Escolha o endereço (URL) do seu site
          </label>
          <div className="flex flex-1 items-center rounded-md border border-input overflow-hidden bg-background">
            <span className="px-3 py-2.5 text-sm text-muted-foreground bg-muted/50 border-r border-input font-mono">
              {origin}/s/
            </span>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                );
                setError(null);
              }}
              className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none font-mono"
              placeholder="sua-imobiliaria"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Apenas letras minúsculas, números e hífen.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button onClick={criar} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando seu site...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Criar meu site agora
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function TemplateCard({
  template,
  onSelect,
  selecionado,
}: {
  template: Template;
  onSelect: () => void;
  selecionado: boolean;
}) {
  const mock = TEMPLATE_MOCKS[template.id] ?? TEMPLATE_MOCKS.elegance;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full text-left rounded-xl border-2 overflow-hidden transition-all',
        selecionado
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:shadow-md',
      )}
    >
      {/* Mockup visual do template — mais rico */}
      <div
        className="relative aspect-[5/3] overflow-hidden"
        style={{ background: mock.bg, color: mock.fg }}
      >
        {/* Header */}
        <div
          className="absolute top-0 left-0 right-0 px-3 py-2 flex items-center justify-between text-[8px] font-semibold border-b"
          style={{ borderColor: `${mock.fg}1f` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full grid place-items-center text-[6px] font-bold"
              style={{ background: mock.accent, color: mock.accentFg }}
            >
              ★
            </span>
            <span style={{ fontFamily: mock.fontDisplay }}>
              {mock.logoText}
            </span>
          </div>
          <span className="opacity-50 text-[7px]">
            Início · Imóveis · Sobre
          </span>
        </div>

        {/* Hero — 60% da altura */}
        <div className="absolute top-[14%] left-0 right-0 bottom-[40%] flex flex-col items-center justify-center px-3">
          <p
            className="text-center leading-[1.05]"
            style={{
              fontFamily: mock.fontDisplay,
              fontSize: 16,
              fontWeight: 300,
              maxWidth: '95%',
            }}
          >
            {mock.slogan.split(' ').slice(0, -1).join(' ')}{' '}
            <span style={{ color: mock.accent, fontStyle: 'italic' }}>
              {mock.slogan.split(' ').slice(-1)}
            </span>
          </p>
        </div>

        {/* Card de busca encavalado */}
        <div
          className="absolute left-[10%] right-[10%] bottom-[18%] rounded px-2 py-1.5 flex flex-col gap-1"
          style={{
            background: mock.cardBg,
            color: mock.cardFg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}
        >
          <span
            className="text-[6px] font-semibold opacity-70"
            style={{ fontFamily: mock.fontDisplay }}
          >
            Buscar imóveis
          </span>
          <div className="flex gap-1">
            <span
              className="flex-1 px-1 py-0.5 rounded text-[6px]"
              style={{ background: mock.muted }}
            >
              Tipo
            </span>
            <span
              className="flex-1 px-1 py-0.5 rounded text-[6px]"
              style={{ background: mock.muted }}
            >
              Bairro
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[6px] font-bold"
              style={{ background: mock.accent, color: mock.accentFg }}
            >
              ⌕
            </span>
          </div>
        </div>

        {/* Mini-cards de imóveis embaixo */}
        <div className="absolute left-3 right-3 bottom-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-4 rounded"
              style={{
                background: `${mock.fg}14`,
                border: `1px solid ${mock.fg}22`,
              }}
            />
          ))}
        </div>

        {/* Badge canto sup direito */}
        <div className="absolute top-2 right-2 flex gap-1">
          {selecionado && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1 shadow">
              <Check className="h-2.5 w-2.5" />
              Selecionado
            </span>
          )}
          {template.premium && !selecionado && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-amber-500 text-amber-950 inline-flex items-center gap-1 shadow">
              <Crown className="h-2.5 w-2.5" />
              Pro
            </span>
          )}
        </div>

        {/* Overlay no hover */}
        <div
          className={cn(
            'absolute inset-0 grid place-items-center transition-opacity',
            selecionado
              ? 'opacity-0'
              : 'opacity-0 group-hover:opacity-100 bg-black/30',
          )}
        >
          <span className="text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded bg-black/70 inline-flex items-center gap-1.5">
            <Check className="h-3 w-3" />
            Selecionar
          </span>
        </div>
      </div>

      {/* Info embaixo */}
      <div className="p-3.5 bg-card">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-display text-base font-semibold">{template.nome}</p>
          {template.premium && (
            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug mb-2">
          {template.descricao}
        </p>
        <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">
          {template.vibe}
        </p>
      </div>
    </button>
  );
}

/* Mockups visuais dos templates pra preview */
const TEMPLATE_MOCKS: Record<
  string,
  {
    bg: string;
    fg: string;
    cardBg: string;
    cardFg: string;
    muted: string;
    accent: string;
    accentFg: string;
    fontDisplay: string;
    logoText: string;
    slogan: string;
  }
> = {
  elegance: {
    bg: '#1a2e1a',
    fg: '#faf8f3',
    cardBg: '#faf8f3',
    cardFg: '#1a2e1a',
    muted: '#e5e1d4',
    accent: '#c5a64f',
    accentFg: '#fff',
    fontDisplay: '"Cormorant Garamond", serif',
    logoText: 'IMOBILIÁRIA',
    slogan: 'Encontre o imóvel ideal',
  },
  cosmic: {
    bg: 'linear-gradient(135deg, #0f0a1f 0%, #1e0a3c 100%)',
    fg: '#e9e3ff',
    cardBg: 'rgba(255,255,255,0.08)',
    cardFg: '#e9e3ff',
    muted: 'rgba(255,255,255,0.12)',
    accent: '#a78bfa',
    accentFg: '#0f0a1f',
    fontDisplay: '"Inter", sans-serif',
    logoText: 'COSMIC',
    slogan: 'Imóveis do futuro, hoje',
  },
  boutique: {
    bg: '#fff8f0',
    fg: '#3a2a1f',
    cardBg: '#fff',
    cardFg: '#3a2a1f',
    muted: '#f4e8d8',
    accent: '#c97362',
    accentFg: '#fff',
    fontDisplay: '"Playfair Display", serif',
    logoText: 'Boutique',
    slogan: 'Lares com personalidade',
  },
};

function ColorChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-4 w-4 rounded border border-border shrink-0"
        style={{ background: color }}
      />
      <span className="text-[11px] text-muted-foreground">
        {label} <span className="font-mono text-foreground/60">{color}</span>
      </span>
    </div>
  );
}

// KpiCard agora vem de @/components/ui/kpi-card
