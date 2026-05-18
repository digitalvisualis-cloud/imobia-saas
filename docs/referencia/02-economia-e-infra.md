# 02 · Economia e infraestrutura do SaaS

> Preço alvo: **R$ 159/mês por cliente** no plano mais barato.
> Meta de margem: **70-80%** → custo real por cliente precisa ficar entre R$ 30 e R$ 50.

---

## 1. Onde NADA disso roda (tira da cabeça)

Tudo 24/7 em servidor. O PC do Pablo nunca precisa estar ligado. O cliente abre o painel, cadastra o imóvel, a nuvem processa, os arquivos ficam disponíveis pra download. Zero dependência de máquina local.

---

## 2. Arquitetura por camada (onde cada coisa roda)

| Camada | Onde roda | Por quê |
|---|---|---|
| **Site público** (Next.js SSR) | **Vercel** | Zero config, CDN global, rápido, grátis até 100GB de banda |
| **Painel do cliente** (admin + portal) | **Vercel** (mesmo app Next.js) | SSR para SEO, rotas protegidas |
| **Banco de dados** | **Supabase** (Postgres gerenciado) | Já temos conta, tem RLS, Realtime, Auth |
| **Storage de fotos/PDFs/vídeos** | **Supabase Storage** | Integrado com RLS, CDN na frente |
| **Auth** | **Supabase Auth** | Mesma sessão do banco |
| **Geração de texto (IA)** | **API Anthropic** (Claude Haiku) | Pay-per-use, sem infra |
| **Geração de imagem (post/story/carrossel)** | **Worker na VPS com satori** | Zero custo por imagem (só CPU local) |
| **Geração de PDF** | **Worker na VPS com @react-pdf/renderer** | CPU local, zero custo por PDF |
| **Geração de voz (reel)** | **ElevenLabs API** | Pay-per-character |
| **Geração de reel (vídeo)** | **Remotion na VPS** (render node) | CPU pesada, mas roda em fila |
| **Watermark nas fotos** | **Worker na VPS com sharp** | CPU-local, zero custo |
| **Fila de jobs** | **Redis na VPS + BullMQ** | Processa cascata em background |
| **Webhook de leads** | **n8n do Pablo (já existe)** | Chama a API do SaaS, salva em `leads` |
| **Cobrança** | **Asaas (API)** | Pix/cartão/boleto, BR nativo |

Resumindo: a **VPS** cuida só dos **workers de processamento pesado** (Remotion, sharp, satori, PDF). O resto tudo é serviço gerenciado.

---

## 3. Custo fixo mensal (independente do número de clientes)

| Item | Fornecedor | Custo | O que cobre |
|---|---|---|---|
| Next.js hospedagem | Vercel Hobby | R$ 0 | até 100GB banda, suficiente até ~30 clientes |
| Next.js hospedagem | Vercel Pro | R$ 100 (US$20) | só quando passar de ~30 clientes |
| Banco + Auth + Storage + Realtime | Supabase Pro | R$ 125 (US$25) | 8GB DB, 100GB storage, 250GB egress — suficiente pra 50-100 clientes |
| VPS worker de geração | Hetzner CX32 | R$ 40 (€7) | 4 vCPU, 8GB RAM, 80GB SSD — roda Remotion + sharp + satori em fila |
| Redis gerenciado (alternativa à VPS) | Upstash Free | R$ 0 | até 10k comandos/dia grátis |
| ElevenLabs | Starter | R$ 25 (US$5) | 30.000 caracteres/mês (≈ 30 reels curtos) |
| Domínios | Registro.br | R$ 40/ano × 1 | só o domínio-mãe `visualisimob.com.br` |
| **TOTAL FIXO** |  | **~R$ 190/mês** | cobre os primeiros 20-30 clientes |

Com 30 clientes × R$ 159 = **R$ 4.770/mês de receita**. Tira R$ 190 fixo = **R$ 4.580 antes do custo variável**.

---

## 4. Custo variável por cliente ativo (estimativa)

Baseado em um cliente que cadastra **30 imóveis/mês** e usa a cascata completa (texto + 3 posts + 1 story + 1 PDF + 1 email por imóvel):

| Item | Volume por cliente | Custo unitário | Custo/mês/cliente |
|---|---|---|---|
| **Texto IA (Claude Haiku)** | 30 imóveis × 4 copies = 120 gerações × ~600 tokens saída | $0.004/k tokens | R$ 1,50 |
| **Imagens (satori, local)** | 30 × 5 formatos = 150 imagens | R$ 0,00 | R$ 0,00 |
| **PDF (@react-pdf, local)** | 30 PDFs | R$ 0,00 | R$ 0,00 |
| **Voz (ElevenLabs)** | 30 reels × 30s ≈ 15.000 chars | incluso no plano Starter | diluído |
| **Vídeo (Remotion, local na VPS)** | 30 reels × ~2min render | CPU da VPS | diluído |
| **Watermark (sharp, local)** | 300 fotos | R$ 0,00 | R$ 0,00 |
| **Storage extra** | ~150MB (fotos + PDF + MP4) | R$ 0,60/GB | R$ 0,10 |
| **Egress (banda)** | ~500MB de visitantes no site | incluído no Vercel/Supabase | diluído |
| **Asaas (taxa de cobrança)** | R$ 159 × 1 cobrança | ~2% Pix / 3% cartão | R$ 3,50 |
| **TOTAL VARIÁVEL** |  |  | **~R$ 5 / cliente ativo** |

## 5. Unit economics por plano

**Plano BASE — R$ 159/mês** (site + CRM + ListaPro + 30 imóveis/mês):
- Receita: R$ 159
- Custo variável: R$ 5
- Custo fixo diluído (30 clientes): R$ 190 ÷ 30 = R$ 6,30
- **Margem bruta: R$ 147,70 (93%)** 🎉

**Quebra-linha real**: precisamos de **2 clientes pagando** pra cobrir todo o custo fixo de R$ 190. Qualquer cliente acima disso é quase 100% lucro, tirando os 3% do Asaas.

---

## 6. A decisão sobre o Remotion

Remotion é o item que mais pesa em CPU. Duas opções:

### Opção A — VPS própria (Hetzner) rodando worker 24/7
- **Prós**: custo fixo previsível (R$ 40/mês pra 20-50 clientes), controle total, latência baixa, zero vendor lock-in
- **Contras**: se escalar muito, precisa aumentar VPS ou adicionar mais workers; demanda um pouco de DevOps
- **Quando faz sentido**: agora, até ~50 clientes ativos

### Opção B — Remotion Lambda (AWS)
- **Prós**: escala infinito, paga só quando renderiza, zero DevOps
- **Contras**: custo é por segundo de vídeo (~$0.001–0.005/s → R$ 0,60–R$ 1,50 por reel de 30s), precisa AWS conta, complexidade extra
- **Quando faz sentido**: quando passar de 100 clientes OU quando tiver picos raros

**Minha recomendação pra começar**: **Hetzner CX32** (4 vCPU, 8GB, €7 ≈ R$ 40/mês). Roda Redis + BullMQ + worker Node com Remotion + sharp + satori + @react-pdf. Com 4 cores você renderiza uns 10-20 reels/hora tranquilo. Quando estourar, subimos uma segunda VPS ou migramos pro Lambda — a arquitetura de fila já está pronta pra isso.

Vantagem bônus: a mesma VPS pode hospedar **o n8n oficialmente** (hoje você mesmo hospeda). Fica um servidor só pra automação de toda a agência.

---

## 7. Como fica o desenho final (diagrama textual)

```
┌─────────────────────────────────────────────────────────┐
│  Cliente cadastra imóvel pelo painel (Next.js / Vercel) │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase grava `imoveis` + dispara Edge Function       │
│  que empurra N jobs na fila BullMQ (texto/post/PDF/reel)│
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  VPS Hetzner (Redis + Worker Node)                      │
│  ├─ Job "texto"     → Claude Haiku API                  │
│  ├─ Job "imagem"    → satori local (post/story/carrossel│
│  ├─ Job "pdf"       → @react-pdf/renderer local         │
│  ├─ Job "watermark" → sharp local                       │
│  ├─ Job "voz"       → ElevenLabs API                    │
│  └─ Job "reel"      → Remotion local (usa voz + imagens)│
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Arquivos gerados → Supabase Storage                    │
│  Supabase Realtime notifica o painel → botão destrava   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Cliente faz download (ou, em plano superior, o n8n     │
│  posta automático no Instagram dele)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Resumo em 1 parágrafo

Tudo roda em servidor 24/7 sem precisar do teu PC. Vercel cuida do site/painel, Supabase do banco e storage, e uma **VPS Hetzner de R$ 40/mês** roda os workers pesados (Remotion, satori, sharp, PDF). O custo total fixo começa em ~R$ 190/mês, e cada cliente custa uns R$ 5/mês variável. Com 2 clientes pagando R$ 159 já cobrimos todo o fixo. Margem bruta **acima de 90%** no plano base.
