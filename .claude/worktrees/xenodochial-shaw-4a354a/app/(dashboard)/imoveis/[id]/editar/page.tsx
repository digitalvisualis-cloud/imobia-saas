'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../../novo/novo.module.css';

const CARACTERISTICAS = [
  'Piscina', 'Jardim', 'Terraço', 'Churrasqueira', 'Academia', 'Segurança 24h',
  'Elevador', 'Dep. Serviço', 'Despensa', 'Rooftop', 'Playground', 'Pet Friendly',
  'Mobiliado', 'Ar condicionado', 'Aquecimento', 'Cozinha planejada', 'Varanda', 'Lareira',
  'Home Office', 'Sauna', 'Salão de festas', 'Portaria 24h',
];

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// Reverse mapping enum → label
const REV_TIPO: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  CHACARA: 'Chácara',
  SITIO: 'Sítio',
};
const REV_OPERACAO: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  TEMPORADA: 'Temporada',
};

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className={styles.numInput}>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function EditarImovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Tipo & operação
  const [tipo, setTipo] = useState('');
  const [operacao, setOperacao] = useState('Venda');

  // Localização
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Preço & specs
  const [preco, setPreco] = useState('');
  const [quartos, setQuartos] = useState(0);
  const [suites, setSuites] = useState(0);
  const [banheiros, setBanheiros] = useState(0);
  const [vagas, setVagas] = useState(0);
  const [area, setArea] = useState('');
  const [areaTotal, setAreaTotal] = useState('');

  // Características
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState('');

  // Mídia & descrição
  const [videoUrl, setVideoUrl] = useState('');
  const [desc, setDesc] = useState('');

  const [codigo, setCodigo] = useState('');
  const [titulo, setTitulo] = useState('');

  // Carrega dados do imóvel
  useEffect(() => {
    fetch(`/api/imoveis/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast.error(d.error);
          return;
        }
        setTipo(REV_TIPO[d.tipo] || d.tipo || '');
        setOperacao(REV_OPERACAO[d.operacao] || d.operacao || 'Venda');
        setCep(d.cep || '');
        // Tenta separar endereço se vier concatenado "Rua, Número, (Comp)"
        const enderecoFull = d.endereco || '';
        // Heurística simples: primeira parte é rua, resto fica em rua mesmo (não dá pra separar 100%)
        setRua(enderecoFull);
        setBairro(d.bairro || '');
        setCidade(d.cidade || '');
        setEstado(d.estado || 'SP');
        setPreco(String(d.preco ?? ''));
        setQuartos(d.quartos ?? 0);
        setSuites(d.suites ?? 0);
        setBanheiros(d.banheiros ?? 0);
        setVagas(d.vagas ?? 0);
        setArea(String(d.areaM2 ?? ''));
        setAreaTotal(String(d.areaTotal ?? ''));
        setCaracteristicas(Array.isArray(d.amenidades) ? d.amenidades : []);
        setVideoUrl(d.videoUrl || '');
        setDesc(d.descricao || '');
        setCodigo(d.codigo || '');
        setTitulo(d.titulo || '');
      })
      .catch(() => toast.error('Erro ao carregar imóvel'))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleCaracteristica(a: string) {
    setCaracteristicas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function adicionarCustom() {
    const v = novoItem.trim();
    if (!v) return;
    if (caracteristicas.includes(v)) {
      toast.error('Já adicionado');
      setNovoItem('');
      return;
    }
    setCaracteristicas((prev) => [...prev, v]);
    setNovoItem('');
  }

  async function buscarCep() {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) {
      toast.error('CEP precisa ter 8 dígitos');
      return;
    }
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      if (data.logradouro) setRua(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setEstado(data.uf);
      toast.success('Endereço atualizado');
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  }

  async function generateDesc() {
    if (!tipo || !operacao || (!cidade && !bairro)) {
      toast.error('Preencha tipo, operação e cidade/bairro antes');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ia/descricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo, operacao, bairro, cidade,
          quartos, suites, banheiros, vagas,
          area, areaTotal,
          amenidades: caracteristicas,
        }),
      });
      const data = await res.json();
      if (res.ok && data.descricao) {
        setDesc(data.descricao);
        toast.success('Descrição gerada');
      } else {
        toast.error(data.error || `Erro ${res.status}`);
      }
    } catch (e: any) {
      toast.error('Erro de conexão: ' + (e.message || ''));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo || !operacao) { toast.error('Selecione tipo e operação'); return; }
    if (!cidade) { toast.error('Cidade é obrigatória'); return; }
    if (!preco) { toast.error('Preço é obrigatório'); return; }

    setSaving(true);
    try {
      const enderecoCompleto = [
        rua,
        numero ? `${numero}` : '',
        complemento ? `(${complemento})` : '',
      ].filter(Boolean).join(', ');

      const body = {
        tipo,
        operacao,
        cep,
        endereco: enderecoCompleto,
        bairro,
        cidade,
        estado,
        preco: Number(preco),
        quartos,
        suites,
        banheiros,
        vagas,
        areaM2: Number(area),
        areaTotal: Number(areaTotal || area),
        amenidades: caracteristicas,
        descricao: desc,
        videoUrl,
      };

      const res = await fetch(`/api/imoveis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Imóvel atualizado!');
        router.push(`/imoveis/${id}`);
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-muted">Carregando imóvel…</div>;
  }

  return (
    <div className={styles.page}>
      <div className="mb-6">
        <Link href={`/imoveis/${id}`} className="text-muted hover:text-primary text-sm">
          ← Voltar pro imóvel
        </Link>
        <h1 className="mt-1">Editar imóvel</h1>
        <p className="text-muted">
          {titulo} <span className="text-xs font-mono">· {codigo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* TIPO E OPERAÇÃO */}
        <div className="card">
          <h3 className="mb-4">🏠 Tipo do imóvel</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Tipo *</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                <option value="">Selecionar...</option>
                <option>Casa</option><option>Apartamento</option><option>Cobertura</option>
                <option>Studio</option><option>Terreno</option><option>Sala Comercial</option>
                <option>Loja</option><option>Galpão</option><option>Chácara</option><option>Sítio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Operação *</label>
              <select className="input" value={operacao} onChange={(e) => setOperacao(e.target.value)} required>
                <option>Venda</option><option>Aluguel</option><option>Temporada</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOCALIZAÇÃO */}
        <div className="card">
          <h3 className="mb-4">📍 Localização</h3>
          <div className={styles.cepRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">CEP</label>
              <input className="input" placeholder="00000-000" value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={() => cep.replace(/\D/g, '').length === 8 && buscarCep()}
                maxLength={9} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={buscarCep}
              disabled={buscandoCep || !cep} style={{ alignSelf: 'flex-end', height: 40 }}>
              {buscandoCep ? 'Buscando…' : '🔍 Buscar CEP'}
            </button>
          </div>

          <div className="form-group mt-3">
            <label className="label">Endereço (rua/avenida)</label>
            <input className="input" value={rua} onChange={(e) => setRua(e.target.value)} />
          </div>

          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Número</label>
              <input className="input" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Complemento</label>
              <input className="input" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
            </div>
          </div>

          <div className="form-group mt-3">
            <label className="label">Bairro</label>
            <input className="input" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>

          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Cidade *</label>
              <input className="input" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Estado *</label>
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)} required>
                {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* PREÇO E DIMENSÕES */}
        <div className="card">
          <h3 className="mb-4">💰 Preço e dimensões</h3>
          <div className="form-group mb-3">
            <label className="label">Preço *</label>
            <div className={styles.priceInput}>
              <span className={styles.currency}>R$</span>
              <input className="input" style={{ borderLeft: 'none', borderRadius: '0 6px 6px 0' }}
                type="number" value={preco} onChange={(e) => setPreco(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2"><NumInput label="Quartos" value={quartos} onChange={setQuartos} /><NumInput label="Suítes" value={suites} onChange={setSuites} /></div>
          <div className="grid-2 mt-3"><NumInput label="Banheiros" value={banheiros} onChange={setBanheiros} /><NumInput label="Vagas de garagem" value={vagas} onChange={setVagas} /></div>
          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Área útil (m²) *</label>
              <input className="input" type="number" value={area} onChange={(e) => setArea(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Área total (m²)</label>
              <input className="input" type="number" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} />
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS */}
        <div className="card">
          <h3 className="mb-1">✨ Características e diferenciais</h3>
          <p className="text-xs text-muted mb-4">
            Marque as características. Não achou alguma? Adiciona embaixo.
          </p>

          <div className={styles.amenidadesGrid}>
            {CARACTERISTICAS.map((a) => (
              <button key={a} type="button"
                className={`${styles.amenidadeChip} ${caracteristicas.includes(a) ? styles.amenidadeActive : ''}`}
                onClick={() => toggleCaracteristica(a)}>
                {caracteristicas.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
          </div>

          {caracteristicas.filter((c) => !CARACTERISTICAS.includes(c)).length > 0 && (
            <>
              <p className="text-xs text-muted mt-4 mb-2">Suas adicionadas:</p>
              <div className={styles.amenidadesGrid}>
                {caracteristicas.filter((c) => !CARACTERISTICAS.includes(c)).map((c) => (
                  <button key={c} type="button"
                    className={`${styles.amenidadeChip} ${styles.amenidadeActive}`}
                    onClick={() => toggleCaracteristica(c)}
                    title="Clique pra remover">
                    ✓ {c} ✕
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Adicionar outra característica</label>
              <input className="input"
                placeholder="Ex: Vista panorâmica, Bicicletário…"
                value={novoItem} onChange={(e) => setNovoItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCustom(); }}} />
            </div>
            <button type="button" className="btn btn-secondary"
              onClick={adicionarCustom} disabled={!novoItem.trim()}>+ Adicionar</button>
          </div>
        </div>

        {/* DESCRIÇÃO E VÍDEO */}
        <div className="card">
          <h3 className="mb-4">📝 Descrição e vídeo</h3>

          <div className="form-group mb-4">
            <label className="label">Link do vídeo (YouTube ou Vimeo) — opcional</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>

          <div className="flex justify-between items-center mb-2">
            <label className="label" style={{ marginBottom: 0 }}>Descrição</label>
            <button type="button" className="btn btn-secondary btn-sm"
              onClick={generateDesc} disabled={generating}>
              {generating ? 'Gerando…' : '✨ Gerar com IA'}
            </button>
          </div>
          <textarea className="input" rows={6} value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder='Descreva o imóvel ou clique em "Gerar com IA"…' />
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : '💾 Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
