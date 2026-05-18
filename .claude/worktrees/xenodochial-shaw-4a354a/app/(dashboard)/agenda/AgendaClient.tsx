'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EventoType = 'visita' | 'retorno' | 'reuniao' | 'tarefa';
type Evento = {
  id: string;
  title: string;
  type: EventoType;
  place?: string;
  start: string; // ISO
  end: string; // ISO
};

type View = 'mes' | 'semana' | 'dia';

const TYPE_STYLES: Record<EventoType, { bg: string; bar: string; label: string }> = {
  visita: {
    bg: 'bg-primary/15 hover:bg-primary/25 border-primary/30 text-primary',
    bar: 'bg-primary',
    label: 'Visita',
  },
  retorno: {
    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
    label: 'Retorno',
  },
  reuniao: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
    label: 'Reunião',
  },
  tarefa: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
    label: 'Tarefa',
  },
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

export default function AgendaClient({ eventos }: { eventos: Evento[] }) {
  const [view, setView] = useState<View>('semana');
  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  const eventosByDay = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const ev of eventos) {
      const k = ev.start.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.start.localeCompare(b.start));
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Visitas, retornos e tarefas da equipe
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title="Em breve">
            <Link2 className="h-4 w-4 mr-2" />
            Conectar Google Calendar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo evento
          </Button>
        </div>
      </div>

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

      {/* View */}
      {view === 'mes' && (
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
      {view === 'semana' && (
        <WeekView
          anchor={anchor}
          eventos={eventos}
          onEventoClick={setSelectedEvento}
        />
      )}
      {view === 'dia' && (
        <DayView
          anchor={anchor}
          eventos={eventos}
          onEventoClick={setSelectedEvento}
        />
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(TYPE_STYLES) as EventoType[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', TYPE_STYLES[t].bar)} />
            {TYPE_STYLES[t].label}
          </span>
        ))}
      </div>

      {/* Modal evento */}
      {selectedEvento && (
        <EventoModal
          evento={selectedEvento}
          onClose={() => setSelectedEvento(null)}
        />
      )}
    </div>
  );
}

/* ---------- Month view ---------- */

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
                  const style = TYPE_STYLES[ev.type];
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
                      title={ev.title}
                    >
                      <span className="font-medium">{fmtTime(new Date(ev.start))}</span>{' '}
                      {ev.title}
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

/* ---------- Week view ---------- */

function WeekView({
  anchor,
  eventos,
  onEventoClick,
}: {
  anchor: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
}) {
  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header dias */}
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

      {/* Grid horários */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
        {/* Horários coluna esquerda */}
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

        {/* 7 colunas dia */}
        {days.map((d) => (
          <DayColumn
            key={d.toISOString()}
            day={d}
            eventos={eventos}
            onEventoClick={onEventoClick}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Day view ---------- */

function DayView({
  anchor,
  eventos,
  onEventoClick,
}: {
  anchor: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
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
        <DayColumn day={anchor} eventos={eventos} onEventoClick={onEventoClick} />
      </div>
    </div>
  );
}

/* ---------- Coluna do dia (compartilhada por week/day) ---------- */

function DayColumn({
  day,
  eventos,
  onEventoClick,
}: {
  day: Date;
  eventos: Evento[];
  onEventoClick: (ev: Evento) => void;
}) {
  const evs = eventos.filter((ev) => sameDay(new Date(ev.start), day));
  const hourPx = 56; // tailwind h-14
  const startMin = HOURS[0] * 60;

  return (
    <div className="relative border-l border-border">
      {/* Linhas de hora */}
      {HOURS.map((h) => (
        <div key={h} className="h-14 border-b border-border/40" />
      ))}

      {/* Eventos posicionados absolutos */}
      {evs.map((ev) => {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        const minsFromStart =
          start.getHours() * 60 + start.getMinutes() - startMin;
        const durationMin =
          (end.getTime() - start.getTime()) / 60000 || 30;
        const top = (minsFromStart / 60) * hourPx;
        const height = Math.max(24, (durationMin / 60) * hourPx - 2);
        const style = TYPE_STYLES[ev.type];
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
              <div className={cn('w-1 self-stretch rounded-full shrink-0', style.bar)} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold truncate">{ev.title}</p>
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

/* ---------- Modal de detalhes ---------- */

function EventoModal({
  evento,
  onClose,
}: {
  evento: Evento;
  onClose: () => void;
}) {
  const start = new Date(evento.start);
  const end = new Date(evento.end);
  const style = TYPE_STYLES[evento.type];

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
              {evento.title}
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
          {evento.place && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{evento.place}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button disabled title="Em breve">
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}
