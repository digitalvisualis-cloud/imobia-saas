# 03 — Arquitetura do ListaPro (contexto permanente pro Claude)

> **Pro Claude das próximas sessões:** lê esse MD inteiro ANTES de trabalhar
> em qualquer coisa de ListaPro. Não peça pro Pablo repetir o que já tá aqui.
> Se o Pablo disser "tu perdeu contexto", vem direto aqui.

---

## 1) O que é o ListaPro no ecossistema Visualis

O ListaPro é o módulo de **geração automática de conteúdo profissional a partir
de um imóvel cadastrado**. Referência visual/funcional: o sistema do mexicano
Santiago Muñoz (vídeo no YouTube, dark theme com amarelo-ouro).

Ele é UM módulo do template VISU-IMOB — não um produto separado. O corretor
cadastra o imóvel **uma vez** no wizard de 7 passos e o sistema entrega:

- **PDF profissional** pra imprimir/compartilhar
- **Post Instagram** (1:1, 1080×1080)
- **Story** (9:16, 1080×1920)
- **Carrossel** (5 slides fixos)
- **Email HTML** pronto pra enviar
- **Voiceover** (ElevenLabs ou OpenAI TTS)
- **Vídeo** tour narrado (15-25s reel ou 45-60s tour)

O cadastro do imóvel é ÚNICO — não existe "cadastrar imóvel" + "gerar ListaPro"
como duas coisas separadas. Wizard = registro + geração.

---

## 2) Camadas do sistema

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND — VISU-IMOB (Next.js 15 App Router)               │
│  Rodando em localhost / visualisdigital.com (subdomínios)   │
│                                                              │
│  /admin/imoveis/novo → wizard 7 passos                      │
│  /admin/imoveis/[id] → detalhe com polling de status        │
│  /sites/[tenant] → site público white-label                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ supabase-js + REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE (mlyeqkkcqfsivqhuoedm) — banco multi-tenant       │
│                                                              │
│  imoveis          ← dados do imóvel + formatos_gerados      │
│  listapro_jobs    ← fila: status/payload/resultado/erro     │
│  listapro_config  ← webhook_url, webhook_secret, branding   │
│  ai_config        ← provider, model, api_key_encrypted      │
│  tenants, plans, tenant_members, subscriptions, leads       │
│                                                              │
│  Storage: imoveis/{tenant}/{imovel}/capa|recorrido|cena     │
│           listapro/{tenant}/{imovel}/post|story|slides      │
└──────────────────────────┬──────────────────────────────────┘
                           │ webhook + REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  n8n (imobflow-n8n.ae01aa.easypanel.host)                   │
│  Workflow: "ListaPro — Gerador de Assets"                   │
│  (arquivo: workflows/n8n/listapro-gerador-de-assets.json)   │
│                                                              │
│  webhook POST /listapro-gerar                               │
│    → setar_dados (job_id, imovel, agente, imobiliaria)      │
│    → atualizar_status='processing' no Supabase              │
│    → gerar_texto (Claude Haiku via Anthropic)               │
│    → extrair_textos (split por formato)                     │
│    → gerar_imagens_visuais (OpenAI gpt-image-1) ← FALTA     │
│    → gerar_html_post/story (satori/puppeteer)               │
│    → gerar_pdf (puppeteer ou @react-pdf server-side)        │
│    → gerar_voiceover (ElevenLabs ou OpenAI TTS)             │
│    → gerar_video (Remotion ou FFmpeg)                       │
│    → upload_todos_assets no Supabase Storage                │
│    → salvar_resultado jsonb em listapro_jobs.resultado      │
│    → atualizar imoveis.formatos_gerados + status='pronto'   │
│    → callback_url (opcional, fallback = polling)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3) Schema das tabelas relevantes

### `imoveis` (tabela principal)

```
id, tenant_id, created_by, codigo_imovel (único por tenant),
titulo, descricao, tipo (enum), finalidade (enum), preco, quartos, suites,
banheiros, vagas, area_m2, area_terreno_m2, pisos, bairro, cidade, estado,
endereco, imagens (array), capa_url, mapa_url, destaque, publicado,
amenidades (array), amenidades_outras, notas,
video_tipo ('reel_rapido'|'tour_narrado'), voiceover_voz ('feminina'|'masculina'),
voiceover_tom ('profissional'|'luxo'|'energetico'), voiceover_contexto,
guion_escenas (jsonb[] — 6 cenas: fachada, sala, cozinha, quarto_master, banheiro, area_externa),
formatos_gerados (jsonb — pdf_url, post_url, story_url, carrusel_urls[], email_html, audio_url, video_url),
status_geracao (enum: rascunho|gerando|pronto|erro), status_geracao_erro, gerado_at,
agente_nome, agente_telefone, agente_email, agencia_nome,
created_at, updated_at
```

### `listapro_jobs` (fila de geração)

```
id, tenant_id, imovel_id (text!), status, payload (jsonb), resultado (jsonb),
erro, callback_url, created_at, updated_at
```

Status: `pending` → `processing` → `done` / `error`.

### `ai_config` (chaves de IA por tenant)

```
id, tenant_id, provider ('openai'|'google'), model (ex: 'gpt-4o-mini', 'gpt-image-1'),
api_key_encrypted, max_tokens, default_mode ('enxuto'|'completo'),
created_at, updated_at
```

**IMPORTANTE:** a chave OpenAI (pra texto E pra imagem) fica AQUI, cifrada.
Não cadastrar OPENAI_API_KEY como secret global do servidor. Cada tenant tem
a sua.

### `listapro_config` (branding + webhook por imobiliária)

```
id, tenant_id, imobiliaria_id (text), webhook_url, webhook_secret,
gemini_key (legado Lovable), branding (jsonb: cores, logo, fontes), ativo
```

---

## 4) Decisões já tomadas (NÃO perguntar de novo)

| Decisão | Valor |
|---|---|
| Tipos de imóvel | BR completo: Casa, Apartamento, Cobertura, Studio, Terreno, Sala Comercial, Loja, Galpão, Chácara, Sítio, Outro |
| Escopo IA | Tudo agora: texto + PDF + Post/Story/Carrusel + Voiceover + Vídeo |
| Fonte das chaves de IA | `ai_config.api_key_encrypted` (por tenant) — não secret global |
| Provedor de texto | Claude Haiku (Anthropic) — barato, rápido |
| Provedor de imagem | **OpenAI gpt-image-1** (Post/Story/Carrusel quando precisar IA) |
| Composição de imagem padrão | HTML→imagem (satori/puppeteer) com foto real + overlay — IA só onde faz diferença |
| Voiceover | OpenAI TTS (gpt-4o-mini-tts) ou ElevenLabs (Pablo tem conta) |
| Vídeo | n8n gera via Remotion ou FFmpeg |
| Pagamento | Asaas (Brasil), planos a partir de R$ 159/mês |
| Sinalização frontend↔worker | **Polling** em `listapro_jobs` a cada 3s (simples) + callback opcional do n8n pro endpoint Next.js `/api/imoveis/[id]/callback` pra reatividade |
| Carrossel | 5 slides fixos (capa + 4 highlights) |
| Qualidade gpt-image-1 | medium (1024×1024, ~$0.04/img) |
| Deploy | VPS Hostinger (n8n já roda lá), Next.js hospeda em Vercel ou mesma VPS |
| Domínio | visualisdigital.com (Cloudflare) com subdomínio por tenant |
| Idioma | **Português-BR** (espanhol fica pra V2) |

---

## 5) Fluxo de dados detalhado

### 5.1 — Cadastro (wizard → DB → n8n)

1. Wizard gera `draftId` (UUID) no mount, vira `imoveis.id`.
2. Fotos uploadam direto pra `imoveis/{tenantId}/{draftId}/{kind}/{uuid}.ext` via Supabase Storage (path-based RLS via `is_member_of()`).
3. No submit, `POST /api/imoveis/novo`:
   - Valida auth + membership + plan limit
   - Insere row em `imoveis` com status_geracao='gerando'
   - Insere row em `listapro_jobs` com status='pending', payload = payload completo + callback_url
   - Dispara `POST https://imobflow-n8n.ae01aa.easypanel.host/webhook/listapro-gerar` (fire-and-forget) com body `{ job_id, imovel_id, tenant_id, callback_url, imovel, agente, imobiliaria }`
4. Retorna `{ ok: true, imovel_id }` — frontend redireciona pra `/admin/imoveis/[id]?gerando=1`.

### 5.2 — Worker (n8n)

1. Webhook recebe payload, responde 202 imediato.
2. Lê `ai_config` do tenant pra pegar OpenAI key (Anthropic pode ser chave global da agência).
3. Monta prompt de texto com dados do imóvel + branding → Claude Haiku → recebe JSON estruturado: `{ descricao_longa, legenda_post, texto_story, slides_carrusel[], email_html, voiceover_script }`.
4. Gera visuais:
   - **Post 1:1** — HTML com foto de capa + overlay (título/preço/bairro) → satori → PNG 1080×1080
   - **Story 9:16** — HTML com foto de capa vertical + overlay → PNG 1080×1920
   - **Carrossel** — 5 slides (capa + 4 fotos do recorrido com legenda overlay) → 5× PNG 1080×1080
   - **PDF** — puppeteer sobre HTML template com logo/branding do tenant
   - Se o tenant quiser visual mais "gerado" (premium): chama OpenAI gpt-image-1 com `/v1/images/edits` passando a foto real + prompt de overlay decorativo.
5. **Voiceover** — OpenAI TTS ou ElevenLabs a partir do `voiceover_script` (juntando as 6 cenas).
6. **Vídeo** — Remotion ou FFmpeg: monta slideshow com as fotos do recorrido na ordem + áudio do voiceover + transições + logo. Output MP4 1080×1920 (reel) ou 1920×1080 (tour).
7. Upload de todos os assets pro bucket `listapro/{tenantId}/{imovelId}/`.
8. Update `listapro_jobs` com `status='done'` + `resultado = { pdf_url, post_url, story_url, carrusel_urls, email_html, audio_url, video_url }`.
9. Update `imoveis.formatos_gerados` com mesmo payload + `status_geracao='pronto'` + `gerado_at=now()`.
10. (Opcional) `POST callback_url` pro Next.js com HMAC pra invalidar cache da página.

### 5.3 — Frontend vendo o resultado

`/admin/imoveis/[id]` faz:
- Consulta `imoveis` direto (a page é server-side, revalida em cada request).
- Se `status_geracao='gerando'`, renderiza `<meta http-equiv="refresh" content="3" />` → polling barato.
- Quando `status_geracao='pronto'`, mostra os FormatoCards com os links.

---

## 6) Entregas por fase

### ✅ Entrega 1 (feita em abril/2026)
- Migrations 0008/0009 aplicadas
- Wizard 7 passos UI completo
- Upload fotos com RLS
- API `/api/imoveis/novo` insere no DB
- Stub `/api/imoveis/[id]/gerar-formatos` marca como "pronto" vazio
- Typecheck limpo

### ⏳ Entrega 2 (ATUAL — integração com n8n + OpenAI)
**Objetivo:** destruir o stub e plugar o worker real.

Passos:
1. **No Supabase** — criar function `get_ai_config(tenant_id)` SECURITY DEFINER que retorna `{ provider, model, api_key, max_tokens }` decifrando `api_key_encrypted` (usar pgsodium ou Vault).
2. **No `/api/imoveis/novo/route.ts`** — substituir o fire-and-forget interno por:
   ```ts
   await fetch(`${N8N_WEBHOOK_URL}/listapro-gerar`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET! },
     body: JSON.stringify({ job_id, imovel_id, tenant_id, imovel, agente, imobiliaria, callback_url })
   })
   ```
3. **No workflow n8n** — completar os nós que faltam:
   - Node "get_ai_config" — `SELECT * FROM get_ai_config($tenant_id)` via supabase-js
   - Node "gerar_imagens_openai" — HTTP Request pra `POST https://api.openai.com/v1/images/generations` com `model: 'gpt-image-1'`, `quality: 'medium'`, `size: '1024x1024'` pra cada prompt
   - Node "upload_storage" — PUT em `{supabase_url}/storage/v1/object/listapro/{tenant}/{imovel}/post.png` com service_role
   - Node "atualizar_imoveis" — UPDATE imoveis SET formatos_gerados=$1, status_geracao='pronto', gerado_at=now() WHERE id=$imovel_id
4. **No Next.js** — criar `/api/imoveis/[id]/callback/route.ts` que o n8n chama quando termina (valida HMAC e revalida path).

### 🔜 Entrega 3 (depois)
- Voiceover real (OpenAI TTS ou ElevenLabs)
- Vídeo (Remotion ou FFmpeg no n8n)
- Carrossel dinâmico
- Email HTML

---

## 7) Env vars necessárias

### Next.js (`web/.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mlyeqkkcqfsivqhuoedm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...                    # pega no dashboard Supabase
N8N_WEBHOOK_URL=https://imobflow-n8n.ae01aa.easypanel.host/webhook
N8N_WEBHOOK_SECRET=<string longa aleatória>      # mesmo valor configurado no n8n
INTERNAL_WORKER_TOKEN=<string longa aleatória>   # legado, pode remover na Entrega 2
```

### n8n (environment variables do workflow)
```bash
SUPABASE_URL=https://mlyeqkkcqfsivqhuoedm.supabase.co
SUPABASE_SERVICE_KEY=<service_role>              # pra escrever em qualquer tenant
ANTHROPIC_API_KEY=<chave da Visualis>            # chave única da agência pra Claude
N8N_WEBHOOK_SECRET=<mesmo valor do Next.js>
```

**Chaves por tenant** (OpenAI, Gemini) vêm do `ai_config`, lidas em runtime.

---

## 8) Estado atual do workflow n8n

Arquivo: `workflows/n8n/listapro-gerador-de-assets.json`

Nodes existentes (ordem):
1. `receber_job` (webhook POST /listapro-gerar)
2. `responder_202` (responde imediato)
3. `setar_dados` (extrai job_id, imovel, agente, imobiliaria do body)
4. `atualizar_status_processing` (UPDATE listapro_jobs)
5. `gerar_texto_claude` (POST api.anthropic.com/v1/messages)
6. `extrair_textos` (parse da resposta do Claude)
7. `gerar_html_post` (HTML template)
8. `gerar_html_story` (HTML template)
9. `converter_post_imagem` (HTML→PNG)
10. `converter_story_imagem` (HTML→PNG)
11. `montar_resultado` (consolida URLs)
12. `salvar_resultado_supabase` (UPDATE listapro_jobs)
13. `callback_lovable` (POST pro callback_url)

**Faltam** (Entrega 2):
- Node pra ler `ai_config` do tenant
- Node pra chamar **OpenAI gpt-image-1** (Post/Story/Carrusel visuais com IA)
- Node pra gerar **PDF** (puppeteer html→pdf)
- Nodes pra upload dos assets pro Storage
- Node pra atualizar `imoveis.formatos_gerados` (não só `listapro_jobs`)

---

## 9) Frustrações do Pablo a evitar

1. **Não fazer ele repetir contexto.** Se perder, lê ESSE MD antes.
2. **Não fazer pergunta cuja resposta já tá aqui.** Seção "Decisões já tomadas" existe por isso.
3. **Haiku não gera imagem.** Não propor usar Haiku pra post/story/carrusel. Usa OpenAI gpt-image-1.
4. **Não refazer o wizard.** Ele já tá pronto na Entrega 1. Se for mexer, é pra conectar com o n8n, não pra recriar.
5. **Não criar paralelo ao Lovable.** O Lovable "Imobiliária One Star" era o POC. O VISU-IMOB é o template oficial da agência. Todo projeto novo nasce do VISU-IMOB.

---

Última atualização: 2026-04-23 (Entrega 2 em planejamento)
