'use client';

import { useMemo, useState } from 'react';
import {
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

type Imovel = {
  id: string;
  codigo: string;
  titulo: string;
  bairro: string | null;
  cidade: string;
};

type TipoPessoa = 'CORRETOR' | 'VISITA' | 'MANUTENCAO' | 'INQUILINO' | 'PROPRIETARIO' | 'OUTRO';

interface Retirada {
  id: string;
  imovelId: string;
  imovel: Imovel;
  pessoaNome: string;
  pessoaContato: string | null;
  pessoaTipo: TipoPessoa;
  retiradaEm: string;
  prazoDevolucao: string | null;
  devolvidaEm: string | null;
  status: 'RETIRADA' | 'DEVOLVIDA';
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialRetiradas: Retirada[];
  imoveis: Imovel[];
}

type FilterTab = 'todas' | 'em_uso' | 'atrasadas' | 'devolvidas';

const TIPO_LABEL: Record<TipoPessoa, string> = {
  CORRETOR: 'Corretor',
  VISITA: 'Visita',
  MANUTENCAO: 'Manutenção',
  INQUILINO: 'Inquilino',
  PROPRIETARIO: 'Proprietário',
  OUTRO: 'Outro',
};

const TIPO_COR: Record<TipoPessoa, string> = {
  CORRETOR: '#3b82f6',
  VISITA: '#eab308',
  MANUTENCAO: '#f97316',
  INQUILINO: '#22c55e',
  PROPRIETARIO: '#8b5cf6',
  OUTRO: '#6b7280',
};

function isAtrasada(r: Retirada): boolean {
  if (r.status === 'DEVOLVIDA') return false;
  if (!r.prazoDevolucao) return false;
  return new Date(r.prazoDevolucao).getTime() < Date.now();
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ControleChavesClient({ initialRetiradas, imoveis }: Props) {
  const [retiradas, setRetiradas] = useState<Retirada[]>(initialRetiradas);
  const [tab, setTab] = useState<FilterTab>('todas');
  const [busca, setBusca] = useState('');
  const [novoOpen, setNovoOpen] = useState(false);
  const [editando, setEditando] = useState<Retirada | null>(null);

  const counts = useMemo(() => {
    const c = { todas: retiradas.length, em_uso: 0, atrasadas: 0, devolvidas: 0 };
    retiradas.forEach((r) => {
      if (r.status === 'DEVOLVIDA') c.devolvidas++;
      else {
        c.em_uso++;
        if (isAtrasada(r)) c.atrasadas++;
      }
    });
    return c;
  }, [retiradas]);

  const filtradas = useMemo(() => {
    return retiradas
      .filter((r) => {
        if (tab === 'em_uso') return r.status === 'RETIRADA';
        if (tab === 'atrasadas') return r.status === 'RETIRADA' && isAtrasada(r);
        if (tab === 'devolvidas') return r.status === 'DEVOLVIDA';
        return true;
      })
      .filter((r) => {
        if (!busca.trim()) return true;
        const q = busca.toLowerCase();
        return (
          r.pessoaNome.toLowerCase().includes(q) ||
          r.imovel.codigo.toLowerCase().includes(q) ||
          (r.imovel.bairro ?? '').toLowerCase().includes(q) ||
          (r.imovel.titulo ?? '').toLowerCase().includes(q)
        );
      });
  }, [retiradas, tab, busca]);

  async function criarRetirada(payload: any) {
    try {
      const res = await fetch('/api/chaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'erro');
      const nova = await res.json();
      setRetiradas((prev) => [
        {
          ...nova,
          retiradaEm: nova.retiradaEm,
          prazoDevolucao: nova.prazoDevolucao ?? null,
          devolvidaEm: nova.devolvidaEm ?? null,
        },
        ...prev,
      ]);
      setNovoOpen(false);
      toast.success('Retirada registrada');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function marcarDevolvida(id: string) {
    try {
      const res = await fetch(`/api/chaves?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DEVOLVIDA' }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRetiradas((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success('Chave devolvida');
    } catch {
      toast.error('Erro ao atualizar');
    }
  }

  async function salvarEdit(id: string, patch: any) {
    try {
      const res = await fetch(`/api/chaves?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRetiradas((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditando(null);
      toast.success('Salvo');
    } catch {
      toast.error('Erro ao salvar');
    }
  }

  async function deletar(id: string) {
    if (!confirm('Apagar esse registro?')) return;
    try {
      const res = await fetch(`/api/chaves?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRetiradas((prev) => prev.filter((r) => r.id !== id));
      toast.success('Removido');
    } catch {
      toast.error('Erro ao remover');
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Controle de Chaves"
        description="Quem está com a chave de cada imóvel, quando retirou e quando devolveu."
        icon={KeyRound}
        actions={
          <button
            onClick={() => setNovoOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            + Nova retirada
          </button>
        }
      />

      {/* Alert atrasadas */}
      {counts.atrasadas > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{counts.atrasadas}</strong> chave{counts.atrasadas > 1 ? 's' : ''} em atraso —
            confira quem ainda não devolveu.
          </span>
        </div>
      )}

      {/* Tabs filtro */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip label="Todas" count={counts.todas} active={tab === 'todas'} onClick={() => setTab('todas')} />
        <FilterChip label="Em uso" count={counts.em_uso} active={tab === 'em_uso'} onClick={() => setTab('em_uso')} />
        <FilterChip
          label="Atrasadas"
          count={counts.atrasadas}
          active={tab === 'atrasadas'}
          onClick={() => setTab('atrasadas')}
          color="#ef4444"
        />
        <FilterChip
          label="Devolvidas"
          count={counts.devolvidas}
          active={tab === 'devolvidas'}
          onClick={() => setTab('devolvidas')}
        />
      </div>

      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="🔍 Buscar por pessoa, código ou bairro..."
        className="mb-4 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      {filtradas.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={retiradas.length === 0 ? 'Nenhuma retirada registrada' : 'Sem resultados'}
          description={
            retiradas.length === 0
              ? 'Quando alguém pegar a chave de um imóvel, registre aqui pra não perder.'
              : 'Ajuste filtros ou limpe a busca.'
          }
          action={
            retiradas.length === 0
              ? { label: 'Registrar primeira retirada', onClick: () => setNovoOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Com quem</th>
                <th className="px-4 py-3">Retirada</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <RetiradaRow
                  key={r.id}
                  r={r}
                  onDevolver={() => marcarDevolvida(r.id)}
                  onEditar={() => setEditando(r)}
                  onDeletar={() => deletar(r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {novoOpen && (
        <NovaRetiradaModal
          imoveis={imoveis}
          onClose={() => setNovoOpen(false)}
          onSalvar={criarRetirada}
        />
      )}
      {editando && (
        <EditarRetiradaModal
          retirada={editando}
          onClose={() => setEditando(null)}
          onSalvar={(patch) => salvarEdit(editando.id, patch)}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? 'text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
      }`}
      style={active ? { background: color ?? '#0f172a' } : undefined}
    >
      {label} ({count})
    </button>
  );
}

function RetiradaRow({
  r,
  onDevolver,
  onEditar,
  onDeletar,
}: {
  r: Retirada;
  onDevolver: () => void;
  onEditar: () => void;
  onDeletar: () => void;
}) {
  const atrasada = isAtrasada(r);
  const wppDigits = r.pessoaContato?.replace(/\D/g, '');
  const wppHref = wppDigits ? `https://wa.me/${wppDigits}` : null;

  return (
    <tr className="border-t border-border hover:bg-muted/10">
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-muted-foreground">{r.imovel.codigo}</div>
        <div className="text-sm font-medium">
          {r.imovel.bairro ? `${r.imovel.bairro} · ${r.imovel.cidade}` : r.imovel.cidade}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold uppercase text-white"
            style={{ background: TIPO_COR[r.pessoaTipo] }}
          >
            {r.pessoaNome.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium">{r.pessoaNome}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {TIPO_LABEL[r.pessoaTipo]}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDateTime(r.retiradaEm)}</td>
      <td className="px-4 py-3 text-xs">
        {r.prazoDevolucao ? (
          <span className={atrasada ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
            {fmtDate(r.prazoDevolucao)}
          </span>
        ) : (
          <span className="text-muted-foreground/50">sem prazo</span>
        )}
      </td>
      <td className="px-4 py-3">
        {r.status === 'DEVOLVIDA' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
            <CheckCircle2 className="h-3 w-3" /> Devolvida
          </span>
        ) : atrasada ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
            <AlertTriangle className="h-3 w-3" /> Atrasada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            <Clock className="h-3 w-3" /> Em uso
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {wppHref && (
            <a
              href={wppHref}
              target="_blank"
              rel="noopener"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input text-green-600 hover:bg-muted"
              title="Cobrar pelo WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {r.pessoaContato && (
            <a
              href={`tel:${r.pessoaContato}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input hover:bg-muted"
              title="Ligar"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {r.status === 'RETIRADA' && (
            <button
              onClick={onDevolver}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-white hover:opacity-90"
              style={{ background: '#16a34a' }}
            >
              <CheckCircle2 className="h-3 w-3" /> Devolver
            </button>
          )}
          <button
            onClick={onEditar}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input hover:bg-muted"
            title="Editar"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDeletar}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input text-red-600 hover:bg-red-50"
            title="Apagar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function NovaRetiradaModal({
  imoveis,
  onClose,
  onSalvar,
}: {
  imoveis: Imovel[];
  onClose: () => void;
  onSalvar: (data: any) => void;
}) {
  const [imovelId, setImovelId] = useState('');
  const [pessoaNome, setPessoaNome] = useState('');
  const [pessoaContato, setPessoaContato] = useState('');
  const [pessoaTipo, setPessoaTipo] = useState<TipoPessoa>('CORRETOR');
  const [prazoDevolucao, setPrazoDevolucao] = useState('');
  const [notas, setNotas] = useState('');

  function submit() {
    if (!imovelId) return toast.error('Selecione o imóvel');
    if (!pessoaNome.trim()) return toast.error('Nome obrigatório');
    onSalvar({
      imovelId,
      pessoaNome,
      pessoaContato: pessoaContato || null,
      pessoaTipo,
      prazoDevolucao: prazoDevolucao || null,
      notas: notas || null,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar retirada de chave"
      maxWidth="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Registrar
          </button>
        </>
      }
    >
      <div className="space-y-3 p-5">
        <Field label="Imóvel *">
          <select
            value={imovelId}
            onChange={(e) => setImovelId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.codigo} — {i.bairro ?? i.cidade}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome *">
            <input
              value={pessoaNome}
              onChange={(e) => setPessoaNome(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="João Silva"
            />
          </Field>
          <Field label="WhatsApp / telefone">
            <input
              value={pessoaContato}
              onChange={(e) => setPessoaContato(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="(11) 99999-9999"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select
              value={pessoaTipo}
              onChange={(e) => setPessoaTipo(e.target.value as TipoPessoa)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(TIPO_LABEL) as TipoPessoa[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo de devolução">
            <input
              type="datetime-local"
              value={prazoDevolucao}
              onChange={(e) => setPrazoDevolucao(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ex: cliente vai mostrar pra esposa, retorna amanhã"
          />
        </Field>
      </div>
    </Modal>
  );
}

function EditarRetiradaModal({
  retirada,
  onClose,
  onSalvar,
}: {
  retirada: Retirada;
  onClose: () => void;
  onSalvar: (patch: any) => void;
}) {
  const [pessoaNome, setPessoaNome] = useState(retirada.pessoaNome);
  const [pessoaContato, setPessoaContato] = useState(retirada.pessoaContato ?? '');
  const [pessoaTipo, setPessoaTipo] = useState<TipoPessoa>(retirada.pessoaTipo);
  const [prazoDevolucao, setPrazoDevolucao] = useState(
    retirada.prazoDevolucao ? retirada.prazoDevolucao.slice(0, 16) : '',
  );
  const [notas, setNotas] = useState(retirada.notas ?? '');

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar — ${retirada.imovel.codigo}`}
      maxWidth="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={() =>
              onSalvar({
                pessoaNome,
                pessoaContato: pessoaContato || null,
                pessoaTipo,
                prazoDevolucao: prazoDevolucao || null,
                notas: notas || null,
              })
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <input
              value={pessoaNome}
              onChange={(e) => setPessoaNome(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="WhatsApp / telefone">
            <input
              value={pessoaContato}
              onChange={(e) => setPessoaContato(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select
              value={pessoaTipo}
              onChange={(e) => setPessoaTipo(e.target.value as TipoPessoa)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(TIPO_LABEL) as TipoPessoa[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo de devolução">
            <input
              type="datetime-local"
              value={prazoDevolucao}
              onChange={(e) => setPrazoDevolucao(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
