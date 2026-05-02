import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import type { TenantPublic } from '../types';

export function Footer({ tenant }: { tenant: TenantPublic }) {
  const home = `/s/${tenant.slug}`;
  const nome = tenant.marca?.nomeEmpresa || tenant.nome;
  const m = tenant.marca;
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + contato */}
          <div>
            <h3 className="font-display text-2xl font-semibold text-primary mb-4">
              {nome}
            </h3>
            {m?.descricao && (
              <p className="text-sm opacity-80 mb-4 leading-relaxed">
                {m.descricao}
              </p>
            )}
            {m?.endereco && (
              <div className="flex items-start gap-2 text-sm opacity-80 mb-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{m.endereco}</span>
              </div>
            )}
            {m?.whatsapp && (
              <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{m.whatsapp}</span>
              </div>
            )}
            {m?.email && (
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{m.email}</span>
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-primary mb-4">
              Links
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href={home} className="hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href={`${home}#imoveis`}
                  className="hover:text-primary transition-colors"
                >
                  Imóveis
                </Link>
              </li>
              <li>
                <Link
                  href={`${home}#contato`}
                  className="hover:text-primary transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociais */}
          <div>
            <h4 className="font-display text-lg font-semibold text-primary mb-4">
              Redes sociais
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {m?.instagram && (
                <li>
                  <a
                    href={m.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {m?.facebook && (
                <li>
                  <a
                    href={m.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Facebook
                  </a>
                </li>
              )}
              {m?.youtube && (
                <li>
                  <a
                    href={m.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    YouTube
                  </a>
                </li>
              )}
              {m?.linkedin && (
                <li>
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
              {m?.tiktok && (
                <li>
                  <a
                    href={m.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    TikTok
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-6 text-center text-xs opacity-60">
          © {ano} {nome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
