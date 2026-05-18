/**
 * Renderiza um texto de pagina legal (privacidade/termos/cookies) com
 * markdown bem simples: # heading, **bold**, listas com -.
 * Nao usa lib externa pra evitar peso. Suficiente pros templates.
 */

function renderMarkdownSimples(texto: string): React.ReactNode[] {
  const linhas = texto.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < linhas.length) {
    const linha = linhas[i];

    // H1
    if (linha.startsWith('# ')) {
      nodes.push(
        <h1 key={i} className="text-3xl font-bold mt-8 mb-4 first:mt-0">
          {processInline(linha.slice(2))}
        </h1>,
      );
      i++; continue;
    }
    // H2
    if (linha.startsWith('## ')) {
      nodes.push(
        <h2 key={i} className="text-xl font-bold mt-6 mb-3">
          {processInline(linha.slice(3))}
        </h2>,
      );
      i++; continue;
    }
    // H3
    if (linha.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
          {processInline(linha.slice(4))}
        </h3>,
      );
      i++; continue;
    }
    // HR
    if (linha.trim() === '---') {
      nodes.push(<hr key={i} className="my-6 border-gray-200" />);
      i++; continue;
    }
    // Lista (junta itens consecutivos)
    if (linha.startsWith('- ')) {
      const items: string[] = [];
      while (i < linhas.length && linhas[i].startsWith('- ')) {
        items.push(linhas[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-3 ml-6 list-disc space-y-1">
          {items.map((it, idx) => (
            <li key={idx}>{processInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    // Linha vazia
    if (!linha.trim()) {
      i++; continue;
    }
    // Italico de aviso (texto em italico no fim)
    if (linha.startsWith('*') && linha.endsWith('*')) {
      nodes.push(
        <p key={i} className="my-3 italic text-sm text-gray-500">
          {linha.slice(1, -1)}
        </p>,
      );
      i++; continue;
    }
    // Paragrafo
    nodes.push(
      <p key={i} className="my-3 leading-relaxed">
        {processInline(linha)}
      </p>,
    );
    i++;
  }
  return nodes;
}

function processInline(texto: string): React.ReactNode[] {
  // **bold**
  const parts = texto.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

export function PaginaLegalRender({
  texto,
  slug,
  footerExtra,
}: {
  texto: string;
  slug: string;
  /** Se passado, renderiza apos o conteudo — usado na pagina /cookies pra
      mostrar o botao "Aceitar cookies e voltar". */
  footerExtra?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href={`/s/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <span aria-hidden>←</span> Voltar pro site
          </a>
          <span className="text-xs text-gray-400">/s/{slug}</span>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-gray max-w-none">
          {renderMarkdownSimples(texto)}
        </div>
        {footerExtra}
      </div>
    </div>
  );
}
