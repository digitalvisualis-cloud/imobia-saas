'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './landing.module.css';

const features = [
  { icon: '🏠', title: 'CRM de Imóveis', desc: 'Cadastre e gerencie seu portfólio completo com fotos, dados técnicos e status em tempo real.' },
  { icon: '🤖', title: 'Posts com IA', desc: 'Gere legendas, descrições e posts prontos para Instagram e Facebook em segundos.' },
  { icon: '🎨', title: 'Artes Sociais', desc: 'Crie artes profissionais para Stories e Feed com os dados do imóvel automaticamente.' },
  { icon: '📄', title: 'Export PDF', desc: 'Gere fichas técnicas dos imóveis em PDF com design profissional para enviar aos clientes.' },
  { icon: '🌐', title: 'Seu Site', desc: 'Monte seu site de corretor ou imobiliária com portfólio de imóveis e formulário de leads.' },
  { icon: '📊', title: 'Kanban de Leads', desc: 'Acompanhe seus leads no funil de vendas com drag-and-drop e métricas em tempo real.' },
  { icon: '💬', title: 'Atendimento com IA', desc: 'Configure um chatbot que atende e qualifica leads automaticamente no seu site.' },
  { icon: '📅', title: 'Agenda de Posts', desc: 'Planeje e agende seus conteúdos com calendário editorial integrado.' },
];

const plans = [
  {
    name: 'Gratuito', price: 'R$ 0', period: '/mês', highlight: false,
    features: ['5 imóveis', '5 posts com IA', '1 site', 'CRM básico', 'Export PDF'],
    cta: 'Começar grátis', href: '/cadastro',
  },
  {
    name: 'Starter', price: 'R$ 97', period: '/mês', highlight: false,
    features: ['30 imóveis', '50 posts com IA', '3 sites', 'Kanban de leads', 'Artes sociais', 'Atendimento IA básico'],
    cta: 'Assinar Starter', href: '/cadastro?plano=starter',
  },
  {
    name: 'Pro', price: 'R$ 197', period: '/mês', highlight: true,
    features: ['Imóveis ilimitados', 'Posts ilimitados', '10 sites', 'IA avançada', 'Artes personalizadas', 'Atendimento IA completo', 'Relatórios'],
    cta: 'Assinar Pro', href: '/cadastro?plano=pro',
  },
  {
    name: 'Agência', price: 'R$ 397', period: '/mês', highlight: false,
    features: ['Tudo do Pro', 'Múltiplos corretores', 'Sites ilimitados', 'Integração WhatsApp', 'White label', 'Suporte prioritário'],
    cta: 'Falar com vendas', href: '/cadastro?plano=agencia',
  },
];

const faqs = [
  { q: 'Preciso saber programar para usar?', a: 'Não! O ImobIA é 100% self-service. Em minutos você já está gerando posts e criando seu site.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem fidelidade. Cancele quando quiser pelo painel de configurações.' },
  { q: 'Os posts gerados são únicos?', a: 'Sim. A IA cria conteúdo personalizado com base nos dados reais de cada imóvel.' },
  { q: 'Funciona para imobiliárias com vários corretores?', a: 'Sim! O plano Agência suporta múltiplos usuários com gestão centralizada.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏡</span>
            <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1.25rem' }}>ImobIA</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">Entrar</Link>
            <Link href="/cadastro" className="btn btn-primary btn-sm">Começar grátis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>🚀 Plataforma #1 para corretores no Brasil</div>
        <h1>
          Seu negócio imobiliário<br />
          <span className="gradient-text">turbinado pela IA</span>
        </h1>
        <p className={styles.heroSub}>
          Cadastre imóveis, gere posts para Instagram, crie artes profissionais, exporte PDFs e construa seu site — tudo em um lugar só.
        </p>
        <div className="flex gap-3 justify-center" style={{ flexWrap: 'wrap' }}>
          <Link href="/cadastro" className="btn btn-primary btn-lg">
            Começar grátis agora
          </Link>
          <Link href="#funcionalidades" className="btn btn-secondary btn-lg">
            Ver funcionalidades
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}><strong>+2.400</strong> corretores</div>
          <div className={styles.heroStatDivider}/>
          <div className={styles.heroStat}><strong>+18.000</strong> posts gerados</div>
          <div className={styles.heroStatDivider}/>
          <div className={styles.heroStat}><strong>4.8★</strong> avaliação</div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.section} id="funcionalidades">
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>Funcionalidades</div>
          <h2>Tudo que você precisa para vender mais</h2>
          <p>Uma plataforma completa pensada para corretores e imobiliárias que querem crescer com inteligência.</p>
        </div>
        <div className="grid-4" style={{ maxWidth: 1100, margin: '0 auto' }}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h4>{f.title}</h4>
              <p className="text-sm text-muted mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className={styles.section} id="precos">
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>Planos</div>
          <h2>Simples e transparente</h2>
          <p>Comece grátis e escale conforme seu negócio cresce.</p>
        </div>
        <div className={styles.plansGrid}>
          {plans.map((plan, i) => (
            <div key={i} className={`${styles.planCard} ${plan.highlight ? styles.planHighlight : ''}`}>
              {plan.highlight && <div className={styles.planBadge}>Mais popular</div>}
              <h3>{plan.name}</h3>
              <div className={styles.planPrice}>
                <span className={styles.planValue}>{plan.price}</span>
                <span className="text-muted text-sm">{plan.period}</span>
              </div>
              <ul className={styles.planFeatures}>
                {plan.features.map((f, j) => (
                  <li key={j}><span className="text-green">✓</span> {f}</li>
                ))}
              </ul>
              <Link href={plan.href} className={`btn w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section} id="faq">
        <div className={styles.sectionHeader}>
          <div className={styles.pill}>FAQ</div>
          <h2>Dúvidas frequentes</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className={styles.faqQ}>
                <span>{faq.q}</span>
                <span>{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <p className={styles.faqA}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2>Pronto para vender mais com IA?</h2>
        <p>Comece hoje mesmo. Sem cartão de crédito.</p>
        <Link href="/cadastro" className="btn btn-primary btn-lg mt-4">
          Criar conta grátis →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏡</span>
          <span className="gradient-text" style={{ fontWeight: 700 }}>ImobIA</span>
        </div>
        <p className="text-sm text-muted mt-2">© 2025 ImobIA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
