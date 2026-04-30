# 04 — Setup do workflow n8n "ListaPro — Gerador de Assets"

Guia completo pra configurar o worker que o Next.js dispara quando um
corretor clica "Gerar listado profissional" no wizard.

> **Pro Claude das próximas sessões:** esse é o contrato entre VISU-IMOB
> (Next.js) e o n8n. Se mudar qualquer coisa aqui, atualiza o MD 03 junto.

---

## 1) Env vars no n8n (Easypanel → serviço n8n → Environment)

| Var | Valor | Onde pega |
|---|---|---|
| `SUPABASE_URL` | `https://mlyeqkkcqfsivqhuoedm.supabase.co` | Supabase dashboard |
| `SUPABASE_SERVICE_KEY` | `<service_role>` | Supabase → Settings → API Keys |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com/settings/keys |
| `N8N_WEBHOOK_SECRET` | `79dd26685adb...` (o mesmo do `.env.local` do VISU-IMOB) | inventado |
| `APP_CALLBACK_URL` | `https://app.visualisdigital.com` (prod) ou `http://host.docker.internal:3000` (dev local) | - |

> **Chave OpenAI** (gpt-image-1) NÃO vai aqui — vem no payload de cada job
> porque é por tenant (`ai_config.api_key_encrypted`).

---

## 2) Payload que o Next.js manda pro webhook

Endpoint n8n: `POST https://imobflow-n8n.ae01aa.easypanel.host/webhook/listapro-gerar`

Headers:
```
Content-Type: application/json
x-webhook-secret: <N8N_WEBHOOK_SECRET>
```

Body:
```json
{
  "job_id": "uuid",
  "imovel_id": "uuid",
  "tenant_id": "uuid",
  "callback_url": "https://app.visualisdigital.com/api/imoveis/{id}/callback",
  "imovel": {
    "codigo_imovel": "V1234A",
    "titulo": "Casa em Polanco",
    "tipo": "casa",
    "finalidade": "venda",
    "preco": 8500000,
    "quartos": 4, "suites": 2, "banheiros": 3, "vagas": 2,
    "area_m2": 180, "area_terreno_m2": 250, "pisos": 2,
    "bairro": "Polanco", "cidade": "CDMX", "estado": "MX", "endereco": "...",
    "capa_url": "https://...mlyeqkkcqfsivqhuoedm.../imoveis/{tenant}/{imovel}/capa/xxx.jpg",
    "imagens": ["https://...", "https://...", ...],
    "amenidades": ["piscina", "gimnasio", "seguridad_24h"],
    "amenidades_outras": "Jacuzzi, Home office",
    "notas": "Recién remodelada, cerca de escuelas",
    "video_tipo": "tour_narrado",
    "voiceover_voz": "feminina",
    "voiceover_tom": "luxo",
    "voiceover_contexto": "Mencionar vista panorâmica e proximidade ao parque",
    "guion_escenas": [
      { "slug": "fachada", "titulo": "Fachada", "texto": "...", "foto_url": "https://...", "ordem": 0 },
      { "slug": "sala",    "titulo": "Sala",    "texto": "...", "foto_url": "https://...", "ordem": 1 },
      ...
    ]
  },
  "agente": {
    "nome": "Maria García",
    "telefone": "+52 55 1234 5678",
    "email": "maria@inmobiliaria.com"
  },
  "imobiliaria": {
    "id": "uuid",
    "slug": "morada-one",
    "nome": "Imobiliária Morada One",
    "brand_kit": {
      "primary_color": "#C9A227",
      "secondary_color": "#1a1a1a",
      "logo_url": "https://...",
      "fonte": "Playfair Display"
    },
    "branding_extra": {}
  },
  "ai_config": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-proj-...",
    "max_tokens": 1024,
    "default_mode": "enxuto"
  }
}
```

---

## 3) Estrutura do workflow (nodes em ordem)

```
receber_job (webhook POST /listapro-gerar)
  │
  ├─→ responder_202 (async: "received: true")
  │
  └─→ setar_dados (extrai vars do body pra ficarem fáceis)
        │
        └─→ atualizar_status_processing (PATCH listapro_jobs SET status='processing')
              │
              └─→ gerar_texto_claude (POST api.anthropic.com)   ◀── ETAPA 1: TEXTO
                    │
                    └─→ extrair_textos (parse do JSON da resposta)
                          │
                          ├─→ gerar_post_openai (POST api.openai.com/v1/images/generations)    ◀── ETAPA 2a
                          ├─→ gerar_story_openai (POST api.openai.com/v1/images/generations)   ◀── ETAPA 2b
                          ├─→ gerar_carrusel_openai (loop 5x)                                  ◀── ETAPA 2c
                          │
                          └─→ gerar_pdf (HTML→PDF via puppeteer ou satori endpoint)            ◀── ETAPA 3
                                │
                                ├─→ upload_post_storage (PUT Supabase Storage)
                                ├─→ upload_story_storage
                                ├─→ upload_carrusel_storage
                                ├─→ upload_pdf_storage
                                │
                                └─→ callback_nextjs (POST {callback_url})   ◀── ETAPA FINAL
```

---

## 4) Node-by-node — configurações

### 4.1 — `receber_job` (Webhook)
- Method: `POST`
- Path: `listapro-gerar`
- Response Mode: **Respond to Webhook node**
- Authentication: **Header Auth** (Header name: `x-webhook-secret`, Header value: `{{ $env.N8N_WEBHOOK_SECRET }}`)

### 4.2 — `responder_202` (Respond to Webhook)
- Respond With: JSON
- Response Code: `202`
- Response Body:
```json
{ "received": true, "job_id": "{{ $json.body.job_id }}" }
```

### 4.3 — `setar_dados` (Set node)
Criar as seguintes variáveis:
| Nome | Valor |
|---|---|
| `job_id` | `{{ $json.body.job_id }}` |
| `imovel_id` | `{{ $json.body.imovel_id }}` |
| `tenant_id` | `{{ $json.body.tenant_id }}` |
| `callback_url` | `{{ $json.body.callback_url }}` |
| `imovel` | `{{ $json.body.imovel }}` (object) |
| `agente` | `{{ $json.body.agente }}` (object) |
| `imobiliaria` | `{{ $json.body.imobiliaria }}` (object) |
| `ai_config` | `{{ $json.body.ai_config }}` (object) |

### 4.4 — `atualizar_status_processing` (HTTP Request — Supabase REST)
- Method: `PATCH`
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/listapro_jobs?id=eq.{{ $json.job_id }}`
- Headers:
  - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`
- Body (JSON):
```json
{ "status": "processing", "updated_at": "{{ $now }}" }
```

### 4.5 — `gerar_texto_claude` (HTTP Request — Anthropic)
- Method: `POST`
- URL: `https://api.anthropic.com/v1/messages`
- Headers:
  - `x-api-key`: `{{ $env.ANTHROPIC_API_KEY }}`
  - `anthropic-version`: `2023-06-01`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": "{{ $('setar_dados').item.json.prompt_texto }}"
    }
  ]
}
```

> **Prompt completo** → ver seção 5.1 abaixo. Copia o prompt inteiro e injeta
> no campo `content` usando expressão do n8n.

### 4.6 — `extrair_textos` (Code node, JavaScript)
```js
// Claude retorna { content: [{ type: 'text', text: '...' }] }
// O prompt força resposta em JSON puro. Parseia e retorna.
const raw = $input.first().json.content?.[0]?.text ?? "";

// Remove code fences se vier ```json ... ```
const cleaned = raw
  .trim()
  .replace(/^```(?:json)?\s*/i, "")
  .replace(/\s*```$/i, "");

let parsed;
try {
  parsed = JSON.parse(cleaned);
} catch (e) {
  throw new Error("Claude não retornou JSON válido: " + cleaned.slice(0, 500));
}

// Retorna + mantém contexto anterior
return [{
  json: {
    ...$('setar_dados').item.json,
    textos: parsed,
  }
}];
```

### 4.7 — `gerar_post_openai` (HTTP Request — OpenAI Images)
- Method: `POST`
- URL: `https://api.openai.com/v1/images/generations`
- Headers:
  - `Authorization`: `Bearer {{ $json.ai_config.api_key }}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "model": "gpt-image-1",
  "prompt": "{{ $('setar_dados').item.json.prompt_imagem_post }}",
  "size": "1024x1024",
  "quality": "medium",
  "n": 1,
  "response_format": "b64_json"
}
```

Resposta tem `data[0].b64_json` — imagem em base64.

### 4.8 — `gerar_story_openai` (HTTP Request — OpenAI Images)
Igual ao post, mas:
- `size`: `1024x1536` (aspect 2:3 — n8n depois redimensiona pra 1080×1920 ou exibe como 9:16 com padding)
- `prompt`: `{{ $('setar_dados').item.json.prompt_imagem_story }}`

### 4.9 — `gerar_carrusel_openai` (SplitInBatches + HTTP)
- **SplitInBatches** com `batchSize: 1` sobre `{{ $('extrair_textos').item.json.textos.slides_carrusel }}`
- Pra cada slide, chama OpenAI com o prompt individual
- Merge no final

### 4.10 — `upload_*_storage` (HTTP Request — Supabase Storage)
Pra cada imagem gerada:
- Method: `POST`
- URL: `{{ $env.SUPABASE_URL }}/storage/v1/object/listapro/{{ $json.tenant_id }}/{{ $json.imovel_id }}/post.png`
- Headers:
  - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`
  - `Content-Type`: `image/png`
  - `x-upsert`: `true`
- Body: Binary (`=Buffer.from($json.data[0].b64_json, 'base64')`)

URL pública final:
```
{{ $env.SUPABASE_URL }}/storage/v1/object/public/listapro/{{ $json.tenant_id }}/{{ $json.imovel_id }}/post.png
```

### 4.11 — `callback_nextjs` (HTTP Request — final)
- Method: `POST`
- URL: `{{ $json.callback_url }}`
- Headers:
  - `x-webhook-secret`: `{{ $env.N8N_WEBHOOK_SECRET }}`
  - `Content-Type`: `application/json`
- Body:
```json
{
  "status": "done",
  "formatos": {
    "pdf_url": "{{ $('upload_pdf').item.json.public_url }}",
    "post_url": "{{ $('upload_post').item.json.public_url }}",
    "story_url": "{{ $('upload_story').item.json.public_url }}",
    "carrusel_urls": "{{ $('upload_carrusel').all().map(i => i.json.public_url) }}",
    "email_html": "{{ $('extrair_textos').item.json.textos.email_html }}",
    "audio_url": null,
    "video_url": null
  },
  "descricao": "{{ $('extrair_textos').item.json.textos.descricao_longa }}"
}
```

**Error branch** — em qualquer node que falhar, chama:
```json
{
  "status": "error",
  "erro": "{{ $json.error.message }}"
}
```

---

## 5) Prompts prontos (copiar e colar)

### 5.1 — Prompt do Claude Haiku (texto)

> Coloca esse prompt todo no campo `content` do node `gerar_texto_claude`,
> entre aspas (escapar quebras com `\n`). Ou usa um Code node antes pra
> montar a string.

```
Você é um copywriter especialista em imobiliárias de alto padrão que escreve
em português do Brasil. Escreve descrições envolventes, legendas de Instagram
que convertem, e scripts de voiceover profissionais.

CONTEXTO DO IMÓVEL:
Tipo: {{tipo}} em {{finalidade}}
Localização: {{bairro}}, {{cidade}}/{{estado}}
Preço: R$ {{preco formatado}}
Especificações: {{quartos}} quartos ({{suites}} suítes), {{banheiros}} banheiros,
{{vagas}} vagas, {{area_m2}} m² construídos, {{area_terreno_m2}} m² de terreno.
Amenidades: {{amenidades.join(", ")}} {{amenidades_outras}}
Notas adicionais: {{notas}}

BRAND KIT DA IMOBILIÁRIA:
Nome: {{imobiliaria.nome}}
Cor primária: {{brand_kit.primary_color}}
Tom de voz esperado: {{voiceover_tom}}
Contexto extra do agente: {{voiceover_contexto}}

GUIÃO POR CENAS (já preenchido pelo agente, ajuste/polisca mas mantém ordem):
{{guion_escenas (array com slug/titulo/texto/ordem)}}

TAREFA — Retorne EXATAMENTE um JSON válido (sem markdown, sem code fence),
com essa estrutura:

{
  "descricao_longa": "texto de 800-1200 caracteres pra ficha do imóvel",
  "legenda_post_instagram": "legenda de até 2200 chars com emojis estratégicos + 8-12 hashtags no final",
  "texto_story": "texto curto (máx 120 chars) pra overlay no story 9:16",
  "slides_carrusel": [
    { "titulo": "Fachada impactante", "descricao": "1-2 frases (máx 150 chars)" },
    { "titulo": "Sala integrada",     "descricao": "..." },
    { "titulo": "Cozinha gourmet",    "descricao": "..." },
    { "titulo": "Quarto master",      "descricao": "..." },
    { "titulo": "Área de lazer",      "descricao": "..." }
  ],
  "email_html": "HTML inline pronto pra copiar no Gmail — com <h1>, <p>, <img src=\"{{capa_url}}\">, <strong> pra destaques",
  "voiceover_script": "texto corrido de ~{{video_tipo === 'reel_rapido' ? '60 palavras' : '150 palavras'}} pro TTS. Não usa emoji. Pausas com vírgula e ponto final. Coerente com o tom {{voiceover_tom}}.",
  "guion_escenas_revisado": [
    { "slug": "fachada", "titulo": "...", "texto": "versão polida da frase do agente", "ordem": 0 },
    ...
  ]
}

REGRAS:
- Português do Brasil, jamais espanhol.
- Nunca invente características que não estão no contexto (se não tem piscina, não mencione piscina).
- Se o tom for "luxo", usa vocabulário sofisticado. Se "energético", mais enérgico. Se "profissional", equilibrado.
- Preço sempre em R$ com formatação brasileira (R$ 8.500.000).
- Retorne APENAS o JSON, sem explicação antes ou depois.
```

### 5.2 — Prompt pro gpt-image-1 (Post 1:1)

```
Professional real estate marketing image in 1:1 square format.
Feature the {{tipo}} located in {{bairro}}, {{cidade}}.
Main photo reference: {{capa_url}}
Style: modern luxury real estate, warm lighting, architectural photography.
Add elegant overlay with property name "{{titulo}}", price "R$ {{preco formatado}}",
and small agency logo watermark in bottom-right corner using color {{brand_kit.primary_color}}.
Typography: clean, sophisticated, serif font for title.
Background: subtle gradient that complements the property photo.
No text artifacts or fake watermarks — only the overlay specified above.
```

### 5.3 — Prompt pro gpt-image-1 (Story 9:16)

```
Professional Instagram Story in 9:16 vertical format for real estate.
Property type: {{tipo}}, {{quartos}} bedrooms, {{area_m2}}m² in {{bairro}}.
Reference photo: {{capa_url}}
Bold, modern design with photo occupying 60% of the frame (top).
Bottom 40%: solid color block in {{brand_kit.primary_color}} with the text:
"{{texto_story}}" in large white sans-serif, price tag "R$ {{preco}}" underneath,
and small agency logo bottom-center.
Swipe-up arrow icon subtle at bottom edge.
Mobile-first composition — text readable at thumbnail size.
```

### 5.4 — Prompts pros slides do Carrusel

Pra cada slide (5 no total), gerar baseado em `slides_carrusel[i]`:

```
Professional real estate carousel slide {{i+1}}/5 in 1:1 square format.
Theme: "{{slides_carrusel[i].titulo}}"
Property: {{tipo}} in {{bairro}}, {{cidade}}.
Reference from property photos: {{imagens[i] || capa_url}}
Layout: photo dominant (70% of frame), bottom strip with title
"{{slides_carrusel[i].titulo}}" and short caption "{{slides_carrusel[i].descricao}}".
Color accent: {{brand_kit.primary_color}}
Slide number indicator ({{i+1}}/5) small, top-right corner.
Consistent style across all 5 slides.
```

---

## 6) Error handling

Em cada node HTTP, configura:
- **Retry on Fail**: 3x com 2s de delay
- **Continue on Fail**: true (pra não travar o workflow inteiro se UM slide falhar)

Na saída, se o `data` tiver `_errors` array preenchido, manda no callback:
```json
{ "status": "error", "erro": "OpenAI falhou no slide 3: <mensagem>" }
```

---

## 7) Teste do workflow (antes de ligar no Next.js)

No n8n, clica "Execute Workflow" com payload de teste:

```bash
curl -X POST https://imobflow-n8n.ae01aa.easypanel.host/webhook/listapro-gerar \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: 79dd26685adb4ccacf46dad6a64fb6d8ce4dd6941ba93ac15d9fab35b86b159c" \
  -d '{
    "job_id": "test-123",
    "imovel_id": "test-123",
    "tenant_id": "22222222-2222-2222-2222-222222222222",
    "callback_url": "https://webhook.site/SEU_ID_DE_TESTE",
    "imovel": { ... ver seção 2 ... },
    "agente": { ... },
    "imobiliaria": { ... },
    "ai_config": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "api_key": "sk-proj-...",
      "max_tokens": 1024,
      "default_mode": "enxuto"
    }
  }'
```

Deve retornar 202 imediato. Em ~30-60s, o webhook.site recebe o callback
com as URLs públicas dos formatos.

---

## 8) Checklist pra subir tudo em produção

- [ ] No Supabase, setar/atualizar `ai_config` com a OpenAI key do tenant
- [ ] No n8n (Easypanel → Environment), configurar as 5 env vars da seção 1
- [ ] Importar o workflow atualizado no n8n (ou editar o atual conforme seção 4)
- [ ] Ativar o workflow (toggle "Active" no canto superior)
- [ ] Configurar `.env.local` do VISU-IMOB com `N8N_WEBHOOK_URL` e `N8N_WEBHOOK_SECRET`
- [ ] Testar via curl (seção 7)
- [ ] Testar pelo wizard `/admin/imoveis/novo` ponta-a-ponta
