'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Phone, Mail, Calendar, MapPin, ChevronRight, MoreHorizontal,
  CheckCircle2, Clock, AlertCircle, Globe, Users, MessageCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

interface Captacao {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  etapa: string;
  origem: string | null;
  interesse: string | null;
  bairroDesejado: string | null;
  orcamento: number | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialLeads: Captacao[];
}

const ETAPAS = [
  { id: 'NOVO', label: 'Nova captação', icon: AlertCircle, color: '#3b82f6', tip: 'Proprietário entrou em contato — fazer primeira ligação' },
  { id: 'CONTATO', label: 'Avaliação agendada', icon: Calendar, color: '#8b5cf6', tip: 'Visita pra avaliar o imóvel marcada' },
  { id: 'VISITA_AGENDADA', label: 'Avaliado', icon: CheckCircle2, color: '#eab308', tip: 'Avaliação feita, aguardando aceite do preço' },
  { id: 'PROPOSTA', label: 'Contrato em negociação', icon: Clock, color: '#f97316', tip: 'Negociando termos do contrato de captação' },
  { id: 'FECHADO', label: 'Listado', icon: CheckCircle2, color: '#22c55e', tip: 'Imóvel captado e cadastrado no portfólio' },
];

const ORIGENS = [
  { id: 'site', label: 'Site (Anuncie seu imóvel)', icon: Globe },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'indicacao', label: 'Indicação', icon: Users },
  { id: 'prospeccao', label: 'Prospecção ativa', icon: Phone },
  { id: 'outro', label: 'Outro', icon: MoreHorizontal },
];

function origemLabel(origem: string | null): string {
  if (!origem) return 'Sem origem';
  const found = ORIGENS.find((o) => o.id === origem || origem.startsWith(o.id));
  return found?.label ?? origem;
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function CaptacaoClient({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Captacao[]>(initialLeads);
  const [showNovo, setShowNovo] = useState(false);
  const [editing, setEditing] = useState<Captacao | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('TODOS');

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      if (filtroEtapa !== 'TODOS' && l.etapa !== filtroEtapa) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        return (
          l.nome.toLowerCase().includes(q) ||
          (l.notas ?? '').toLowerCase().includes(q) ||
          (l.bairroDesejado ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, busca, filtroEtapa]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: leads.length };
    ETAPAS.forEach((e) => {
      c[e.id] = leads.filter((l) => l.etapa === e.id).length;
    });
    return c;
  }, [leads]);

  async function moverEtapa(id: string, etapa: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, etapa } : l)));
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, etapa }),
      });
      if (!res.ok) throw new Error();
      toast.success('Etapa atualizada');
    } catch {
      toast.error('Erro ao atualizar');
    }
  }

  async function salvarNovo(form: Partial<Captacao>) {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tipoLead: 'VENDEDOR',
          origem: form.origem ?? 'prospeccao',
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setLeads((prev) => [
        {
          ...saved,
          createdAt: saved.createdAt ?? new Date().toISOString(),
          updatedAt: saved.updatedAt ?? new Date().toISOString(),
          orcamento: saved.orcamento ? Number(saved.orcamento) : null,
        },
        ...prev,
      ]);
      setShowNovo(false);
      toast.success('Captação criada');
    } catch {
      toast.error('Erro ao criar');
    }
  }

  async function salvarEdit(id: string, patch: Partial<Captacao>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error();
      toast.success('Salvo');
      setEditing(null);
    } catch {
      toast.error('Erro ao salvar');
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Captação de Imóveis"
        description="Proprietários que querem anunciar com você. Acompanhe origem, contato, avaliação e fechamento de contrato."
        icon={Briefcase}
        actions={
          <button
            onClick={() => setShowNovo(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            + Nova captação
          </button>
        }
      />

      {/* Filtros: barra de etapas com contagem */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltroEtapa('TODOS')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            filtroEtapa === 'TODOS' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Todos ({counts.TODOS})
        </button>
        {ETAPAS.map((e) => (
          <button
            key={e.id}
            onClick={() => setFiltroEtapa(e.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filtroEtapa === e.id ? 'text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
            style={filtroEtapa === e.id ? { background: e.color } : undefined}
          >
            {e.label} ({counts[e.id] ?? 0})
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar por nome, bairro ou notas..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-4 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={leads.length === 0 ? 'Nenhuma captação ainda' : 'Sem resultados'}
          description={
            leads.length === 0
              ? 'Quando alguém preencher "Anuncie seu imóvel" no seu site ou você criar manualmente, aparece aqui.'
              : 'Limpe o filtro ou tente outra busca.'
          }
          action={
            leads.length === 0
              ? { label: 'Criar primeira captação', onClick: () => setShowNovo(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => (
            <CaptacaoRow
              key={l.id}
              lead={l}
              onMoverEtapa={(etapa) => moverEtapa(l.id, etapa)}
              onAbrirEdit={() => setEditing(l)}
            />
          ))}
        </div>
      )}

      {showNovo && <NovaCaptacaoModal onClose={() => setShowNovo(false)} onSalvar={salvarNovo} />}
      {editing && (
        <EditCaptacaoModal
          lead={editing}
          onClose={() => setEditing(null)}
          onSalvar={(patch) => salvarEdit(editing.id, patch)}
        />
      )}
    </div>
  );
}

function CaptacaoRow({
  lead,
  onMoverEtapa,
  onAbrirEdit,
}: {
  lead: Captacao;
  onMoverEtapa: (etapa: string) => void;
  onAbrirEdit: () => void;
}) {
  const etapa = ETAPAS.find((e) => e.id === lead.etapa) ?? ETAPAS[0];
  const Icon = etapa.icon;
  const wppDigits = lead.whatsapp?.replace(/\D/g, '');
  const wppHref = wppDigits ? `https://wa.me/${wppDigits}` : null;
  const proximaEtapa = ETAPAS[ETAPAS.findIndex((e) => e.id === lead.etapa) + 1];

  return (
    <div className="rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${etapa.color}20`, color: etapa.color }}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Conteudo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{lead.nome}</h3>
            <span className="text-[10px] uppercase tracking-wider opacity-50">{relativeTime(lead.createdAt)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" /> {origemLabel(lead.origem)}
            </span>
            <span style={{ color: etapa.color }} className="font-semibold">
              {etapa.label}
            </span>
            {lead.bairroDesejado && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {lead.bairroDesejado}
              </span>
            )}
          </div>
          {lead.notas && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{lead.notas}</p>
          )}
        </div>

        {/* Acoes */}
        <div className="flex shrink-0 items-center gap-1.5">
          {wppHref && (
            <a
              href={wppHref}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-muted text-green-600"
              title="Abrir WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-muted"
              title="Enviar e-mail"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          <Link
            href={`/agenda?leadId=${lead.id}&titulo=Avaliação%20-%20${encodeURIComponent(lead.nome)}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-muted"
            title="Agendar avaliação"
          >
            <Calendar className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onAbrirEdit}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2.5 text-xs hover:bg-muted"
            title="Editar"
          >
            Editar
          </button>
          {proximaEtapa && (
            <button
              onClick={() => onMoverEtapa(proximaEtapa.id)}
              className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-semibold text-white hover:opacity-90"
              style={{ background: proximaEtapa.color }}
              title={`Mover pra: ${proximaEtapa.label}`}
            >
              {proximaEtapa.label} <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NovaCaptacaoModal({
  onClose,
  onSalvar,
}: {
  onClose: () => void;
  onSalvar: (form: Partial<Captacao> & { origem: string }) => void;
}) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [origem, setOrigem] = useState('prospeccao');
  const [bairroDesejado, setBairroDesejado] = useState('');
  const [notas, setNotas] = useState('');

  return (
    <Modal
      open
      onClose={onClose}
      title="Nova captação"
      maxWidth="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
          <button
            onClick={() => {
              if (!nome.trim()) return toast.error('Nome obrigatório');
              onSalvar({ nome, whatsapp, email, origem, bairroDesejado, notas });
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Criar captação
          </button>
        </>
      }
    >
        <div className="p-5 space-y-3">
          <Field label="Nome do proprietário *">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input-base" placeholder="Maria Silva" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp">
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input-base" placeholder="(11) 99999-9999" />
            </Field>
            <Field label="E-mail">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="maria@exemplo.com" type="email" />
            </Field>
          </div>
          <Field label="Como ele(a) chegou?">
            <select value={origem} onChange={(e) => setOrigem(e.target.value)} className="input-base">
              {ORIGENS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Bairro / Endereço do imóvel">
            <input value={bairroDesejado} onChange={(e) => setBairroDesejado(e.target.value)} className="input-base" placeholder="Jardim Maristela, Atibaia" />
          </Field>
          <Field label="Notas (contexto, preço pretendido, urgência...)">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} className="input-base resize-none" placeholder="Casa 3 quartos, quer R$ 500k, tem pressa pra vender..." />
          </Field>
        </div>
        <style jsx>{`
          .input-base {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
        `}</style>
    </Modal>
  );
}

function EditCaptacaoModal({
  lead,
  onClose,
  onSalvar,
}: {
  lead: Captacao;
  onClose: () => void;
  onSalvar: (patch: Partial<Captacao>) => void;
}) {
  const [notas, setNotas] = useState(lead.notas ?? '');
  const [bairroDesejado, setBairroDesejado] = useState(lead.bairroDesejado ?? '');
  const [orcamento, setOrcamento] = useState(lead.orcamento?.toString() ?? '');
  const [etapa, setEtapa] = useState(lead.etapa);

  return (
    <Modal
      open
      onClose={onClose}
      title={lead.nome}
      maxWidth="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
          <button
            onClick={() =>
              onSalvar({
                notas: notas.trim() || null,
                bairroDesejado: bairroDesejado.trim() || null,
                orcamento: orcamento ? Number(orcamento) : null,
                etapa,
              })
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Salvar
          </button>
        </>
      }
    >
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Origem: {origemLabel(lead.origem)} · Criado {relativeTime(lead.createdAt)} atrás
          </p>
          <Field label="Etapa">
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="input-base">
              {ETAPAS.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Bairro / Endereço">
            <input value={bairroDesejado} onChange={(e) => setBairroDesejado(e.target.value)} className="input-base" />
          </Field>
          <Field label="Preço pretendido (R$)">
            <input value={orcamento} onChange={(e) => setOrcamento(e.target.value)} className="input-base" type="number" />
          </Field>
          <Field label="Notas">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={6} className="input-base resize-none" />
          </Field>
        </div>
        <style jsx>{`
          .input-base {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
        `}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
