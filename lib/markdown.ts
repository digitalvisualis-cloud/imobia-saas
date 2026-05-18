/**
 * Renderizador minimalista de markdown → HTML pra blog posts.
 *
 * Cobre o necessario pro caso de uso (H2/H3, paragrafos, negrito,
 * italico, links, listas, codigo inline). Sem dep externa pra evitar
 * bloat — quando precisarmos de mais, troca por marked/remark.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMd(s: string): string {
  let r = escapeHtml(s);
  // **bold**
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  r = r.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // [text](url)
  r = r.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="underline">$1</a>');
  // `code`
  r = r.replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1 py-0.5 rounded text-sm">$1</code>');
  return r;
}

export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const blocks: string[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  function flushPara() {
    if (para.length) {
      blocks.push(`<p>${inlineMd(para.join(' '))}</p>`);
      para = [];
    }
  }
  function flushList() {
    if (list) {
      blocks.push(`<ul class="list-disc pl-6 space-y-1">${list.map((li) => `<li>${inlineMd(li)}</li>`).join('')}</ul>`);
      list = null;
    }
  }

  for (const line of lines) {
    if (/^###\s/.test(line)) {
      flushPara();
      flushList();
      blocks.push(`<h3>${inlineMd(line.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s/.test(line)) {
      flushPara();
      flushList();
      blocks.push(`<h2>${inlineMd(line.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s/.test(line)) {
      flushPara();
      flushList();
      blocks.push(`<h1>${inlineMd(line.replace(/^#\s+/, ''))}</h1>`);
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      list = list ?? [];
      list.push(line.replace(/^[-*]\s+/, ''));
    } else if (/^\s*$/.test(line)) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks.join('\n');
}
