'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  MessageCircle,
  Send,
  User as UserIcon,
  Bot,
  Hand,
  ArrowRight,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type ConvStatus = 'IA' | 'HUMANO' | 'FECHADA';

interface ConversaItem {
  id: string;
  clienteWa: string;
  clienteNome: string | null;
  status: ConvStatus;
  providerType: 'WAHA' | 'EVOLUTION' | 'CLOUD_API';
  iniciadaEm: string;
  ultimaMsgEm: string;
  imovel: { id: string; codigo: string; titulo: string; capaUrl: string | null } | null;
  mensagens: Array<{
    id: string;
    direcao: 'IN' | 'OUT';
    autorTipo: 'IA' | 'HUMANO' | 'CLIENTE' | 'SISTEMA';
    tipo: string;
    conteudo: string;
    createdAt: string;
  }>;
  _count: { mensagens: number };
}

interface MensagemDetalhe {
  id: string;
  direcao: 'IN' | 'OUT';
  autorTipo: 'IA' | 'HUMANO' | 'CLIENTE' | 'SISTEMA';
  autorId: string | null;
  tipo: string;
  conteudo: string;
  anexoUrl: string | null;
  anexoMime: string | null;
  createdAt: string;
}

interface ConversaDetalhe {
  id: string;
  clienteWa: string;
  clienteNome: string | null;
  status: ConvStatus;
  providerType: string;
  iniciadaEm: string;
  ultimaMsgEm: string;
  fechadaEm: string | null;
  resumoLLM: string | null;
  imovel: {
    id: string;
    codigo: string;
    titulo: string;
    tipo: string;
    operacao: string;
    preco: number;
    bairro: string | null;
    cidade: string;
    estado: string;
    capaUrl: string | null;
    areaM2: number | null;
    quartos: number;
    banheiros: number;
    vagas: number;
  } | null;
  lead: { id: string; nome: string; etapa: string; temperatura: string } | null;
}

function formatPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return raw;
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function AtendimentoClient({
  tenantId,
  whatsappConectado,
  conversasIniciais,
  supabaseUrl,
  supabaseAnonKey,
}: {
  tenantId: string;
  whatsappConectado: boolean;
  conversasIniciais: ConversaItem[];
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [conversas, setConversas] = useState<ConversaItem[]>(conversasIniciais);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODAS' | ConvStatus>('TODAS');
  const [selecionadaId, setSelecionadaId] = useState<string | null>(
    conversasIniciais[0]?.id ?? null,
  );
  const [detalhe, setDetalhe] = useState<ConversaDetalhe | null>(null);
  const [mensagens, setMensagens] = useState<MensagemDetalhe[]>([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [composer, setComposer] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);
  const msgsEndRef = useRef<HTMLDivElement | null>(null);

  // Realtime: assina mudanças em conversas + mensagens do tenant
  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel(`atendimento-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversas', filter: `tenantId=eq.${tenantId}` },
        () => {
          refreshConversas();
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `tenantId=eq.${tenantId}` },
        (payload) => {
          // Atualiza preview na lista
          refreshConversas();
          // Se a msg eh da conversa aberta, adiciona ao detalhe
          const novaMsg = payload.new as any;
          if (novaMsg.conversaId === selecionadaId) {
            setMensagens((prev) => [
              ...prev,
              {
                id: novaMsg.id,
                direcao: novaMsg.direcao,
                autorTipo: novaMsg.autorTipo,
                autorId: novaMsg.autorId,
                tipo: novaMsg.tipo,
                conteudo: novaMsg.conteudo,
                anexoUrl: novaMsg.anexoUrl,
                anexoMime: novaMsg.anexoMime,
                createdAt: novaMsg.createdAt,
              },
            ]);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, selecionadaId]);

  // Carrega detalhe quando troca de conversa
  useEffect(() => {
    if (!selecionadaId) {
      setDetalhe(null);
      setMensagens([]);
      return;
    }
    loadDetalhe(selecionadaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionadaId]);

  // Auto-scroll pro fim das mensagens
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  async function refreshConversas() {
    try {
      const res = await fetch('/api/atendimento/conversas?status=ATIVAS&limit=100', {
        cache: 'no-store',
      });
      const data = await res.json();
      setConversas(data.conversas ?? []);
    } catch {}
  }

  async function loadDetalhe(id: string) {
    setLoadingDetalhe(true);
    try {
      const res = await fetch(`/api/atendimento/conversas/${id}/mensagens`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'erro');
      setDetalhe(data.conversa);
      setMensagens(data.mensagens);
    } catch (err) {
      toast.error(`Falha carregando conversa: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setLoadingDetalhe(false);
    }
  }

  async function enviar() {
    if (!detalhe || !composer.trim()) return;
    setEnviando(true);
    const conteudo = composer;
    setComposer('');
    try {
      const res = await fetch('/api/atendimento/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId: detalhe.id, tipo: 'TEXTO', conteudo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'erro');
      // Realtime vai trazer a msg de volta, mas adicionamos otimisticamente
      // pra UX nao parecer travada
    } catch (err) {
      toast.error(`Falha enviando: ${err instanceof Error ? err.message : ''}`);
      setComposer(conteudo); // restaura
    } finally {
      setEnviando(false);
    }
  }

  async function acao(tipo: 'assumir' | 'devolver' | 'fechar') {
    if (!detalhe) return;
    const labels = { assumir: 'Você assumiu a conversa', devolver: 'Devolvido para a IA', fechar: 'Conversa encerrada' };
    setAcaoEmAndamento(true);
    try {
      const res = await fetch('/api/atendimento/assumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId: detalhe.id, acao: tipo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'erro');
      toast.success(labels[tipo]);
      // Atualiza detalhe + lista
      setDetalhe((d) => (d ? { ...d, status: data.status } : d));
      refreshConversas();
    } catch (err) {
      toast.error(`Falha: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  // Filtra lista
  const conversasFiltradas = useMemo(() => {
    const q = filtroBusca.trim().toLowerCase();
    return conversas.filter((c) => {
      if (filtroStatus !== 'TODAS' && c.status !== filtroStatus) return false;
      if (!q) return true;
      return (
        (c.clienteNome ?? '').toLowerCase().includes(q) ||
        c.clienteWa.includes(q) ||
        (c.imovel?.codigo ?? '').toLowerCase().includes(q) ||
        (c.imovel?.titulo ?? '').toLowerCase().includes(q)
      );
    });
  }, [conversas, filtroBusca, filtroStatus]);

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Atendimento IA"
        icon={MessageCircle}
        title="Conversas"
        description="Acompanhe os atendimentos em tempo real. Assuma quando o lead esquentar."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/configuracoes/whatsapp">
              <MessageCircle className="h-4 w-4 mr-2" /> Configurar WhatsApp
            </Link>
          </Button>
        }
      />

      {!whatsappConectado && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">WhatsApp não conectado</p>
            <p className="text-amber-800 mt-0.5">
              Conecte um número de WhatsApp pra começar a receber leads.{' '}
              <Link href="/configuracoes/whatsapp" className="underline font-medium">
                Conectar agora
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px,1fr,300px] h-[calc(100vh-220px)] min-h-[500px]">
        {/* Coluna 1: Lista de conversas */}
        <aside className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar..."
                className="h-8 w-full pl-8 pr-2 rounded-md border border-input bg-background text-xs"
              />
            </div>
            <div className="flex gap-1 text-[11px]">
              {(['TODAS', 'IA', 'HUMANO'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={cn(
                    'flex-1 rounded px-2 py-1 font-medium transition-colors',
                    filtroStatus === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {s === 'TODAS' ? 'Todas' : s === 'IA' ? 'IA' : 'Eu atendendo'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {conversas.length === 0
                  ? 'Nenhuma conversa ainda. Quando alguém mandar mensagem no seu WhatsApp, aparece aqui.'
                  : 'Nenhuma conversa pra esse filtro.'}
              </div>
            ) : (
              conversasFiltradas.map((c) => {
                const last = c.mensagens[0];
                const preview = last?.conteudo ?? '(sem mensagens)';
                const selected = c.id === selecionadaId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelecionadaId(c.id)}
                    className={cn(
                      'w-full text-left border-b border-border px-3 py-3 hover:bg-muted/50 transition-colors',
                      selected && 'bg-primary/5 border-l-2 border-l-primary',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StatusDot status={c.status} />
                        <span className="text-xs font-semibold truncate">
                          {c.clienteNome ?? formatPhoneBR(c.clienteWa)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {tempoRelativo(c.ultimaMsgEm)}
                      </span>
                    </div>
                    {c.imovel && (
                      <div className="mt-1 text-[10px] font-mono text-primary truncate">
                        {c.imovel.codigo}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {preview}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Coluna 2: Detalhe da conversa */}
        <section className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          {!detalhe ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Selecione uma conversa
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-border p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                    {(detalhe.clienteNome ?? detalhe.clienteWa).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {detalhe.clienteNome ?? formatPhoneBR(detalhe.clienteWa)}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {formatPhoneBR(detalhe.clienteWa)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {detalhe.status === 'IA' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acao('assumir')}
                      disabled={acaoEmAndamento}
                    >
                      <Hand className="h-3.5 w-3.5 mr-1.5" /> Assumir
                    </Button>
                  )}
                  {detalhe.status === 'HUMANO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acao('devolver')}
                      disabled={acaoEmAndamento}
                    >
                      <Bot className="h-3.5 w-3.5 mr-1.5" /> Devolver pra IA
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acao('fechar')}
                    disabled={acaoEmAndamento}
                  >
                    Encerrar
                  </Button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {loadingDetalhe ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Sem mensagens ainda.
                  </div>
                ) : (
                  mensagens.map((m) => <Bubble key={m.id} msg={m} />)
                )}
                <div ref={msgsEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-border p-3">
                {detalhe.status === 'FECHADA' ? (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    Conversa encerrada.{' '}
                    <button
                      onClick={() => acao('assumir')}
                      className="underline text-primary hover:opacity-80"
                    >
                      Reabrir
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          enviar();
                        }
                      }}
                      placeholder={
                        detalhe.status === 'IA'
                          ? 'Assumir antes de escrever (ou só envie — IA pausa)'
                          : 'Sua mensagem...'
                      }
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <Button
                      onClick={enviar}
                      disabled={enviando || !composer.trim()}
                      size="sm"
                    >
                      {enviando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Coluna 3: Contexto (imóvel, lead) */}
        <aside className="rounded-xl border border-border bg-card overflow-y-auto hidden lg:block">
          {!detalhe ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Selecione uma conversa pra ver detalhes
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Status
                </div>
                <StatusBadge status={detalhe.status} />
              </div>

              {detalhe.imovel && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Imóvel da conversa
                  </div>
                  <Link
                    href={`/imoveis/${detalhe.imovel.id}`}
                    className="block rounded-lg border border-border overflow-hidden hover:border-primary transition-colors"
                  >
                    {detalhe.imovel.capaUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detalhe.imovel.capaUrl}
                        alt=""
                        className="h-24 w-full object-cover"
                      />
                    )}
                    <div className="p-2.5">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {detalhe.imovel.codigo}
                      </div>
                      <div className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2">
                        {detalhe.imovel.titulo}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {[detalhe.imovel.bairro, detalhe.imovel.cidade].filter(Boolean).join(' · ')}
                      </div>
                      <div className="text-[11px] font-bold text-primary mt-1.5">
                        {detalhe.imovel.preco.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary">
                        Ver imóvel <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {detalhe.lead && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Lead vinculado
                  </div>
                  <Link
                    href={`/leads/${detalhe.lead.id}`}
                    className="block rounded-lg border border-border p-3 hover:border-primary transition-colors"
                  >
                    <div className="text-xs font-semibold">{detalhe.lead.nome}</div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">
                        {detalhe.lead.etapa}
                      </span>
                      <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">
                        {detalhe.lead.temperatura}
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {detalhe.resumoLLM && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Resumo da IA
                  </div>
                  <div className="text-xs leading-relaxed text-muted-foreground rounded-md bg-muted/40 p-2.5">
                    {detalhe.resumoLLM}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Detalhes
                </div>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <div>Iniciada: {new Date(detalhe.iniciadaEm).toLocaleString('pt-BR')}</div>
                  <div>Última msg: {new Date(detalhe.ultimaMsgEm).toLocaleString('pt-BR')}</div>
                  <div>Provider: {detalhe.providerType}</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: ConvStatus }) {
  const color = {
    IA: 'bg-blue-500',
    HUMANO: 'bg-emerald-500',
    FECHADA: 'bg-slate-400',
  }[status];
  return <span className={cn('h-2 w-2 rounded-full flex-shrink-0', color)} />;
}

function StatusBadge({ status }: { status: ConvStatus }) {
  const map = {
    IA: { label: 'IA atendendo', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    HUMANO: { label: 'Você atendendo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FECHADA: { label: 'Encerrada', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  }[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium', map.cls)}>
      <StatusDot status={status} />
      {map.label}
    </span>
  );
}

function Bubble({ msg }: { msg: MensagemDetalhe }) {
  const isOut = msg.direcao === 'OUT';
  const autorIcon =
    msg.autorTipo === 'IA' ? <Bot className="h-3 w-3" /> :
    msg.autorTipo === 'HUMANO' ? <UserIcon className="h-3 w-3" /> : null;
  const autorLabel =
    msg.autorTipo === 'IA' ? 'IA' :
    msg.autorTipo === 'HUMANO' ? 'Você' :
    msg.autorTipo === 'CLIENTE' ? 'Cliente' : 'Sistema';
  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2', isOut ? 'bg-primary text-primary-foreground' : 'bg-white border border-border')}>
        {isOut && (
          <div className="text-[9px] opacity-70 mb-0.5 flex items-center gap-1 uppercase tracking-wider">
            {autorIcon} {autorLabel}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</div>
        <div className={cn('text-[9px] mt-1', isOut ? 'opacity-70' : 'text-muted-foreground')}>
          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
