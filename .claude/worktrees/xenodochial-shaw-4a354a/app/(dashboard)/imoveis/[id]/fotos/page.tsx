'use client';

import { useState, useEffect, useRef, use, DragEvent } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './fotos.module.css';

type FotosState = {
  imagens: string[];
  capaUrl: string | null;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

export default function FotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<FotosState>({ imagens: [], capaUrl: null });
  const [imovel, setImovel] = useState<{ titulo: string; codigo: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega
  useEffect(() => {
    fetch(`/api/imoveis/${id}/fotos`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setState({ imagens: data.imagens ?? [], capaUrl: data.capaUrl });
          if (data.titulo && data.codigo) {
            setImovel({ titulo: data.titulo, codigo: data.codigo });
          }
        }
      })
      .catch(() => toast.error('Erro ao carregar fotos'))
      .finally(() => setLoading(false));
  }, [id]);

  async function uploadFiles(files: File[]) {
    const valid = files.filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name}: não é imagem`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: maior que 25MB`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    for (const f of valid) fd.append('files', f);

    try {
      const res = await fetch(`/api/imoveis/${id}/fotos`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload');
      setState({ imagens: data.imagens, capaUrl: data.capaUrl });
      toast.success(`${data.uploaded.length} foto(s) enviada(s)`);
      if (data.errors?.length) {
        for (const err of data.errors) toast.error(err);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }

  async function setCapa(url: string) {
    if (state.capaUrl === url) return;
    const prev = state;
    setState((s) => ({ ...s, capaUrl: url }));
    try {
      const res = await fetch(`/api/imoveis/${id}/fotos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-capa', url }),
      });
      if (!res.ok) throw new Error();
      toast.success('Capa atualizada');
    } catch {
      setState(prev);
      toast.error('Erro ao definir capa');
    }
  }

  async function removeFoto(url: string) {
    if (!confirm('Remover essa foto?')) return;
    const prev = state;
    setState((s) => ({
      imagens: s.imagens.filter((u) => u !== url),
      capaUrl: s.capaUrl === url ? null : s.capaUrl,
    }));
    try {
      const res = await fetch(
        `/api/imoveis/${id}/fotos?url=${encodeURIComponent(url)}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState({ imagens: data.imagens, capaUrl: data.capaUrl });
    } catch {
      setState(prev);
      toast.error('Erro ao remover');
    }
  }

  // Reorder via setas (mais simples que drag) e drag opcional
  async function persistOrder(arr: string[]) {
    try {
      const res = await fetch(`/api/imoveis/${id}/fotos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', imagens: arr }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('Erro ao reordenar');
    }
  }

  function moveLeft(idx: number) {
    if (idx === 0) return;
    const arr = [...state.imagens];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setState((s) => ({ ...s, imagens: arr }));
    persistOrder(arr);
  }
  function moveRight(idx: number) {
    if (idx >= state.imagens.length - 1) return;
    const arr = [...state.imagens];
    [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
    setState((s) => ({ ...s, imagens: arr }));
    persistOrder(arr);
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
  }
  function onDragOverCard(e: DragEvent) {
    e.preventDefault();
  }
  function onDropCard(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      return;
    }
    const arr = [...state.imagens];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(targetIdx, 0, moved);
    setDragIdx(null);
    setState((s) => ({ ...s, imagens: arr }));
    persistOrder(arr);
  }

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href={`/imoveis/${id}`} className="text-muted hover:text-primary text-sm">
            ← Voltar pro imóvel
          </Link>
          <h1 className="mt-1">Galeria de fotos</h1>
          {imovel && (
            <p className="text-muted text-sm">
              {imovel.titulo} <span className="text-xs font-mono">· {imovel.codigo}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
          <span className="text-xs text-muted">
            {state.imagens.length} foto{state.imagens.length === 1 ? '' : 's'}
          </span>
          <Link href={`/imoveis/${id}/editar`} className="btn btn-secondary btn-sm">
            ✏️ Editar dados
          </Link>
          <Link href={`/imoveis/${id}`} className="btn btn-primary btn-sm">
            ✓ Concluir
          </Link>
        </div>
      </div>

      {/* DROPZONE */}
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) uploadFiles(files);
            e.target.value = '';
          }}
        />
        <div className={styles.dropzoneInner}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>📸</div>
          <p className={styles.dropzoneTitle}>
            {uploading ? 'Enviando…' : 'Arraste fotos aqui ou clique pra escolher'}
          </p>
          <p className="text-xs text-muted">JPEG, PNG, WebP ou GIF · máx 25MB cada</p>
        </div>
      </div>

      {/* GRID DE FOTOS — estilo Lano: posição + setas + botão capa visível */}
      {loading ? (
        <p className="text-muted mt-8 text-center">Carregando…</p>
      ) : state.imagens.length === 0 ? (
        <div className={styles.emptyState}>
          <p className="text-muted">Nenhuma foto ainda. Sobe a primeira aí em cima — vira capa automaticamente.</p>
        </div>
      ) : (
        <>
          <div className={styles.legendaInfo}>
            ★ A foto marcada como <strong>CAPA</strong> é a que aparece no card do imóvel e nos posts.
            Use as setas <strong>‹ ›</strong> pra reordenar.
          </div>

          <div className={styles.grid}>
            {state.imagens.map((url, idx) => {
              const isCapa = state.capaUrl === url;
              const total = state.imagens.length;
              return (
                <div
                  key={url}
                  className={`${styles.fotoCard} ${isCapa ? styles.fotoCapa : ''}`}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={onDragOverCard}
                  onDrop={() => onDropCard(idx)}
                >
                  <div className={styles.fotoImgWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${idx + 1}`} className={styles.fotoImg} loading="lazy" />

                    {isCapa && <span className={styles.fotoBadgeCapa}>★ CAPA</span>}
                    <span className={styles.fotoIdx}>#{idx + 1}</span>

                    <button
                      className={styles.fotoBtnRemove}
                      onClick={() => removeFoto(url)}
                      title="Remover foto"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>

                  <div className={styles.fotoActions}>
                    {isCapa ? (
                      <span className={styles.fotoCapaActive}>★ É a capa</span>
                    ) : (
                      <button
                        className={styles.fotoBtnCapa}
                        onClick={() => setCapa(url)}
                        type="button"
                      >
                        ☆ Definir como capa
                      </button>
                    )}

                    <div className={styles.fotoArrows}>
                      <button
                        type="button"
                        className={styles.arrowBtn}
                        onClick={() => moveLeft(idx)}
                        disabled={idx === 0}
                        title="Mover pra esquerda"
                        aria-label="Mover pra esquerda"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.arrowBtn}
                        onClick={() => moveRight(idx)}
                        disabled={idx === total - 1}
                        title="Mover pra direita"
                        aria-label="Mover pra direita"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
