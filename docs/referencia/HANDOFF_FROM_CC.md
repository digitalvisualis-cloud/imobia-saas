# HANDOFF — ImobIA SaaS
**Atualizado em:** 2026-04-28  
**Feito por:** Claude Code (API) para continuar no Claude Max

---

## 1. O QUE É O PROJETO

SaaS imobiliário multi-tenant chamado **ImobIA**. Cada corretor/imobiliária que se cadastra vira um "tenant" isolado com seus próprios imóveis, leads, site público e agente de IA.

**Ideia central:** o corretor cadastra um imóvel → a IA gera PDF, post de Instagram, story, legenda e vídeo Reels automaticamente via webhook n8n.

---

## 2. ONDE FICA O PROJETO

```
/Users/pmfprodutora/Documents/ImobIA_SaaS/
```

### Para rodar local:
```bash
cd /Users/pmfprodutora/Documents/ImobIA_SaaS
npm run dev
# → http://localhost:3000
```

---

## 3. STACK TÉCNICA

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js App Router | 16.2.4 |
| ORM | Prisma | 7.x |
| Banco | Supabase (PostgreSQL) | — |
| Auth | NextAuth v5 | 5.0.0-beta.31 |
| UI | CSS Modules + globals | custom |
| IA | OpenAI GPT-4o | via API |
| Automação | n8n (webhook) | externo |
| Atendimento | Chatwoot | externo |
| Deploy alvo | Easypanel + VPS Hostinger | — |

> ⚠️ **ATENÇÃO:** Next.js 16 tem breaking changes. `middleware.ts` foi renomeado para `proxy.ts`. Não usar `middleware.ts`. Ler `AGENTS.md` antes de qualquer mudança estrutural.

---

## 4. CREDENCIAIS E VARIÁVEIS DE AMBIENTE

Arquivo: `/Users/pmfprodutora/Documents/ImobIA_SaaS/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://obddnxcoaillnxxpknjf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""   ← VAZIO (não usado diretamente, usar Prisma)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGRueGNvYWlsbG54eHBrbmpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxODY0NywiZXhwIjoyMDkyODk0NjQ3fQ.hhVJo9hQVD-Znzv46Ih3M-iRdjcj1ZXxBzjvXPbavWo"

# Banco direto (Prisma usa isso)
DATABASE_URL="postgresql://postgres:V3PdUk2EgcOU2PFr@db.obddnxcoaillnxxpknjf.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:V3PdUk2EgcOU2PFr@db.obddnxcoaillnxxpknjf.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="v9d8c7x6z5a4s3d2f1g0h9j8k7l6m5n4b3v2c1x0"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="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"

# Google OAuth (NÃO CONFIGURADO — login Google não funciona ainda)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""

# n8n webhook (NÃO CONFIGURADO — geração de conteúdo IA não dispara ainda)
# N8N_WEBHOOK_URL=""
# N8N_WEBHOOK_SECRET=""
```

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard/project/obddnxcoaillnxxpknjf
- **Senha do banco:** `V3PdUk2EgcOU2PFr`
- **Usuário banco:** `postgres`

---

## 5. USUÁRIO DE TESTE (PRODUÇÃO)

O Pablo criou conta real pelo signup. Credenciais de acesso ao app:

- **Email:** pablomedinafilmes@gmail.com  
- **Senha:** (Pablo sabe — foi cadastrada pelo signup do app)
- **Tenant slug:** `pablo-medina`
- **Site público:** `http://localhost:3000/s/pablo-medina`

> Para ver dados reais: logar com as credenciais acima. Todos os imóveis, leads e configurações são do tenant real do Pablo.

---

## 6. ESTRUTURA DE ARQUIVOS PRINCIPAIS

```
ImobIA_SaaS/
├── app/
│   ├── (dashboard)/              ← Área logada (protegida por auth)
│   │   ├── layout.tsx            ← SIDEBAR PRINCIPAL — editar aqui para mudar navegação
│   │   ├── layout.module.css     ← Estilos do sidebar/topbar
│   │   ├── dashboard/page.tsx    ← Painel com métricas reais
│   │   ├── imoveis/
│   │   │   ├── page.tsx          ← Server component — busca imóveis do DB
│   │   │   ├── ImoveisClient.tsx ← Client — grid/tabela de imóveis
│   │   │   ├── imoveis.module.css
│   │   │   ├── novo/page.tsx     ← Formulário de cadastro de imóvel
│   │   │   └── [id]/
│   │   │       ├── page.tsx      ← Server — busca imóvel + siteSlug
│   │   │       ├── ImovelDetailsClient.tsx ← Tabs: Info | IA & Conteúdo
│   │   │       ├── ListaProTrigger.tsx     ← UI de geração de conteúdo IA
│   │   │       └── midia/page.tsx          ← Upload de fotos
│   │   ├── leads/page.tsx        ← Kanban de leads (drag-and-drop)
│   │   ├── contatos/page.tsx     ← Redireciona para /leads (a implementar)
│   │   ├── atendimento/page.tsx  ← Config do agente IA + Chatwoot
│   │   ├── conteudo/page.tsx     ← Hub de marketing (aponta para imóveis)
│   │   ├── sites/page.tsx        ← Config do site público
│   │   ├── artes/page.tsx        ← Placeholder (a implementar)
│   │   ├── parceria/page.tsx     ← Fotos & Tour 360 (placeholder)
│   │   └── configuracoes/page.tsx ← Perfil + Marca + Plano
│   │
│   ├── s/[slug]/                 ← Site PÚBLICO do corretor (sem auth)
│   │   ├── page.tsx              ← Homepage do site do corretor
│   │   └── imovel/[codigo]/page.tsx ← Página do imóvel público
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts ← Handlers NextAuth
│   │   │   ├── profile/route.ts      ← GET/PUT perfil do usuário
│   │   │   └── signup/route.ts       ← POST cria tenant+user+marca+site
│   │   ├── imoveis/route.ts          ← GET lista / POST cria imóvel
│   │   ├── leads/route.ts            ← GET lista / POST cria / PATCH move etapa
│   │   ├── sites/route.ts            ← GET site do tenant atual
│   │   ├── agente/route.ts           ← GET/PUT config do agente IA
│   │   ├── configuracoes/marca/route.ts ← GET/PUT marca do tenant
│   │   ├── ia/
│   │   │   ├── descricao/route.ts    ← POST → gera descrição via GPT-4o
│   │   │   └── post/route.ts         ← POST → gera legenda via GPT-4o
│   │   └── listapro/
│   │       ├── trigger/route.ts      ← POST → marca GERANDO + chama n8n (INCOMPLETO)
│   │       └── status/route.ts       ← GET → retorna statusGeracao do imóvel
│   │
│   ├── login/page.tsx            ← Tela de login
│   ├── cadastro/page.tsx         ← Tela de cadastro
│   └── globals.css               ← Design system completo (variáveis, classes utilitárias)
│
├── prisma/
│   ├── schema.prisma             ← Schema completo do banco
│   └── seed.ts                   ← Seed com tenant "demo" de teste
│
├── auth.ts                       ← Config NextAuth (JWT, Credentials + Google)
├── lib/
│   └── prisma.ts                 ← Instância do Prisma com PgAdapter
├── proxy.ts                      ← Middleware de proteção de rotas (Next.js 16)
├── AGENTS.md                     ← LEIA ANTES DE QUALQUER MUDANÇA (instrução Next.js 16)
└── .env.local                    ← Credenciais (não commitar)
```

---

## 7. BANCO DE DADOS — MODELOS PRINCIPAIS

```
Tenant (imobiliária/corretor)
  ├── User (pode ter vários — corretor, admin)
  ├── Imovel (imóveis cadastrados)
  │   └── Lead (interessados naquele imóvel)
  ├── ConfigMarca (logo, cores, redes sociais)
  ├── AgenteIA (config do assistente virtual)
  ├── Site (slug do site público)
  └── PostGerado (artes/posts gerados)
```

### Campos importantes do Imovel:
- `status` = situação da venda: `DISPONIVEL / RESERVADO / VENDIDO / ALUGADO / INATIVO`
- `statusGeracao` = situação da IA: `RASCUNHO / GERANDO / PRONTO / ERRO`
- `formatosGerados` = JSON com URLs dos arquivos gerados: `{ pdf_url, post_url, story_url, reels_url, copy }`

---

## 8. SIDEBAR — ESTRUTURA ATUAL (implementada em 2026-04-28)

```
✦ ImobIA
│
├── VISÃO GERAL
│   └── Painel                    /dashboard
│
├── PORTFÓLIO
│   ├── Meus Imóveis              /imoveis
│   ├── Cadastrar Imóvel          /imoveis/novo
│   ├── Negócios                  /leads
│   └── Contatos                  /contatos  (redireciona para /leads por ora)
│
├── MARKETING
│   ├── Meu Site                  /s/[slug] (abre em nova aba)
│   ├── Conteúdo IA               /conteudo
│   └── Agendar Posts             [EM BREVE]
│
├── ATENDIMENTO IA
│   ├── Assistente Virtual        /atendimento
│   ├── Agenda                    [EM BREVE]
│   └── Financeiro                [EM BREVE]
│
├── PARCERIA
│   └── Fotos & Tour 360          /parceria
│
└── ⚙️ Configurações              /configuracoes
    [avatar do usuário]
```

---

## 9. O QUE FUNCIONA HOJE

✅ Cadastro de novo usuário (cria tenant isolado)  
✅ Login com email/senha  
✅ Dashboard com métricas reais (imóveis, leads, valor total)  
✅ CRUD de imóveis (cadastrar, ver detalhes, upload de fotos)  
✅ Kanban de leads com drag-and-drop  
✅ Config do agente IA (nome, personalidade, webhook n8n, Chatwoot)  
✅ Configurações de perfil (nome, CRECI, WhatsApp)  
✅ Configurações de marca (cores, logo, redes sociais)  
✅ Site público do corretor em `/s/[slug]` com imóveis reais  
✅ Página pública de cada imóvel em `/s/[slug]/imovel/[codigo]`  
✅ Botão "Ver no Site" no detalhe do imóvel (link correto)  
✅ Geração de conteúdo IA — UI completa (disparo via n8n, polling de status)  
✅ Sidebar modular (Portfólio / Marketing / Atendimento IA / Parceria)  

---

## 10. O QUE NÃO FUNCIONA / ESTÁ INCOMPLETO

| Feature | Status | O que falta |
|---|---|---|
| Login com Google | ❌ | Criar app no Google Cloud Console → pegar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` → colocar no `.env.local` |
| Geração IA (n8n) | ⚠️ UI pronta, disparo não funciona | Configurar URL do webhook n8n em `/api/listapro/trigger/route.ts` — linha com comentário "AQUI ENTRARIA A CHAMADA REAL PARA O N8N" |
| Contatos | ⚠️ | Criar página própria de contatos (atualmente redireciona para /leads) |
| Agenda | 🚧 Em breve | Nova página + integração com calendário |
| Financeiro | 🚧 Em breve | Nova página de comissões/receitas |
| Agendar Posts | 🚧 Em breve | Nova página de agendamento de conteúdo |
| Upload de logo/favicon | ❌ | Supabase Storage não configurado para upload de imagens |
| Deploy em produção | ❌ | Easypanel + VPS Hostinger — ainda não configurado |
| Planos pagos / Stripe | ❌ | Stripe SDK instalado mas sem integração |

---

## 11. PRÓXIMAS TAREFAS (MÓDULOS)

### Módulo 1 — Conectar n8n (PRIORITÁRIO)
1. No n8n, criar workflow que recebe webhook com dados do imóvel
2. O workflow gera o conteúdo (PDF/post/story via ferramentas de design)
3. Ao finalizar, faz POST de volta para `/api/listapro/callback` com as URLs geradas
4. No app, criar `/api/listapro/callback/route.ts` que atualiza `statusGeracao = PRONTO` e `formatosGerados = { pdf_url, post_url, ... }`
5. Em `/api/listapro/trigger/route.ts`, descomentar e configurar a chamada real ao webhook

### Módulo 2 — Contatos (CRM completo)
- Criar `/contatos/page.tsx` com lista de contatos separada de leads
- Contatos = pessoas cadastradas; Leads = oportunidades ativas
- Importar contatos do Chatwoot

### Módulo 3 — Site Builder (melhorar o site público)
- Atualmente o site é HTML puro gerado pelo código
- Próximo: adicionar seleção de temas, upload de logo, banner customizável
- Referência: ver como o Lano faz (tema, cores da marca, SEO)

### Módulo 4 — Atendimento IA com Agenda
- Integrar Google Calendar para agendamento de visitas
- Criar view de agenda semanal em `/atendimento/agenda`

### Módulo 5 — Financeiro
- Registrar comissões por imóvel vendido
- Dashboard de receitas previstas vs realizadas

---

## 12. ARQUITETURA DE AUTH (IMPORTANTE)

- **JWT strategy** — sem banco de sessões, token carrega `{ id, tenantId, role, plano }`
- **Toda API** deve verificar auth assim:
  ```ts
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  ```
- **Isolamento de dados:** sempre filtrar queries com `where: { tenantId }` — nunca retornar dados de outro tenant
- **proxy.ts** (não middleware.ts!) protege todas as rotas do dashboard — redireciona para `/login` se não autenticado

---

## 13. DESIGN SYSTEM

Tudo em `app/globals.css`. Classes disponíveis:

```css
/* Layout */
.card, .fade-in, .grid-2, .grid-3, .flex, .flex-col

/* Botões */
.btn .btn-primary, .btn-secondary, .btn-sm

/* Formulários */
.input, .label, .form-group

/* Badges */
.badge .badge-green, .badge-yellow, .badge-red, .badge-gray, .badge-blue, .badge-purple

/* Texto */
.text-muted, .text-xs, .text-sm, .font-semibold, .text-green, .text-accent
```

---

## 14. COMANDOS ÚTEIS

```bash
# Rodar desenvolvimento
cd /Users/pmfprodutora/Documents/ImobIA_SaaS
npm run dev

# Build de produção
npm run build

# Resetar banco (cuidado — apaga tudo)
npx prisma db push --force-reset

# Popular banco com dados de demo
npx prisma db seed

# Gerar cliente Prisma após mudar schema
npx prisma generate

# Abrir Prisma Studio (visualizar banco)
npx prisma studio
```

---

## 15. SERVIÇOS EXTERNOS CONECTADOS

| Serviço | Status | Acesso |
|---|---|---|
| Supabase | ✅ Ativo | supabase.com → projeto `obddnxcoaillnxxpknjf` |
| OpenAI | ✅ Configurado | chave no `.env.local` |
| n8n | ⚠️ Não conectado | URL do webhook precisa ser configurada |
| Chatwoot | ⚠️ Campo existe no DB | Precisa configurar instância e token |
| Google OAuth | ❌ Não configurado | Precisa criar app no Google Cloud Console |
| Stripe | ❌ SDK instalado | Sem integração implementada |

---

## 16. CONTEXTO DE NEGÓCIO

- **Produto:** SaaS para corretores de imóveis brasileiros
- **Diferencial:** IA gera PDF de ficha, post, story e vídeo Reels automaticamente
- **Referência de mercado:** plataforma "Lano" — boa estrutura de módulos, mas IA mais básica
- **Usuário real de teste:** Pablo Medina (pablomedinafilmes@gmail.com) — usa o próprio produto
- **Meta:** lançar versão paga com Stripe e deploy no Easypanel/Hostinger

---

*Documento gerado pelo Claude Code em 2026-04-28. Continuar no Claude Max.*
