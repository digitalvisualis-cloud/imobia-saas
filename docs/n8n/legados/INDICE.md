# Workflows n8n legados — VISU-IMOB / Imobiliária Morada One

> ⚠️ **Estes workflows JÁ EXISTEM em produção no n8n do Pablo.**
>
> NÃO sobrescrever. Use como **referência** pra adaptar e plugar nos novos
> endpoints `/api/internal/*` e `/api/webhooks/n8n/*` do ImobIA_SaaS.

## Origem

Estes JSONs vieram do repositório legado `digitalvisualis-cloud/visu-imob`
(antiga base de scaffolding criada com Claude Code). Foram movidos pra cá em
F4.11 pra ficar tudo em 1 lugar.

## O que cada um faz (inferido pelos nomes)

### Imobiliária Morada One (cliente teste do Pablo)
| Arquivo | Função provável |
|---|---|
| `1-caique-imobiliaria-morada-one.json` | Agente Caique (consultor IA inicial) |
| `2-crm-imobiliaria-morada-one.json` | CRM — entrada e roteamento de leads |
| `3-imo-tool-imobiliaria-morada-one.json` | Tool de busca de imóvel pra IA usar |
| `4-agente-ia-de-agendamento-imobiliaria-morada-one.json` | Agendamento de visitas |
| `5-marcac-ao-de-visita-imobiliaria-morada-one.json` | Marcação automática agenda |

### Visualis Capital (template multi-tenant?)
| Arquivo | Função provável |
|---|---|
| `vc-01-webhook-entrada-mensagens-whatsapp.json` | Webhook IN do WhatsApp |
| `vc-02-dispatcher-ia-ou-humano.json` | Switch IA vs corretor humano |

### Outros
| Arquivo | Função provável |
|---|---|
| `andre-imob.json` | Cliente "andre-imob" — workflow específico |
| `integracao-com-chatwoot.json` | Integração ChatWoot (inbox externo) |
| `listapro-gerador-de-assets.json` | ListaPro — geração de assets visuais |
| `my-workflow.json` | Sandbox/teste |

## O que o Claude Code deve fazer

Quando assumir, ler **TODOS** esses JSONs (são pequenos, ~5-50 nodes cada).
Pra cada um:

1. **Identificar** o que ele faz hoje
2. **Decidir** se mantém isolado, adapta, ou substitui pelo workflow master
3. **Plugar** os endpoints do ImobIA quando fizer sentido:
   - Lookup de tenant: `GET /api/internal/tenant-by-phone`
   - Config IA: `GET /api/internal/tenant-ia-config`
   - Contexto do lead: `GET /api/internal/lead-context`
   - Criar lead: `POST /api/webhooks/n8n/lead-in`
   - Atualizar lead: `POST /api/webhooks/n8n/lead-update`

## Escolha estratégica importante

O Pablo já tem workflows funcionando em produção pro cliente Morada One. Em
vez de criar 1 workflow master multi-tenant do zero, o caminho mais
**defensivo** pode ser:

**Opção A — Adaptar incremental:**
Mantém workflows por cliente como existem, e ADICIONA neles os 4-5 nodes
HTTP que falam com o ImobIA. Risco baixo, escala 1 a 1.

**Opção B — Fazer master multi-tenant agora:**
Substitui tudo por 1 workflow só, lookup por número de WhatsApp. Mais limpo
mas requer rebuild completo dos 5 workflows da Morada One.

Recomendo **A pra primeiros clientes**, **B quando tu tiver 5+ clientes**.

Pablo: confirme essa decisão quando voltar pro Cowork.

## Scripts auxiliares

- `deploy.sh` — script bash que importa JSONs no n8n via API (legado)
- `export.sh` — exporta workflows ativos pra JSON (backup)
- `_index.json` — índice antigo gerado por scripts

Adapte ou ignore — depende de como tu organizar.
