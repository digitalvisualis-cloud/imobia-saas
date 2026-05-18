'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ListaProTrigger({ imovel }: { imovel: any }) {
  const router = useRouter();
  
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>(imovel.statusGeracao || 'RASCUNHO');
  const [resultado, setResultado] = useState<any>(imovel.formatosGerados || null);
  
  // Opções de Assets
  const [selected, setSelected] = useState({
    pdf: true, post: true, story: true, copy: true, reels: false
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Simulação de Polling quando está gerando
  useEffect(() => {
    if (status !== 'GERANDO') return;
    
    // Como não temos a edge function ligada de verdade ainda, simulamos
    // o fluxo chamando o nosso próprio endpoint local a cada 3s.
    const interval = setInterval(async () => {
      const res = await fetch(`/api/listapro/status?id=${imovel.id}`);
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        if (data.resultado) setResultado(data.resultado);
        if (data.status === 'PRONTO' || data.status === 'ERRO') {
          setRunning(false);
          router.refresh();
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [status, imovel.id, router]);

  async function triggerJob(mode: 'completo' | 'avancado') {
    setRunning(true);
    setStatus('GERANDO');
    
    const assets = mode === 'completo' 
      ? ['pdf', 'post', 'story', 'copy', 'reels'] 
      : Object.keys(selected).filter(k => (selected as any)[k]);

    try {
      // Inicia a geração
      const res = await fetch('/api/listapro/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovelId: imovel.id,
          assets,
          // Enviamos os dados do imovel que serão passados pro n8n
          dados: {
            videoTipo: imovel.videoTipo,
            voiceoverVoz: imovel.voiceoverVoz,
            voiceoverTom: imovel.voiceoverTom,
            voiceoverContexto: imovel.voiceoverContexto
          }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAdvancedOpen(false);
    } catch (e: any) {
      alert(e.message || 'Erro ao iniciar geração');
      setStatus('ERRO');
      setRunning(false);
    }
  }

  const ASSETS = [
    { key: 'pdf', label: 'PDF da ficha', slow: false },
    { key: 'post', label: 'Post Instagram (1080×1080)', slow: false },
    { key: 'story', label: 'Story (1080×1920)', slow: false },
    { key: 'copy', label: 'Copy + hashtags', slow: false },
    { key: 'reels', label: 'Reels vídeo (1080×1920)', slow: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div>
            <h3 className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-dark)', fontSize: '1.25rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span> Gerar Conteúdo com IA
            </h3>
            <p className="text-sm text-muted">PDF, post para Instagram, story, legenda e vídeo Reels — gerados automaticamente.</p>
          </div>
          
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setAdvancedOpen(!advancedOpen)} disabled={running}>
              ⚙️ Avançado
            </button>
            <button className="btn btn-primary" onClick={() => triggerJob('completo')} disabled={running}>
              {running ? '⏳ Iniciando...' : '✨ Pacote Completo'}
            </button>
          </div>
        </div>

        {advancedOpen && !running && (
          <div className="p-4 mb-6" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
            <h4 className="text-sm font-semibold mb-3">Selecionar Assets</h4>
            <div className="grid-2 gap-3 mb-4">
              {ASSETS.map(a => (
                <label key={a.key} className="flex items-center justify-between p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <span className="text-sm font-medium">
                    {a.label} {a.slow && <span className="badge badge-gray ml-2 text-xs">~45s</span>}
                  </span>
                  <input 
                    type="checkbox" 
                    checked={(selected as any)[a.key]}
                    onChange={e => setSelected({ ...selected, [a.key]: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                </label>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => triggerJob('avancado')}>Gerar Selecionados</button>
          </div>
        )}

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold">Status:</span>
            <span className={`badge ${
              status === 'PRONTO' ? 'badge-green' : 
              status === 'GERANDO' ? 'badge-yellow' : 
              status === 'ERRO' ? 'badge-red' : 'badge-gray'
            }`}>
              {status === 'RASCUNHO' ? 'Aguardando' : status === 'GERANDO' ? '⏳ Gerando...' : status === 'PRONTO' ? '✅ Pronto' : status === 'ERRO' ? '❌ Erro' : status}
            </span>
          </div>

          {resultado && (
            <div className="grid-3 gap-3">
              {resultado.pdf_url && (
                <a href={resultado.pdf_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>📄 Download PDF</a>
              )}
              {resultado.post_url && (
                <a href={resultado.post_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🖼️ Download Post</a>
              )}
              {resultado.story_url && (
                <a href={resultado.story_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>📱 Download Story</a>
              )}
              {resultado.reels_url && (
                <a href={resultado.reels_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🎬 Download Reels</a>
              )}
              {resultado.copy && (
                <button className="btn btn-secondary" onClick={() => {
                  navigator.clipboard.writeText(resultado.copy);
                  alert('Copy copiada para a área de transferência!');
                }}>📝 Copiar Legenda</button>
              )}
            </div>
          )}
          
          {status === 'PRONTO' && !resultado && (
            <p className="text-sm text-muted">Os arquivos foram gerados mas não estão disponíveis no retorno da API.</p>
          )}
        </div>
      </div>

      {(imovel.videoTipo || imovel.voiceoverVoz || imovel.voiceoverTom || imovel.voiceoverContexto) && (
        <div className="card">
          <h3 className="mb-4">Configurações de Vídeo</h3>
          <div className="grid-2 gap-4">
            {imovel.videoTipo && <div><span className="text-muted text-xs">Estilo:</span> <p className="font-medium text-sm">{imovel.videoTipo}</p></div>}
            {imovel.voiceoverVoz && <div><span className="text-muted text-xs">Narração:</span> <p className="font-medium text-sm">{imovel.voiceoverVoz}</p></div>}
            {imovel.voiceoverTom && <div><span className="text-muted text-xs">Tom:</span> <p className="font-medium text-sm">{imovel.voiceoverTom}</p></div>}
            {imovel.voiceoverContexto && <div style={{ gridColumn: '1 / -1' }}><span className="text-muted text-xs">Contexto:</span> <p className="font-medium text-sm">{imovel.voiceoverContexto}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
