'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './leads.module.css';

type Lead = {
  id: string;
  nome: string;
  whatsapp: string | null;
  etapa: string;
  temperatura: string;
  interesse: string | null;
  orcamento: number | null;
  notas: string | null;
  tipoLead?: string;
  origem?: string | null;
  imovel?: { titulo: string; codigo: string } | null;
  createdAt: string;
};

type TipoTab = 'COMPRADOR' | 'VENDEDOR';

// Etapas pra COMPRADOR (funil padrao)
const STAGES_COMPRADOR = [
  { id: 'NOVO', label: 'Novo Lead', color: '#3b82f6' },
  { id: 'CONTATO', label: 'Em Contato', color: '#8b5cf6' },
  { id: 'VISITA_AGENDADA', label: 'Visita Marcada', color: '#eab308' },
  { id: 'PROPOSTA', label: 'Proposta', color: '#f97316' },
  { id: 'FECHADO', label: 'Fechado ✓', color: '#22c55e' },
];

// Etapas pra VENDEDOR (captacao) — mesma enum subjacente, labels especificos
const STAGES_VENDEDOR = [
  { id: 'NOVO', label: 'Novo proprietário', color: '#3b82f6' },
  { id: 'CONTATO', label: 'Avaliação agendada', color: '#8b5cf6' },
  { id: 'VISITA_AGENDADA', label: 'Avaliado', color: '#eab308' },
  { id: 'PROPOSTA', label: 'Contrato em negociação', color: '#f97316' },
  { id: 'FECHADO', label: 'Listado ✓', color: '#22c55e' },
];

const TEMP_LABEL: Record<string, string> = { FRIO: 'Frio', MORNO: 'Morno', QUENTE: '🔥 Quente' };
const TEMP_CSS: Record<string, string> = { FRIO: styles.tagFrio, MORNO: styles.tagMorno, QUENTE: styles.tagHot };

function fmt(val: number | null) {
  if (!val) return '';
  return 'R$ ' + Number(val).toLocaleString('pt-BR');
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return Math.floor(diff / 60) + 'min';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

// Wrapper com Suspense pra useSearchParams() — Next 16 exige isso pra
// nao quebrar o prerender estatico.
export default function LeadsPageWrapper() {
  return (
    <Suspense fallback={<p className="text-muted mt-8 text-center">Carregando...</p>}>
      <LeadsPage />
    </Suspense>
  );
}

function LeadsPage() {
  const searchParams = useSearchParams();
  const initialTab: TipoTab = searchParams.get('tab') === 'vendedor' ? 'VENDEDOR' : 'COMPRADOR';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoTab, setTipoTab] = useState<TipoTab>(initialTab);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  // Form novo lead
  const [form, setForm] = useState({ nome: '', whatsapp: '', interesse: '', orcamento: '', imovelId: '' });

  // Imoveis disponiveis pra vincular ao lead (autocomplete)
  type ImovelOption = { id: string; codigo: string; titulo: string; bairro: string | null; cidade: string };
  const [imovelOptions, setImovelOptions] = useState<ImovelOption[]>([]);
  const [imovelSearch, setImovelSearch] = useState('');
  const [showImovelDropdown, setShowImovelDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => setLeads(d.data ?? []))
      .catch(() => toast.error('Erro ao carregar leads'))
      .finally(() => setLoading(false));
  }, []);

  // Busca lista de imoveis quando modal de novo lead abre (lazy + 1x)
  useEffect(() => {
    if (showModal && !selected && imovelOptions.length === 0) {
      fetch('/api/imoveis')
        .then(r => r.json())
        .then(d => setImovelOptions(d.data ?? []))
        .catch(() => {});
    }
  }, [showModal, selected, imovelOptions.length]);

  // Filtra options pela busca (codigo, titulo, bairro)
  const imovelMatches = imovelSearch.trim()
    ? imovelOptions.filter((i) => {
        const q = imovelSearch.toLowerCase();
        return (
          i.codigo.toLowerCase().includes(q) ||
          i.titulo.toLowerCase().includes(q) ||
          (i.bairro ?? '').toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : imovelOptions.slice(0, 8);

  const imovelSelecionado = form.imovelId
    ? imovelOptions.find((i) => i.id === form.imovelId)
    : null;

  // Conta por tipo pra mostrar nas tabs
  const counts = leads.reduce(
    (acc, l) => {
      const t = (l.tipoLead ?? 'COMPRADOR') as TipoTab;
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    { COMPRADOR: 0, VENDEDOR: 0 } as Record<TipoTab, number>,
  );

  const filtered = leads
    .filter((l) => (l.tipoLead ?? 'COMPRADOR') === tipoTab)
    .filter((l) =>
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      (l.imovel?.titulo ?? '').toLowerCase().includes(search.toLowerCase()),
    );

  const STAGES_VIEW = tipoTab === 'VENDEDOR' ? STAGES_VENDEDOR : STAGES_COMPRADOR;

  function onDragStart(id: string) { setDragging(id); }
  async function onDrop(stage: string) {
    if (!dragging || leads.find(l => l.id === dragging)?.etapa === stage) { setDragging(null); return; }
    setLeads(prev => prev.map(l => l.id === dragging ? { ...l, etapa: stage } : l));
    const id = dragging;
    setDragging(null);
    try {
      const res = await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, etapa: stage }) });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Erro ao mover lead');
    }
  }

  async function createLead() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          whatsapp: form.whatsapp,
          interesse: form.interesse,
          orcamento: form.orcamento ? Number(form.orcamento) : null,
          imovelId: form.imovelId || null,
          tipoLead: tipoTab, // novo lead manual entra na aba atualmente visualizada
        }),
      });
      const lead = await res.json();
      if (!res.ok) throw new Error(lead.error || 'Erro');
      setLeads(prev => [lead, ...prev]);
      setShowModal(false);
      setForm({ nome: '', whatsapp: '', interesse: '', orcamento: '', imovelId: '' });
      setImovelSearch('');
      setShowImovelDropdown(false);
      toast.success('Lead criado!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Pipeline de Negócios</h1>
          <p className="text-muted">Gerencie seu funil de vendas com drag & drop</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input" style={{ width: 240 }}
            placeholder="🔍 Buscar lead ou imóvel..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>+ Novo Lead</button>
        </div>
      </div>

      {/* Tabs: Compradores (default) vs Captacao (vendedores) */}
      <div className="mb-5 flex gap-1 rounded-lg bg-muted/40 p-1 w-fit">
        <button
          onClick={() => setTipoTab('COMPRADOR')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tipoTab === 'COMPRADOR' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏠 Compradores <span className="ml-1 opacity-60">({counts.COMPRADOR})</span>
        </button>
        <button
          onClick={() => setTipoTab('VENDEDOR')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tipoTab === 'VENDEDOR' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📝 Captação <span className="ml-1 opacity-60">({counts.VENDEDOR})</span>
        </button>
      </div>

      {/* METRICS */}
      <div className={styles.metricsRow}>
        {STAGES_VIEW.map(s => {
          const count = filtered.filter(l => l.etapa === s.id).length;
          return (
            <div key={s.id} className={styles.metricChip} style={{ borderColor: s.color + '44' }}>
              <span style={{ color: s.color, fontWeight: 700 }}>{count}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted mt-8 text-center">Carregando leads...</p>
      ) : (
        <div className={styles.kanban}>
          {STAGES_VIEW.map(stage => {
            const col = filtered.filter(l => l.etapa === stage.id);
            return (
              <div
                key={stage.id} className={styles.col}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(stage.id)}
              >
                <div className={styles.colHeader} style={{ borderColor: stage.color + '66' }}>
                  <div className="flex items-center gap-2">
                    <div className={styles.colDot} style={{ background: stage.color }} />
                    <span className={styles.colTitle} style={{ color: stage.color }}>{stage.label.toUpperCase()}</span>
                  </div>
                  <span className={styles.colCount}>{col.length}</span>
                </div>

                <div className={styles.cards}>
                  {col.map(lead => (
                    <div
                      key={lead.id} className={styles.leadCard}
                      draggable onDragStart={() => onDragStart(lead.id)}
                      onClick={() => { setSelected(lead); setShowModal(true); }}
                    >
                      {lead.temperatura !== 'MORNO' && (
                        <span className={`${styles.tag} ${TEMP_CSS[lead.temperatura]}`}>{TEMP_LABEL[lead.temperatura]}</span>
                      )}
                      <p className={styles.leadName}>{lead.nome}</p>
                      {lead.imovel && <p className={styles.leadImovel}>{lead.imovel.titulo}</p>}
                      {lead.interesse && !lead.imovel && <p className={styles.leadImovel}>{lead.interesse}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className={styles.leadValue}>{fmt(lead.orcamento)}</span>
                        <span className={styles.leadTime}>{timeAgo(lead.createdAt)}</span>
                      </div>
                      {lead.whatsapp && (
                        <div className={styles.leadFooter}>
                          <span className={styles.leadPhone}>📱 {lead.whatsapp}</span>
                          <button className="btn btn-icon btn-ghost btn-sm" title="WhatsApp"
                            onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`, '_blank'); }}>💬</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className={styles.emptyCol}>
                      {leads.length === 0 && stage.id === 'NOVO' ? 'Seus leads aparecerão aqui' : 'Arraste leads aqui'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leads.length === 0 && !loading && (
        <div className="text-center mt-4">
          <p className="text-muted text-sm">Nenhum lead ainda. Eles chegam automaticamente pelo seu site ou WhatsApp.</p>
          <button className="btn btn-secondary btn-sm mt-2" onClick={() => { setSelected(null); setShowModal(true); }}>Adicionar lead manualmente</button>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3>{selected ? selected.nome : 'Novo Lead'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {selected ? (
              <div className="flex flex-col gap-3">
                <div className="grid-2">
                  <div className="form-group"><label className="label">Nome</label><input className="input" defaultValue={selected.nome} /></div>
                  <div className="form-group"><label className="label">WhatsApp</label><input className="input" defaultValue={selected.whatsapp ?? ''} /></div>
                </div>
                <div className="form-group"><label className="label">Interesse</label><input className="input" defaultValue={selected.interesse ?? ''} /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="label">Orçamento</label><input className="input" defaultValue={selected.orcamento?.toString() ?? ''} /></div>
                  <div className="form-group"><label className="label">Etapa</label>
                    <select className="input" defaultValue={selected.etapa}>
                      {STAGES_VIEW.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="label">Notas</label><textarea className="input" defaultValue={selected.notas ?? ''} placeholder="Observações sobre este lead..." /></div>
                <button className="btn btn-primary w-full">Salvar</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid-2">
                  <div className="form-group"><label className="label">Nome *</label>
                    <input className="input" placeholder="Nome do lead" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div className="form-group"><label className="label">WhatsApp</label>
                    <input className="input" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label className="label">O que busca?</label>
                  <input className="input" placeholder="Ex: Apartamento 3 quartos no Jardins" value={form.interesse} onChange={e => setForm(p => ({ ...p, interesse: e.target.value }))} /></div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="label">Imóvel de interesse (opcional)</label>
                  {imovelSelecionado ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/20 px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">{imovelSelecionado.codigo}</div>
                        <div className="truncate text-sm font-medium">{imovelSelecionado.titulo}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[imovelSelecionado.bairro, imovelSelecionado.cidade].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setForm(p => ({ ...p, imovelId: '' })); setImovelSearch(''); }}
                        className="shrink-0 rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-red-600"
                        aria-label="Remover"
                      >✕</button>
                    </div>
                  ) : (
                    <>
                      <input
                        className="input"
                        placeholder="Busca por código (IMV-1234), título ou bairro"
                        value={imovelSearch}
                        onChange={e => { setImovelSearch(e.target.value); setShowImovelDropdown(true); }}
                        onFocus={() => setShowImovelDropdown(true)}
                        onBlur={() => setTimeout(() => setShowImovelDropdown(false), 150)}
                      />
                      {showImovelDropdown && imovelMatches.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-input bg-white shadow-lg">
                          {imovelMatches.map(i => (
                            <button
                              key={i.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setForm(p => ({ ...p, imovelId: i.id }));
                                setImovelSearch('');
                                setShowImovelDropdown(false);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{i.codigo}</span>
                                <span className="truncate font-medium">{i.titulo}</span>
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {[i.bairro, i.cidade].filter(Boolean).join(' · ')}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {showImovelDropdown && imovelSearch.trim() && imovelMatches.length === 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-muted-foreground shadow-lg">
                          Nenhum imóvel encontrado
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group"><label className="label">Orçamento (R$)</label>
                  <input className="input" type="number" placeholder="Ex: 750000" value={form.orcamento} onChange={e => setForm(p => ({ ...p, orcamento: e.target.value }))} /></div>
                <button className="btn btn-primary w-full" onClick={createLead} disabled={saving}>{saving ? 'Criando...' : 'Criar Lead'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
