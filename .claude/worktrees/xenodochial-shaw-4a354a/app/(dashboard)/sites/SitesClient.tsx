'use client';

import { useState, useTransition } from 'react';
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
  Save,
  Monitor,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    descricao: 'Tema gold + forest com tipografia serif. Sofisticado.',
    preview: 'linear-gradient(135deg, #c5a64f 0%, #1a2e1a 100%)',
    vibe: 'Alto padrão · Boutique',
    ativo: true,
  },
  {
    id: 'cosmic',
    nome: 'Cosmic',
    descricao: 'Tema dark moderno com gradientes vibrantes.',
    preview: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
    vibe: 'Lançamentos · Tech',
    ativo: false,
    premium: true,
  },
  {
    id: 'boutique',
    nome: 'Boutique',
    descricao: 'Tema clean rose + cream com tipografia delicada.',
    preview: 'linear-gradient(135deg, #f97316 0%, #fef3c7 100%)',
    vibe: 'Residencial · Família',
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
  const [dirty, setDirty] = useState(false);
  const [publicado, setPublicado] = useState(site.publicado);
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://imobia.io';
  const url = `${origin}/s/${site.slug}`;

  function togglePagina(id: PageId) {
    setConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    }));
    setDirty(true);
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
    setDirty(true);
  }

  async function salvar() {
    setSaving(true);
    try {
      const r = await fetch('/api/sites/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, templateId: site.templateId }),
      });
      if (!r.ok) throw new Error('Erro ao salvar');
      setSavedFlash(true);
      setDirty(false);
      setTimeout(() => setSavedFlash(false), 2200);
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
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
      alert('Erro ao alterar status');
    }
  }

  function copiarUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const paginaAtual = config.pages.find((p) => p.id === pageActive);

  // dimensões do viewport pro iframe
  const previewSize =
    viewport === 'mobile'
      ? { w: 380, h: 800 }
      : { w: '100%' as const, h: 700 };

  return (
    <div className="space-y-4">
      {/* Header de gestão (não é parte do editor — fica no topo da rota /sites) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Meu Site
          </h1>
          <p className="text-sm text-muted-foreground">
            Personalize páginas e seções. Mudanças entram no ar quando você clica
            em <span className="font-semibold">Salvar</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={url} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir site
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Status"
          value={publicado ? 'No ar' : 'Fora do ar'}
          icon={publicado ? Eye : EyeOff}
          accent={publicado ? 'green' : 'amber'}
        />
        <KpiCard
          label="Imóveis publicados"
          value={String(totalImoveis)}
          icon={ImageIcon}
          accent="primary"
        />
        <KpiCard
          label="Template ativo"
          value="Elegance"
          icon={Palette}
          accent="violet"
        />
        <KpiCard
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

            {/* Salvar */}
            <Button
              onClick={salvar}
              disabled={saving || !dirty}
              size="sm"
              className="min-w-[100px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando
                </>
              ) : savedFlash ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvo
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_280px_1fr] min-h-[700px]">
          {/* Coluna 1 — Páginas */}
          <div className="border-b lg:border-b-0 lg:border-r border-border">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Páginas
              </p>
            </div>
            <div className="p-2 space-y-0.5">
              {config.pages.map((p) => {
                const meta = PAGE_CATALOG.find((x) => x.id === p.id);
                if (!meta) return null;
                const active = pageActive === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPageActive(p.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors text-left',
                      active
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    <span className="text-base">{meta.icon}</span>
                    <span className="flex-1 truncate text-xs">
                      {meta.label}
                    </span>
                    {!p.enabled && (
                      <EyeOff className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-2 pb-3 pt-2 border-t border-border mt-2">
              <p className="text-[10px] text-muted-foreground/70 px-2 mb-2">
                Adicionar página customizada chega na próxima entrega.
              </p>
            </div>
          </div>

          {/* Coluna 2 — Seções da página atual */}
          <div className="border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {paginaAtual
                  ? PAGE_CATALOG.find((p) => p.id === paginaAtual.id)?.label
                  : 'Seções'}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Liga e desliga as seções da página
              </p>
            </div>

            {paginaAtual && (
              <>
                {/* Toggle da página inteira */}
                <div className="px-3 py-2.5 border-b border-border bg-card flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Página ativa</p>
                    <p className="text-[10px] text-muted-foreground">
                      {paginaAtual.enabled
                        ? 'Visível no menu'
                        : 'Escondida do menu'}
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

                <div className="p-2 space-y-1">
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

                <div className="px-3 pb-3 pt-1 text-[10px] text-muted-foreground/70">
                  Adicionar / reordenar seções chega na próxima entrega.
                </div>
              </>
            )}
          </div>

          {/* Coluna 3 — Preview */}
          <div className="bg-muted/40 p-4 flex flex-col items-center justify-start overflow-auto">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Preview ao vivo · {viewport === 'mobile' ? 'mobile' : 'desktop'}
            </div>
            <div
              className="rounded-md overflow-hidden shadow-md border border-border bg-white"
              style={{
                width: previewSize.w,
                maxWidth: '100%',
                height: previewSize.h,
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
                src={url}
                title="Preview"
                className="w-full bg-white"
                style={{ height: 'calc(100% - 32px)', border: 0 }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-3 text-center max-w-md">
              ⓘ As mudanças nas seções aplicam no site público depois que você
              clicar em <span className="font-semibold">Salvar</span>.
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
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">
              Template visual
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Estilo visual do site. Conteúdo e configurações são preservados ao
            trocar.
          </p>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <TemplateCard key={t.id} template={t} />
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

function TemplateCard({ template }: { template: Template }) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 flex items-center gap-3 transition-colors',
        template.ativo
          ? 'border-primary bg-primary/5'
          : 'border-border opacity-75',
      )}
    >
      <div
        className="h-10 w-14 shrink-0 rounded-md"
        style={{ background: template.preview }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{template.nome}</p>
          {template.ativo && (
            <Badge className="bg-primary text-primary-foreground text-[9px] uppercase tracking-wider">
              Ativo
            </Badge>
          )}
          {template.premium && !template.ativo && (
            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
              <Crown className="h-2.5 w-2.5 mr-1 text-amber-500" />
              Pro
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {template.vibe}
        </p>
      </div>
      {template.ativo ? (
        <Check className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <span className="text-[10px] text-muted-foreground">Em breve</span>
      )}
    </div>
  );
}

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

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  mono,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: 'primary' | 'green' | 'amber' | 'violet' | 'blue';
  mono?: boolean;
}) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'h-6 w-6 rounded-md grid place-items-center',
            colors[accent],
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <p
        className={cn(
          'mt-1.5 font-semibold text-base text-foreground truncate',
          mono && 'font-mono text-sm',
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
