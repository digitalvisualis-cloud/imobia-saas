// Exporta nós DOM (renderizados em tamanho nativo) como PNGs e dispara download.
import { toPng } from 'html-to-image';

export async function nodeToPngDataUrl(node: HTMLElement, pixelRatio = 1): Promise<string> {
  return toPng(node, { pixelRatio, cacheBust: true, skipFonts: false });
}

export async function exportNodeAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await nodeToPngDataUrl(node);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportSlides(nodes: HTMLElement[], baseName: string) {
  for (let i = 0; i < nodes.length; i++) {
    const name = nodes.length === 1
      ? `${baseName}.png`
      : `${baseName}-${String(i + 1).padStart(2, '0')}.png`;
    // eslint-disable-next-line no-await-in-loop
    await exportNodeAsPng(nodes[i], name);
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 250));
  }
}

// Thumbnail compacto pra biblioteca (~320 de largura mantendo proporção do nó nativo)
export async function nodeToThumbnail(node: HTMLElement, targetWidth = 360): Promise<string> {
  const w = node.offsetWidth || targetWidth;
  const ratio = Math.max(0.15, Math.min(1, targetWidth / w));
  return toPng(node, { pixelRatio: ratio, cacheBust: true, skipFonts: false });
}
