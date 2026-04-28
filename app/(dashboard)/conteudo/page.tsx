'use client';
import Link from 'next/link';

export default function ConteudoPage() {
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>✍️ Gerar Posts com IA</h1>
        <p className="text-muted">Crie legendas e posts prontos para Instagram e WhatsApp</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
        <h3 className="mb-2">Gere posts a partir dos seus imóveis</h3>
        <p className="text-sm text-muted mb-4">
          Acesse qualquer imóvel cadastrado, vá na aba <strong>IA & Conteúdo</strong> e gere posts personalizados em segundos.
        </p>
        <Link href="/imoveis" className="btn btn-primary">Ver meus imóveis →</Link>
      </div>
    </div>
  );
}
