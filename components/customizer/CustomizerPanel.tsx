'use client';

import { useState } from 'react';
import {
  Layers,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Type,
  Plus,
  Trash2,
  Save,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSiteStore, useThemeConfig } from '@/lib/site-store';
import {
  FONT_OPTIONS,
  THEME_META,
  type SectionConfig,
  type ThemeId,
  type Customization,
} from '@/types/site-customization';
import { cn } from '@/lib/utils';

type Tab = 'tema' | 'conteudo' | 'estilo' | 'config';

const RAIL = [
  { id: 'tema' as const, label: 'Tema', Icon: Sparkles },
  { id: 'conteudo' as const, label: 'Conteúdo', Icon: Layers },
  { id: 'estilo' as const, label: 'Estilo', Icon: Palette },
  { id: 'config' as const, label: 'Config', Icon: Settings },
];

interface Props {
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saved?: boolean;
}

export function CustomizerPanel({ onSave, saving, saved }: Props) {
  const activeTheme = useSiteStore((s) => s.activeTheme);
  const panelOpen = useSiteStore((s) => s.panelOpen);
  const setPanelOpen = useSiteStore((s) => s.setPanelOpen);
  const resetTheme = useSiteStore((s) => s.resetTheme);
  const dirty = useSiteStore((s) => s.dirty);
  const [tab, setTab] = useState<Tab>('tema');

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="fixed left-3 top-1/2 z-50 -translate-y-1/2 rounded-r-md border border-l-0 bg-white px-2 py-3 text-slate-700 shadow-md hover:bg-slate-50"
        aria-label="Abrir painel"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[380px] border-r border-slate-200 bg-white text-slate-800 shadow-xl">
      <div className="flex w-[60px] flex-col items-center border-r border-slate-200 bg-slate-50 py-3">
        {RAIL.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setTab(r.id)}
            className={cn(
              'mb-1 flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium transition-colors',
              tab === r.id
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-500 hover:bg-white hover:text-slate-700',
            )}
            aria-label={r.label}
          >
            <r.Icon className="h-4 w-4" />
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {RAIL.find((r) => r.id === tab)?.label}
            </span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
              {THEME_META[activeTheme].nome}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar painel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'tema' && <TemaTab />}
          {tab === 'conteudo' && <ConteudoTab theme={activeTheme} />}
          {tab === 'estilo' && <EstiloTab theme={activeTheme} />}
          {tab === 'config' && <ConfigTab theme={activeTheme} />}
        </div>

        <footer className="space-y-2 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors',
              dirty
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-slate-100 text-slate-400',
              saving && 'cursor-wait',
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : saved && !dirty ? (
              <>
                <Check className="h-4 w-4" /> Salvo
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Salvar alterações
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => resetTheme(activeTheme)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Resetar tema
          </button>
        </footer>
      </div>
    </aside>
  );
}

/* ---------------- Tema: escolha entre Brisa e Aura ---------------- */

function TemaTab() {
  const activeTheme = useSiteStore((s) => s.activeTheme);
  const setActiveTheme = useSiteStore((s) => s.setActiveTheme);

  return (
    <div className="space-y-3">
      <Group title="Escolha o tema" subtitle="Aplica imediatamente no preview">
        {(['brisa', 'aura'] as ThemeId[]).map((id) => {
          const meta = THEME_META[id];
          const active = activeTheme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTheme(id)}
              className={cn(
                'group block w-full overflow-hidden rounded-xl border-2 text-left transition-all',
                active
                  ? 'border-violet-500 ring-2 ring-violet-200'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className="h-24 w-full" style={{ background: meta.preview }} />
              <div className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{meta.nome}</span>
                  {active && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{meta.descricao}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                  {meta.vibe}
                </p>
              </div>
            </button>
          );
        })}
      </Group>
    </div>
  );
}

/* ---------------- Conteúdo: header + seções ---------------- */
function ConteudoTab({ theme }: { theme: ThemeId }) {
  const cfg = useThemeConfig(theme);
  const setBrandName = useSiteStore((s) => s.setBrandName);
  const setCta = useSiteStore((s) => s.setCta);
  const updateLink = useSiteStore((s) => s.updateLink);
  const addLink = useSiteStore((s) => s.addLink);
  const removeLink = useSiteStore((s) => s.removeLink);
  const toggleSection = useSiteStore((s) => s.toggleSection);
  const reorderSections = useSiteStore((s) => s.reorderSections);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    reorderSections(theme, active.id as SectionConfig['id'], over.id as SectionConfig['id']);
  };

  return (
    <div className="space-y-6">
      <Group title="Header" subtitle="Marca, menu e botão de chamada">
        <Field label="Nome da imobiliária">
          <input
            type="text"
            value={cfg.header.brandName}
            onChange={(e) => setBrandName(theme, e.target.value)}
            className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-violet-500"
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Links do menu</span>
            <button
              type="button"
              onClick={() => addLink(theme)}
              className="flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:underline"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-1.5">
            {cfg.header.links.map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={l.label}
                  onChange={(e) => updateLink(theme, i, { label: e.target.value })}
                  placeholder="Rótulo"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-500"
                />
                <input
                  type="text"
                  value={l.to}
                  onChange={(e) => updateLink(theme, i, { to: e.target.value })}
                  placeholder="/"
                  className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-mono outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => removeLink(theme, i)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Botão CTA — texto">
          <input
            type="text"
            value={cfg.header.ctaLabel}
            onChange={(e) => setCta(theme, 'ctaLabel', e.target.value)}
            className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-violet-500"
          />
        </Field>
        <Field label="Botão CTA — link">
          <input
            type="text"
            value={cfg.header.ctaHref}
            onChange={(e) => setCta(theme, 'ctaHref', e.target.value)}
            className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm font-mono outline-none focus:border-violet-500"
          />
        </Field>
      </Group>

      <Group title="Seções da página" subtitle="Arraste para reordenar, olho para esconder">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cfg.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {cfg.sections.map((s) => (
                <SortableSectionRow
                  key={s.id}
                  section={s}
                  onToggle={() => toggleSection(theme, s.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Group>
    </div>
  );
}

/* ---------------- Estilo: cores + tipografia ---------------- */
function EstiloTab({ theme }: { theme: ThemeId }) {
  const cfg = useThemeConfig(theme);
  const setColor = useSiteStore((s) => s.setColor);
  const setFont = useSiteStore((s) => s.setFont);

  return (
    <div className="space-y-6">
      <Group title="Cores" subtitle="Atualizam a página em tempo real">
        {(
          [
            { key: 'primary', label: 'Cor primária' },
            { key: 'secondary', label: 'Cor secundária' },
            { key: 'background', label: 'Cor de fundo' },
            { key: 'foreground', label: 'Cor de texto' },
          ] as const
        ).map((f) => (
          <Field key={f.key} label={f.label}>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5">
              <input
                type="color"
                value={cfg.colors[f.key]}
                onChange={(e) => setColor(theme, f.key, e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0"
              />
              <input
                type="text"
                value={cfg.colors[f.key]}
                onChange={(e) => setColor(theme, f.key, e.target.value)}
                className="flex-1 bg-transparent text-sm font-mono text-slate-700 outline-none"
              />
            </div>
          </Field>
        ))}
      </Group>

      <Group title="Tipografia" subtitle="Pareie um título marcante com um corpo legível">
        <FontSelect
          label="Fonte de título"
          value={cfg.fonts.heading}
          onChange={(v) => setFont(theme, 'heading', v)}
          preview="Casa de luxo em Pinheiros"
          isHeading
        />
        <FontSelect
          label="Fonte de corpo"
          value={cfg.fonts.body}
          onChange={(v) => setFont(theme, 'body', v)}
          preview="Apartamento de 3 dormitórios, 110m² com vista privilegiada."
        />
      </Group>
    </div>
  );
}

/* ---------------- Config: redes + SEO ---------------- */
function ConfigTab({ theme }: { theme: ThemeId }) {
  const cfg = useThemeConfig(theme);
  const setSocial = useSiteStore((s) => s.setSocial);
  const setSeo = useSiteStore((s) => s.setSeo);

  return (
    <div className="space-y-6">
      <Group title="Redes sociais" subtitle="Aparecem no rodapé do site">
        {(['facebook', 'instagram', 'twitter', 'linkedin'] as const).map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <input
              type="text"
              value={cfg.social[k]}
              onChange={(e) => setSocial(theme, k, e.target.value)}
              placeholder={k === 'instagram' ? '@usuario' : 'https://...'}
              className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-violet-500"
            />
          </Field>
        ))}
      </Group>

      <Group title="SEO" subtitle="Como o site aparece no Google">
        <Field label="Título da página">
          <input
            type="text"
            value={cfg.seo.title}
            onChange={(e) => setSeo(theme, 'title', e.target.value)}
            className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-violet-500"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            value={cfg.seo.description}
            onChange={(e) => setSeo(theme, 'description', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-violet-500"
          />
        </Field>
      </Group>
    </div>
  );
}

/* ---------------- Helpers UI ---------------- */
function Group({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function FontSelect({
  label,
  value,
  onChange,
  preview,
  isHeading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  preview: string;
  isHeading?: boolean;
}) {
  const stack = FONT_OPTIONS.find((f) => f.name === value)?.stack;
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <Type className="h-3 w-3" /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name}
          </option>
        ))}
      </select>
      <div
        className="mt-2 rounded-md bg-slate-50 px-3 py-2.5 text-slate-700"
        style={{ fontFamily: stack, fontSize: isHeading ? 22 : 14, lineHeight: 1.3 }}
      >
        {preview}
      </div>
    </div>
  );
}

function SortableSectionRow({
  section,
  onToggle,
}: {
  section: SectionConfig;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-2',
        isDragging && 'z-10 border-violet-300 bg-white shadow-lg',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 active:cursor-grabbing"
          aria-label="Arrastar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span
          className={cn(
            'truncate text-sm',
            !section.visible && 'text-slate-400 line-through',
          )}
        >
          {section.label}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="rounded p-1 text-slate-500 hover:bg-white"
        aria-label={section.visible ? 'Ocultar' : 'Mostrar'}
      >
        {section.visible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export type { Customization };
