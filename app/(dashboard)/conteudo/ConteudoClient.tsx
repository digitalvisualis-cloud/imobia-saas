'use client';

import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Download, Save, Loader2, ArrowLeft, Library } from 'lucide-react';
import { CanvasPreview } from '@/app/_post-templates/lovable/CanvasPreview';
import { ExportStage, type ExportStageHandle } from '@/app/_post-templates/lovable/ExportStage';
import { TEMPLATES } from '@/app/_post-templates/lovable/templates/registry';
import {
  PALETTES,
  FONT_PAIRS,
  DEFAULT_PALETTE,
  DEFAULT_FONT_PAIR,
} from '@/app/_post-templates/lovable/templates/tokens';
import { FORMATO_LIST, FORMATOS } from '@/app/_post-templates/lovable/lib/formats';
import { exportSlides } from '@/app/_post-templates/lovable/lib/export';
import type {
  Customizacao,
  FormatoPost,
  ImovelData,
  MarcaData,
} from '@/app/_post-templates/lovable/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Props {
  imoveis: ImovelData[];
  marca: MarcaData;
}

export default function ConteudoClient({ imoveis, marca }: Props) {
  const sp = useSearchParams();
  const initialImovel = sp.get('imovel');

  const [imovelId, setImovelId] = useState<string | null>(
    initialImovel ?? imoveis[0]?.id ?? null,
  );
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [formatoId, setFormatoId] = useState<FormatoPost>('SQUARE');
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE.id);
  const [fontPairId, setFontPairId] = useState(DEFAULT_FONT_PAIR.id);
  const [operacaoOverride, setOperacaoOverride] = useState<'VENDA' | 'ALUGUEL' | null>(null);
  const [showTitle, setShowTitle] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showCTA, setShowCTA] = useState(true);
  const [ctaText, setCtaText] = useState('Fale conosco');
  const [customMsg, setCustomMsg] = useState('');
  const [useCustomMsg, setUseCustomMsg] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<ExportStageHandle>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? DEFAULT_PALETTE;
  const formato = FORMATOS[formatoId];
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const imovelBase = imoveis.find((i) => i.id === imovelId) ?? imoveis[0] ?? null;
  const imovel: ImovelData | null = imovelBase
    ? { ...imovelBase, operacao: operacaoOverride ?? imovelBase.operacao }
    : null;

  const customizacao: Customizacao = useMemo(
    () => ({
      paletteId,
      fontPairId,
      primary: palette.primary,
      secondary: palette.secondary,
      surface: palette.surface,
      ink: palette.ink,
      ctaText: ctaText.trim() || 'Fale conosco',
      headlineOverride: useCustomMsg && customMsg.trim() ? customMsg.trim() : undefined,
      showLogo: true,
      showTitle,
      showPrice,
      showSpecs,
      showCTA,
      showContact: false,
    }),
    [
      paletteId,
      fontPairId,
      palette,
      ctaText,
      useCustomMsg,
      customMsg,
      showTitle,
      showPrice,
      showSpecs,
      showCTA,
    ],
  );

  async function handleExport() {
    const nodes = stageRef.current?.getSlideNodes() ?? [];
    if (!nodes.length) return;
    setExporting(true);
    try {
      const base = `${template.id}-${formato.id.toLowerCase()}`;
      await exportSlides(nodes, base);
      toast.success(`Exportado ${nodes.length === 1 ? 'PNG' : `${nodes.length} PNGs`}`);
    } catch (e) {
      toast.error('Erro ao exportar', { description: (e as Error).message });
    } finally {
      setExporting(false);
    }
  }

  async function handleSaveLibrary() {
    // Placeholder — Fase C implementa upload do thumb + persistencia
    // em posts_gerados_lib via Supabase Storage.
    toast.info('Biblioteca chega na próxima fase 📚');
    setSaving(false);
  }

  if (!imovel) {
    return (
      <div className="space-y-6">
        <PageHeader
          kicker="Conteúdo"
          icon={Sparkles}
          title="Criador de Posts"
          description="Você precisa ter pelo menos 1 imóvel cadastrado e publicado pra gerar posts."
        />
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Nenhum imóvel disponível.{' '}
          <Link href="/imoveis/novo" className="underline font-medium">
            Cadastre o primeiro
          </Link>{' '}
          ou marque como publicado em <Link href="/imoveis" className="underline">/imoveis</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Conteúdo"
        icon={Sparkles}
        title="Criador de Posts"
        description={`Template ${template.nome} · ${formato.label} ${formato.width}×${formato.height}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/conteudo/legacy"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-3 w-3 inline mr-1" />
              Editor antigo
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-[240px_1fr_280px]">
        {/* ESQUERDA — templates */}
        <aside className="rounded-lg border border-border bg-card p-3 space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
            Templates
          </h4>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-xs transition-colors',
                templateId === t.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              <div className="font-semibold">{t.nome}</div>
              <div className={cn('text-[11px]', templateId === t.id ? 'opacity-80' : 'opacity-60')}>
                {t.vibe}
              </div>
            </button>
          ))}
        </aside>

        {/* CENTRO — canvas + botões */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center gap-4">
          <CanvasPreview
            template={template}
            formato={formato}
            imovel={imovel}
            marca={marca}
            customizacao={customizacao}
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {formato.slides > 1 ? `Baixar carrossel (${formato.slides})` : 'Baixar PNG'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleSaveLibrary} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar na biblioteca
                </>
              )}
            </Button>
            <Link href="/biblioteca" passHref legacyBehavior>
              <Button variant="ghost" size="sm" asChild>
                <a>
                  <Library className="h-4 w-4 mr-2" />
                  Biblioteca
                </a>
              </Button>
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {formato.slides > 1
              ? 'Slide 1 = template completo · slides 2-4 = fotos cadastradas'
              : `1 PNG ${formato.width}×${formato.height}`}
          </p>
        </div>

        {/* DIREITA — controles */}
        <aside className="rounded-lg border border-border bg-card p-4 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
          <Section title="Imóvel">
            <select
              value={imovel.id}
              onChange={(e) => setImovelId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo} · {i.titulo}
                  {i.bairro ? ` · ${i.bairro}` : ''}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Formato">
            <div className="grid grid-cols-2 gap-2">
              {FORMATO_LIST.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatoId(f.id)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-left text-[11px]',
                    formatoId === f.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="font-semibold">{f.label}</div>
                  <div className="opacity-70 font-mono">
                    {f.width}×{f.height}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Paleta">
            <div className="grid grid-cols-5 gap-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  title={p.label}
                  className={cn(
                    'h-10 rounded-md border-2 transition-all',
                    paletteId === p.id
                      ? 'border-foreground scale-105'
                      : 'border-transparent hover:border-border',
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${p.primary} 0 50%, ${p.secondary} 50% 100%)`,
                  }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Selecionada: {palette.label}
            </p>
          </Section>

          <Section title="Fonte">
            <select
              value={fontPairId}
              onChange={(e) => setFontPairId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FONT_PAIRS.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.label}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Operação">
            <div className="grid grid-cols-2 gap-2">
              {(['VENDA', 'ALUGUEL'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setOperacaoOverride(op)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-[11px] font-semibold',
                    imovel.operacao === op
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {op === 'VENDA' ? 'À venda' : 'Aluguel'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Default: {imovelBase?.operacao}
            </p>
          </Section>

          <Section title="Elementos">
            <Toggle label="Título" value={showTitle} onChange={setShowTitle} />
            <Toggle label="Preço" value={showPrice} onChange={setShowPrice} />
            <Toggle label="Specs" value={showSpecs} onChange={setShowSpecs} />
            <Toggle label="CTA" value={showCTA} onChange={setShowCTA} />
          </Section>

          {showCTA && (
            <Section title="Texto do CTA">
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Fale conosco"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Section>
          )}

          <Section title="Mensagem personalizada">
            <textarea
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="Escreva uma chamada (substitui o título)…"
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1.5">
              <Toggle label="Usar essa mensagem" value={useCustomMsg} onChange={setUseCustomMsg} />
            </div>
          </Section>
        </aside>
      </div>

      {/* ExportStage off-screen pra render nativo 1080px */}
      <ExportStage
        ref={stageRef}
        template={template}
        formato={formato}
        imovel={imovel}
        marca={marca}
        customizacao={customizacao}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 text-xs">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="cursor-pointer"
      />
    </label>
  );
}
