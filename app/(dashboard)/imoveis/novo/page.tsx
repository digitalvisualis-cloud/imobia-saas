'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mic } from 'lucide-react';
import { CadastroPorVozModal, type ExtraidoVoz } from '@/components/imoveis/CadastroPorVozModal';
import styles from './novo.module.css';

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

export default function NovoImovelPage() {
  const router = useRouter();

  // Tipo & operação
  const [tipo, setTipo] = useState('');
  const [operacao, setOperacao] = useState('Venda');

  // Localização (campos separados — estilo Lano)
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Preço & dimensões
  const [preco, setPreco] = useState('');
  const [quartos, setQuartos] = useState(0);
  const [suites, setSuites] = useState(0);
  const [banheiros, setBanheiros] = useState(0);
  const [vagas, setVagas] = useState(0);
  const [area, setArea] = useState('');
  const [areaTotal, setAreaTotal] = useState('');

  // Características & diferenciais (antes "amenidades")
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState('');

  // Mídia
  const [videoUrl, setVideoUrl] = useState('');

  // Descrição (com IA opcional)
  const [generating, setGenerating] = useState(false);
  const [desc, setDesc] = useState('');

  const [saving, setSaving] = useState(false);

  // Cadastro por voz (beta) — modal grava audio, IA preenche os campos
  const [openVoz, setOpenVoz] = useState(false);

  function aplicarVoz(d: ExtraidoVoz) {
    // Cada campo so preenche se o usuario nao tinha digitado nada — assim
    // se ele rodar voz 2x ou misturar com digitacao manual, nao perde nada.
    if (d.tipo && !tipo) setTipo(d.tipo);
    if (d.operacao && operacao === 'Venda') setOperacao(d.operacao);
    if (d.bairro && !bairro) setBairro(d.bairro);
    if (d.cidade && !cidade) setCidade(d.cidade);
    if (d.estado && estado === 'SP') setEstado(d.estado);
    if (d.preco != null && !preco) setPreco(String(d.preco));
    if (d.quartos != null && quartos === 0) setQuartos(d.quartos);
    if (d.suites != null && suites === 0) setSuites(d.suites);
    if (d.banheiros != null && banheiros === 0) setBanheiros(d.banheiros);
    if (d.vagas != null && vagas === 0) setVagas(d.vagas);
    if (d.areaM2 != null && !area) setArea(String(d.areaM2));
    if (d.areaTotal != null && !areaTotal) setAreaTotal(String(d.areaTotal));
    if (d.caracteristicas?.length) {
      setCaracteristicas((prev) => {
        const set = new Set(prev);
        d.caracteristicas.forEach((c) => set.add(c));
        return Array.from(set);
      });
    }
    if (d.descricao && !desc) setDesc(d.descricao);
  }

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
      if (data.logradouro && !rua) setRua(data.logradouro);
      if (data.bairro && !bairro) setBairro(data.bairro);
      if (data.localidade && !cidade) setCidade(data.localidade);
      if (data.uf) setEstado(data.uf);
      toast.success('Endereço preenchido');
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
          tipo,
          operacao,
          bairro,
          cidade,
          quartos,
          suites,
          banheiros,
          vagas,
          area,
          areaTotal,
          amenidades: caracteristicas,
        }),
      });
      const data = await res.json();
      if (res.ok && data.descricao) {
        setDesc(data.descricao);
        toast.success('Descrição gerada');
      } else {
        // mostra a mensagem REAL da OpenAI (chave inválida, sem créditos, etc)
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
    if (!tipo || !operacao) {
      toast.error('Selecione tipo e operação');
      return;
    }
    if (!cidade) {
      toast.error('Cidade é obrigatória');
      return;
    }
    if (!preco) {
      toast.error('Preço é obrigatório');
      return;
    }

    setSaving(true);
    try {
      // Concatena rua + número + complemento no campo `endereco`
      const enderecoCompleto = [
        rua,
        numero ? `${numero}` : '',
        complemento ? `(${complemento})` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const fd = new FormData();
      fd.append('tipo', tipo);
      fd.append('operacao', operacao);
      fd.append('cep', cep);
      fd.append('endereco', enderecoCompleto);
      fd.append('numero', numero);
      fd.append('complemento', complemento);
      fd.append('bairro', bairro);
      fd.append('cidade', cidade);
      fd.append('estado', estado);
      // Compat: API atual espera "cidadeBairro" — manda combinado também
      fd.append('cidadeBairro', [bairro, cidade].filter(Boolean).join(', '));

      fd.append('preco', preco);
      fd.append('quartos', quartos.toString());
      fd.append('suites', suites.toString());
      fd.append('banheiros', banheiros.toString());
      fd.append('vagas', vagas.toString());
      fd.append('area', area);
      fd.append('areaTotal', areaTotal || area);
      fd.append('amenidades', JSON.stringify(caracteristicas));
      fd.append('descricao', desc);
      fd.append('videoUrl', videoUrl);

      const res = await fetch('/api/imoveis', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.imovel?.id) {
        toast.success('Imóvel cadastrado! Agora adicione as fotos.');
        router.push(`/imoveis/${data.imovel.id}/fotos`);
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar imóvel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="mb-6">
        <h1>Cadastrar novo imóvel</h1>
        <p className="text-muted">Preencha os dados. As fotos você adiciona no próximo passo.</p>
      </div>

      {/* Atalho — cadastro por voz */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-emerald-50 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-violet-600 text-white">
            <Mic className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">Cadastrar por voz <span className="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">beta</span></div>
            <div className="text-xs text-muted-foreground">Descreva o imóvel falando e a IA preenche o formulário pra você revisar.</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpenVoz(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Mic className="h-4 w-4" /> Gravar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* BLOCO 1 — TIPO E OPERAÇÃO */}
        <div className="card">
          <h3 className="mb-4">🏠 Tipo do imóvel</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Tipo *</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                <option value="">Selecionar...</option>
                <option>Casa</option>
                <option>Apartamento</option>
                <option>Cobertura</option>
                <option>Studio</option>
                <option>Terreno</option>
                <option>Sala Comercial</option>
                <option>Loja</option>
                <option>Galpão</option>
                <option>Chácara</option>
                <option>Sítio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Operação *</label>
              <select className="input" value={operacao} onChange={(e) => setOperacao(e.target.value)} required>
                <option>Venda</option>
                <option>Aluguel</option>
                <option>Temporada</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 2 — LOCALIZAÇÃO (campos separados, com busca CEP) */}
        <div className="card">
          <h3 className="mb-4">📍 Localização</h3>

          <div className={styles.cepRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">CEP *</label>
              <input
                className="input"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={() => cep.replace(/\D/g, '').length === 8 && buscarCep()}
                maxLength={9}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={buscarCep}
              disabled={buscandoCep || !cep}
              style={{ alignSelf: 'flex-end', height: 40 }}
            >
              {buscandoCep ? 'Buscando…' : '🔍 Buscar CEP'}
            </button>
          </div>

          <div className="form-group mt-3">
            <label className="label">Endereço (rua/avenida)</label>
            <input
              className="input"
              placeholder="Ex: Avenida Paulista"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
            />
          </div>

          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Número</label>
              <input
                className="input"
                placeholder="Ex: 1234"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Complemento</label>
              <input
                className="input"
                placeholder="Ex: Apto 502, Bloco B"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group mt-3">
            <label className="label">Bairro</label>
            <input
              className="input"
              placeholder="Ex: Jardim Maristela"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
          </div>

          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Cidade *</label>
              <input
                className="input"
                placeholder="Ex: São Paulo"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Estado *</label>
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)} required>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapa Google embed — sem pin exato, so a regiao.
              Prioriza CEP (zoom nivel rua) > bairro > cidade. */}
          {(cidade || cep.replace(/\D/g, '').length === 8) && (() => {
            const cepClean = cep.replace(/\D/g, '');
            const hasCep = cepClean.length === 8;
            const mapQuery = hasCep
              ? cepClean
              : [bairro, cidade, estado].filter(Boolean).join(', ');
            const zoom = hasCep ? 16 : bairro ? 15 : 13;
            return (
              <div className="form-group mt-4">
                <label className="label">Localização aproximada no mapa</label>
                <div className="overflow-hidden rounded-md border border-input" style={{ height: 240 }}>
                  <iframe
                    title="Localização aproximada"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${zoom}&output=embed`}
                    width="100%"
                    height="240"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  {hasCep
                    ? 'Centralizado pelo CEP (nível de rua, sem número exato — preserva privacidade).'
                    : 'Mostra a região do bairro/cidade. Preenche o CEP pra mais precisão.'}
                </p>
              </div>
            );
          })()}
        </div>

        {/* BLOCO 3 — PREÇO E DIMENSÕES */}
        <div className="card">
          <h3 className="mb-4">💰 Preço e dimensões</h3>
          <div className="form-group mb-3">
            <label className="label">Preço *</label>
            <div className={styles.priceInput}>
              <span className={styles.currency}>R$</span>
              <input
                className="input"
                style={{ borderLeft: 'none', borderRadius: '0 6px 6px 0' }}
                placeholder="Ex: 750.000"
                type="text"
                inputMode="numeric"
                // Mostra com separador de milhar (1.500.000) — o state preco
                // guarda so digitos ('1500000'), o backend recebe raw.
                value={preco.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                onChange={(e) => setPreco(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <NumInput label="Quartos" value={quartos} onChange={setQuartos} />
            <NumInput label="Suítes" value={suites} onChange={setSuites} />
          </div>
          <div className="grid-2 mt-3">
            <NumInput label="Banheiros" value={banheiros} onChange={setBanheiros} />
            <NumInput label="Vagas de garagem" value={vagas} onChange={setVagas} />
          </div>
          <div className="grid-2 mt-3">
            <div className="form-group">
              <label className="label">Área útil (m²) *</label>
              <input
                className="input"
                placeholder="Ex: 85"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Área total (m²)</label>
              <input
                className="input"
                placeholder="Ex: 120"
                type="number"
                value={areaTotal}
                onChange={(e) => setAreaTotal(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* BLOCO 4 — CARACTERÍSTICAS E DIFERENCIAIS */}
        <div className="card">
          <h3 className="mb-1">✨ Características e diferenciais</h3>
          <p className="text-xs text-muted mb-4">
            Marque as características da unidade e do condomínio. Não achou alguma? Adiciona embaixo.
          </p>

          <div className={styles.amenidadesGrid}>
            {CARACTERISTICAS.map((a) => (
              <button
                key={a}
                type="button"
                className={`${styles.amenidadeChip} ${caracteristicas.includes(a) ? styles.amenidadeActive : ''}`}
                onClick={() => toggleCaracteristica(a)}
              >
                {caracteristicas.includes(a) ? '✓ ' : ''}
                {a}
              </button>
            ))}
          </div>

          {/* Customs adicionados */}
          {caracteristicas.filter((c) => !CARACTERISTICAS.includes(c)).length > 0 && (
            <>
              <p className="text-xs text-muted mt-4 mb-2">Suas adicionadas:</p>
              <div className={styles.amenidadesGrid}>
                {caracteristicas
                  .filter((c) => !CARACTERISTICAS.includes(c))
                  .map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.amenidadeChip} ${styles.amenidadeActive}`}
                      onClick={() => toggleCaracteristica(c)}
                      title="Clique pra remover"
                    >
                      ✓ {c} ✕
                    </button>
                  ))}
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Adicionar outra característica</label>
              <input
                className="input"
                placeholder="Ex: Vista panorâmica, Bicicletário, Lavanderia compartilhada…"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarCustom();
                  }
                }}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={adicionarCustom} disabled={!novoItem.trim()}>
              + Adicionar
            </button>
          </div>
        </div>

        {/* BLOCO 5 — DESCRIÇÃO */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ margin: 0 }}>📝 Descrição</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={generateDesc}
              disabled={generating}
              title="Usa os dados acima pra gerar uma descrição chamativa"
            >
              {generating ? 'Gerando…' : '✨ Gerar com IA'}
            </button>
          </div>
          <textarea
            className="input"
            rows={6}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descreva o imóvel ou clique em &quot;Gerar com IA&quot;…"
          />
        </div>

        {/* BLOCO 6 — VÍDEO */}
        <div className="card">
          <h3 className="mb-4">🎬 Vídeo</h3>
          <div className="form-group">
            <label className="label">Link do YouTube ou Vimeo — opcional</label>
            <input
              className="input"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">
              Cola a URL pública. O vídeo aparece embedado no site do imóvel.
            </p>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : '🚀 Cadastrar e adicionar fotos'}
          </button>
        </div>
      </form>

      <CadastroPorVozModal
        open={openVoz}
        onClose={() => setOpenVoz(false)}
        onResult={aplicarVoz}
      />
    </div>
  );
}
