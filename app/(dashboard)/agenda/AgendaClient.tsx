'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Link2,
  X,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

/* ---------- Tipos vindos do server ---------- */

type EventoTipo = 'VISITA' | 'RETORNO' | 'REUNIAO' | 'TAREFA' | 'OUTRO';
type EventoStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'REALIZADO'
  | 'CANCELADO'
  | 'REMARCADO';

type Evento = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: string;
  inicio: string; // ISO
  fim: string;
  diaInteiro: boolean;
  local: string | null;
  imovelId: string | null;
  leadId: string | null;
  imovelCodigo: string | null;
  imovelTitulo: string | null;
  leadNome: string | null;
};

type ImovelLite = {
  id: string;
  codigo: string;
  titulo: string;
  local: string;
};

type View = 'mes' | 'semana' | 'dia';

const TYPE_STYLES: Record<EventoTipo, { bg: string; bar: string; label: string }> = {
  VISITA: {
    bg: 'bg-primary/15 hover:bg-primary/25 border-primary/30 text-primary',
    bar: 'bg-primary',
    label: 'Visita',
  },
  RETORNO: {
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
    label: 'Retorno',
  },
  REUNIAO: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
    label: 'Reunião',
  },
  TAREFA: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400',
    bar: 'bg-amber-500',
    label: 'Tarefa',
  },
  OUTRO: {
    bg: 'bg-zinc-500/10 hover:bg-zinc-500/20 border-zinc-500/30 text-zinc-700 dark:text-zinc-300',
    bar: 'bg-zinc-500',
    label: 'Outro',
  },
};

const TIPO_LABELS: Record<EventoTipo, string> = {
  VISITA: 'Visita',
  RETORNO: 'Retorno',
  REUNIAO: 'Reunião',
  TAREFA: 'Tarefa',
  OUTRO: 'Outro',
};

const DOW_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const DOW_LONG = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
const MONTH_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8h–20h

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
/** "2026-04-28T14:00" pra <input type=datetime-local> a partir de Date */
function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AgendaClient({
  eventos,
  imoveis,
}: {
  eventos: Evento[];
  imoveis: ImovelLite[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<View>('semana');
  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | null>(null);

  const eventosByDay = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const ev of eventos) {
      const k = ev.inicio.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.inicio.localeCompare(b.inicio));
    }
    return map;
  }, [eventos]);

  function shift(direction: -1 | 1) {
    const d = new Date(anchor);
    if (view === 'mes') d.setMonth(d.getMonth() + direction);
    else if (view === 'semana') d.setDate(d.getDate() + 7 * direction);
    else d.setDate(d.getDate() + direction);
    setAnchor(d);
  }
  function goToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchor(d);
  }

  function abrirFormNovo(start?: Date) {
    setEditing(null);
    setDefaultStart(start ?? null);
    setShowForm(true);
  }
  function abrirFormEdit(ev: Evento) {
    setEditing(ev);
    setDefaultStart(null);
    setSelectedEvento(null);
    setShowForm(true);
  }

  async function handleSave(payload: SavePayload) {
    const isEdit = !!editing;
    const url = isEdit ? `/api/agenda/${editing!.id}` : '/api/agenda';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao salvar');
      toast.success(isEdit ? 'Evento atualizado' : 'Evento criado');
      setShowForm(false);
      setEditing(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error('Erro ao salvar evento', {
        description: (e as Error).message,
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este evento?')) return;
    try {
      const r = await fetch(`/api/agenda/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erro ao apagar');
      toast.success('Evento apagado');
      setSelectedEvento(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error('Erro ao apagar evento', {
        description: (e as Error).message,
      });
    }
  }

  const headerLabel = (() => {
    if (view === 'dia') {
      return `${DOW_LONG[anchor.getDay()]}, ${anchor.getDate()} de ${MONTH_LONG[anchor.getMonth()]}`;
    }
    if (view === 'semana') {
      const s = startOfWeek(anchor);
      const e = addDays(s, 6);
      const sameMonth = s.getMonth() === e.getMonth();
      return sameMonth
        ? `${s.getDate()}–${e.getDate()} de ${MONTH_LONG[s.getMonth()]} ${e.getFullYear()}`
        : `${s.getDate()} ${MONTH_LONG[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTH_LONG[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
    }
    return `${MONTH_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`;
  })();

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="CRM"
        icon={CalendarIcon}
        title="Agenda"
        description="Visitas, retornos e tarefas da equipe"
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Em breve">
              <Link2 className="h-4 w-4 mr-2" />
              Conectar Google Calendar
            </Button>
            <Button size="sm" onClick={() => abrirFormNovo()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo evento
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <div className="flex items-center">
            <button
              onClick={() => shift(-1)}
              className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => shift(1)}
              className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-base md:text-lg font-display font-semibold text-foreground capitalize">
            {headerLabel}
          </h2>
        </div>

        <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
          {(['mes', 'semana', 'dia'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 h-8 rounded text-xs font-medium capitalize transition-colors',
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'mes' ? 'Mês' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {eventos.length === 0 && (
        <EmptyState
          icon={CalendarIcon}
          title="Nenhum evento agendado ainda"
          description="Cadastre visitas, retornos e tarefas pra acompanhar a agenda da sua equipe."
          action={{
            label: 'Criar primeiro evento',
            icon: Plus,
            onClick: () => abrirFormNovo(),
          }}
        />
      )}

      {/* View */}
      {eventos.length > 0 && view === 'mes' && (
        <MonthView
          anchor={anchor}
          eventosByDay={eventosByDay}
          onDayClick={(d) => {
            setAnchor(d);
            setView('dia');
          }}
          onEventoClick={setSelectedEvento}
        />
      )}
      {eventos.length > 0 && view === 'semana' && (
        <WeekView
          anchor={anchor}
          eventos={eventos}
          onEventoClick={setSelectedEvento}
          onSlotClick={(d) => abrirFormNovo(d)}
        />
      )}
      {eventos.length > 0 && view === 'dia' && (
        <DayView
          anchor={anchor}
          eventos={eventos}
          onEventoClick={setSelectedEvento}
          onSlotClick={(d) => abrirFormNovo(d)}
        />
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(TYPE_STYLES) as EventoTipo[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', TYPE_STYLES[t].bar)} />
            {TYPE_STYLES[t].label}
          </span>
        ))}
      </div>

      {/* Modal detalhes */}
      {selectedEvento && (
        <EventoDetalhesModal
          evento={selectedEvento}
          onClose={() => setSelectedEvento(null)}
          onEdit={() => abrirFormEdit(selectedEvento)}
          onDelete={() => handleDelete(selectedEvento.id)}
        />
      )}

      {/* Modal form */}
      {showForm && (
        <EventoFormModal
          editing={editing}
          defaultStart={defaultStart}
          imoveis={imoveis}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ───────────── Month View ───────────── */

function MonthView({
  anchor,
  eventosByDay,
  onDayClick,
  onEventoClick,
}: {
  anchor: Date;
  eventosByDay: Map<string, Evento[]>;
  onDayClick: (d: Date) => void;
  onEventoClick: (ev: Evento) => void;
}) {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {DOW_SHORT.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((cell, idx) => {
          const inMonth = cell.getMonth() === anchor.getMonth();
          const isToday = sameDay(cell, today);
          const key = cell.toISOString().slice(0, 10);
          const evs = eventosByDay.get(key) ?? [];
          return (
            <button
              key={idx}
              onClick={() => onDayClick(cell)}
              className={cn(
                'relative min-h-[88px] p-1.5 text-left border-b border-r border-border/60 transition-colors hover:bg-muted/40',
                !inMonth && 'bg-muted/20',
                idx % 7 === 6 && 'border-r-0',
                idx >= 35 && 'border-b-0',
              )}
            >
              <div
                className={cn(
                  'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : inMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/50',
                )}
              >
                {cell.getDate()}
              </div>
              <div className="mt-1 space-y-0.5">
                {evs.slice(0, 3).map((ev) => {
                  const style =
                    TYPE_STYLES[(ev.tipo as EventoTipo) ?? 'OUTRO'] ??
                    TYPE_STYLES.OUTRO;
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventoClick(ev);
                      }}
                      className={cn(
                        'truncate text-[11px] leading-tight px-1.5 py-0.5 rounded border cursor-pointer',
                        style.bg,
                      )}
                      title={ev.titulo}
                    >
                      <span className="font-medium">
                        {fmtTime(new Date(ev.inicio))}
                      </span>{' '}
                      {ev.titulo}
                    </div>
                  );
                })}
                {evs.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">
                    +{evs.length - 3} mais
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Week View ───────────── */

function WeekView({
  anchor,
  eventos,
  onEventoClick,
  onSlotClick,
}: {
  anchor: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
  onSlotClick: (d: Date) => void;
}) {
  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border bg-muted/30">
        <div />
        {days.map((d) => {
          const isToday = sameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className="px-2 py-2 text-center border-l border-border"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {DOW_SHORT[d.getDay()]}
              </div>
              <div
                className={cn(
                  'mt-1 inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-semibold',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-14 px-2 pt-0 text-[10px] text-muted-foreground text-right -translate-y-1.5"
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((d) => (
          <DayColumn
            key={d.toISOString()}
            day={d}
            eventos={eventos}
            onEventoClick={onEventoClick}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────── Day View ───────────── */

function DayView({
  anchor,
  eventos,
  onEventoClick,
  onSlotClick,
}: {
  anchor: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
  onSlotClick: (d: Date) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[64px_1fr] relative">
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-14 px-2 text-[10px] text-muted-foreground text-right -translate-y-1.5"
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <DayColumn
          day={anchor}
          eventos={eventos}
          onEventoClick={onEventoClick}
          onSlotClick={onSlotClick}
        />
      </div>
    </div>
  );
}

function DayColumn({
  day,
  eventos,
  onEventoClick,
  onSlotClick,
}: {
  day: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
  onSlotClick: (d: Date) => void;
}) {
  const evs = eventos.filter((ev) => sameDay(new Date(ev.inicio), day));
  const hourPx = 56;
  const startMin = HOURS[0] * 60;

  function slotClick(hour: number) {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    onSlotClick(d);
  }

  return (
    <div className="relative border-l border-border">
      {HOURS.map((h) => (
        <button
          key={h}
          onClick={() => slotClick(h)}
          className="block w-full h-14 border-b border-border/40 hover:bg-primary/5 transition-colors"
          aria-label={`Criar evento às ${h}:00`}
        />
      ))}

      {evs.map((ev) => {
        const start = new Date(ev.inicio);
        const end = new Date(ev.fim);
        const minsFromStart =
          start.getHours() * 60 + start.getMinutes() - startMin;
        const durationMin = (end.getTime() - start.getTime()) / 60000 || 30;
        const top = (minsFromStart / 60) * hourPx;
        const height = Math.max(24, (durationMin / 60) * hourPx - 2);
        const style = TYPE_STYLES[(ev.tipo as EventoTipo) ?? 'OUTRO'];
        return (
          <button
            key={ev.id}
            onClick={() => onEventoClick(ev)}
            style={{ top, height }}
            className={cn(
              'absolute left-1 right-1 px-2 py-1 rounded border text-left overflow-hidden cursor-pointer transition-colors',
              style.bg,
            )}
          >
            <div className="flex items-start gap-1.5">
              <div
                className={cn('w-1 self-stretch rounded-full shrink-0', style.bar)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold truncate">{ev.titulo}</p>
                <p className="text-[10px] opacity-80 truncate">
                  {fmtTime(start)} – {fmtTime(end)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Modal de detalhes ───────────── */

function EventoDetalhesModal({
  evento,
  onClose,
  onEdit,
  onDelete,
}: {
  evento: Evento;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const start = new Date(evento.inicio);
  const end = new Date(evento.fim);
  const style = TYPE_STYLES[(evento.tipo as EventoTipo) ?? 'OUTRO'] ?? TYPE_STYLES.OUTRO;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className={cn('h-3 w-3 rounded-full mt-1.5', style.bar)} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">
              {style.label}
            </p>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              {evento.titulo}
            </h3>
          </div>
        </div>

        <div className="space-y-2 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {DOW_LONG[start.getDay()]}, {start.getDate()} de{' '}
              {MONTH_LONG[start.getMonth()]} {start.getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {fmtTime(start)} – {fmtTime(end)}
            </span>
          </div>
          {evento.local && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{evento.local}</span>
            </div>
          )}
          {evento.imovelCodigo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary">
                {evento.imovelCodigo}
              </span>
              <span className="truncate">— {evento.imovelTitulo}</span>
            </div>
          )}
          {evento.leadNome && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cliente:</span>
              <span>{evento.leadNome}</span>
            </div>
          )}
          {evento.descricao && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-2 border-t border-border">
              {evento.descricao}
            </p>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Apagar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={onEdit}>Editar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Modal form (criar / editar) ───────────── */

type SavePayload = {
  titulo: string;
  descricao?: string | null;
  tipo: EventoTipo;
  status: EventoStatus;
  inicio: string;
  fim: string;
  local?: string | null;
  imovelId?: string | null;
};

function EventoFormModal({
  editing,
  defaultStart,
  imoveis,
  onCancel,
  onSave,
}: {
  editing: Evento | null;
  defaultStart: Date | null;
  imoveis: ImovelLite[];
  onCancel: () => void;
  onSave: (p: SavePayload) => Promise<void>;
}) {
  const initialInicio = editing
    ? new Date(editing.inicio)
    : defaultStart ?? new Date();
  const initialFim = editing
    ? new Date(editing.fim)
    : new Date(initialInicio.getTime() + 60 * 60 * 1000); // +1h

  const [titulo, setTitulo] = useState(editing?.titulo ?? '');
  const [descricao, setDescricao] = useState(editing?.descricao ?? '');
  const [tipo, setTipo] = useState<EventoTipo>(
    (editing?.tipo as EventoTipo) ?? 'VISITA',
  );
  const [status, setStatus] = useState<EventoStatus>(
    (editing?.status as EventoStatus) ?? 'AGENDADO',
  );
  const [inicioStr, setInicioStr] = useState(toDatetimeLocal(initialInicio));
  const [fimStr, setFimStr] = useState(toDatetimeLocal(initialFim));
  const [local, setLocal] = useState(editing?.local ?? '');
  const [imovelId, setImovelId] = useState(editing?.imovelId ?? '');
  const [saving, setSaving] = useState(false);

  // Quando muda imóvel, sugere o local
  function onImovelChange(id: string) {
    setImovelId(id);
    if (!editing && !local && id) {
      const im = imoveis.find((i) => i.id === id);
      if (im) setLocal(im.local);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (saving) return;

    setSaving(true);
    try {
      await onSave({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tipo,
        status,
        inicio: new Date(inicioStr).toISOString(),
        fim: new Date(fimStr).toISOString(),
        local: local.trim() || null,
        imovelId: imovelId || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-lg shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-display text-xl font-semibold text-foreground">
            {editing ? 'Editar evento' : 'Novo evento'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Título *" required>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Visita do João — Apto Pinheiros"
              required
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tipo">
              <NativeSelect
                value={tipo}
                onChange={(e) => setTipo(e.target.value as EventoTipo)}
              >
                {Object.entries(TIPO_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status">
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as EventoStatus)}
              >
                <option value="AGENDADO">Agendado</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="REALIZADO">Realizado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="REMARCADO">Remarcado</option>
              </NativeSelect>
            </Field>
            <Field label="Início *" required>
              <Input
                type="datetime-local"
                value={inicioStr}
                onChange={(e) => setInicioStr(e.target.value)}
                required
              />
            </Field>
            <Field label="Fim *" required>
              <Input
                type="datetime-local"
                value={fimStr}
                onChange={(e) => setFimStr(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Imóvel relacionado (opcional)">
            <NativeSelect
              value={imovelId}
              onChange={(e) => onImovelChange(e.target.value)}
            >
              <option value="">— Nenhum —</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo} · {i.titulo}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Local / endereço">
            <Input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Endereço, sala de reunião, WhatsApp, etc."
            />
          </Field>

          <Field label="Descrição / notas">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Detalhes do evento, contato do cliente, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando
              </>
            ) : editing ? (
              'Atualizar'
            ) : (
              'Criar evento'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={cn(
          'text-xs font-medium block mb-1.5',
          required ? 'text-foreground' : 'text-foreground/80',
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
