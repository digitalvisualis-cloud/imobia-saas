import { Construction, type LucideIcon } from 'lucide-react';

export function AdminPlaceholder({
  title,
  description,
  Icon = Construction,
  bullets,
}: {
  title: string;
  description: string;
  Icon?: LucideIcon;
  bullets?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-10 flex flex-col items-center text-center max-w-2xl">
        <div className="h-12 w-12 rounded-full bg-red-500/10 grid place-items-center text-red-400 mb-4">
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-semibold text-zinc-200 mb-1">Em construção</p>
        <p className="text-sm text-zinc-400 max-w-md">
          Essa seção do painel de plataforma ainda não foi implementada.
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-5 text-left text-sm text-zinc-400 space-y-1.5 max-w-md">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
