/**
 * Cifra simétrica AES-256-GCM pra dados sensíveis em DB.
 *
 * Usa `MASTER_ENCRYPTION_KEY` (32 bytes hex = 64 chars) do env.
 * Gera com: `openssl rand -hex 32`
 *
 * Formato de saída (string única, base64 url-safe):
 *   v1.<iv-base64>.<authTag-base64>.<ciphertext-base64>
 *
 * Plain-text que começa com "v1." nunca conflita com outros formatos.
 *
 * Operações idempotentes: se o valor já tá cifrado (começa com "v1."),
 * `encrypt` retorna como veio. `decrypt` de plain-text retorna como veio.
 * Útil pra migração progressiva sem quebrar nada.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM padrão
const TAG_LEN = 16;
const PREFIX = 'v1.';

function getKey(): Buffer {
  const hex = process.env.MASTER_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'MASTER_ENCRYPTION_KEY ausente ou inválida (esperado 64 chars hex). Gere com: openssl rand -hex 32',
    );
  }
  return Buffer.from(hex, 'hex');
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/**
 * Cifra. Se entrada já tá cifrada (prefixo v1.), retorna como veio (idempotente).
 * Se entrada vazia ou null, retorna null.
 */
export function encrypt(plain: string | null | undefined): string | null {
  if (!plain || typeof plain !== 'string' || plain.length === 0) return null;
  if (plain.startsWith(PREFIX)) return plain; // já cifrado

  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

/**
 * Descifra. Se entrada não tem prefixo v1., retorna como veio (legado plain text).
 * Se inválido, throw.
 */
export function decrypt(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string' || value.length === 0) return null;
  if (!value.startsWith(PREFIX)) return value; // legado plain — passthrough pra migração suave

  const parts = value.slice(PREFIX.length).split('.');
  if (parts.length !== 3) {
    throw new Error(`Formato cifrado inválido (esperado v1.iv.tag.ct): ${value.slice(0, 12)}...`);
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = fromB64url(ivB64);
  const tag = fromB64url(tagB64);
  const ciphertext = fromB64url(ctB64);

  if (iv.length !== IV_LEN) throw new Error('IV com tamanho inválido');
  if (tag.length !== TAG_LEN) throw new Error('Tag com tamanho inválido');

  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}

/**
 * Helper: detecta se está cifrado.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Mascara um valor cifrado pra UI (não descifra — só mostra prefixo+sufixo).
 * Pra plain text legado, máscara normal.
 */
export function maskSecret(value: string | null | undefined, visibleChars = 4): string | null {
  if (!value) return null;
  if (value.startsWith(PREFIX)) {
    // Cifrado — só mostra que tá lá
    return '••••••••••••';
  }
  if (value.length <= visibleChars * 2) return '••••';
  return `${value.slice(0, visibleChars)}••••${value.slice(-visibleChars)}`;
}
