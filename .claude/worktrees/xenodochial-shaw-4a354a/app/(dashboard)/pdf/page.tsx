'use client';
import Link from 'next/link';

export default function PdfPage() {
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>📄 Exportar PDF</h1>
        <p className="text-muted">Gere fichas técnicas em PDF para enviar aos clientes</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
        <h3 className="mb-2">Exporte o PDF de qualquer imóvel</h3>
        <p className="text-sm text-muted mb-4">
          Acesse um imóvel e clique em <strong>Exportar PDF</strong> para gerar a ficha técnica completa com fotos, dados e descrição — pronta para enviar ao cliente.
        </p>
        <Link href="/imoveis" className="btn btn-primary">Ver meus imóveis →</Link>
      </div>
    </div>
  );
}
