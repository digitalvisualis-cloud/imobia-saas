'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/auth.module.css';

const PLANOS = [
  { id: 'FREE', label: 'Gratuito', price: 'R$0/mês', features: ['5 imóveis', '5 posts IA', '1 site', '1 usuário'] },
  { id: 'STARTER', label: 'Starter', price: 'R$97/mês', features: ['50 imóveis', '50 posts IA', '1 site', '3 usuários', 'Chatbot IA'], destaque: true },
  { id: 'PRO', label: 'Pro', price: 'R$197/mês', features: ['Ilimitado', 'Posts ilimitados', '3 sites', 'Usuários ilimitados', 'White-label'] },
];

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nome: '', email: '', password: '', confirm: '',
    tipo: 'CORRETOR', creci: '', whatsapp: '', plano: 'FREE',
  });

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome, email: form.email, password: form.password,
        tipoAccount: form.tipo, creci: form.creci, whatsapp: form.whatsapp,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Erro ao criar conta');
      setLoading(false);
      return;
    }

    // Auto-login após cadastro
    await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    });

    router.push('/dashboard');
  }

  return (
    <div className={styles.authPage}>
      <div className={`${styles.authCard} ${step === 3 ? styles.authCardWide : ''}`}>
        <div className={styles.authLogo}>🏡 ImobIA</div>

        {/* Steps */}
        <div className={styles.steps}>
          {[1,2,3].map(s => (
            <div key={s} className={`${styles.step} ${step >= s ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>{step > s ? '✓' : s}</div>
              <span>{s === 1 ? 'Conta' : s === 2 ? 'Perfil' : 'Plano'}</span>
            </div>
          ))}
        </div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        {/* Step 1 — Conta */}
        {step === 1 && (
          <>
            <h1 className={styles.authTitle}>Criar conta</h1>
            <p className={styles.authSub}>Comece gratuitamente, sem cartão</p>
            <div className="flex flex-col gap-3 mt-4">
              <div className="form-group">
                <label className="label">Nome completo</label>
                <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="João Silva" />
              </div>
              <div className="form-group">
                <label className="label">E-mail</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" />
              </div>
              <div className="form-group">
                <label className="label">Senha</label>
                <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mín. 8 caracteres" />
              </div>
              <div className="form-group">
                <label className="label">Confirmar senha</label>
                <input className="input" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Repita a senha" />
              </div>
            </div>
            <button className="btn btn-primary w-full mt-4"
              onClick={() => form.nome && form.email && form.password && setStep(2)}
              disabled={!form.nome || !form.email || !form.password}>
              Próximo →
            </button>
            <p className={styles.authSwitch}>Já tem conta? <Link href="/login">Entrar</Link></p>
          </>
        )}

        {/* Step 2 — Perfil */}
        {step === 2 && (
          <>
            <h1 className={styles.authTitle}>Seu perfil</h1>
            <p className={styles.authSub}>Conte um pouco sobre você</p>
            <div className="flex gap-3 mt-4">
              {[['CORRETOR','🤝 Corretor independente'],['IMOBILIARIA','🏢 Imobiliária']].map(([v,l]) => (
                <button key={v} className={`${styles.roleCard} ${form.tipo === v ? styles.roleCardActive : ''}`}
                  onClick={() => set('tipo', v)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="form-group">
                <label className="label">CRECI (opcional)</label>
                <input className="input" value={form.creci} onChange={e => set('creci', e.target.value)} placeholder="123456-SP" />
              </div>
              <div className="form-group">
                <label className="label">WhatsApp</label>
                <input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(1)}>← Voltar</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(3)}>Próximo →</button>
            </div>
          </>
        )}

        {/* Step 3 — Plano */}
        {step === 3 && (
          <>
            <h1 className={styles.authTitle}>Escolha seu plano</h1>
            <p className={styles.authSub}>Comece grátis e faça upgrade quando quiser</p>
            <div className={styles.planosGrid}>
              {PLANOS.map(p => (
                <div key={p.id} className={`${styles.planoCard} ${form.plano === p.id ? styles.planoCardActive : ''} ${p.destaque ? styles.planoDestaque : ''}`}
                  onClick={() => set('plano', p.id)}>
                  {p.destaque && <span className={styles.planoBadge}>⭐ Popular</span>}
                  <p className="font-bold">{p.label}</p>
                  <p className="text-accent font-bold mt-1">{p.price}</p>
                  <ul className="mt-3 flex flex-col gap-1">
                    {p.features.map(f => <li key={f} className="text-xs text-muted">✓ {f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(2)}>← Voltar</button>
              <button className="btn btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando conta...' : '🚀 Criar conta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
