'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './config.module.css';

interface PerfilForm { nome: string; email: string; whatsapp: string; creci: string; }

interface MarcaForm {
  nomeEmpresa: string;
  slogan: string;
  descricao: string;
  email: string;
  telefone: string;
  endereco: string;
  corPrimaria: string;
  corSecundaria: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

const SOCIAL_LINKS: { id: keyof MarcaForm; label: string; icon: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/seuperfil' },
  { id: 'facebook', label: 'Facebook', icon: '👥', placeholder: 'https://facebook.com/suapagina' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: 'https://wa.me/5511999999999' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@seucanal' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/seuperfil' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@seuperfil' },
];

const PALETAS: [string, string][] = [
  ['#7c3aed', '#06b6d4'],
  ['#dc2626', '#f97316'],
  ['#059669', '#10b981'],
  ['#1d4ed8', '#7c3aed'],
  ['#d97706', '#f59e0b'],
  ['#0f172a', '#334155'],
];

const EMPTY: MarcaForm = {
  nomeEmpresa: '', slogan: '', descricao: '', email: '',
  telefone: '', endereco: '', corPrimaria: '#7c3aed', corSecundaria: '#06b6d4',
  instagram: '', facebook: '', whatsapp: '', youtube: '', linkedin: '', tiktok: '',
};

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<'perfil' | 'marca' | 'plano'>('perfil');
  const [marca, setMarca] = useState<MarcaForm>(EMPTY);
  const [perfil, setPerfil] = useState<PerfilForm>({ nome: '', email: '', whatsapp: '', creci: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/configuracoes/marca').then(r => r.json()),
      fetch('/api/auth/profile').then(r => r.json()),
    ]).then(([marcaData, perfilData]) => {
      if (marcaData && !marcaData.error) setMarca(prev => ({ ...prev, ...marcaData }));
      if (perfilData && !perfilData.error) setPerfil({ nome: perfilData.nome || '', email: perfilData.email || '', whatsapp: perfilData.whatsapp || '', creci: perfilData.creci || '' });
    }).finally(() => setLoading(false));
  }, []);

  async function savePerfil() {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(perfil) });
      if (!res.ok) throw new Error();
      toast.success('Perfil salvo!');
    } catch { toast.error('Erro ao salvar perfil'); }
    finally { setSaving(false); }
  }

  function set(key: keyof MarcaForm, value: string) {
    setMarca(prev => ({ ...prev, [key]: value }));
  }

  async function saveMarca() {
    setSaving(true);
    try {
      const res = await fetch('/api/configuracoes/marca', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marca),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      toast.success('Configurações salvas!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>Configurações</h1>
        <p className="text-muted">Gerencie seu perfil, marca e plano</p>
      </div>

      <div className={styles.tabs}>
        {([['perfil', '👤 Perfil'], ['marca', '🎨 Minha Marca'], ['plano', '💳 Plano']] as [string, string][]).map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`} onClick={() => setTab(id as any)}>{label}</button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className={styles.section}>
          {loading ? <p className="text-muted">Carregando...</p> : (
            <>
              <div className={`${styles.grid2} mt-2`}>
                <div className="form-group">
                  <label className="label">Nome completo</label>
                  <input className="input" value={perfil.nome} onChange={e => setPerfil(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome completo" />
                </div>
                <div className="form-group">
                  <label className="label">CRECI</label>
                  <input className="input" value={perfil.creci} onChange={e => setPerfil(p => ({ ...p, creci: e.target.value }))} placeholder="Ex: 123456-SP" />
                </div>
                <div className="form-group">
                  <label className="label">E-mail</label>
                  <input className="input" value={perfil.email} disabled style={{ opacity: 0.6 }} title="Não é possível alterar o e-mail" />
                </div>
                <div className="form-group">
                  <label className="label">WhatsApp</label>
                  <input className="input" value={perfil.whatsapp} onChange={e => setPerfil(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <button className="btn btn-primary mt-4" onClick={savePerfil} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'marca' && (
        <div className={styles.section}>
          {loading ? <p className="text-muted">Carregando...</p> : (
            <>
              <div className={styles.infoBox}>
                🎨 Sua marca é aplicada automaticamente no seu site, artes geradas, rodapé e PDF de imóveis.
              </div>

              <div className="card mt-4">
                <h3 className="mb-4">Cores da marca</h3>
                <div className={styles.colorGrid}>
                  <div className="form-group">
                    <label className="label">Cor principal</label>
                    <div className={styles.colorInput}>
                      <input type="color" value={marca.corPrimaria} onChange={e => set('corPrimaria', e.target.value)} className={styles.colorPicker} />
                      <input className="input" value={marca.corPrimaria} onChange={e => set('corPrimaria', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Cor secundária</label>
                    <div className={styles.colorInput}>
                      <input type="color" value={marca.corSecundaria} onChange={e => set('corSecundaria', e.target.value)} className={styles.colorPicker} />
                      <input className="input" value={marca.corSecundaria} onChange={e => set('corSecundaria', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className={styles.colorPreview} style={{ background: `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})` }}>
                  <span>Prévia das suas cores</span>
                </div>
                <p className="label mt-3 mb-2">Paletas sugeridas</p>
                <div className="flex gap-2">
                  {PALETAS.map(([a, b], i) => (
                    <button key={i} className={styles.palette} style={{ background: `linear-gradient(135deg,${a},${b})` }}
                      onClick={() => { set('corPrimaria', a); set('corSecundaria', b); }} />
                  ))}
                </div>
              </div>

              <div className="card mt-4">
                <h3 className="mb-4">Informações da empresa</h3>
                <div className="flex flex-col gap-3">
                  <div className="form-group"><label className="label">Nome da empresa</label>
                    <input className="input" value={marca.nomeEmpresa} onChange={e => set('nomeEmpresa', e.target.value)} placeholder="Ex: Imobiliária Pinheiros" /></div>
                  <div className="form-group"><label className="label">Slogan</label>
                    <input className="input" value={marca.slogan} onChange={e => set('slogan', e.target.value)} placeholder="Ex: Seu lar ideal começa aqui" /></div>
                  <div className="form-group"><label className="label">Descrição curta</label>
                    <textarea className="input" value={marca.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Especialistas em imóveis residenciais..." /></div>
                  <div className="form-group"><label className="label">E-mail de contato</label>
                    <input className="input" value={marca.email} onChange={e => set('email', e.target.value)} placeholder="contato@suaimobiliaria.com.br" /></div>
                  <div className="form-group"><label className="label">Telefone</label>
                    <input className="input" value={marca.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 3333-4444" /></div>
                  <div className="form-group"><label className="label">Endereço</label>
                    <input className="input" value={marca.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro — Cidade/UF" /></div>
                </div>
              </div>

              <div className="card mt-4">
                <h3 className="mb-1">Links das redes sociais</h3>
                <p className="text-sm text-muted mb-4">Aparecerão no rodapé do site e nas artes geradas</p>
                <div className="flex flex-col gap-3">
                  {SOCIAL_LINKS.map(s => (
                    <div key={s.id} className="form-group">
                      <label className="label">{s.icon} {s.label}</label>
                      <input className="input" value={marca[s.id]} onChange={e => set(s.id, e.target.value)} placeholder={s.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary mt-4" onClick={saveMarca} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações de marca'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'plano' && (
        <div className={styles.section}>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3>Plano atual: <span className="text-accent">Gratuito</span></h3>
                <p className="text-sm text-muted">Renova em —</p>
              </div>
              <span className="badge badge-gray">Free</span>
            </div>
            <a href="#" className="btn btn-primary w-full mt-4">Fazer upgrade</a>
          </div>
        </div>
      )}
    </div>
  );
}
