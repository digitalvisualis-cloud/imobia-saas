'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type SiteData = {
  slug: string;
  publicado: boolean;
  titulo: string;
};

export default function GeradorSitePage() {
  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form para criação/edição
  const [slugInput, setSlugInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/sites').then(res => res.json()).then(data => {
      if (data.site) {
        setSite(data.site);
        setSlugInput(data.site.slug);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!slugInput.trim()) return alert('Digite um endereço para seu site.');
    
    setSaving(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugInput, publicado: site?.publicado ?? true })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSite(data.site);
      alert('Site configurado com sucesso!');
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar site');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(novoStatus: boolean) {
    if (!site) return;
    
    // Atualização otimista
    setSite({ ...site, publicado: novoStatus });
    
    try {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: site.slug, publicado: novoStatus })
      });
    } catch (e) {
      // Reverter se falhar
      setSite({ ...site, publicado: !novoStatus });
      alert('Erro ao alterar status');
    }
  }

  if (loading) {
    return <div className="p-6">Carregando gerenciador de site...</div>;
  }

  if (!site) {
    return (
      <div className="fade-in max-w-2xl">
        <div className="mb-6">
          <h1>🚀 Crie o site da sua Imobiliária</h1>
          <p className="text-muted">Tenha uma vitrine profissional de imóveis em menos de 1 minuto.</p>
        </div>

        <div className="card">
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Escolha o endereço (URL) do seu site</label>
              <div className="flex items-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <span className="text-muted" style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRight: '1px solid var(--border)' }}>imobia.io/s/</span>
                <input 
                  className="input" 
                  style={{ border: 'none', borderRadius: 0 }}
                  placeholder="sua-imobiliaria"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
              <p className="text-xs text-muted mt-1">Apenas letras minúsculas, números e hifens.</p>
            </div>

            <button className="btn btn-primary mt-2" onClick={handleSave} disabled={saving}>
              {saving ? 'Criando...' : 'Criar Meu Site Agora'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const siteUrl = `http://localhost:3000/s/${site.slug}`;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>Meu Site (Vitrine)</h1>
        <p className="text-muted">Gerencie seu site público. As alterações são publicadas instantaneamente.</p>
      </div>

      <div className="grid-2 gap-6" style={{ gridTemplateColumns: '350px 1fr' }}>
        
        {/* ESQUERDA - CONFIGURAÇÕES */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 className="mb-4">🔗 Link do Site</h3>
            <div className="form-group mb-4">
              <label className="label">URL Pública</label>
              <div className="flex gap-2">
                <input className="input" value={siteUrl} readOnly style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
                <a href={siteUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Abrir</a>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 p-4" style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
              <div>
                <p className="font-semibold">Status do Site</p>
                <p className="text-xs text-muted">{site.publicado ? 'Visível para todos' : 'Fora do ar'}</p>
              </div>
              <label style={{ display:'flex', alignItems:'center', cursor:'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={site.publicado} 
                  onChange={(e) => toggleStatus(e.target.checked)}
                  style={{ width: 40, height: 20, appearance: 'none', background: site.publicado ? 'var(--green)' : 'var(--border)', borderRadius: 20, position: 'relative', outline: 'none' }}
                />
                <div style={{ position: 'absolute', width: 16, height: 16, background: '#fff', borderRadius: '50%', left: site.publicado ? 20 : 2, transition: '0.2s' }} />
              </label>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">🎨 Personalização</h3>
            <p className="text-sm text-muted mb-4">
              O site utiliza as cores, logo e slogan definidos nas configurações da sua marca.
            </p>
            <Link href="/configuracoes" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
              Editar Marca e Cores
            </Link>
          </div>
          
          <div className="card border-red-500">
            <h3 className="mb-2 text-red">Zona de Perigo</h3>
            <p className="text-sm text-muted mb-4">Deseja alterar a URL atual ({site.slug})?</p>
            <div className="flex gap-2">
              <input className="input" value={slugInput} onChange={e=>setSlugInput(e.target.value)} />
              <button className="btn btn-secondary" onClick={handleSave} disabled={saving || slugInput === site.slug}>Mudar</button>
            </div>
          </div>
        </div>

        {/* DIREITA - PREVIEW */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{siteUrl}</span>
          </div>
          <div style={{ flex: 1, minHeight: '600px', background: '#fff' }}>
            <iframe 
              src={siteUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Preview do Site"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
