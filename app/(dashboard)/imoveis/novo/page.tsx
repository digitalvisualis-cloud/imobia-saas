'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './novo.module.css';

const AMENIDADES = [
  'Piscina','Jardim','Terraço','Churrasqueira','Academia','Segurança 24h',
  'Elevador','Dep. Serviço','Despensa','Rooftop','Playground','Pet Friendly',
  'Mobiliado','Ar condicionado','Aquecimento','Cozinha planejada','Varanda','Lareira',
  'Home Office','Sauna','Salão de festas','Portaria 24h',
];

function NumInput({ label, value, onChange }: { label: string; value: number; onChange:(v:number)=>void }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className={styles.numInput}>
        <button type="button" onClick={()=>onChange(Math.max(0,value-1))}>−</button>
        <span>{value}</span>
        <button type="button" onClick={()=>onChange(value+1)}>+</button>
      </div>
    </div>
  );
}

export default function NovoImovelPage() {
  const router = useRouter();
  
  // Dados do imóvel
  const [tipo, setTipo] = useState('');
  const [operacao, setOperacao] = useState('Venda');
  const [estado, setEstado] = useState('São Paulo');
  const [cidadeBairro, setCidadeBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  
  // Preço e specs
  const [preco, setPreco] = useState('');
  const [quartos, setQuartos] = useState(0);
  const [banheiros, setBanheiros] = useState(0);
  const [area, setArea] = useState('');
  const [areaTotal, setAreaTotal] = useState('');
  const [vagas, setVagas] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Amenidades
  const [amenidades, setAmenidades] = useState<string[]>([]);
  
  // Fotos
  const [fotos, setFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IA Descrição
  const [generating, setGenerating] = useState(false);
  const [desc, setDesc] = useState('');
  
  // ListaPro
  const [videoTipo, setVideoTipo] = useState('Cinematográfico');
  const [voiceoverVoz, setVoiceoverVoz] = useState('Masculina');
  const [voiceoverTom, setVoiceoverTom] = useState('Consultivo');
  const [voiceoverContexto, setVoiceoverContexto] = useState('');
  
  const [saving, setSaving] = useState(false);

  function toggleAmenidade(a: string) {
    setAmenidades(prev => prev.includes(a) ? prev.filter(x=>x!==a) : [...prev, a]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFotos(prev => [...prev, ...newFiles]);
    }
  }

  function removeFoto(index: number) {
    setFotos(prev => prev.filter((_, i) => i !== index));
  }

  function moveFoto(index: number, direction: 'left' | 'right') {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fotos.length) return;
    
    setFotos(prev => {
      const newFotos = [...prev];
      const temp = newFotos[index];
      newFotos[index] = newFotos[newIndex];
      newFotos[newIndex] = temp;
      return newFotos;
    });
  }

  async function generateDesc() {
    if (!tipo || !operacao || !cidadeBairro) {
      alert('Preencha Tipo, Operação e Cidade/Bairro antes de gerar a descrição.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ia/descricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, operacao, cidadeBairro, quartos, banheiros, vagas, area, amenidades }),
      });
      const data = await res.json();
      if (data.descricao) {
        setDesc(data.descricao);
      } else {
        alert(data.error || 'Erro ao gerar descrição.');
      }
    } catch (e) {
      alert('Erro de conexão ao gerar descrição.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo || !operacao) return alert('Por favor, selecione o Tipo e a Operação.');
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('operacao', operacao);
      formData.append('cidadeBairro', cidadeBairro);
      formData.append('endereco', endereco);
      formData.append('preco', preco);
      formData.append('quartos', quartos.toString());
      formData.append('banheiros', banheiros.toString());
      formData.append('vagas', vagas.toString());
      formData.append('area', area);
      formData.append('areaTotal', areaTotal);
      formData.append('amenidades', JSON.stringify(amenidades));
      formData.append('descricao', desc);
      formData.append('videoUrl', videoUrl);
      
      // ListaPro
      formData.append('videoTipo', videoTipo);
      formData.append('voiceoverVoz', voiceoverVoz);
      formData.append('voiceoverTom', voiceoverTom);
      formData.append('voiceoverContexto', voiceoverContexto);
      
      fotos.forEach(f => formData.append('fotos', f));

      const res = await fetch('/api/imoveis', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Imóvel publicado com sucesso!');
        router.push('/imoveis');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar imóvel.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="mb-6">
        <h1>Cadastrar Novo Imóvel</h1>
        <p className="text-muted">Preencha os dados e use a IA para otimizar o anúncio.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* BLOCO 1: DADOS BÁSICOS */}
        <div className="card">
          <h3 className="mb-4">📍 Localização e Tipo</h3>
          <div className="grid-2 mb-3">
            <div className="form-group">
              <label className="label">TIPO DE IMÓVEL *</label>
              <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)} required>
                <option value="">Selecionar...</option>
                <option>Apartamento</option><option>Casa</option><option>Terreno</option>
                <option>Comercial</option><option>Studio</option><option>Cobertura</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">OPERAÇÃO *</label>
              <select className="input" value={operacao} onChange={e=>setOperacao(e.target.value)} required>
                <option value="">Selecionar...</option>
                <option>Venda</option><option>Aluguel</option><option>Temporada</option>
              </select>
            </div>
          </div>
          <div className="grid-2 mb-3">
            <div className="form-group">
              <label className="label">CIDADE / BAIRRO *</label>
              <input className="input" placeholder="Ex: Pinheiros, São Paulo" value={cidadeBairro} onChange={e=>setCidadeBairro(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">ENDEREÇO (opcional)</label>
              <input className="input" placeholder="Rua, número" value={endereco} onChange={e=>setEndereco(e.target.value)} />
            </div>
          </div>
        </div>

        {/* BLOCO 2: CARACTERÍSTICAS */}
        <div className="card">
          <h3 className="mb-4">📐 Preço e Dimensões</h3>
          <div className="form-group mb-3">
            <label className="label">PREÇO *</label>
            <div className={styles.priceInput}>
              <span className={styles.currency}>R$</span>
              <input className="input" style={{ borderLeft:'none', borderRadius:'0 6px 6px 0' }} placeholder="Ex: 750000" type="number" value={preco} onChange={e=>setPreco(e.target.value)} required />
            </div>
          </div>
          <div className="grid-2 mb-3">
            <NumInput label="QUARTOS" value={quartos} onChange={setQuartos} />
            <NumInput label="BANHEIROS" value={banheiros} onChange={setBanheiros} />
          </div>
          <div className="grid-3 mb-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="label">ÁREA ÚTIL (m²) *</label>
              <input className="input" placeholder="Ex: 85" type="number" value={area} onChange={e=>setArea(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">ÁREA TOTAL (m²)</label>
              <input className="input" placeholder="Ex: 120" type="number" value={areaTotal} onChange={e=>setAreaTotal(e.target.value)} />
            </div>
            <NumInput label="VAGAS" value={vagas} onChange={setVagas} />
          </div>
        </div>

        {/* BLOCO 3: AMENIDADES */}
        <div className="card">
          <h3 className="mb-4">✨ Amenidades</h3>
          <div className={styles.amenidadesGrid}>
            {AMENIDADES.map(a => (
              <button
                key={a} type="button"
                className={`${styles.amenidadeChip} ${amenidades.includes(a)?styles.amenidadeActive:''}`}
                onClick={()=>toggleAmenidade(a)}
              >
                {amenidades.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
          </div>
        </div>

        {/* BLOCO 4: MÍDIA */}
        <div className="card">
          <h3 className="mb-4">📸 Fotos e Vídeo</h3>
          <div className="form-group mb-4">
            <label className="label">LINK DO VÍDEO (YouTube/Vimeo)</label>
            <input className="input" placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} />
          </div>
          
          <label className="label">FOTOS DO IMÓVEL (A primeira será a capa)</label>
          <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
            <div className={styles.uploadIcon}>📸</div>
            <p className="font-semibold mb-1">Clique para selecionar fotos</p>
            <p className="text-xs text-muted">Formatos: JPG, PNG, WEBP (Máx 10MB)</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={handleFileSelect} />
          </div>
          
          {fotos.length > 0 && (
            <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border)', aspectRatio: '1/1' }}>
                  <img src={URL.createObjectURL(f)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>CAPA</span>}
                  
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={()=>moveFoto(i, 'left')} disabled={i === 0} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', opacity: i===0?0.5:1 }}>◀</button>
                      <button type="button" onClick={()=>moveFoto(i, 'right')} disabled={i === fotos.length - 1} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', opacity: i===fotos.length-1?0.5:1 }}>▶</button>
                    </div>
                    <button type="button" onClick={()=>removeFoto(i)} style={{ background:'none', border:'none', color:'#ff5f56', cursor:'pointer', fontWeight:'bold' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOCO 5: IA E DESCRIÇÃO */}
        <div className="card">
          <h3 className="mb-4">🤖 Descrição do Imóvel</h3>
          <div className={styles.aiDescCard}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-medium text-sm">Gerar com IA</p>
                <p className="text-xs text-muted">A IA usará os dados acima para criar o texto.</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={generateDesc} disabled={generating}>
                {generating ? 'Gerando...' : '✨ Gerar Texto'}
              </button>
            </div>
            <textarea className="input" rows={6} value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Digite a descrição ou clique em Gerar Texto..." required />
          </div>
        </div>

        {/* BLOCO 6: GERAÇÃO DE MÍDIA COM IA */}
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 20 }}>🎬</span>
            <h3 style={{ color: 'var(--accent-dark)' }}>Geração de Conteúdo com IA</h3>
          </div>
          <p className="text-sm text-muted mb-4">
            Como prefere que a IA crie os vídeos, posts e materiais deste imóvel? Você pode mudar isso depois.
          </p>

          <div className="grid-2 mb-3">
            <div className="form-group">
              <label className="label">Estilo do Vídeo</label>
              <select className="input" value={videoTipo} onChange={e=>setVideoTipo(e.target.value)}>
                <option value="Cinematográfico">🎥 Cinematográfico — sofisticado e elegante</option>
                <option value="Tour Rápido (Tiktok)">⚡ Tour Rápido — dinâmico, ideal para Reels</option>
                <option value="Foco no Bairro / Drone">🏙️ Foco no Bairro — destaca a localização</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Voz da Narração</label>
              <select className="input" value={voiceoverVoz} onChange={e=>setVoiceoverVoz(e.target.value)}>
                <option value="Feminina">👩 Feminina</option>
                <option value="Masculina">👨 Masculina</option>
                <option value="Sem Voz (Apenas Música)">🎵 Sem voz — só música de fundo</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="label">Tom dos Textos</label>
            <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
              {[
                ['Consultivo','🤝 Consultivo — próximo e confiante'],
                ['Descontraído','😊 Descontraído — leve e acolhedor'],
                ['Agressivo (Vendas)','🔥 Persuasivo — direto e impactante'],
              ].map(([val,label])=>(
                <button key={val} type="button"
                  className={`btn btn-sm ${voiceoverTom===val ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={()=>setVoiceoverTom(val)}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Destaque especial (opcional)</label>
            <input className="input" placeholder="Ex: Focar na área de lazer e na proximidade com o metrô" value={voiceoverContexto} onChange={e=>setVoiceoverContexto(e.target.value)} />
            <p className="text-xs text-muted mt-1">A IA vai priorizar esse ponto em todos os materiais gerados.</p>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : '🚀 Publicar Imóvel'}
          </button>
        </div>
      </form>
    </div>
  );
}
