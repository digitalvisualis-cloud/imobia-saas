'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  QrCode,
  Loader2,
  Check,
  AlertCircle,
  Power,
  PowerOff,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Status = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'BANNED' | 'ERROR';

interface Initial {
  providerType: 'WAHA' | 'EVOLUTION' | 'CLOUD_API';
  status: Status;
  numero: string | null;
  conectadoEm: string | null;
  ultimoErro: string | null;
}

export default function WhatsAppClient({ initial }: { initial: Initial | null }) {
  const [status, setStatus] = useState<Status>(initial?.status ?? 'DISCONNECTED');
  const [providerType, setProviderType] = useState<Initial['providerType']>(
    initial?.providerType ?? 'WAHA',
  );
  const [numero, setNumero] = useState<string | null>(initial?.numero ?? null);
  const [conectadoEm, setConectadoEm] = useState<string | null>(initial?.conectadoEm ?? null);
  const [qr, setQr] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(initial?.ultimoErro ?? null);
  const [working, setWorking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/atendimento/whatsapp/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data.status);
      setProviderType(data.providerType ?? providerType);
      setNumero(data.numero ?? null);
      setQr(data.qr ?? null);
      if (data.error) setErro(data.error);
      if (data.status === 'CONNECTED' || data.status === 'DISCONNECTED' || data.status === 'BANNED' || data.status === 'ERROR') {
        stopPolling();
      }
    } catch (err) {
      console.error('fetchStatus erro:', err);
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(fetchStatus, 2500);
  };

  // Polling enquanto CONNECTING
  useEffect(() => {
    if (status === 'CONNECTING') startPolling();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConectar = async () => {
    setWorking(true);
    setErro(null);
    try {
      const res = await fetch('/api/atendimento/whatsapp/conectar', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'erro');
      setStatus('CONNECTING');
      toast.success('Sessão iniciada. Escaneie o QR Code abaixo.');
      // Pega QR imediatamente + começa polling
      await fetchStatus();
      startPolling();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro';
      setErro(msg);
      toast.error(`Falha ao conectar: ${msg}`);
    } finally {
      setWorking(false);
    }
  };

  const handleDesconectar = async () => {
    if (!confirm('Desconectar o WhatsApp do ImobIA? Você precisará escanear o QR de novo pra reconectar.')) return;
    setWorking(true);
    try {
      const res = await fetch('/api/atendimento/whatsapp/desconectar', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'erro');
      setStatus('DISCONNECTED');
      setQr(null);
      stopPolling();
      toast.success('Desconectado');
    } catch (err) {
      toast.error(`Falha ao desconectar: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Atendimento"
        icon={MessageCircle}
        title="WhatsApp"
        description="Conecte o WhatsApp do seu negócio pra que a IA atenda os leads automaticamente."
        actions={
          <Button asChild variant="outline">
            <Link href="/configuracoes">
              <ArrowLeft className="h-4 w-4 mr-2" /> Configurações
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Coluna principal */}
        <div className="space-y-5">
          {/* Card de status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusDot status={status} />
                <div>
                  <div className="text-sm font-semibold">{labelStatus(status)}</div>
                  {numero && (
                    <div className="text-xs text-muted-foreground font-mono">
                      +{numero}
                    </div>
                  )}
                  {conectadoEm && status === 'CONNECTED' && (
                    <div className="text-[11px] text-muted-foreground">
                      Conectado em {new Date(conectadoEm).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={fetchStatus}
                disabled={working}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted"
                aria-label="Atualizar"
              >
                <RefreshCw className={cn('h-4 w-4', working && 'animate-spin')} />
              </button>
            </div>

            {erro && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>{erro}</div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {status === 'DISCONNECTED' || status === 'ERROR' ? (
                <Button onClick={handleConectar} disabled={working}>
                  {working ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  Conectar WhatsApp
                </Button>
              ) : (
                <Button onClick={handleDesconectar} disabled={working} variant="outline">
                  {working ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PowerOff className="h-4 w-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {/* QR code area */}
          {status === 'CONNECTING' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base font-bold">Escaneie o QR Code</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Abra o WhatsApp no seu celular →{' '}
                <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong>{' '}
                → mire a câmera no QR abaixo.
              </p>
              <div className="flex items-center justify-center rounded-lg bg-muted/40 p-6">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="QR Code WhatsApp" className="w-64 h-64 rounded-md bg-white p-2" />
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando QR Code...
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                O QR atualiza a cada 30 segundos. Esta página atualiza sozinha quando você escanear.
              </p>
            </div>
          )}

          {/* Próximos passos quando conectado */}
          {status === 'CONNECTED' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <h3 className="font-display text-base font-bold text-emerald-900">
                  Pronto! WhatsApp conectado.
                </h3>
              </div>
              <p className="text-sm text-emerald-900/80 mb-4">
                A partir de agora, qualquer mensagem que chegar no seu WhatsApp pode ser
                respondida automaticamente pela IA.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">→</span>
                  <span>
                    Configure o agente em{' '}
                    <Link href="/configuracoes/agente-ia" className="text-primary underline">
                      Agente IA
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">→</span>
                  <span>
                    Veja as conversas em{' '}
                    <Link href="/atendimento" className="text-primary underline">
                      Atendimento
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">→</span>
                  <span>Mande uma mensagem teste do seu outro celular pra verificar</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar de info */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Provider
            </div>
            <div className="font-semibold text-sm">{labelProvider(providerType)}</div>
            <div className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              {providerType === 'WAHA' && (
                <>
                  <strong>WAHA</strong> é um servidor não-oficial baseado em Baileys.
                  Setup instantâneo via QR Code. Funciona pra qualquer número de WhatsApp.
                </>
              )}
              {providerType === 'EVOLUTION' && (
                <>
                  <strong>Evolution API</strong> alternativa não-oficial 100% gratuita.
                </>
              )}
              {providerType === 'CLOUD_API' && (
                <>
                  <strong>Cloud API oficial Meta.</strong> Requer Meta Business + verificação.
                  Disponível no plano Agência.
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Importante
            </div>
            <ul className="space-y-2 text-[11px] text-muted-foreground">
              <li>
                <strong className="text-foreground">Use número dedicado</strong> — não use seu
                WhatsApp pessoal. Use um chip do negócio.
              </li>
              <li>
                <strong className="text-foreground">Evite spam</strong> — disparos em massa
                podem fazer o número ser banido pelo WhatsApp.
              </li>
              <li>
                <strong className="text-foreground">A IA não substitui você</strong> — atende
                primeiro filtro, libera leads quentes pra você.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color = {
    CONNECTED: 'bg-emerald-500',
    CONNECTING: 'bg-amber-500 animate-pulse',
    DISCONNECTED: 'bg-slate-400',
    ERROR: 'bg-red-500',
    BANNED: 'bg-red-600',
  }[status];
  return <div className={cn('h-2.5 w-2.5 rounded-full', color)} />;
}

function labelStatus(s: Status): string {
  return (
    {
      CONNECTED: 'Conectado',
      CONNECTING: 'Conectando — aguardando QR Code',
      DISCONNECTED: 'Desconectado',
      ERROR: 'Erro na conexão',
      BANNED: 'Número banido pelo WhatsApp',
    } as Record<Status, string>
  )[s];
}

function labelProvider(p: Initial['providerType']): string {
  return { WAHA: 'WAHA (não-oficial)', EVOLUTION: 'Evolution API (não-oficial)', CLOUD_API: 'WhatsApp Cloud API (oficial Meta)' }[p];
}
