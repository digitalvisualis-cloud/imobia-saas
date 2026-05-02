'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  Building2,
  KeyRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type PortalDef = {
  id: 'vrsync' | 'chavesnamao';
  nome: string;
  cobertura: string[]; // portais que aceitam esse formato
  formato: 'VRSync' | 'XML proprietário';
  comoConectar: 'painel' | 'email';
  emailContato?: string;
  instrucoes: string[];
  cor: string;
};

const PORTAIS: PortalDef[] = [
  {
    id: 'vrsync',
    nome: 'ZAP, Viva Real, OLX e outros',
    cobertura: ['ZAP Imóveis', 'Viva Real', 'OLX', 'Imovelweb', 'ImobiBrasil', '99 Imóveis'],
    formato: 'VRSync',
    comoConectar: 'painel',
    instrucoes: [
      'Entra no painel do portal (ZAP/VivaReal/OLX usam o mesmo: Canal Pro)',
      'Vai em "Integrações" ou "Importação de imóveis"',
      'Cola a URL do feed abaixo no campo "URL do XML"',
      'Salva. O portal vai puxar o XML em até 24h e atualizar os anúncios',
    ],
    cor: 'red',
  },
  {
    id: 'chavesnamao',
    nome: 'Chaves na Mão',
    cobertura: ['Chaves na Mão'],
    formato: 'XML proprietário',
    comoConectar: 'email',
    emailContato: 'atendimento@chavesnamao.com.br',
    instrucoes: [
      'Copia a URL do feed abaixo',
      'Manda email pra atendimento@chavesnamao.com.br',
      'Anexa: nome da imobiliária, CNPJ, e a URL do feed',
      'Eles processam o XML 4x por dia (07h, 13h, 19h, 01h)',
    ],
    cor: 'amber',
  },
];

export default function PortaisClient({
  slug,
  feedToken,
  imoveisCount,
}: {
  slug: string;
  feedToken: string;
  imoveisCount: number;
}) {
  const router = useRouter();
  const [token, setToken] = useState(feedToken);
  const [copied, setCopied] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Base URL — quando rodando local fica em localhost:3005, em prod, o NEXTAUTH_URL
  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  // Carrega stats em background
  useEffect(() => {
    fetch('/api/configuracoes/portais')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        if (d.feedToken) setToken(d.feedToken);
      })
      .catch(() => {});
  }, []);

  function urlOf(portal: PortalDef): string {
    const path =
      portal.id === 'vrsync'
        ? '/api/portais/vrsync.xml'
        : '/api/portais/chavesnamao.xml';
    return `${baseUrl}${path}?tenant=${slug}&token=${token}`;
  }

  async function copiar(portalId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(portalId);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error('Não consegui copiar — copia manual aí.');
    }
  }

  async function rotacionar() {
    if (
      !confirm(
        'Vai gerar uma URL nova pra todos os feeds. Os portais que estão usando a URL antiga vão parar de receber atualizações até tu atualizar lá. Confirma?',
      )
    )
      return;
    setRotating(true);
    try {
      const r = await fetch('/api/configuracoes/portais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate-token' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      setToken(d.feedToken);
      toast.success('URL nova gerada — atualiza em todos os portais.');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        kicker="Configurações"
        icon={Globe}
        title="Anunciar nos portais"
        description="Conecta teu portfólio em ZAP, Viva Real, OLX, Chaves na Mão e outros — um link XML faz o trabalho."
        back={{ href: '/configuracoes', label: 'Voltar pra Configurações' }}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Building2 className="h-3 w-3" />
              {imoveisCount} {imoveisCount === 1 ? 'imóvel' : 'imóveis'} publicados
            </Badge>
            <button
              onClick={rotacionar}
              disabled={rotating}
              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground disabled:opacity-50"
              title="Gera nova URL — quebra a antiga"
            >
              {rotating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCw className="h-3 w-3" />
              )}
              Renovar URL
            </button>
          </div>
        }
      />

      {imoveisCount === 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Nenhum imóvel publicado ainda</p>
            <p className="text-amber-700/80 dark:text-amber-300/80">
              Os feeds só incluem imóveis com status "Disponível" e "Publicado". Cadastra alguns
              em /imoveis primeiro.
            </p>
          </div>
        </div>
      )}

      {/* Aviso — não é self-service */}
      <div className="rounded-md border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Importante: tu precisa ter conta nos portais
        </p>
        <p className="text-blue-700/80 dark:text-blue-300/80">
          Os portais cobram mensalidade direto. Tu paga a eles e cadastra a URL do nosso feed lá no
          painel deles. A gente só gera o XML — não consegue criar conta nem pagar por ti. É assim
          em todo o mercado, infelizmente.
        </p>
      </div>

      {/* Cards dos portais */}
      <div className="space-y-4">
        {PORTAIS.map((portal) => {
          const url = urlOf(portal);
          const stat = stats?.[portal.id];
          const isCopied = copied === portal.id;
          return (
            <div
              key={portal.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                      <Zap
                        className={cn(
                          'h-4 w-4',
                          portal.cor === 'red'
                            ? 'text-red-500'
                            : 'text-amber-500',
                        )}
                      />
                      {portal.nome}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Funciona em: {portal.cobertura.join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider"
                    >
                      {portal.formato}
                    </Badge>
                    {stat && stat.ultimoAcesso && (
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        Acessado {timeAgo(stat.ultimoAcesso)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* URL do feed */}
                <div className="rounded-md border border-border bg-muted/40 p-3 flex items-center gap-2 group">
                  <code className="flex-1 text-xs font-mono text-foreground/90 truncate">
                    {url}
                  </code>
                  <button
                    onClick={() => copiar(portal.id, url)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted font-medium"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar URL
                      </>
                    )}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted text-muted-foreground"
                    title="Abrir XML em nova aba (debug)"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {stat && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {stat.hits7d} {stat.hits7d === 1 ? 'acesso' : 'acessos'} nos últimos 7 dias
                    {stat.ultimoIp && ` · último IP: ${stat.ultimoIp}`}
                  </p>
                )}
              </div>

              {/* Instruções */}
              <div className="px-5 py-4 bg-muted/20">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Como conectar
                  {portal.comoConectar === 'email' && (
                    <span className="ml-2 inline-flex items-center gap-1 normal-case font-normal text-amber-700 dark:text-amber-400">
                      <Mail className="h-3 w-3" />
                      Por email
                    </span>
                  )}
                </p>
                <ol className="space-y-1.5">
                  {portal.instrucoes.map((step, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground/80 flex items-start gap-2"
                    >
                      <span className="shrink-0 h-4 w-4 grid place-items-center rounded bg-primary/10 text-primary text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {portal.emailContato && (
                  <a
                    href={`mailto:${portal.emailContato}?subject=Integração XML&body=${encodeURIComponent(
                      `Olá!\n\nGostaria de cadastrar o feed XML da nossa imobiliária.\n\nURL do XML: ${url}\n\nNome da imobiliária: \nCNPJ: \n\nObrigado!`,
                    )}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    Abrir email pré-preenchido pra {portal.emailContato}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">
          Mais portais (Imovelweb, 99 Imóveis, Imobzi, Praedium, etc):
        </p>
        <p>
          A maioria aceita o mesmo formato VRSync (a primeira URL acima). Cola lá e funciona.
          Se um portal específico recusar o feed, manda um print do erro pra a equipe da
          Visualis — a gente adapta o XML pro formato dele.
        </p>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}
