export default function ParceriaPage() {
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1>Parceria — Fotos & Tour 360</h1>
        <p className="text-muted">Serviços especializados para valorizar seu imóvel</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
        <h2 className="mb-2">Fotografia, Tour Virtual 360° e Vídeo com IA</h2>
        <p className="text-muted mb-6" style={{ lineHeight: 1.7 }}>
          Parceiros especializados em fotografia imobiliária profissional, tour virtual 360°, animações e vídeos gerados com IA — tudo para destacar seus imóveis e fechar mais negócios.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {[
            { icon: '📷', title: 'Fotografia Profissional', desc: 'Fotos HDR de alta qualidade com edição incluída' },
            { icon: '🔄', title: 'Tour Virtual 360°', desc: 'Visita imersiva online — o cliente explora de casa' },
            { icon: '🎬', title: 'Vídeo Aéreo com Drone', desc: 'Tomadas externas e de localização com drone' },
            { icon: '🤖', title: 'Animação IA', desc: 'Decoração virtual e ambientação gerada por IA' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-4 p-4" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://wa.me/5511999999999?text=Olá! Tenho interesse nos serviços de foto e tour 360 para imóveis."
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
        >
          💬 Falar com Parceiro no WhatsApp
        </a>
      </div>
    </div>
  );
}
