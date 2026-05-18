'use client';
import Link from 'next/link';

export default function ArtesPage() {
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>🎨 Artes para Redes Sociais</h1>
        <p className="text-muted">Crie artes profissionais para Stories e Feed</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎨</div>
        <h3 className="mb-2">Em breve nesta tela</h3>
        <p className="text-sm text-muted mb-4">
          As artes são geradas diretamente na página de cada imóvel. Acesse um imóvel, vá em <strong>IA & Conteúdo</strong> e clique em <strong>Gerar Arte</strong>.
        </p>
        <Link href="/imoveis" className="btn btn-primary">Ver meus imóveis →</Link>
      </div>
    </div>
  );
}
