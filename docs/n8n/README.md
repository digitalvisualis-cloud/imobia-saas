# n8n — Workflow Master Multi-Tenant

> **Princípio:** 1 workflow só, multi-tenant. Cliente novo = só linha no Supabase, ZERO trabalho no n8n.

## Estrutura

```
[Webhook IN /webhook/imobia-master]
  ↓
[HTTP: GET /api/internal/tenant-by-phone] ← descobre o tenantId pelo número de WA
  ↓
[HTTP: GET /api/internal/tenant-ia-config] ← carrega persona, objetivo, key
  ↓
[Switch: textoProvider == CLAUDE | OPENAI]
  ↓                              ↓
[Anthropic (Claude Haiku)]   [OpenAI (GPT-4o-mini)]
  ↓                              ↓
[HTTP: POST /api/webhooks/n8n/lead-in] ← cria lead no ImobIA
  ↓
[HTTP: POST /api/webhooks/n8n/lead-update] ← persiste qualificação
  ↓
(opcional: chama webhook do CRM externo se configurado)
```

## Variáveis de ambiente do n8n

No painel n8n (Settings → Environment variables), defina:

```
IMOBIA_BASE_URL       = https://app.visualisdigital.com   (ou localhost no dev)
IMOBIA_INTERNAL_TOKEN = <token random forte>               (mesmo valor no Vercel env)
N8N_WEBHOOK_SECRET    = <random forte>                     (mesmo valor no Vercel env do ImobIA)
```

## Importar o workflow

1. Acesse https://imobflow-n8n.ae01aa.easypanel.host
2. Workflows → Import from File → escolha `imobia-master-workflow.json`
3. **Configure as Credentials** (Anthropic Master + OpenAI Master) — usa as keys env do CLAUDE.md
4. **Ative o workflow** (toggle no canto superior direito)
5. Copie a URL do webhook que aparece no Webhook IN node — essa é o que o WhatsApp/site dispara

## Endpoints internos no ImobIA que o n8n consome

Esses ainda **PRECISAM SER CRIADOS** (sandbox não criou pra economizar contexto, são triviais — Pablo monta no Mac):

### `GET /api/internal/tenant-by-phone?phone=+5511999`
Retorna `{ tenantId, nome }` baseado em match de número WhatsApp salvo em `ConfigMarca.whatsapp` ou similar.
Auth: header `x-internal-token` == `IMOBIA_INTERNAL_TOKEN`.

### `GET /api/internal/tenant-ia-config?tenantId=xyz`
Retorna config do AgenteIA (nome, persona, objetivo, mensagens, textoProvider, **key resolvida** via `lib/ai-keys.ts`).
Auth: header `x-internal-token`.

⚠️ Esses endpoints retornam dados SENSÍVEIS (chave OpenAI por tenant, etc). Por isso o token interno é obrigatório e nunca vai pro browser.

## Endpoints públicos (já criados nessa sessão)

✅ `POST /api/webhooks/n8n/lead-in` — recebe lead novo (HMAC verificado)
✅ `POST /api/webhooks/n8n/lead-update` — recebe qualificação (HMAC verificado)
✅ `GET /api/admin/n8n/health` — super admin pinga o n8n

## Verificação HMAC

Todos os webhooks IN do ImobIA verificam:
- Header: `x-n8n-signature: sha256=<hex>`
- Hash: `HMAC-SHA256(rawBody, N8N_WEBHOOK_SECRET)`

No n8n, o nó HTTP Request gera assim:
```
{{ $crypto.hmac('sha256', $env.N8N_WEBHOOK_SECRET, JSON.stringify($json)) }}
```

## Troubleshooting

**"Assinatura inválida" no log:**
- N8N_WEBHOOK_SECRET diferente entre n8n env e Vercel env. Sincroniza os dois.

**Workflow não acha o tenant:**
- Falta o número de WA cadastrado em `ConfigMarca.whatsapp`. Verifica o tenant.
- OU: precisa criar `/api/internal/tenant-by-phone` primeiro.

**Anthropic/OpenAI retorna 401:**
- Credential do n8n com chave errada/expirada. Atualiza no painel n8n.
- OU: tenant tem key própria mas tá errada — checa `/configuracoes/agente-ia` do tenant.
