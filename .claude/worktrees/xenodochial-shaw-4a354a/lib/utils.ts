import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper padrão do shadcn/ui — combina classes Tailwind com merge inteligente
 * (resolve conflitos tipo "p-4 p-6" → "p-6").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
