'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Phone,
  Palette,
  Share2,
  Globe,
  ScrollText,
  Plug,
  UsersRound,
  CreditCard,
  Save,
  Check,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Perfil = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  creci: string;
};
type Marca = {
  nomeEmpresa: string;
  slogan: string;
  descricao: string;
  logoUrl: string;
  faviconUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  email: string;
  whatsapp: string;
  telefone: string;
  endereco: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
};
type TenantInfo = {
  slug: string;
  plano: string;
  siteSlug: string | null;
  sitePublicado: boolean;
};
type EquipeUser = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  creci: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
};

type TabId =
  | 'perfil'
  | 'empresa'
  | 'contato'
  | 'marca'
  | 'redes'
  | 'site'
  | 'legal'
  | 'integracoes'
  | 'equipe'
  | 'plano';

type Tab = { id: TabId; label: string; icon: LucideIcon; soft?: boolean };

const TABS: Tab[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'contato', label: 'Contato', icon: Phone },
  { id: 'marca', label: 'Marca & Cores', icon: Palette },
  { id: 'redes', label: 'Redes Sociais', icon: Share2 },
  { id: 'site', label: 'Meu Site', icon: Globe },
  { id: 'legal', label: 'Páginas Legais', icon: ScrollText, soft: true },
  { id: 'integracoes', label: 'Integrações', icon: Plug, soft: true },
  { id: 'equipe', label: 'Equipe', icon: UsersRound },
  { id: 'plano', label: 'Plano', icon: CreditCard },
];

const PALETAS: Array<{ name: string; primaria: string; secundaria: string }> = [
  { name: 'Gold + Forest', primaria: '#c5a64f', secundaria: '#1a2e1a' },
  { name: 'Roxo + Ciano', primaria: '#7c3aed', secundaria: '#06b6d4' },
  { name: 'Vermelho + Laranja', primaria: '#dc2626', secundaria: '#f97316' },
  { name: 'Verde Esmeralda', primaria: '#059669', secundaria: '#10b981' },
  { name: 'Azul Marinho', primaria: '#1d4ed8', secundaria: '#7c3aed' },
  { name: 'Âmbar', primaria: '#d97706', secundaria: '#f59e0b' },
  { name: 'Charcoal', primaria: '#0f172a', secundaria: '#334155' },
];

const PLANO_LABEL: Record<string, string> = {
  FREE: 'Gratuito',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export default function ConfiguracoesClient(props: {
  perfil: Perfil;
  marca: Marca;
  tenantInfo: TenantInfo;
  equipe: EquipeUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<TabId>('perfil');
  const [perfil, setPerfil] = useState<Perfil>(props.perfil);
  const [marca, setMarca] = useState<Marca>(props.marca);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  }

  async function savePerfil() {
    setSaving(true);
    try {
      const r = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfil),
      });
      if (!r.ok) throw new Error();
      flashSaved();
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  async function saveMarca() {
    setSaving(true);
    try {
      const r = await fetch('/api/configuracoes/marca', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marca),
      });
      if (!r.ok) throw new Error();
      flashSaved();
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  function setM<K extends keyof Marca>(k: K, v: Marca[K]) {
    setMarca((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Identidade, marca, site e equipe da sua imobiliária
          </p>
        </div>
        {savedFlash && (
          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/20">
            <Check className="h-3 w-3 mr-1" /> Salvo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Tabs verticais */}
        <nav className="md:sticky md:top-20 md:self-start space-y-0.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{t.label}</span>
                {t.soft && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-muted-foreground/10 tracking-wider text-muted-foreground">
                    em breve
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo da aba */}
        <div className="space-y-5 min-w-0">
          {tab === 'perfil' && (
            <Section
              title="Perfil do corretor"
              hint="Suas informações pessoais — aparecem como remetente em mensagens automáticas e em sua assinatura."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome completo *">
                  <Input
                    value={perfil.nome}
                    onChange={(e) =>
                      setPerfil((p) => ({ ...p, nome: e.target.value }))
                    }
                    placeholder="Seu nome completo"
                  />
                </Field>
                <Field label="CRECI">
                  <Input
                    value={perfil.creci}
                    onChange={(e) =>
                      setPerfil((p) => ({ ...p, creci: e.target.value }))
                    }
                    placeholder="Ex: 123456-SP"
                  />
                </Field>
                <Field label="E-mail" hint="Não pode ser alterado">
                  <Input value={perfil.email} disabled />
                </Field>
                <Field label="WhatsApp pessoal">
                  <Input
                    value={perfil.whatsapp}
                    onChange={(e) =>
                      setPerfil((p) => ({ ...p, whatsapp: e.target.value }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </Field>
              </div>
              <SaveButton onClick={savePerfil} saving={saving} />
            </Section>
          )}

          {tab === 'empresa' && (
            <Section
              title="Identidade da empresa"
              hint="Como sua imobiliária aparece pro mundo — usado no site público, posts e PDFs."
            >
              <div className="grid grid-cols-1 gap-4">
                <Field label="Nome da imobiliária *">
                  <Input
                    value={marca.nomeEmpresa}
                    onChange={(e) => setM('nomeEmpresa', e.target.value)}
                    placeholder="Ex: Imobiliária Pinheiros"
                  />
                </Field>
                <Field label="Slogan">
                  <Input
                    value={marca.slogan}
                    onChange={(e) => setM('slogan', e.target.value)}
                    placeholder="Ex: Seu lar ideal começa aqui"
                  />
                </Field>
                <Field
                  label="Descrição curta"
                  hint="2 a 3 linhas — aparece no site e nos posts"
                >
                  <textarea
                    value={marca.descricao}
                    onChange={(e) => setM('descricao', e.target.value)}
                    rows={3}
                    placeholder="Especialistas em imóveis residenciais de alto padrão na Zona Sul de São Paulo..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  />
                </Field>
              </div>
              <SaveButton onClick={saveMarca} saving={saving} />
            </Section>
          )}

          {tab === 'contato' && (
            <Section
              title="Contato e endereço"
              hint="Aparecem no rodapé do site, no botão de WhatsApp e nas peças de marketing."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="WhatsApp da imobiliária *" hint="Sem espaços. Ex: 5511999999999">
                  <Input
                    value={marca.whatsapp}
                    onChange={(e) => setM('whatsapp', e.target.value)}
                    placeholder="5511999999999"
                  />
                </Field>
                <Field label="Telefone fixo">
                  <Input
                    value={marca.telefone}
                    onChange={(e) => setM('telefone', e.target.value)}
                    placeholder="(11) 3333-4444"
                  />
                </Field>
                <Field label="E-mail de contato">
                  <Input
                    type="email"
                    value={marca.email}
                    onChange={(e) => setM('email', e.target.value)}
                    placeholder="contato@suaimobiliaria.com.br"
                  />
                </Field>
                <Field label="Endereço completo">
                  <Input
                    value={marca.endereco}
                    onChange={(e) => setM('endereco', e.target.value)}
                    placeholder="Rua, número, bairro — Cidade/UF"
                  />
                </Field>
              </div>
              <SaveButton onClick={saveMarca} saving={saving} />
            </Section>
          )}

          {tab === 'marca' && (
            <Section
              title="Marca & cores"
              hint="Logo, favicon e paleta — aplicado automaticamente no site e nas artes geradas."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="URL do logo" hint="Use uma URL hospedada por enquanto. Upload em breve.">
                  <Input
                    value={marca.logoUrl}
                    onChange={(e) => setM('logoUrl', e.target.value)}
                    placeholder="https://..."
                  />
                  {marca.logoUrl && (
                    <div className="mt-2 p-3 rounded-md bg-muted/40 border border-border flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={marca.logoUrl}
                        alt="Logo preview"
                        className="h-8 max-w-[120px] object-contain"
                      />
                      <span className="text-xs text-muted-foreground">
                        Pré-visualização
                      </span>
                    </div>
                  )}
                </Field>
                <Field label="URL do favicon" hint="Ícone que aparece na aba do navegador.">
                  <Input
                    value={marca.faviconUrl}
                    onChange={(e) => setM('faviconUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Cor primária">
                  <ColorInput
                    value={marca.corPrimaria}
                    onChange={(v) => setM('corPrimaria', v)}
                  />
                </Field>
                <Field label="Cor secundária">
                  <ColorInput
                    value={marca.corSecundaria}
                    onChange={(v) => setM('corSecundaria', v)}
                  />
                </Field>
              </div>

              {/* Preview gradiente */}
              <div
                className="mt-3 h-24 rounded-lg flex items-center justify-center text-white font-display text-xl font-semibold shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})`,
                }}
              >
                Pré-visualização das suas cores
              </div>

              {/* Paletas sugeridas */}
              <div className="mt-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Paletas sugeridas
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PALETAS.map((p) => {
                    const ativa =
                      p.primaria === marca.corPrimaria &&
                      p.secundaria === marca.corSecundaria;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setM('corPrimaria', p.primaria);
                          setM('corSecundaria', p.secundaria);
                        }}
                        className={cn(
                          'rounded-md p-2 border text-left transition-colors',
                          ativa
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-foreground/30',
                        )}
                      >
                        <div
                          className="h-8 rounded"
                          style={{
                            background: `linear-gradient(135deg, ${p.primaria}, ${p.secundaria})`,
                          }}
                        />
                        <p className="text-[11px] mt-1.5 truncate text-foreground">
                          {p.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <SaveButton onClick={saveMarca} saving={saving} />
            </Section>
          )}

          {tab === 'redes' && (
            <Section
              title="Redes sociais"
              hint="Aparecem no rodapé do site e em peças de marketing. Cole a URL completa."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="📸 Instagram">
                  <Input
                    value={marca.instagram}
                    onChange={(e) => setM('instagram', e.target.value)}
                    placeholder="https://instagram.com/suaimobiliaria"
                  />
                </Field>
                <Field label="👥 Facebook">
                  <Input
                    value={marca.facebook}
                    onChange={(e) => setM('facebook', e.target.value)}
                    placeholder="https://facebook.com/suaimobiliaria"
                  />
                </Field>
                <Field label="▶️ YouTube">
                  <Input
                    value={marca.youtube}
                    onChange={(e) => setM('youtube', e.target.value)}
                    placeholder="https://youtube.com/@suaimobiliaria"
                  />
                </Field>
                <Field label="💼 LinkedIn">
                  <Input
                    value={marca.linkedin}
                    onChange={(e) => setM('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/suaimobiliaria"
                  />
                </Field>
                <Field label="🎵 TikTok">
                  <Input
                    value={marca.tiktok}
                    onChange={(e) => setM('tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@suaimobiliaria"
                  />
                </Field>
              </div>
              <SaveButton onClick={saveMarca} saving={saving} />
            </Section>
          )}

          {tab === 'site' && <SiteTab tenantInfo={props.tenantInfo} />}

          {tab === 'legal' && (
            <Placeholder
              title="Páginas legais"
              description="Política de Privacidade, Termos de Uso e Política de Cookies do seu site público."
              bullets={[
                'Editor rich text com placeholders {{nome_empresa}}, {{cidade}}',
                'Templates prontos LGPD pra preencher na hora',
                'Aparece automaticamente no rodapé do site público',
                'Banner de cookies configurável (cor, posição, texto)',
              ]}
            />
          )}

          {tab === 'integracoes' && (
            <Placeholder
              title="Integrações"
              description="Conecte ferramentas externas pra rastrear, cobrar e atender clientes."
              bullets={[
                'Pixel da Meta (Facebook/Instagram Ads) — código de rastreamento',
                'Google Analytics 4 — ID de medição',
                'Google Tag Manager',
                'Google Maps API (mapa no site)',
                'Asaas (pagamentos) — credenciais já gerenciadas pela plataforma',
                'Evolution API (WhatsApp) — chatbot no site',
              ]}
            />
          )}

          {tab === 'equipe' && (
            <EquipeTab
              equipe={props.equipe}
              currentUserId={props.currentUserId}
            />
          )}

          {tab === 'plano' && <PlanoTab tenantInfo={props.tenantInfo} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Aba Site ---------- */

function SiteTab({ tenantInfo }: { tenantInfo: TenantInfo }) {
  const url = tenantInfo.siteSlug ? `/s/${tenantInfo.siteSlug}` : null;
  return (
    <Section
      title="Meu Site"
      hint="O endereço público do seu site, template visual escolhido e domínio próprio."
    >
      <div className="space-y-4">
        <Field label="URL pública">
          {url ? (
            <div className="flex items-center gap-2">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}${url}`}
                readOnly
                className="bg-muted/40 font-mono text-xs"
              />
              <Button asChild variant="outline" size="sm">
                <Link href={url} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href="/sites">
                <Plus className="h-4 w-4 mr-2" /> Configurar meu site
              </Link>
            </Button>
          )}
        </Field>

        <Field label="Template visual ativo">
          <div className="rounded-md border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 grid place-items-center text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Elegance</p>
              <p className="text-xs text-muted-foreground">
                Tema Gold + Forest, tipografia serif. Padrão da plataforma.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Ativo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Mais templates (Cosmic, Boutique) chegam em breve. Você poderá
            trocar quando quiser.
          </p>
        </Field>

        <Field
          label="Domínio próprio"
          hint="Use seu próprio domínio (suaimobiliaria.com.br) em vez de imobia.io/s/slug"
        >
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Plug className="h-4 w-4" /> Em breve no plano Pro
          </div>
        </Field>

        <Field
          label="SEO (Search Engine Optimization)"
          hint="Title, description e imagem que aparecem no Google e quando alguém compartilha o link."
        >
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Plug className="h-4 w-4" /> Em breve
          </div>
        </Field>
      </div>
    </Section>
  );
}

/* ---------- Aba Equipe ---------- */

function EquipeTab({
  equipe,
  currentUserId,
}: {
  equipe: EquipeUser[];
  currentUserId: string;
}) {
  return (
    <Section
      title="Equipe"
      hint="Corretores e usuários da sua imobiliária. Cada um pode ter o próprio CRECI e WhatsApp."
    >
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">
          {equipe.length} {equipe.length === 1 ? 'pessoa' : 'pessoas'} na equipe
        </p>
        <Button disabled title="Em breve">
          <Plus className="h-4 w-4 mr-2" />
          Convidar corretor
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Nome</th>
              <th className="text-left px-4 py-2.5 font-medium">Função</th>
              <th className="text-left px-4 py-2.5 font-medium">CRECI</th>
              <th className="text-left px-4 py-2.5 font-medium">Contato</th>
              <th className="text-right px-4 py-2.5 font-medium">Entrou em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {equipe.map((u) => {
              const eu = u.id === currentUserId;
              return (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold shrink-0">
                        {u.nome
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {u.nome}
                          {eu && (
                            <span className="ml-1.5 text-[10px] uppercase font-semibold tracking-wider text-primary">
                              você
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {u.creci || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {u.whatsapp || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Convite por e-mail, edição de papéis e remoção de membros chegam na
        próxima entrega.
      </p>
    </Section>
  );
}

/* ---------- Aba Plano ---------- */

function PlanoTab({ tenantInfo }: { tenantInfo: TenantInfo }) {
  return (
    <Section
      title="Plano e cobrança"
      hint="Seu plano atual, próxima cobrança e histórico de pagamentos."
    >
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] uppercase font-semibold tracking-wider text-primary">
              Plano atual
            </p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">
              {PLANO_LABEL[tenantInfo.plano] ?? tenantInfo.plano}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tenant: <code className="font-mono">{tenantInfo.slug}</code>
            </p>
          </div>
          <Button>Fazer upgrade</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCardLite label="Próxima cobrança" value="—" />
        <KpiCardLite label="Forma de pagamento" value="—" />
        <KpiCardLite label="Status" value="Ativo" accent />
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Histórico de faturas e gestão completa de cobrança via Asaas chega na
        próxima entrega.
      </p>
    </Section>
  );
}

/* ---------- Helpers visuais ---------- */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 md:p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">
          {title}
        </h2>
        {hint && (
          <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1.5 text-foreground/80">
        {label}
      </span>
      {children}
      {hint && (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      )}
    </label>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer"
        aria-label="Seletor de cor"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
        placeholder="#000000"
      />
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
}: {
  onClick: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end">
      <Button onClick={onClick} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </>
        )}
      </Button>
    </div>
  );
}

function Placeholder({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Section title={title} hint={description}>
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            Em construção
          </p>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function KpiCardLite({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-semibold',
          accent ? 'text-green-600 dark:text-green-400' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
