/**
 * Wrapper de embeddings OpenAI. Padrao da stack ImobIA:
 *   - Modelo: text-embedding-3-small (1536 dim, custo baixo, qualidade BR boa)
 *   - Dimensoes batem com a coluna `vector(1536)` em embeddings_imoveis/documentos
 */
import OpenAI from 'openai';

const MODEL = 'text-embedding-3-small';
const DIM = 1536;

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  _client = new OpenAI({ apiKey: key });
  return _client;
}

/** Gera embedding pra um unico texto. */
export async function embedOne(text: string): Promise<number[]> {
  const res = await client().embeddings.create({
    model: MODEL,
    input: text,
    encoding_format: 'float',
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length !== DIM) {
    throw new Error(`Embedding com dimensao inesperada: ${vec?.length}`);
  }
  return vec;
}

/** Batch de textos (até ~1000 itens). Mais eficiente que loop. */
export async function embedMany(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await client().embeddings.create({
    model: MODEL,
    input: texts,
    encoding_format: 'float',
  });
  return res.data.map((d) => d.embedding);
}

export const EMBEDDING_MODEL = MODEL;
export const EMBEDDING_DIM = DIM;
