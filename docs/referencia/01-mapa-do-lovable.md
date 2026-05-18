# 01 · Mapa do repo Lovable (o que já existe e o que vamos reaproveitar)

> Leitura completa do repositório `imobili-ria-one-star` (Lovable).
> Essa é a base que vamos migrar para Next.js 15 + multi-tenant.

---

## 1. Stack atual (Lovable)

- **Frontend**: Vite + React 18 + TypeScript + React Router v6
- **UI**: Tailwind + shadcn/ui + framer-motion + embla-carousel
- **Data**: Supabase (auth + postgres + storage) + TanStack Query
- **Editor**: TipTap (rich text)
- **PDF**: jsPDF
- **Forms/Validação**: react-hook-form + zod

---

## 2. Tabelas que já existem no Supabase

| Tabela | O que guarda | Status |
|---|---|---|
| `config_site` | Branding do site (nome, logo, favicon, whatsapp, email, endereço, políticas) | singleton — **precisa tenantizar** |
| `imoveis` | Imóveis (código, título, descrição, tipo, finalidade, preço, quartos, banheiros, vagas, área, bairro, cidade, estado, imagens[], capa, mapa, vídeo, destaque, publicado, created_by) | **precisa tenant_id** |
| `imovel_views` | Contador de visualizações por imóvel (hash único do visitante) | **precisa tenant_id** |
| `profiles` | Usuários do Supabase Auth (email, nome, must_change_password) | ok — global |
| `user_roles` | Papéis por usuário — enum `app_role`: admin, editor, viewer, owner, manager, agent | **precisa tenant_id** |
| `agent_permissions` | Permissões fine-grained por módulo (imoveis, crm, financeiro, dashboard) × can_read/write/delete | **precisa tenant_id** |
| `clientes` | CRM: nome, email, telefone, cpf_cnpj, observações | **precisa tenant_id** |
| `negocios` | Deals: cliente_id, imovel_id, valor, comissão_%, comissão_valor, status (prospecção/negociação/fechado/cancelado) | **precisa tenant_id** |
| `financeiro` | Fluxo de caixa: tipo (receita/despesa), categoria, valor, vencimento, pagamento, status (pendente/pago/atrasado), descrição, negocio_id | **precisa tenant_id** |
| `api_keys` | Chaves de API externas (key_hash, preview, active) | **precisa tenant_id** |
| `ai_config` | Config singleton de IA (provider, model, api_key_encrypted, max_tokens, default_mode) | **precisa tenantizar** |
| `ai_search_logs` | Log de buscas IA | **precisa tenant_id** |
| `api_request_logs` | Log de requests externos | **precisa tenant_id** |
| `login_attempts` | Anti brute-force | ok — global |
| `IMOBILIARIA_ANDRE` | Leads do ChatWoot/n8n de UM cliente (nome hardcoded!) | **refatorar para `leads` com tenant_id** |

**Total: 15 tabelas já criadas, 13 precisam ganhar `tenant_id` + RLS por tenant.**

### Observação crítica
A tabela `IMOBILIARIA_ANDRE` tem nome hardcoded — foi criada para um cliente específico. Na versão multi-tenant ela vira simplesmente `leads` (colunas: tenant_id, nome, whatsapp, tipo_imovel, finalidade, bairro_desejado, data_visita, follow_up_1/2/3, inicio_atendimento, timestamp_ultima_msg).

---

## 3. Páginas que já existem (29 .tsx)

### Público (o "site da imobiliária")
- `Index.tsx` — home com busca + destaques
- `PropertyDetail.tsx` — página do imóvel
- `Policies.tsx` — privacidade / termos / cookies

### Auth
- `Login`, `RecoverPassword`, `ResetPassword`, `ChangePassword`, `SupabaseConfig`

### Admin (super-admin da plataforma)
- `SiteConfig` — edita config_site
- `Properties`, `PropertyForm` — CRUD de imóveis
- `Leads` — lê IMOBILIARIA_ANDRE (WhatsApp, follow-ups, etc)
- `Integracoes`, `ApiKeys`, `ApiDocs`, `ApiLogs` — API externa
- `AiConfig`, `AiLogs` — provider/model/key da IA
- `Analytics` — visualizações
- `Users` — gestão de usuários

### Portal (o painel do cliente-imobiliária)
- `Dashboard` — contadores (imóveis, leads no mês, saldo)
- `PortalProperties` — CRUD de imóveis para o corretor
- `CRM` — clientes + negócios (com comissão automática)
- `Financeiro` — entradas/saídas manuais, soma por mês
- `Agenda` — **placeholder "em breve"** (tem botão pro Google Calendar)
- `Equipe` — toggle de permissões por módulo × owner/manager/agent
- `ListaPro` — gerador de PDF + copy pra Instagram (481 linhas, reusable)

---

## 4. O que JÁ está pronto e vamos reaproveitar quase intacto

1. **Geração de PDF** (`src/lib/listing-pdf.ts`) — layout gold/charcoal, foto de capa, tabela de fatos, descrição, diferenciais, galeria, footer com contato do corretor. 221 linhas, funciona. Só precisa parametrizar as cores pelo Brand Kit.
2. **ListaPro completo** — importa imóvel + fotos + gera descrição + copy Instagram + PDF
3. **CRM Clientes/Negócios** — já calcula comissão automática
4. **Financeiro** — soma receitas/despesas/saldo
5. **Permissões por módulo** — tabela `agent_permissions` + UI de toggle
6. **Storage de imagens** — bucket `imoveis` + `site-assets` com policies
7. **Componentes de UI** — shadcn inteiro configurado
8. **Hooks de dados** — `use-imoveis`, `use-leads`, `use-site-config`

## 5. O que precisa ser REFEITO na migração

| Item | Por quê |
|---|---|
| **Router** | Vite/React Router → Next.js 15 App Router (SSR, server components, middleware) |
| **Auth session** | AuthContext client-only → `@supabase/ssr` com cookies |
| **Data fetching** | TanStack Query puro → mix server components (RSC) + mutations client |
| **Tenant resolution** | Nenhum → middleware por host/subdomain |
| **RLS** | Policies globais → policies com `tenant_id = current_setting('app.tenant_id')` |
| **Agenda** | Placeholder → implementar de verdade (Google Calendar OAuth? ou tabela própria?) |
| **Leads table** | `IMOBILIARIA_ANDRE` hardcoded → `leads` multi-tenant + webhook do n8n |
| **AI config** | Singleton global → por tenant |

## 6. O que precisa ser CRIADO do zero (não existe no Lovable)

- Sistema de **tenants** (tabela `tenants`, `tenant_users`, onboarding wizard)
- **Cascata de geração** ao cadastrar imóvel → posts, stories, carrossel, reel, email, PDF
- **Brand Kit MD** por tenant (doc que alimenta a IA)
- **Watermark automática** nas fotos (sharp + logo do tenant)
- **Billing Asaas** (Pix, cartão, boleto, trial 15 dias)
- **Plan gates** (botões de download bloqueados por plano)
- **Webhook do n8n** para leads (substituir IMOBILIARIA_ANDRE)
- **Edge functions** pra jobs assíncronos de geração
- **Realtime** pra UI mostrar progresso da cascata
- **Geradores**: satori (imagem), @react-pdf/renderer, Remotion (reel), ElevenLabs (voz)

---

## 7. Próximos 3 passos

1. Responder perguntas do Pablo sobre **IA (Haiku + qual gerador de imagem)** e confirmar **Brand Kit MD**
2. Desenhar a **tenantização do schema** (migração de 13 tabelas ganhando tenant_id + RLS nova)
3. Fazer o **scaffolding Fase 0** no VISU-IMOB: monorepo Turborepo + Next.js 15 + Supabase client SSR + middleware de tenant
