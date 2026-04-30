'use client';

import { useState, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  ImageOff,
  Loader2,
  ArrowRight,
  Square,
  RectangleVertical,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  type ImovelParaPost,
  type MarcaParaPost,
  type PostFormato,
  FORMATO_DIMENSOES,
  FORMATO_LABELS,
  gerarLegenda,
} from '@/app/_post-templates/types';
import { POST_TEMPLATES, getTemplate } from '@/app/_post-templates/registry';

type PostExistente = {
  id: string;
  tipo: string;
  conteudo: string;
  imageUrl: string | null;
  createdAt: string;
};

type Step = 'lista' | 'formato' | 'template' | 'export';

const AI_TEMPLATE_ID = '__ia__';

export default function MediaKitClient({
  imovel,
  marca,
  postsExistentes,
}: {
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
  postsExistentes: PostExistente[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('lista');
  const [formatoEscolhido, setFormatoEscolhido] = useState<PostFormato>('POST_QUADRADO');
  const [templateEscolhido, setTemplateEscolhido] = useState<string>('clean');
  const [savingPost, setSavingPost] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedTexto, setCopiedTexto] = useState(false);
  const [legendaCustom, setLegendaCustom] = useState<string | null>(null); // se IA gerou
  const [gerandoIA, setGerandoIA] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  // F4.3c — imagem gerada pela OpenAI (alternativa aos templates HTML)
  const [imagemIaUrl, setImagemIaUrl] = useState<string | null>(null);
  const [gerandoImagemIa, setGerandoImagemIa] = useState(false);

  // Ref do template em tamanho REAL (off-screen) — esse é o que o html2canvas captura
  const offscreenRef = useRef<HTMLDivElement>(null);

  const legenda = legendaCustom ?? gerarLegenda(imovel, marca);

  function abrirGerador() {
    setLegendaCustom(null); // reset legenda IA ao começar de novo
    setImagemIaUrl(null); // reset imagem IA também
    setStep('formato');
  }

  function escolherFormato(f: PostFormato) {
    setFormatoEscolhido(f);
    setStep('template');
  }

  async function escolherTemplate(templateId: string) {
    setTemplateEscolhido(templateId);
    if (templateId === AI_TEMPLATE_ID) {
      // Dispara geração antes de mostrar o export
      await gerarImagemIA();
    }
    setStep('export');
  }

  async function gerarImagemIA() {
    setGerandoImagemIa(true);
    setImagemIaUrl(null);
    try {
      const r = await fetch('/api/posts/imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovelId: imovel.id,
          formato: formatoEscolhido,
          estilo: 'fotografico',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setImagemIaUrl(data.imageUrl);
    } catch (e) {
      toast.error('Não consegui gerar a imagem com IA', {
        description: (e as Error).message,
      });
    } finally {
      setGerandoImagemIa(false);
    }
  }

  async function gerarLegendaIA() {
    setGerandoIA(true);
    try {
      const r = await fetch('/api/posts/legenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId: imovel.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar');
      setLegendaCustom(data.legenda);
    } catch (e) {
      toast.error('Erro ao gerar legenda com IA', {
        description: (e as Error).message,
      });
    } finally {
      setGerandoIA(false);
    }
  }

  /**
   * Captura PNG do template em tamanho REAL (não escalado).
   * scale=2 = ~2160×2160 (alta resolução pra Instagram).
   */
  async function baixarPNG() {
    // Se for imagem IA, baixa direto da URL — não usa html2canvas
    if (templateEscolhido === AI_TEMPLATE_ID && imagemIaUrl) {
      setDownloading(true);
      try {
        const r = await fetch(imagemIaUrl);
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${imovel.codigo}_ia_${formatoEscolhido.toLowerCase()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        toast.error('Erro ao baixar imagem IA', {
          description: (e as Error).message,
        });
      } finally {
        setDownloading(false);
      }
      return;
    }
    if (!offscreenRef.current) {
      toast.error('Template não está pronto', {
        description: 'Aguarde um instante e tente novamente.',
      });
      return;
    }
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(offscreenRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2, // alta resolução
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        // garante que captura o tamanho declarado, não o visual
        windowWidth: FORMATO_DIMENSOES[formatoEscolhido].w,
        windowHeight: FORMATO_DIMENSOES[formatoEscolhido].h,
      });
      const link = document.createElement('a');
      link.download = `${imovel.codigo}_${templateEscolhido}_${formatoEscolhido.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      toast.error('Erro ao baixar PNG', {
        description: (e as Error).message,
      });
    } finally {
      setDownloading(false);
    }
  }

  async function salvarNaBiblioteca() {
    setSavingPost(true);
    try {
      const r = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovelId: imovel.id,
          tipo: tipoPrismaFromFormato(formatoEscolhido),
          conteudo: legenda,
          templateId: templateEscolhido,
          formato: formatoEscolhido,
          // Se gerou pela IA, persiste imageUrl pra a biblioteca exibir direto
          imageUrl:
            templateEscolhido === AI_TEMPLATE_ID ? imagemIaUrl : undefined,
        }),
      });
      if (!r.ok) throw new Error('Erro ao salvar');
      // Volta pra lista e mostra flash de sucesso
      setStep('lista');
      setFlashMsg('Post salvo na biblioteca! Aparece logo abaixo. ✓');
      setTimeout(() => setFlashMsg(null), 4000);
      router.refresh();
    } catch (e) {
      toast.error('Erro ao salvar', { description: (e as Error).message });
    } finally {
      setSavingPost(false);
    }
  }

  function copyTexto() {
    navigator.clipboard.writeText(legenda);
    setCopiedTexto(true);
    setTimeout(() => setCopiedTexto(false), 1500);
  }

  return (
    <>
      {/* DOM real off-screen — html2canvas captura DAQUI (escala 1, tamanho real) */}
      <OffscreenTemplate
        templateId={templateEscolhido}
        formato={formatoEscolhido}
        imovel={imovel}
        marca={marca}
        ref={offscreenRef}
      />

      {step === 'lista' && (
        <ListaView
          imovel={imovel}
          marca={marca}
          postsExistentes={postsExistentes}
          onGerar={abrirGerador}
          flashMsg={flashMsg}
        />
      )}

      {step === 'formato' && (
        <FormatoModal
          onCancel={() => setStep('lista')}
          onPick={escolherFormato}
        />
      )}

      {step === 'template' && (
        <TemplateModal
          imovel={imovel}
          marca={marca}
          formato={formatoEscolhido}
          onBack={() => setStep('formato')}
          onCancel={() => setStep('lista')}
          onChoose={escolherTemplate}
        />
      )}

      {step === 'export' && (
        <ExportView
          imovel={imovel}
          marca={marca}
          formato={formatoEscolhido}
          templateId={templateEscolhido}
          legenda={legenda}
          legendaIsCustom={legendaCustom !== null}
          downloading={downloading}
          savingPost={savingPost}
          copiedTexto={copiedTexto}
          gerandoIA={gerandoIA}
          imagemIaUrl={imagemIaUrl}
          gerandoImagemIa={gerandoImagemIa}
          onBack={() => setStep('template')}
          onClose={() => setStep('lista')}
          onDownload={baixarPNG}
          onSave={salvarNaBiblioteca}
          onCopy={copyTexto}
          onGerarIA={gerarLegendaIA}
          onResetLegenda={() => setLegendaCustom(null)}
          onRegenerarImagemIa={gerarImagemIA}
        />
      )}
    </>
  );
}

/* ---------- View 1: Lista de posts já gerados ---------- */

function ListaView({
  imovel,
  marca,
  postsExistentes,
  onGerar,
  flashMsg,
}: {
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
  postsExistentes: PostExistente[];
  onGerar: () => void;
  flashMsg: string | null;
}) {
  return (
    <div className="space-y-6">
      {flashMsg && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{flashMsg}</span>
        </div>
      )}
      <PageHeader
        kicker={`Media Kit · ${imovel.codigo}`}
        back={{ href: '/conteudo', label: 'Voltar pra Conteúdo' }}
        title={imovel.titulo}
        description={[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
        compact
        actions={
          <Button onClick={onGerar}>
            <Plus className="h-4 w-4 mr-2" />
            Gerar novo post
          </Button>
        }
      />

      <BrandKitInfoCard marca={marca} />

      {postsExistentes.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhum post salvo ainda pra esse imóvel"
          description="Você pode baixar posts sem salvar — só salve se quiser ter histórico aqui na biblioteca."
          action={{
            label: 'Gerar primeiro post',
            icon: Plus,
            onClick: onGerar,
          }}
        />
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {postsExistentes.length}{' '}
            {postsExistentes.length === 1
              ? 'post na biblioteca'
              : 'posts na biblioteca'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {postsExistentes.map((p) => (
              <BibliotecaCard
                key={p.id}
                post={p}
                imovel={imovel}
                marca={marca}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extrai metadata salva no início do conteudo: "[template:clean|formato:POST_QUADRADO]"
 * (workaround até ter colunas dedicadas no schema).
 */
function parsePostMetadata(conteudo: string): {
  templateId: string;
  formato: PostFormato;
  texto: string;
} {
  const match = conteudo.match(
    /^\[template:([^|]+)\|formato:([^\]]+)\]\n?([\s\S]*)$/,
  );
  if (match) {
    const [, templateId, formato, texto] = match;
    return {
      templateId,
      formato: formato as PostFormato,
      texto: texto.trim(),
    };
  }
  // Sem metadata — usa defaults
  return {
    templateId: 'clean',
    formato: 'POST_QUADRADO',
    texto: conteudo,
  };
}

function BibliotecaCard({
  post,
  imovel,
  marca,
}: {
  post: PostExistente;
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const offscreenRef = useRef<HTMLDivElement>(null);
  const { templateId, formato, texto } = parsePostMetadata(post.conteudo);
  const isAI = templateId === AI_TEMPLATE_ID || !!post.imageUrl;
  const template = isAI ? null : getTemplate(templateId) ?? POST_TEMPLATES[0];
  const TemplateComp = template?.Component;
  const dim = FORMATO_DIMENSOES[formato];

  // Preview cabe em ~340px de largura, mantendo proporção
  const previewW = 340;
  const scale = previewW / dim.w;
  const previewH = dim.h * scale;

  function copiar() {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function baixar() {
    setDownloading(true);
    try {
      // Se for post IA, baixa direto a imagem do Storage
      if (isAI && post.imageUrl) {
        const r = await fetch(post.imageUrl);
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${imovel.codigo}_ia_${formato.toLowerCase()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      if (!offscreenRef.current) return;
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(offscreenRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        windowWidth: dim.w,
        windowHeight: dim.h,
      });
      const link = document.createElement('a');
      link.download = `${imovel.codigo}_${templateId}_${formato.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      toast.error('Erro ao baixar PNG', {
        description: (e as Error).message,
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {/* Off-screen — só pros templates HTML */}
      {!isAI && TemplateComp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: -99999,
            width: dim.w,
            height: dim.h,
            pointerEvents: 'none',
            zIndex: -1,
          }}
          aria-hidden
        >
          <div ref={offscreenRef} style={{ width: dim.w, height: dim.h }}>
            <TemplateComp imovel={imovel} marca={marca} formato={formato} />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Mini preview do criativo */}
        <div
          className="relative bg-muted overflow-hidden mx-auto"
          style={{ width: previewW, height: previewH }}
        >
          {isAI && post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt="Imagem por IA"
              className="h-full w-full object-cover"
            />
          ) : TemplateComp ? (
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: dim.w,
                height: dim.h,
              }}
            >
              <TemplateComp imovel={imovel} marca={marca} formato={formato} />
            </div>
          ) : null}
          {/* Botão download flutuante */}
          <button
            onClick={baixar}
            disabled={downloading}
            className="absolute top-2 right-2 h-9 w-9 rounded-md bg-white/95 hover:bg-white grid place-items-center shadow-md transition-colors disabled:opacity-50"
            title="Baixar PNG em alta resolução"
            aria-label="Baixar PNG"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            ) : (
              <Download className="h-4 w-4 text-foreground" />
            )}
          </button>
        </div>

        {/* Texto + ações */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isAI ? (
              <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30 text-[10px] uppercase font-normal">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Por IA
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] uppercase font-normal">
                {template?.nome}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {dim.aspect}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>

          <p className="text-xs text-foreground/80 line-clamp-3 whitespace-pre-wrap leading-relaxed">
            {texto}
          </p>

          <div className="flex gap-2">
            <button
              onClick={copiar}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md border border-border hover:bg-muted text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar texto
                </>
              )}
            </button>
            <button
              onClick={baixar}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Baixar PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function BrandKitInfoCard({ marca }: { marca: MarcaParaPost }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 flex items-center gap-3 flex-wrap">
      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
        Brand kit aplicado:
      </span>
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded border border-border"
          style={{ background: marca.corPrimaria }}
        />
        <span className="text-xs text-muted-foreground font-mono">
          {marca.corPrimaria}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded border border-border"
          style={{ background: marca.corSecundaria }}
        />
        <span className="text-xs text-muted-foreground font-mono">
          {marca.corSecundaria}
        </span>
      </div>
      {marca.logoUrl && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={marca.logoUrl}
            alt=""
            className="h-5 max-w-[80px] object-contain"
          />
        </div>
      )}
      <Link
        href="/configuracoes"
        className="ml-auto text-xs text-primary hover:underline"
      >
        Editar marca →
      </Link>
    </div>
  );
}

/* ---------- View 2: Modal escolha de formato ---------- */

const FORMATOS_LISTA: { id: PostFormato; Icon: typeof Square; tag?: string }[] = [
  { id: 'POST_QUADRADO', Icon: Square },
  { id: 'POST_VERTICAL', Icon: RectangleVertical, tag: 'Recomendado' },
  { id: 'STORY', Icon: Smartphone },
];

function FormatoModal({
  onCancel,
  onPick,
}: {
  onCancel: () => void;
  onPick: (f: PostFormato) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-card border rounded-lg shadow-xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Crie posts pras redes em segundos
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Escolha o formato. Cores e logo da sua marca são aplicados
          automaticamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATOS_LISTA.map((f) => {
            const Icon = f.Icon;
            const dim = FORMATO_DIMENSOES[f.id];
            return (
              <button
                key={f.id}
                onClick={() => onPick(f.id)}
                className="flex flex-col items-center gap-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 p-5 text-center transition-colors group relative"
              >
                {f.tag && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold">
                    {f.tag}
                  </span>
                )}
                <div className="h-12 w-12 rounded-md bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-semibold text-sm text-foreground mt-1">
                  {FORMATO_LABELS[f.id]}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {dim.w}×{dim.h} ({dim.aspect})
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- View 3: Modal escolha de template ---------- */

function TemplateModal({
  imovel,
  marca,
  formato,
  onBack,
  onCancel,
  onChoose,
}: {
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
  formato: PostFormato;
  onBack: () => void;
  onCancel: () => void;
  onChoose: (templateId: string) => void;
}) {
  const dim = FORMATO_DIMENSOES[formato];
  const previewW = 280;
  const scale = previewW / dim.w;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 px-4 overflow-y-auto py-8"
      onClick={onCancel}
    >
      <div
        className="bg-card border rounded-lg shadow-xl max-w-5xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground p-1 -ml-1"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Escolha um modelo
            </h3>
            <p className="text-xs text-muted-foreground">
              {FORMATO_LABELS[formato]} · {dim.w}×{dim.h}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card "Imagem por IA" — opção #1, com badge de novidade */}
          <button
            onClick={() => onChoose(AI_TEMPLATE_ID)}
            className="text-left rounded-md border-2 border-violet-500/40 hover:border-violet-500 hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 group relative"
          >
            <span className="absolute top-2 right-2 z-10 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-violet-600 text-white font-bold">
              ✨ Novo
            </span>
            <div
              className="relative bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 overflow-hidden mx-auto flex items-center justify-center"
              style={{ width: previewW, height: dim.h * scale }}
            >
              <div className="text-center px-4">
                <Sparkles className="h-12 w-12 text-violet-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-foreground">
                  Imagem gerada por IA
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  OpenAI cria uma arte realista baseada nos dados do imóvel
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-violet-500/30">
              <p className="font-semibold text-sm">Imagem IA</p>
              <p className="text-xs text-muted-foreground">
                Cores da marca aplicadas. Demora ~30s.
              </p>
              <p className="text-[10px] text-violet-600 mt-1 uppercase tracking-wider font-semibold">
                gpt-image-1
              </p>
            </div>
          </button>

          {POST_TEMPLATES.map((t) => {
            const Component = t.Component;
            return (
              <button
                key={t.id}
                onClick={() => onChoose(t.id)}
                className="text-left rounded-md border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden bg-card group"
              >
                <div
                  className="relative bg-muted overflow-hidden mx-auto"
                  style={{ width: previewW, height: dim.h * scale }}
                >
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                      width: dim.w,
                      height: dim.h,
                    }}
                  >
                    <Component imovel={imovel} marca={marca} formato={formato} />
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <p className="font-semibold text-sm">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.descricao}
                  </p>
                  <p className="text-[10px] text-primary mt-1 uppercase tracking-wider font-semibold">
                    {t.vibe}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- View 4: Tela dedicada de Export (post grande + ações) ---------- */

function ExportView({
  imovel,
  marca,
  formato,
  templateId,
  legenda,
  legendaIsCustom,
  downloading,
  savingPost,
  copiedTexto,
  gerandoIA,
  imagemIaUrl,
  gerandoImagemIa,
  onBack,
  onClose,
  onDownload,
  onSave,
  onCopy,
  onGerarIA,
  onResetLegenda,
  onRegenerarImagemIa,
}: {
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
  formato: PostFormato;
  templateId: string;
  legenda: string;
  legendaIsCustom: boolean;
  downloading: boolean;
  savingPost: boolean;
  copiedTexto: boolean;
  gerandoIA: boolean;
  imagemIaUrl: string | null;
  gerandoImagemIa: boolean;
  onBack: () => void;
  onClose: () => void;
  onDownload: () => void;
  onSave: () => void;
  onCopy: () => void;
  onGerarIA: () => void;
  onResetLegenda: () => void;
  onRegenerarImagemIa: () => void;
}) {
  const isAI = templateId === AI_TEMPLATE_ID;
  const template = isAI
    ? null
    : getTemplate(templateId) ?? POST_TEMPLATES[0];
  const Component = template?.Component;
  const dim = FORMATO_DIMENSOES[formato];
  // preview grande (até 480px de largura ou altura, mantendo aspect)
  const maxW = 480;
  const maxH = 600;
  const scale = Math.min(maxW / dim.w, maxH / dim.h);
  const previewW = dim.w * scale;
  const previewH = dim.h * scale;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground p-1 -ml-1"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">
            Pronto pra exportar
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground truncate">
            {imovel.titulo}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isAI ? 'Imagem por IA' : template?.nome} · {FORMATO_LABELS[formato]} · {dim.w}×{dim.h}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Preview grande do post */}
        <div className="flex justify-center">
          <div
            className="rounded-lg overflow-hidden shadow-xl bg-muted relative"
            style={{ width: previewW, height: previewH }}
          >
            {isAI ? (
              <>
                {gerandoImagemIa ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                    <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-foreground">
                      Gerando arte com IA...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pode levar até 30 segundos. A OpenAI tá pintando.
                    </p>
                  </div>
                ) : imagemIaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagemIaUrl}
                    alt="Imagem gerada por IA"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center px-6 bg-muted">
                    <ImageOff className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold">
                      Nenhuma imagem gerada
                    </p>
                    <Button
                      onClick={onRegenerarImagemIa}
                      size="sm"
                      className="mt-3"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Gerar agora
                    </Button>
                  </div>
                )}
              </>
            ) : Component ? (
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: dim.w,
                  height: dim.h,
                }}
              >
                <Component imovel={imovel} marca={marca} formato={formato} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Painel direito com ações */}
        <div className="space-y-4">
          {/* Card download */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display text-lg font-semibold mb-1">
              Baixar imagem
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Alta resolução ({dim.w * 2}×{dim.h * 2}px) — pronta pra postar.
              A foto mantém proporção sem distorção.
            </p>
            <Button
              onClick={onDownload}
              disabled={downloading}
              className="w-full"
              size="lg"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PNG...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PNG
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Sem marca d'água · {dim.aspect}
            </p>
          </div>

          {/* Card legenda */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display text-lg font-semibold">
                Legenda pronta
              </h3>
              {legendaIsCustom ? (
                <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30 text-[10px] uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Por IA
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wider"
                >
                  Modelo padrão
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {legendaIsCustom
                ? 'Gerada com IA — analisa o imóvel e cria copy de marketing.'
                : 'Texto fixo com seus dados. Use IA pra um texto mais persuasivo.'}
            </p>

            <div className="rounded-md bg-muted/40 border border-border p-3 mb-3 max-h-44 overflow-y-auto">
              <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {legenda}
              </p>
            </div>

            {/* Ações da legenda */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={onCopy}
                className="flex-1"
              >
                {copiedTexto ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              {legendaIsCustom ? (
                <Button
                  variant="outline"
                  onClick={onGerarIA}
                  disabled={gerandoIA}
                  className="flex-1"
                >
                  {gerandoIA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar outra
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onGerarIA}
                  disabled={gerandoIA}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {gerandoIA ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              )}
            </div>
            {legendaIsCustom && (
              <button
                onClick={onResetLegenda}
                className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                ← voltar pro texto modelo
              </button>
            )}
          </div>

          {/* Card salvar */}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-3">
              💾 Salve esse post na biblioteca pra ter histórico — opcional.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={savingPost}
              className="w-full"
            >
              {savingPost ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-2" />
                  Salvar na biblioteca
                </>
              )}
            </Button>
          </div>

          {/* Voltar pra escolher outro template */}
          <button
            onClick={onBack}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-2 inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Escolher outro modelo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- DOM off-screen com template em tamanho REAL ---------- */

type OffscreenProps = {
  templateId: string;
  formato: PostFormato;
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
};

const OffscreenTemplate = forwardRef<HTMLDivElement, OffscreenProps>(
  function OffscreenTemplate({ templateId, formato, imovel, marca }, ref) {
    const template = getTemplate(templateId) ?? POST_TEMPLATES[0];
    const TemplateComp = template.Component;
    const dim = FORMATO_DIMENSOES[formato];

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: -99999, // off-screen — não aparece pro usuário
          width: dim.w,
          height: dim.h,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden
      >
        <div ref={ref} style={{ width: dim.w, height: dim.h }}>
          <TemplateComp imovel={imovel} marca={marca} formato={formato} />
        </div>
      </div>
    );
  },
);

/* ---------- Helpers ---------- */

function tipoPrismaFromFormato(formato: PostFormato): string {
  if (formato === 'STORY') return 'INSTAGRAM_STORIES';
  return 'INSTAGRAM_FEED';
}
