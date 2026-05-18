# Plano de adaptação — n8n multi-tenant via "Master + 5 Agentes" (estratégia B+)

> **Decisão tomada (29-abr-2026 com Pablo):**
> Mantém os 5 workflows que já estão testados e funcionando pra Morada One,
> só adiciona 1 workflow novo "Master Dispatcher" que descobre o tenant e
> chama os 5 existentes passando contexto. Cada workflow vira **genérico**
> (não-Morada-One-hardcoded).
>
> **Princípio:** menor risco possível pra arquitetura que tu já validou em
> produção. Aproveita 134 nodes de trabalho IA testado (prompts, memória
> Postgres, buffer Redis, transcrição áudio/imagem, agentes especializados
> com tools).

---

## 1. Arquitetura

### Antes (hoje, single-tenant Morada One)

```
[WhatsApp/Chatwoot] → 1-Caique
                        ├ tool: imove_tool → 3-imo_tool
                        ├ tool: Agendar    → 4-Agendamento
                        │                       ├ tool: marcar     → 5-Marcação
                        │                       ├ tool: reagendar  → 5-Marcação
                        │                       ├ tool: cancelar   → 5-Marcação
                        │                       └ tool: VerHorário → 5-Marcação
                        └ executeWorkflow:  CRM → 2-CRM
```

Tudo hardcoded pro cliente "Morada One": número WhatsApp, prompts,
tabelas Supabase específicas, URLs de notificação corretor.

### Depois (multi-tenant via Master)

```
[WhatsApp único — todos clientes] → 0-Master Dispatcher
                                       ├ GET /api/internal/tenant-by-phone
                                       ├ GET /api/internal/tenant-ia-config
                                       └ Execute Workflow: 1-Caique
                                          (passa tenantId + config completa)
                                                     │
                                                     ▼
                                          1-Caique (genérico)
                                            ├ tool → 3-imo_tool   (genérico)
                                            ├ tool → 4-Agendamento (genérico)
                                            │          └ tools → 5-Marcação
                                            └ executeWorkflow → 2-CRM (genérico)
```

**Cliente novo entra:** só inserir linha em `agente_ia` com persona dele.
**ZERO trabalho no n8n.**

---

## 2. Schema do payload entre workflows

Decidir o **contrato** uma vez, todo mundo consome.

### `0-Master → 1-Caique` (input)

```json
{
  "tenantId": "tnt_abc123",
  "tenantSlug": "morada-one",
  "leadPhone": "+5511999998888",
  "leadName": "João Silva (do WhatsApp pushName)",
  "mensagem": {
    "tipo": "texto" | "audio" | "imagem",
    "conteudo": "...",
    "mediaUrl": "https://..." // se for áudio/imagem
  },
  "config": {
    "nome": "Caique",
    "personalidade": "Consultivo e empático. Faz perguntas...",
    "apresentacao": "Somos a Morada One...",
    "objetivo": "AGENDAR_VISITA",
    "etapas": [
      { "id": "boas_vindas", "active": true },
      { "id": "consultivo",  "active": true },
      { "id": "apresentar",  "active": true },
      ...
    ],
    "mensagemSaudacao": "Oi! Vi que tu tá interessado...",
    "horarioInicio": "08:00",
    "horarioFim": "20:00",
    "diasSemana": [1,2,3,4,5],
    "textoProvider": "CLAUDE",
    "marca": {
      "nomeEmpresa": "Morada One",
      "whatsapp": "+5511...",
      "instagram": "@morada_one"
    },
    "keys": {
      "openai":    { "key": "sk-...", "source": "tenant" | "master" },
      "anthropic": { "key": "sk-ant-...", "source": "tenant" | "master" },
      "elevenlabs": { "key": "...", "source": "...", "voiceId": "..." }
    }
  },
  "imobiaBaseUrl": "https://app.visualisdigital.com",
  "imobiaInternalToken": "xxx",
  "n8nWebhookSecret": "xxx"
}
```

### `1-Caique → 2-CRM` (input quando chama executeWorkflow)

```json
{
  "tenantId": "tnt_abc123",
  "leadPhone": "+5511...",
  "leadName": "...",
  "estadoConversa": "qualificando" | "interessado" | "agendado" | ...,
  "resumoConversa": "...",
  "ultimasMensagens": [...],
  "imobiaBaseUrl": "...",
  "imobiaInternalToken": "..."
}
```

### `1-Caique → 3-imo_tool` (input via tool call do agent)

```json
{
  "tenantId": "tnt_abc123",
  "filtros": {
    "bairro": "Pinheiros",
    "tipo": "APARTAMENTO",
    "operacao": "VENDA",
    "precoMax": 1500000,
    "quartos": 3
  },
  "imobiaBaseUrl": "...",
  "imobiaInternalToken": "..."
}
```

### `1-Caique → 4-Agendamento` (input)

```json
{
  "tenantId": "tnt_abc123",
  "leadPhone": "+5511...",
  "leadId": "lead_xxx",
  "imovelCodigo": "IMV-VLS-101", // se já decidiu o imóvel
  "config": {
    "nome": "Caique",
    "horarioInicio": "08:00",
    "horarioFim": "20:00",
    "diasSemana": [1,2,3,4,5]
  },
  "googleCalendarConfig": {
    "calendarId": "...",
    "credentialId": "n8n_credential_xxx" // a credential do Google Calendar do tenant
  }
}
```

---

## 3. Mudanças por workflow

### 0-Master Dispatcher (NOVO — criar)

**O que faz:**
- Recebe webhook único do WhatsApp/Chatwoot (ou o que tu usar de provider)
- Faz lookup do tenant
- Carrega config IA do tenant
- Chama `1-Caique` passando tudo

**Nodes:**
1. `Webhook` (POST `/webhook/imobia-master`)
2. `Set` — extrai `from`, `text/audio/image` do payload
3. `HTTP Request` — `GET {{IMOBIA_BASE_URL}}/api/internal/tenant-by-phone?phone={{$json.from}}`
   - Header: `x-internal-token: {{IMOBIA_INTERNAL_TOKEN}}`
4. `IF` — tenant existe? Se não, retorna erro "número não cadastrado"
5. `HTTP Request` — `GET {{IMOBIA_BASE_URL}}/api/internal/tenant-ia-config?tenantId={{$json.tenantId}}`
6. `Execute Workflow` — chama `1-Caique` com payload completo (schema acima)

**Tamanho:** ~6-8 nodes só. É só plumbing.

---

### 1-Caique (adaptar)

**Mudanças cirúrgicas:**

| Antes | Depois |
|---|---|
| Webhook IN próprio | Recebe via `executeWorkflowTrigger` (input do Master) |
| Prompt do agent hardcoded com "Caique da Morada One" | Prompt dinâmico: `Você é {{$json.config.nome}}, da {{$json.config.marca.nomeEmpresa}}...` |
| OpenAI key configurada na credential do n8n | Usa `{{$json.config.keys.openai.key}}` ou `keys.anthropic.key` baseado em `textoProvider` |
| Postgres memory chat ID = phone hardcoded | Memory chat ID = `{{$json.tenantId}}_{{$json.leadPhone}}` (isolado por tenant) |
| `notificar_corretor` (httpRequest hardcoded) | URL do tenant: `{{$json.config.webhookSaidaCrm}}` se tiver, ou nosso `/api/webhooks/n8n/lead-update` |
| Buffer Redis key = phone hardcoded | Buffer key = `{{$json.tenantId}}:{{$json.leadPhone}}` |
| `respostaChatwoot` (httpRequest pra Chatwoot) | Condicional: se `config.usarChatwoot` é true, manda; senão manda direto pro WAHA |

**Não muda:**
- Lógica de transcrição áudio/imagem (OpenAI)
- Buffer Redis (concatena mensagens rápidas)
- Quebra de mensagem em chunks
- Memória persistente
- Estrutura do agent + 3 tools

### 2-CRM (adaptar)

| Antes | Depois |
|---|---|
| Tabela Supabase `morada_one_leads` | Tabela `leads` filtrada por `tenantId` |
| `atualizarCRM` direto via Supabase node | Substitui por `HTTP Request` → `POST /api/webhooks/n8n/lead-update` |
| `CriarUsuario` direto via Supabase | Substitui por `HTTP Request` → `POST /api/webhooks/n8n/lead-in` |
| `PuxarNumeroLead` Supabase | `GET /api/internal/lead-context?tenantId=...&phone=...` |

**Vantagem:** todas as criações/atualizações passam pelo nosso backend (com validação, log, RLS), em vez de gravar direto no DB.

### 3-imo_tool (adaptar — mais simples)

| Antes | Depois |
|---|---|
| `buscar_imoveis` HTTP pra `https://morada-one-api.com/imoveis?...` | `GET {{IMOBIA_BASE_URL}}/api/internal/lead-context?tenantId={{$json.tenantId}}&phone={{$json.leadPhone}}` |
| `formatar_imoveis` (code node) | Mantém se ajudar, ou simplifica porque nossa API já retorna formatado |

**Diferença grande:** nossa API já retorna `imovelDestacado` (se lead chegou via card específico) + `imoveisDisponiveis`. Reduz código.

### 4-Agente Agendamento (adaptar pouco)

| Antes | Depois |
|---|---|
| Memória chat ID hardcoded | `{{$json.tenantId}}_{{$json.leadPhone}}_agendamento` |
| Prompt do agent | Adapta com `{{$json.config.nome}}` |
| OpenAI key | Da config do tenant |

Tools `marcar_visita`, `reagendar_visita`, `cancelar_visita`, `VerHorarios` → continuam chamando o workflow 5.

### 5-Marcação de visita (adaptar)

| Antes | Depois |
|---|---|
| Google Calendar credential única (Morada One) | Credential dinâmica por tenant — `{{$json.googleCalendarConfig.credentialId}}` |
| Calendar ID hardcoded | `{{$json.googleCalendarConfig.calendarId}}` |
| `marcarData` Supabase tabela `morada_one_visitas` | Adicionar campo `tenantId` na query, ou substituir por `POST /api/agenda` (já existe!) |
| `etiqueta_avaliacao_agendada` (Chatwoot tag) | Condicional só se tenant usa Chatwoot |

**Bonus:** o ImobIA já tem `/api/agenda` (F4.1) com persistência. Workflow 5 pode chamar lá em vez de gravar direto no Supabase. Centraliza dados.

---

## 4. Pré-requisitos no schema

Verificar/adicionar no `agente_ia`:
- ✅ `googleCalendarTokenId` — referência à credential n8n do Google Calendar do tenant
- ✅ Campo de "calendar ID" do Google do tenant
- ✅ Campo `redisBufferKey` (se for usar buffer dedicado por tenant)

Se faltar algum: criar migration via Supabase MCP antes de adaptar workflow 5.

---

## 5. Ordem de execução (Claude Code, faça nessa ordem)

### Sprint 1 — Foundation (1-2h)
1. Ler todos os 5 workflows JSON em `docs/n8n/legados/` (entender estrutura real)
2. Validar com Pablo o schema do payload (seção 2 acima — pode ter ajustes)
3. **Não tocar nos workflows existentes ainda**

### Sprint 2 — Master + Caique adaptado (2-3h)
4. Importar `1-Caique` no n8n como **clone** chamado `1-Caique-master` (preservar original)
5. Ajustar Caique-master conforme tabela seção 3 (prompt dinâmico, memory key tenant-aware, keys do tenant)
6. Criar workflow `0-master-dispatcher` (~6-8 nodes)
7. Testar: enviar mensagem fake pelo webhook do master, ver o Caique-master responder com persona do tenant Morada One

### Sprint 3 — Adaptar 2, 3 (1h)
8. Clonar 2-CRM e 3-imo_tool, trocar HTTP nodes pra apontar pra `/api/internal/*` e `/api/webhooks/n8n/*`
9. Atualizar referências no Caique-master pra chamar os clones

### Sprint 4 — Adaptar 4, 5 (2-3h)
10. Clonar 4-Agendamento e 5-Marcação
11. Trocar Google Calendar credential pra dinâmica
12. Trocar Supabase queries por `/api/agenda` quando aplicável
13. Testar fluxo completo de agendamento

### Sprint 5 — Cliente novo de teste (1h)
14. Criar tenant teste no Supabase via app (`/signup`)
15. Configurar agente IA dele em `/configuracoes/agente-ia` (persona diferente, tipo "Lana — Boutique de Imóveis")
16. Plugar número WhatsApp dele em `config_marca.whatsapp`
17. Mandar mensagem WhatsApp pro número
18. Confirmar que o **mesmo workflow** atende o tenant novo com persona "Lana", **sem mexer no n8n**
19. Manter Morada One funcionando em paralelo (tenant antigo)

### Sprint 6 — Cutover (depois de teste OK)
20. Trocar webhook do WhatsApp da Morada One pro `0-master-dispatcher`
21. Confirmar que Morada One continua funcionando (com Caique-master agora)
22. Desativar workflows originais 1-5 (manter como backup, não deletar)

---

## 6. Como testar (sem mandar WhatsApp real toda hora)

Tu pode **simular o webhook** com curl direto:

```bash
# Simula mensagem chegando do WhatsApp pro master
curl -X POST https://imobflow-n8n.ae01aa.easypanel.host/webhook/imobia-master \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+5511988887777",
    "pushName": "João Teste",
    "text": "Olá, quero ver o ap [IMV-VLS-101]"
  }'
```

E acompanhar:
- **n8n Executions** — vê passo a passo
- **Logs ImobIA** em `/superadmin/logs-api` — vê os hits nos endpoints `/api/internal/*` e `/api/webhooks/*`
- **Lead criado** em `/leads-inbox` — confirma que apareceu

---

## 7. Checklist final de validação

Antes de chamar de "pronto":

- [ ] Master dispatcher recebe webhook e identifica tenant pelo número
- [ ] Caique-master responde com persona correta do tenant (testar com 2 tenants diferentes — Morada One + 1 novo)
- [ ] Imóveis sugeridos vêm do portfólio do tenant correto (multi-tenant rigoroso)
- [ ] Memória de conversa isolada por tenant (não vaza entre clientes)
- [ ] Agendamento marca no Google Calendar do tenant correto
- [ ] Lead criado aparece em `/leads-inbox` do tenant correto
- [ ] Logs em `/superadmin/logs-ia` mostram chamada com `tenantId` correto e custo BRL
- [ ] Webhook HMAC validado (manda payload errado → 401)
- [ ] Token interno validado (sem `x-internal-token` → 403)
- [ ] Cliente Morada One continua funcionando após cutover

---

## 8. Quando dar errado, fallback

**Cenário:** Cliente novo de teste não funciona, mas Morada One ainda funciona.
- **Solução:** Master dispatcher continua chamando o workflow original 1-Caique (não-clonado) pra Morada One, e Caique-master só pros clientes novos. Switch baseado em `tenantId` no master.

**Cenário:** Adaptar workflow 5 (Marcação) gera bug em agendamento.
- **Solução:** Manter workflow 5 original (com Calendar Morada One) pra Morada One, e criar uma versão genérica só pra clientes novos. Cutover gradual.

**Cenário:** Caique-master tem prompt fora do tom (sai do papel)
- **Solução:** Ajusta system prompt iterando até pegar o jeito. Pablo já viu esse processo na criação original.

---

## 9. Bonus — coisas que ImobIA expõe pra agentes legados aproveitarem

Coisas que tu não tinha antes:

1. **Lead history ric/h** — `/api/internal/lead-context` retorna histórico do lead (etapa atual, último contato, imóveis vistos)
2. **Imóveis com filtro inteligente** — mesma rota retorna imóveis matching baseado em `bairroDesejado`, `imovelCodigo`, etc
3. **Dados marca + brand kit** — `tenantConfig.marca` tem cores, slogan, descrição (pode usar pra contextualizar IA)
4. **Logs de IA centralizados** — toda chamada ao Claude/OpenAI vai pra `ai_call_logs` automaticamente quando passa pelo backend ImobIA. Tu ganha custo por tenant grátis.
5. **Cifra de chaves** — keys do tenant chegam descriptografadas no payload do Master pro Caique. Não tem que pensar em criptografia no n8n.

---

## 10. Decisões pendentes (Pablo + Claude Code conversam)

1. **Provider de WhatsApp final:** Pablo tava considerando WAHA. Decidido?
2. **Multi-instância vs ChatWoot:** alguns tenants vão querer Chatwoot próprio (workflow 1-Caique já tem `usarChatwoot` no config). Outros direto WAHA. Validar.
3. **Limite de mensagens por tenant** (controle de custo OpenAI): adicionar em `agente_ia.metadados.limites` no futuro?
4. **Sub-agentes especializados** futuros (já tem 4 agentes/agendamento/marcação): vai querer mais (avaliação de imóvel? assistente fiscal? bot de bairros?). Estrutura já permite — só clonar Caique e adicionar tools.
