'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Email ou senha inválidos. Verifique seus dados.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>🏡 ImobIA</div>
        <h1 className={styles.authTitle}>Bem-vindo de volta</h1>
        <p className={styles.authSub}>Entre na sua conta para continuar</p>

        <button className={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.48A4.84 4.84 0 0 1 4.5 8v-.01H1.83a8 8 0 0 0 0 4.55L4.5 10.48z"/><path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A8 8 0 0 0 1.83 7.49L4.5 9.5c.69-2 2.56-3.92 4.48-3.92z"/></svg>
          Entrar com Google
        </button>

        <div className={styles.divider}><span>ou</span></div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">E-mail</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="form-group mt-3">
            <label className="label">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex items-center justify-between mt-2 mb-4">
            <span />
            <Link href="/recuperar-senha" className={styles.forgotLink}>Esqueci minha senha</Link>
          </div>
          <button id="btn-login" className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.authSwitch}>
          Não tem conta? <Link href="/cadastro">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
}
