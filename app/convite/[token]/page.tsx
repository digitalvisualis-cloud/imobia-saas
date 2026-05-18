'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Estado = 'loading' | 'invalid' | 'expired' | 'taken' | 'ready' | 'submitting' | 'success';

export default function AceitarConvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;

  const [estado, setEstado] = useState<Estado>('loading');
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState<{ email: string; role: string; imobiliaria: string } | null>(null);

  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [creci, setCreci] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/equipe/convite/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (r.status === 404) { setEstado('invalid'); return; }
        if (r.status === 410) {
          setEstado(d.error === 'Convite ja foi aceito' ? 'taken' : 'expired');
          return;
        }
        if (!r.ok) { setEstado('invalid'); setErro(d.error ?? ''); return; }
        setInfo(d);
        setEstado('ready');
      })
      .catch(() => setEstado('invalid'));
  }, [token]);

  async function aceitar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === 'submitting') return;
    if (password.length < 6) {
      setErro('Senha precisa ter pelo menos 6 caracteres');
      return;
    }
    setErro('');
    setEstado('submitting');
    try {
      const r = await fetch(`/api/equipe/convite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, password, whatsapp, creci }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error ?? 'Erro ao aceitar');
        setEstado('ready');
        return;
      }
      setEstado('success');
      // Loga direto com as credenciais
      const res = await signIn('credentials', {
        email: info?.email,
        password,
        redirect: false,
      });
      if (res?.ok) {
        router.push('/dashboard');
      } else {
        // Falha no auto-login — manda pro /login pra ele entrar manualmente
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (e: any) {
      setErro(e.message ?? 'Erro');
      setEstado('ready');
    }
  }

  if (estado === 'loading') {
    return (
      <Wrapper>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-600" />
        <p className="mt-4 text-sm text-gray-600">Validando convite...</p>
      </Wrapper>
    );
  }

  if (estado === 'invalid' || estado === 'expired' || estado === 'taken') {
    return (
      <Wrapper>
        <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
        <h1 className="mt-4 font-display text-xl font-bold">
          {estado === 'invalid' && 'Convite inválido'}
          {estado === 'expired' && 'Convite expirado'}
          {estado === 'taken' && 'Convite já aceito'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {estado === 'invalid' && 'Esse link não existe ou já foi removido.'}
          {estado === 'expired' && 'Esse convite expirou. Pede pro admin gerar um novo.'}
          {estado === 'taken' && 'Esse convite já foi usado. Se foi você, é só logar.'}
        </p>
        <a href="/login" className="mt-6 inline-block rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
          Ir pro login
        </a>
      </Wrapper>
    );
  }

  if (estado === 'success') {
    return (
      <Wrapper>
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 font-display text-xl font-bold">Tudo certo!</h1>
        <p className="mt-2 text-sm text-gray-600">Entrando no sistema...</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="font-display text-2xl font-bold">Convite pra equipe</h1>
      <p className="mt-2 text-sm text-gray-600">
        Você foi convidado pra entrar na equipe da <strong>{info?.imobiliaria}</strong> como{' '}
        <strong className="uppercase">{info?.role.toLowerCase()}</strong>.
      </p>
      <p className="mt-1 text-xs text-gray-500">Email: {info?.email}</p>

      <form onSubmit={aceitar} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Seu nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Senha *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="11 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">CRECI</label>
            <input
              type="text"
              value={creci}
              onChange={(e) => setCreci(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={estado === 'submitting'}
          className="w-full rounded-md bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {estado === 'submitting' ? 'Criando conta...' : 'Aceitar convite e criar conta'}
        </button>
      </form>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
        {children}
      </div>
    </div>
  );
}
