'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

/** Shape dos campos extraidos pela IA. Espelha o schema do endpoint. */
export type ExtraidoVoz = {
  tipo: string | null;
  operacao: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  preco: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaM2: number | null;
  areaTotal: number | null;
  caracteristicas: string[];
  descricao: string | null;
};

type Estado = 'idle' | 'gravando' | 'processando' | 'erro';

export function CadastroPorVozModal({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (data: ExtraidoVoz, transcricao: string) => void;
}) {
  const [estado, setEstado] = useState<Estado>('idle');
  const [tempo, setTempo] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup quando fecha o modal ou desmonta
  useEffect(() => {
    if (!open) {
      pararTudo();
      setEstado('idle');
      setTempo(0);
    }
    return pararTudo;
  }, [open]);

  function pararTudo() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recorderRef.current?.state === 'recording') {
      try {
        recorderRef.current.stop();
      } catch {}
    }
  }

  async function comecar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Tenta webm; senao deixa o browser escolher
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || 'audio/webm',
        });
        await enviar(blob);
      };

      rec.start();
      recorderRef.current = rec;
      setEstado('gravando');
      setTempo(0);
      timerRef.current = setInterval(() => setTempo((t) => t + 1), 1000);
    } catch (e: any) {
      console.error(e);
      toast.error('Não consegui acessar o microfone. Verifica as permissões.');
      setEstado('erro');
    }
  }

  function parar() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setEstado('processando');
    recorderRef.current?.stop();
  }

  async function enviar(blob: Blob) {
    try {
      const fd = new FormData();
      // .webm como nome — o Whisper aceita varios formatos
      fd.append('file', blob, 'audio.webm');
      const res = await fetch('/api/imoveis/voz', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar');
      onResult(data.dados, data.transcricao);
      toast.success('Dados preenchidos. Revisa o formulário e salva.');
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao processar áudio');
      setEstado('erro');
    }
  }

  if (!open) return null;

  function formatTempo(s: number) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Cadastrar por voz
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">
              beta
            </span>
          </h3>
          <button
            onClick={onClose}
            disabled={estado === 'processando'}
            className="rounded-md p-1 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-center">
          {estado === 'idle' && (
            <>
              <p className="text-sm text-gray-600">
                Aperte e <strong>descreva o imóvel falando</strong> — tipo, localização,
                quartos, área, preço, diferenciais. A IA preenche o formulário pra
                você revisar.
              </p>
              <button
                onClick={comecar}
                className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700"
                aria-label="Começar gravação"
              >
                <Mic className="h-8 w-8" />
              </button>
              <p className="text-xs text-gray-500">Vai pedir permissão do microfone.</p>
            </>
          )}

          {estado === 'gravando' && (
            <>
              <div className="mx-auto inline-flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                <Mic className="h-8 w-8" />
              </div>
              <p className="font-mono text-3xl font-bold text-red-600">{formatTempo(tempo)}</p>
              <p className="text-sm text-gray-600">Gravando... fala à vontade.</p>
              <button
                onClick={parar}
                className="mx-auto inline-flex items-center gap-2 rounded-md border-2 border-red-600 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <MicOff className="h-4 w-4" /> Parar e processar
              </button>
            </>
          )}

          {estado === 'processando' && (
            <>
              <Loader2 className="mx-auto h-14 w-14 animate-spin text-violet-600" />
              <p className="font-display text-base font-semibold">
                Transcrevendo e extraindo dados...
              </p>
              <p className="text-xs text-gray-500">
                Whisper + GPT. Uns 5-15 segundos.
              </p>
            </>
          )}

          {estado === 'erro' && (
            <>
              <p className="text-sm text-red-600">Algo deu errado. Tenta de novo.</p>
              <button
                onClick={() => setEstado('idle')}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Tentar de novo
              </button>
            </>
          )}
        </div>

        {estado === 'idle' && (
          <p className="mt-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            <strong>Dica:</strong> "Apartamento à venda no Jardim Paulista, São Paulo,
            por 850 mil. 3 quartos sendo 1 suíte, 2 banheiros, 1 vaga, 80m². Tem
            piscina, churrasqueira, mobiliado."
          </p>
        )}
      </div>
    </div>
  );
}
