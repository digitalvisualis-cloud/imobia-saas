# Handoff pro Claude Code

> **Lê isso INTEIRO antes de começar.** Esse arquivo é a passagem de bastão da sessão Cowork (ambiente sandbox claude.ai) pra ti, Claude Code (CLI rodando direto no Mac do Pablo).

---

## ⛔ Regras intransigentes

1. **NÃO refatorar** o que o Cowork construiu (F4.1 a F4.11). Backend, schema, RLS, endpoints, painéis super-admin, feeds XML — tudo isso tá testado e em produção mental do Pablo. Trabalha **POR CIMA**, não em cima.
2. **NÃO criar workflows n8n novos do zero**. Pablo já tem vários rodando em produção (ver `docs/n8n/legados/`). Adapta os existentes.
3. **NÃO mexer** em `MASTER_ENCRYPTION_KEY`, `IMOBIA_INTERNAL_TOKEN`, `N8N_WEBHOOK_SECRET` em `.env` que já tá funcionando — só adicionar novos. Rotacionar quebra dados cifrados.
4. **NÃO desabilitar RLS** em nenhuma tabela. Está habilitado em todas as 13 tabelas public por design.
5. **Antes de modificar arquivo da estrutura existente**, lê o `99-onde-paramos.md` pra entender se aquela parte foi feita por Cowork (intocável sem motivo forte).

## Sources of truth pra entender o projeto

Pra ti pegar o contexto **completo** antes de tomar qualquer decisão técnica:

| Fonte | O que tem | Onde |
|---|---|---|
| **Obsidian** | Brain do projeto, decisões estratégicas, virada backend-first, contexto Pablo | `ImobIA_SaaS_Brain.md` no vault. MCP `obsidian` se conectar. |
| **CLAUDE.md** (raiz) | Regras, tom, decisões fixas | Root do repo |
| **docs/99-onde-paramos.md** | Estado atual completo (F4.1 a F4.11) | Repo |
| **docs/n8n/legados/** | **10+ workflows que Pablo já tem rodando** (Morada One, Visualis Capital, etc) | Repo. Ler INDICE.md primeiro. |
| **docs/referencia/** | Mapa do Lovable, Lano reference, economia, arquitetura ListaPro, n8n setup | Repo |
| **docs/referencia/lano-prints/** | Screenshots de design Lano (referência visual pra FASE 2) | Repo |
| **docs/n8n/imobia-master-workflow.json** | Workflow master "ideal" desenhado pelo Cowork (referência teórica) | Repo |
| **docs/n8n/README.md** | Setup do workflow master + endpoints disponíveis | Repo |

## Fluxo recomendado quando começar

1. `git pull` no `~/Documents/ImobIA_SaaS`
2. Lê o **CLAUDE.md** (regras de tom e decisões)
3. Lê o **`docs/99-onde-paramos.md`** (estado atual de tudo)
4. Lê o **`docs/n8n/legados/INDICE.md`** (visão geral dos 10+ workflows existentes)
5. Conecta o **MCP Obsidian** e lê **`ImobIA_SaaS_Brain.md`** (contexto estratégico)
6. **Roda smoke test** local (passos abaixo)
7. **Pede confirmação ao Pablo** antes de qualquer mudança grande:
   > "Vi os workflows legados. Tu quer Opção A (adaptar incrementalmente, mantém os 5 da Morada One e adiciona nodes HTTP novos) ou Opção B (substituir tudo pelo workflow master multi-tenant que o Cowork desenhou)?"

## Estratégia de adaptação dos workflows legados

Pablo tem em produção workflows do cliente **Morada One** (5 workflows interligados) e templates **Visualis Capital** (vc-01, vc-02). Esses workflows funcionam — não quebrar.

A app ImobIA agora tem 5 endpoints prontos pra serem chamados pelo n8n:

```
GET  /api/internal/tenant-by-phone?phone=+55...
GET  /api/internal/tenant-ia-config?tenantId=xxx
GET  /api/internal/lead-context?tenantId=xxx&phone=...&imovelCodigo=IMV-XXX
POST /api/webhooks/n8n/lead-in        (cria Lead)
POST /api/webhooks/n8n/lead-update    (atualiza qualificação)
```

**Pra cada workflow legado**, decida:
- Vale plugar nesses endpoints? → Adiciona 4-5 HTTP Request nodes nos pontos certos
- Tá redundante com o que a app já faz? → Desativa no n8n
- Faz algo único (ex: integração Chatwoot, ListaPro)? → Mantém isolado, talvez adicione um node de notificação pro ImobIA

**Decisão arquitetural já TOMADA com o Pablo:**

Estratégia **B+ (híbrida — master dispatcher + 5 agentes existentes genericizados)**.

Pablo construiu uma arquitetura modular GENIAL nos workflows da Morada One:
- 1 orchestrator (Caique) com agent IA + 3 tools
- 4 sub-workflows especializados (CRM, busca imóvel, agendamento, marcação)
- 134 nodes de inteligência IA testada em produção

A estratégia é **NÃO refazer** — só adicionar 1 workflow novo `0-master-dispatcher` que descobre tenant, e adaptar pequenos pontos nos 5 existentes pra serem genéricos (não-Morada-One-hardcoded).

📖 **PLANO COMPLETO em `docs/n8n/PLANO_DE_ADAPTACAO.md`** com:
- Diagrama atual vs novo
- Schema do payload entre workflows (input/output de cada um)
- Mudança cirúrgica por workflow (tabela de antes/depois)
- 6 sprints de execução (~9-13h total)
- Checklist de validação
- Fallback se der errado

**Antes de começar essa parte do n8n:** lê o PLANO_DE_ADAPTACAO.md inteiro. É a coisa mais importante desse handoff.



## Contexto rápido

Eu sou o Claude rodando em sandbox no claude.ai (Cowork). Eu **não tenho acesso à rede** do Pablo — bloqueado. Por isso, fiz tudo que dava pra fazer **só com código + Supabase MCP + Obsidian MCP**.

Tu (Claude Code) roda **na máquina dele**, com acesso total de rede. Por isso, **as próximas tarefas são pra ti**: integração com n8n, ChatWoot, Hostinger, Vercel deploy, e qualquer coisa que precise alcançar serviços externos.

## Ordem de leitura obrigatória

1. **`CLAUDE.md`** (raiz do projeto) — regras, tom, decisões fixas
2. **`docs/99-onde-paramos.md`** — estado atual completo
3. **`docs/n8n/README.md`** — setup do workflow n8n master
4. **`prisma/schema.prisma`** — modelo de dados
5. Esse arquivo (continua abaixo)

## Estado atual da plataforma

### Backend (>95% completo)

- ✅ Auth multi-tenant (NextAuth v5 + JWT + Google OAuth)
- ✅ Schema completo (Tenant, User, Imovel, Lead, AgenteIA, Site, ConfigMarca, AgendaEvento, Contrato, PostGerado, AiCallLog, ApiRequestLog)
- ✅ Configurações em 7 abas (incluindo /configuracoes/agente-ia dedicada)
- ✅ CRM Kanban (drag-and-drop)
- ✅ Caixa de leads `/leads-inbox` (split-view com filtros)
- ✅ Agenda persistindo
- ✅ Financeiro com contratos
- ✅ Posts: 3 templates HTML→PNG + opção "Imagem por IA" (OpenAI gpt-image-1)
- ✅ Site público `/s/[slug]` com 5 templates + editor visual
- ✅ Asaas signup
- ✅ Super Admin completo (`/superadmin/{tenants, planos, api-keys, n8n, n8n-saude, logs-ia, logs-api}`)

### Hardening (F4.7 — feito hoje)

- ✅ **Cifra AES-256-GCM** das chaves IA do tenant (`lib/crypto.ts`). Format `v1.iv.tag.ct`. Idempotente — passa por valores plain legados sem quebrar.
- ✅ **Rate limit in-memory** sliding window (`lib/rate-limit.ts`). Aplicado em webhooks, internal, agente/teste, posts/imagem.
- ✅ **Logs estruturados** em DB (tabelas `ai_call_logs`, `api_request_logs`). Painéis `/superadmin/logs-ia` e `/superadmin/logs-api` consumindo dados reais.

### Segurança

- ✅ **RLS habilitado em TODAS as 13 tabelas public**. Sem policies = só Prisma/service-role acessa. Anon key bloqueada.
- ✅ HMAC SHA256 nos webhooks n8n (`lib/n8n-signature.ts`)
- ✅ Token interno nos endpoints `/api/internal/*` (`lib/internal-auth.ts`)
- ✅ isSuperAdminEmail allowlist pra rotas /superadmin/*

### n8n integration (lib/n8n-client.ts)

Cliente API REST completo: workflows CRUD, credentials CRUD idempotente, variables upsert, executions list/get, healthCheck. Painel `/superadmin/n8n` com 4 abas. **Não cria workflows automaticamente** — Pablo já tem vários, vamos adaptar.

## O que tu vai fazer agora

### 1. Verificar estado local

```bash
git pull
git status
npm install
node node_modules/typescript/bin/tsc --noEmit  # tem que dar exit 0
npx prisma generate
```

### 2. Verificar env vars do `.env.local`

Tem que ter (gera com `openssl rand -hex 32` cada um):

```
# Supabase (já configurado)
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3005

# IA master Visualis
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...      # opcional

# CRYPTO — NOVO, OBRIGATÓRIO antes de gravar qualquer chave por tenant
MASTER_ENCRYPTION_KEY=<openssl rand -hex 32>

# n8n
N8N_BASE_URL=https://imobflow-n8n.ae01aa.easypanel.host
N8N_API_KEY=eyJ...
N8N_WEBHOOK_SECRET=<openssl rand -hex 32>
N8N_MASTER_WEBHOOK_PATH=/webhook/imobia-master

# Endpoints internos
IMOBIA_INTERNAL_TOKEN=<openssl rand -hex 32>
IMOBIA_PUBLIC_URL=http://localhost:3005   # ou ngrok URL pra teste com n8n

# WAHA (quando subir)
WAHA_BASE_URL=
WAHA_API_KEY=

# Asaas
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...
```

### 3. Smoke test local

```bash
npm run dev
```

Abre `http://localhost:3005`:
- Login
- `/configuracoes/agente-ia` — toggle ativo, salva, testa
- `/superadmin/n8n` — lista workflows do n8n (a app falando com a API REST direta)
- `/superadmin/api-keys` — todas vars críticas verdes
- `/superadmin/n8n-saude` — atualiza, mostra latência
- `/superadmin/logs-ia` — vai mostrar dados conforme tu testar
- `/leads-inbox` — empty state OK

Se algo quebrar: `git log` mostra os últimos commits, geralmente o erro tá no última 1-2.

### 4. Tarefa principal (única razão pra eu te chamar)

**Plugar o pipeline n8n end-to-end com o WhatsApp do Pablo.**

Subtarefas:

#### 4.1 Conectar n8n MCP no Claude Code
```bash
claude mcp add n8n npx -y @illuminaresolutions/n8n-mcp-server
```
(ou versão atual)

Configurar com `N8N_BASE_URL` e `N8N_API_KEY` do `.env.local`. Vai te dar tools pra ler workflows.

#### 4.2 Mapear o que já existe no n8n
```bash
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://imobflow-n8n.ae01aa.easypanel.host/api/v1/workflows | jq '.data[] | {id, name, active}'
```

Lista todos. Pablo já disse que tem **vários workflows existentes** — NÃO criar novos, só adaptar.

#### 4.3 Identificar o workflow de WhatsApp/lead

Provavelmente Pablo tem algum workflow que já recebe WhatsApp (via Evolution, WaPI, ou WAHA). Lê o JSON dele com:

```bash
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://imobflow-n8n.ae01aa.easypanel.host/api/v1/workflows/<ID> | jq
```

#### 4.4 Adaptar pra plugar nos endpoints do ImobIA

Adicionar nesses workflow nodes (na ordem):

1. **Lookup tenant pelo número WA** — `GET {{$env.IMOBIA_BASE_URL}}/api/internal/tenant-by-phone?phone={{$json.from}}` com header `x-internal-token: {{$env.IMOBIA_INTERNAL_TOKEN}}`

2. **Code node: extrai código de imóvel da mensagem (Fluxo A: site → card específico)**

   ```javascript
   // O site público gera links wa.me com mensagem tipo:
   //   "Olá! Tenho interesse no imóvel [IMV-VLS-101] - Apartamento Pinheiros"
   // O agente precisa reconhecer pra puxar contexto do imóvel.
   const text = $('Webhook IN').item.json.body.text || '';
   const match = text.match(/\[\s*([A-Z]{2,5}-[A-Z0-9-]+)\s*\]/i);
   return [{ json: { ...$json, imovelCodigo: match ? match[1].toUpperCase() : null } }];
   ```

3. **Carregar contexto do lead + imóvel** — `GET {{$env.IMOBIA_BASE_URL}}/api/internal/lead-context?tenantId={{$json.tenantId}}&phone={{$json.from}}&imovelCodigo={{$json.imovelCodigo || ''}}` com x-internal-token

   Retorna `imovelDestacado` (se código veio) + `imoveisDisponiveis` (similares ou geral) + `lead` (se já existe).

4. **Carregar config IA + chaves do tenant** — `GET {{$env.IMOBIA_BASE_URL}}/api/internal/tenant-ia-config?tenantId={{$json.tenantId}}` mesmo header

5. **Set node — monta system prompt** (pseudocódigo):

   ```javascript
   const cfg = $('Lookup IA Config').item.json;
   const ctx = $('Lead Context').item.json;
   const ETAPA_LABELS = {
     boas_vindas: "Apresente-se com seu nome e pergunte o nome do lead",
     consultivo: "Descubra tipo de imóvel buscado, bairro, faixa de valor",
     apresentar: "Mostre imóveis que casam com o perfil",
     interesse: "Identifique se está pronto pra próximo passo",
     notificar: "Avise o corretor humano que tem lead quente",
     agendar: "Ofereça agendar visita direto",
     encerrar: "Finalize com mensagem de despedida",
   };
   const etapas = (cfg.etapas || [])
     .filter(e => e.active)
     .map((e, i) => `${i+1}. ${ETAPA_LABELS[e.id] || e.id}`)
     .join('\n');

   let imovelContext = '';
   if (ctx.imovelDestacado) {
     // Lead chegou interessado num imóvel específico
     const i = ctx.imovelDestacado;
     imovelContext = `\nO LEAD CHEGOU INTERESSADO NESTE IMÓVEL ESPECÍFICO:
   Código: ${i.codigo}
   ${i.titulo} — ${i.bairro || ''}, ${i.cidade}
   ${i.tipo}, ${i.quartos} quartos, ${i.banheiros} banheiros, ${i.areaM2}m²
   Preço: R$ ${i.preco.toLocaleString('pt-BR')}
   ${i.descricao || ''}\n`;
   } else if (ctx.imoveisDisponiveis?.length) {
     imovelContext = `\nIMÓVEIS DISPONÍVEIS (para sugerir quando relevante):\n` +
       ctx.imoveisDisponiveis.map(i =>
         `- ${i.codigo}: ${i.titulo}, ${i.bairro || ''}, ${i.areaM2 || '?'}m², R$ ${i.preco.toLocaleString('pt-BR')}`
       ).join('\n');
   }

   const systemPrompt = `Você é ${cfg.nome}, assistente de ${cfg.marca?.nomeEmpresa || ''}.
   Personalidade: ${cfg.personalidade}.
   ${cfg.apresentacao || ''}

   Objetivo: ${cfg.objetivo}.

   Etapas do atendimento:
   ${etapas}
   ${imovelContext}

   NUNCA invente imóveis ou preços. Mensagens curtas (3-4 linhas) — é WhatsApp.`;

   return [{ json: { ...$json, systemPrompt } }];
   ```

6. **Switch IA Provider** baseado em `cfg.textoProvider` (CLAUDE | OPENAI)

7. **Anthropic ou OpenAI node** — usa `cfg.keys.anthropic.key` ou `cfg.keys.openai.key`

8. **Criar Lead no ImobIA** — `POST {{$env.IMOBIA_BASE_URL}}/api/webhooks/n8n/lead-in` com header `x-n8n-signature: {{$crypto.hmac('sha256', $env.N8N_WEBHOOK_SECRET, JSON.stringify($json))}}` e body:
   ```json
   {
     "tenantId": "{{$('Lookup Tenant').item.json.tenantId}}",
     "nome": "{{$('Webhook IN').item.json.body.pushName}}",
     "telefone": "{{$('Webhook IN').item.json.body.from}}",
     "mensagem": "{{$('Webhook IN').item.json.body.text}}",
     "origem": "whatsapp",
     "imovelCodigoInteresse": "{{$('Extract Codigo').item.json.imovelCodigo}}"
   }
   ```

9. **Mandar resposta de volta pro WhatsApp** via WAHA

10. **Atualizar Lead com qualificação** — `POST {{$env.IMOBIA_BASE_URL}}/api/webhooks/n8n/lead-update` com mesma signature

#### 4.5 Configurar n8n env vars

Via Settings → Variables (ou via API com `lib/n8n-client.ts variables.upsert`):
- `IMOBIA_BASE_URL` = ngrok URL pra teste local OU URL Vercel pra prod
- `IMOBIA_INTERNAL_TOKEN` = mesmo valor do `.env.local`
- `N8N_WEBHOOK_SECRET` = mesmo valor do `.env.local`

#### 4.6 Teste end-to-end

1. Pablo manda mensagem real no WhatsApp do tenant teste
2. Vê o lead aparecer em `/leads-inbox` da app
3. Vê o log em `/superadmin/logs-ia`
4. Vê a execução em `/superadmin/n8n-saude` ou `/superadmin/n8n` aba Executions

Se um deles falhar — debug:
- `/superadmin/logs-api` mostra request errado
- `n8n` painel direto mostra erro do workflow
- `tail -f` no terminal do `npm run dev` pra ver erro server

### 5. Quando terminar

```bash
# Atualiza o doc do estado
# Edita docs/99-onde-paramos.md adicionando o que tu fez
git add -A
git commit -m "feat(F4.8): pipeline n8n WhatsApp → ImobIA end-to-end funcional"
git push
```

E adiciona no Obsidian também — leitura/escrita via MCP, mesma forma que o Cowork faz.

## Ferramentas que tu (Claude Code) tem que eu (Cowork) NÃO tinha

- `curl` direto pra qualquer URL
- `gh` (GitHub CLI) pra PRs e issues
- SSH pra VPS Hostinger
- `vercel` CLI pra deploy
- ngrok / cloudflared pra tunnel local
- MCP n8n native (mais tools que registry)
- Editor real-time no Mac

## Feeds dos portais (F4.10) — pra adaptar quando der erro

`/api/portais/vrsync.xml` e `/api/portais/chavesnamao.xml` retornam XML completo com todos imóveis publicados de um tenant. **VRSync** cobre 80%+ dos portais (ZAP/Viva Real/OLX/Imovelweb/etc). Quando um portal específico recusar:

1. Pega o erro/spec deles
2. Cria `/api/portais/<nome>.xml` novo
3. Adiciona helper em `lib/feeds/<nome>.ts`
4. Adiciona o card em `/configuracoes/portais/PortaisClient.tsx` (`PORTAIS` array)

Pode também aplicar webhook de **lead in** dos portais quando virar realidade — ex: ZAP manda lead via webhook, tu cria endpoint `/api/webhooks/portais/zap-lead` que parseia e cria Lead. Doc oficial: developers.grupozap.com.

## Coisas que NÃO mudou

- Idioma da UI: PT-BR sempre
- Tom: "tu" > "você", direto, sem bajulação
- Self-service: zero jargão técnico ("n8n", "webhook" são palavrões)
- Schema: sempre extender via Prisma, nunca direto SQL drift
- Multi-tenancy: filter por tenantId em TODA query
- Commits: `feat(scope): mensagem` no formato Conventional Commits

## Limites óbvios

- **Não rotaciona** chave Anthropic / OpenAI / N8N_API_KEY sem avisar Pablo. Ele é rigoroso com isso.
- **Não cria workflows novos no n8n** sem confirmação — adaptar os existentes.
- **Não toca** `MASTER_ENCRYPTION_KEY` depois que tiver dados cifrados — perderia tudo.
- **Não desabilita RLS** em nenhuma tabela.

## Boa sorte 🤝

Se travar, escreve no `99-onde-paramos.md` o que aconteceu e o Pablo me chama de volta no Cowork pra a gente discutir junto.

— Cowork Claude
