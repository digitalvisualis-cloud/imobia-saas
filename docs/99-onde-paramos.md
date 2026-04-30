# 99 — Onde Paramos

> **Última atualização:** 2026-04-28 — Pablo + Cowork session.
> Sempre dar `git pull` antes de codar e atualizar este arquivo ao terminar.

---

## ✅ Estado atual (2026-04-28)

### Concluído (F4.12 — Plano detalhado de adaptação n8n)

- ✅ **Decisão arquitetural com Pablo:** Estratégia **B+** (master dispatcher + 5 agentes existentes genéricos), em vez de refazer do zero. Aproveita 134 nodes de inteligência IA já testada na Morada One.
- ✅ **`docs/n8n/PLANO_DE_ADAPTACAO.md`** completo:
  - Diagrama arquitetural (antes single-tenant Morada One vs depois multi-tenant via Master)
  - Schema do payload em JSON entre cada par de workflows
  - Mudanças cirúrgicas por workflow (tabela antes/depois pra cada um dos 5)
  - Pré-requisitos no schema (`googleCalendarTokenId`, etc)
  - 6 sprints de execução (~9-13h total) com ordem detalhada
  - Como simular webhook com curl (sem mandar WhatsApp real)
  - Checklist de validação (10 critérios)
  - Fallbacks se der errado
  - Bonus: como Caique pode aproveitar logs centralizados, lead history rico, etc do ImobIA
- ✅ **HANDOFF_TO_CLAUDE_CODE atualizado** — decisão B+ documentada, link pro PLANO_DE_ADAPTACAO

### Concluído (F4.11 — Consolidação VISU-IMOB)

- ✅ Migrados **80 arquivos** do repo legado `digitalvisualis-cloud/visu-imob` pra dentro do `ImobIA_SaaS`:
  - `docs/n8n/legados/` — **10+ workflows n8n** que Pablo já tem rodando (Morada One, Visualis Capital, Chatwoot, ListaPro, etc) + scripts deploy/export + INDICE.md explicando função inferida de cada um
  - `docs/referencia/` — mapa do Lovable, economia + infra, arquitetura ListaPro, setup n8n original, Lano reference, HANDOFF_FROM_CC do legado
  - `docs/referencia/lano-prints/` — screenshots de design Lano (pra FASE 2 visual)
  - `docs/referencia/supabase-migrations-legadas/` — SQL antigo
- ✅ **HANDOFF_TO_CLAUDE_CODE.md reformulado** com regras intransigentes:
  - Não refatorar o que Cowork construiu
  - Não criar workflow n8n novo (pegar dos legados)
  - Sources of truth (Obsidian + 99-onde-paramos + legados + referencia)
  - Estratégia de adaptação Opção A vs B (Pablo decide)
- ✅ **Recomendação:** arquivar `digitalvisualis-cloud/visu-imob` no GitHub (não deletar — é histórico) com `gh repo archive digitalvisualis-cloud/visu-imob`

### Concluído (F4.10 — Feed XML pros portais imobiliários)

- ✅ **Schema** — campo `feedToken` no Tenant (auto-gerado UUID, populado via migration nos tenants existentes)
- ✅ **`lib/feeds/vrsync.ts`** — gera XML padrão VRSync (OpenImoveis), aceito por ZAP, Viva Real, OLX, Imovelweb, ImobiBrasil, 99imoveis, Praedium
- ✅ **`lib/feeds/chavesnamao.ts`** — gera XML proprietário pro Chaves na Mão (formato deles)
- ✅ **`/api/portais/vrsync.xml?tenant=xxx&token=xxx`** — endpoint público, valida slug+token, retorna XML completo, cache 30min, rate limit 60/min
- ✅ **`/api/portais/chavesnamao.xml?tenant=xxx&token=xxx`** — mesmo padrão
- ✅ **`/configuracoes/portais`** — página com cards dos portais + URL pra copiar + instruções passo-a-passo + stats de uso (último acesso, hits 7d) + botão "Renovar URL" pra rotacionar token
- ✅ **`/api/configuracoes/portais`** GET (stats) e POST (rotate-token)
- ✅ **Sidebar Marketing** — link "Anunciar em portais" novo, sem soon
- ✅ **Logging** — todo acesso ao feed entra em `api_request_logs` (debug + stats)

### Concluído (F4.9 — Separação estrita tenant vs super-admin)

- ✅ **Removida seção "Avançado"** de `/configuracoes/agente-ia`. Cliente final só vê: identidade (nome+tom selecionável), objetivo, fluxo de etapas, mensagens, horário. Zero jargão técnico.
- ✅ **`/api/agente`** whitelist reduzido a 8 campos. Bloqueia tentativa de tenant editar `openaiApiKey`, `anthropicApiKey`, `webhookUrl`, `webhookSaidaCrm`, `chatwootToken`, `textoProvider`, etc. Defesa em profundidade.
- ✅ **Painel super-admin** `/superadmin/tenants/[id]/agente` com 4 seções: provider IA, chaves IA cifradas, n8n integration, ChatWoot, webhook CRM.
- ✅ **`/api/admin/tenants/[id]/agente`** PUT — endpoint protegido por `isSuperAdminEmail` que aceita os 12 campos sensíveis e cifra chaves antes de salvar.
- ✅ **Lista de tenants** ganhou coluna "Agente IA" com link "configurar →" pra cada tenant.

### Concluído (F4.8 — Site → Agente IA com contexto + fusão UI)

- ✅ **`lib/whatsapp-link.ts`** — helper de geração de URL com mensagem pré-preenchida + extração de código de imóvel via regex `/\[\s*([A-Z]{2,5}-[A-Z0-9-]+)\s*\]/i`
- ✅ **`/api/internal/lead-context`** ganhou param `imovelCodigo` opcional — retorna `imovelDestacado` (imóvel específico que lead clicou no card) + `imoveisDisponiveis` (similares ou geral)
- ✅ **`TemplateImovel.tsx`** atualizado — botão "Tenho interesse" gera link com `[CÓDIGO IMV-XXX]` no texto WhatsApp
- ✅ **`buildWhatsAppLink` legado** estendido com param `imovel?` pra retro-compat
- ✅ **`/configuracoes/agente-ia` ganhou seção "Fluxo do atendimento"** — toggle por etapa, reordenação up/down, label/ícone bonitos. Substitui `/atendimento` legado.
- ✅ **Sidebar fundida** — só aparece "Agente IA" agora (apontando pra /configuracoes/agente-ia). `/atendimento` ainda existe mas sai do menu.
- ✅ **Handoff Claude Code atualizado** com pseudocódigo do parser regex + Set node n8n que monta o systemPrompt usando etapas + `imovelDestacado` quando aplicável.

### Concluído (F4.7 — Hardening produção)

- ✅ **Cifra AES-256-GCM** das chaves IA tenant — `lib/crypto.ts`. Idempotente, formato `v1.iv.tag.ct`.
- ✅ **Rate limit** sliding window — `lib/rate-limit.ts`. Aplicado em webhooks (100/min), agente/teste (20/min por tenant), posts/imagem (10/min por tenant), internal (300/min por IP).
- ✅ **Logs estruturados** — tabelas `ai_call_logs` + `api_request_logs` no Supabase. `lib/logger.ts` com `logAiCall()` + `logApiRequest()` + `estimateCostBrl()`. Aplicado em `/api/agente/teste`, `/api/posts/imagem`, `/api/webhooks/n8n/lead-in`. Páginas `/superadmin/logs-ia` e `/superadmin/logs-api` consumindo dados reais (substituiu placeholders).
- ✅ **`/superadmin/api-keys` ganhou `MASTER_ENCRYPTION_KEY`** como var crítica.
- ✅ **`docs/HANDOFF_TO_CLAUDE_CODE.md`** — briefing completo pra próxima sessão no Claude Code do Mac.

### Concluído (até a virada n8n-via-API)

- ✅ **F4.6 — n8n via API REST direta dentro da app:**
  - `lib/n8n-client.ts` — cliente completo (workflows CRUD, credentials, variables, executions, healthCheck)
  - 6 routes admin protegidas: `/api/admin/n8n/{workflows, workflows/[id], credentials, credentials/ensure-master, variables, executions, health}`
  - Painel **`/superadmin/n8n`** com 4 abas (Workflows / Credentials / Variables / Executions)
  - **Não cria workflows novos** — Pablo já tem vários, então só lista e adapta
  - Botão **"Garantir credentials master Visualis"** — cria Anthropic + OpenAI + WAHA idempotentemente usando keys do `.env`
  - Botão **"Sincronizar vars do ImobIA"** — cria/atualiza `IMOBIA_BASE_URL`, `IMOBIA_INTERNAL_TOKEN`, `N8N_WEBHOOK_SECRET` no n8n
  - `/superadmin/api-keys` ganhou novas vars: `N8N_API_KEY`, `IMOBIA_INTERNAL_TOKEN`, `IMOBIA_PUBLIC_URL`, `WAHA_BASE_URL`, `WAHA_API_KEY`

### Concluído nesta sessão (autônoma)

**FASE 1 — Backend e Sistemas (em progresso)**

- ✅ **F4.1** — Agenda persistindo (schema `AgendaEvento` + API + UI conectada)
- ✅ **F4.2** — Financeiro persistindo (schema `Contrato` + API + UI conectada)
- ✅ **F4.3** — OpenAI Image plugado nos posts:
  - **F4.3a** — Schema estendido em `AgenteIA` + página `/configuracoes/agente-ia` UX-friendly
  - **F4.3b** — Super Admin: `/superadmin/api-keys` real (15 env vars, 5 grupos) + `/superadmin/n8n-saude` (ping, KPIs, endpoints)
  - **F4.3c** — Botão "✨ Imagem por IA" no MediaKit usando key tenant→master
- ✅ **F4.4** — Webhooks n8n master (lead-in, lead-update, HMAC) + workflow JSON exportável
- ✅ **F4.5** — Inbox de leads `/leads-inbox` (split-view com filtros por etapa/temperatura, busca, KPIs) + endpoint `/api/agente/teste` chama Claude/OpenAI real
- ✅ **Endpoints internos pro n8n** (auth via `x-internal-token`):
  - `/api/internal/tenant-by-phone?phone=+55...` → tenantId
  - `/api/internal/tenant-ia-config?tenantId=xyz` → config completa com chaves resolvidas
  - `/api/internal/lead-context?tenantId=xyz&phone=+55...` → lead atual + imóveis disponíveis pra IA sugerir
  - `lib/internal-auth.ts` — helper timing-safe de validação do token
- ✅ **Migrations aplicadas direto no Supabase via MCP** (project `obddnxcoaillnxxpknjf`):
  - `extend_agente_ia_with_persona_keys_and_schedule` (14 colunas + 2 enums)
  - `enable_rls_on_sensitive_tables` (4 tabelas)
  - `enable_rls_on_remaining_tables` (9 tabelas)
- ✅ **Segurança:** RLS habilitado em **TODAS** as 13 tabelas. Sem policies = só Prisma/service-role acessa, anon key bloqueada.
- ✅ Obsidian sincronizado

### Pendente

- ⏳ **Cifrar chaves** em `agente_ia.{openai,anthropic,elevenlabs,remotion}ApiKey` (hoje plain text)
- ⏳ **Logs de execução do n8n** (tabela `n8n_execution_logs` pra alimentar /superadmin/n8n-saude completamente)
- ⏳ **Rate limiting** em `/api/webhooks/n8n/*` e `/api/agente`
- 🔜 **FASE 2** — Clonar visual Lovable Imob Star
- 🔜 **FASE 3** — Polish dashboard admin

---

## 🛠 O que tu (Pablo) precisa rodar no Mac

### 1) Pull e regenerar Prisma client

```bash
cd ~/Documents/ImobIA_SaaS
git pull
rm -rf node_modules/.prisma   # bug do Prisma 7.8 alpha SST
npx prisma generate
# ⚠️ NÃO precisa rodar `prisma db push` — migrations JÁ APLICADAS via MCP no Supabase
```

### 2) Adicionar env vars no `.env.local`

```bash
# n8n — gerenciamento via API
N8N_BASE_URL=https://imobflow-n8n.ae01aa.easypanel.host
N8N_API_KEY=                                       # Settings → API → Create new key
N8N_WEBHOOK_SECRET=                                # gera com `openssl rand -hex 32`

# Endpoints internos (n8n → ImobIA)
IMOBIA_INTERNAL_TOKEN=                             # gera com `openssl rand -hex 32`
IMOBIA_PUBLIC_URL=https://app.visualisdigital.com  # ou ngrok pra teste local

# WAHA (WhatsApp HTTP API) — quando subir
WAHA_BASE_URL=
WAHA_API_KEY=

# IA (opcionais — já tem se for master Visualis)
ELEVENLABS_API_KEY=
REMOTION_API_KEY=

# CRYPTO (NOVO — obrigatório antes de cifrar qualquer chave de tenant)
MASTER_ENCRYPTION_KEY=                             # gera com `openssl rand -hex 32`
```

⚠️ **`MASTER_ENCRYPTION_KEY` é a chave que cifra as chaves IA por tenant em DB.**
Se mudar depois que tiver dados cifrados, **perde acesso** às chaves dos tenants.
Salva ela em backup seguro. Em produção (Vercel), define como **encrypted env var**.

E replicar tudo isso no painel Vercel (Settings → Environment Variables) antes de produção.

### 3) Configurar n8n via app (em vez de mexer no painel)

**Pré-requisito:** ter `N8N_API_KEY` no `.env.local` (passo 2).

1. Abre `/superadmin/n8n` na app (rodando local)
2. **Aba Workflows** — vai listar **TODOS** os workflows que tu já tem no n8n. Tu vê o que existe e decide qual adaptar pro ImobIA. **Não vamos criar novo.**
3. **Aba Credentials** — clica "Garantir credentials master Visualis" → cria Anthropic + OpenAI no n8n usando as keys do `.env` (idempotente)
4. **Aba Variables** — clica "Sincronizar vars do ImobIA" → cria/atualiza `IMOBIA_BASE_URL`, `IMOBIA_INTERNAL_TOKEN`, `N8N_WEBHOOK_SECRET` no n8n
5. **Aba Executions** — pra monitorar quando workflow rodar

Pra adaptar um workflow existente pro pipeline de leads ImobIA, abre ele no n8n e adiciona 3 nodes HTTP que chamam:
- `GET {{IMOBIA_BASE_URL}}/api/internal/tenant-by-phone?phone=...`
- `GET {{IMOBIA_BASE_URL}}/api/internal/tenant-ia-config?tenantId=...`
- `POST {{IMOBIA_BASE_URL}}/api/webhooks/n8n/lead-in`
- `POST {{IMOBIA_BASE_URL}}/api/webhooks/n8n/lead-update`

Headers: `x-internal-token: {{IMOBIA_INTERNAL_TOKEN}}` (read) e `x-n8n-signature: {{HMAC SHA256 do body com N8N_WEBHOOK_SECRET}}` (write).

### 4) Smoke test

```bash
npm run dev
```

Confirma:
- [ ] `/configuracoes/agente-ia` carrega sem erro 500. Mexe nas configs, ativa, salva.
- [ ] `/superadmin/api-keys` mostra 15 env vars (críticas faltando = vermelho)
- [ ] `/superadmin/n8n-saude` clica Atualizar — vê latência e KPIs
- [ ] `/leads-inbox` abre. Sem leads ainda = empty state, OK.
- [ ] `/conteudo/imovel/[id]` → "Gerar novo post" → "✨ Imagem por IA" → aguarda 30s → PNG real
- [ ] Botão "Testar" em `/configuracoes/agente-ia` (com agente ativo) chama Claude/OpenAI real e mostra resposta

### 5) Commit + push

```bash
git add -A
git commit -m "feat(F4): backend completo multi-tenant IA + RLS + endpoints internos n8n"
git push
```

---

## 🔥 Débitos técnicos críticos (antes de cliente externo)

1. **Cifrar chaves** em `agente_ia.{openai,anthropic,elevenlabs,remotion}ApiKey` com `MASTER_ENCRYPTION_KEY` (AES-256). Criar `lib/crypto.ts` com `encrypt/decrypt`.
2. **Rate limiting** em `/api/webhooks/n8n/*` (50 req/min por IP), `/api/agente/teste` (20/min por session), `/api/posts/imagem` (5/min por session).
3. **Migrar ANTHROPIC_API_KEY** pra Credential nativa do n8n (não env var).
4. **Tabela `n8n_execution_logs`** — pra alimentar campos vazios em /superadmin/n8n-saude.
5. **Cuidar com `posts_gerados`** — se um cliente apagar imagem do Storage manualmente, fica órfão. Cron pra limpar.

---

## 📁 Arquivos novos/modificados nesta sessão

**Schema (já aplicado no banco via MCP):**
- `prisma/schema.prisma` — AgenteIA estendido + enums ObjetivoAgente, TextoProvider

**Libs:**
- `lib/ai-keys.ts` — resolveAiKey(tenant→master)
- `lib/n8n-signature.ts` — HMAC SHA256 timing-safe
- `lib/internal-auth.ts` — requireInternalToken + normalizePhone

**APIs:**
- `app/api/agente/route.ts` — refatorado com whitelist + masking
- `app/api/agente/teste/route.ts` — chama Claude/OpenAI real (não mais stub)
- `app/api/posts/imagem/route.ts` — usa resolveAiKey
- `app/api/posts/route.ts` — aceita imageUrl
- `app/api/admin/n8n/health/route.ts` — NOVO
- `app/api/internal/tenant-by-phone/route.ts` — NOVO
- `app/api/internal/tenant-ia-config/route.ts` — NOVO
- `app/api/internal/lead-context/route.ts` — NOVO
- `app/api/webhooks/n8n/lead-in/route.ts` — NOVO
- `app/api/webhooks/n8n/lead-update/route.ts` — NOVO

**Páginas:**
- `app/(dashboard)/configuracoes/agente-ia/{page,AgenteIaClient}.tsx` — NOVO
- `app/(dashboard)/leads-inbox/{page,LeadsInboxClient}.tsx` — NOVO
- `app/(dashboard)/conteudo/imovel/[id]/MediaKitClient.tsx` — opção IA
- `app/(dashboard)/layout.tsx` — sidebar atualizada
- `app/(super-admin)/superadmin/api-keys/{page,CredenciaisClient}.tsx` — substituiu placeholder
- `app/(super-admin)/superadmin/n8n-saude/{page,N8nSaudeClient}.tsx` — NOVO
- `app/(super-admin)/superadmin/SuperAdminShell.tsx` — link "Saúde n8n"

**Docs:**
- `docs/99-onde-paramos.md` — este arquivo
- `docs/n8n/README.md` — guia completo
- `docs/n8n/imobia-master-workflow.json` — workflow exportável

**Obsidian:**
- `ImobIA_SaaS_Brain.md` — sincronizado

---

## 🎯 Próximo passo recomendado

Depois de testar localmente:

1. Commit + push o que sandbox fez
2. Smoke test do fluxo n8n → ImobIA usando algum cliente HTTP (Postman/Insomnia)
3. Plugar provedor real de WhatsApp (Evolution API recomendado, integra fácil com n8n)
4. Quando confirmar 1 lead end-to-end → **FASE 2 (clonar visual Lovable)**
