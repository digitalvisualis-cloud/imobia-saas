# Workflows n8n (versionados)

Essa pasta guarda todos os workflows do n8n em formato JSON, versionados no Git.

## Por quê versionar

1. **Histórico de mudanças**: cada edição num workflow fica rastreada no Git
2. **Replicação pra novos clientes**: templates com variáveis (`{{tenant_id}}`, `{{whatsapp_number}}`, etc) são importados automaticamente no onboarding
3. **Backup**: se o n8n der ruim, recria tudo a partir desses JSONs
4. **Leitura pelo Claude (Cowork)**: o agente consegue ler os workflows direto dessa pasta pra ajudar a evoluir

## Como exportar do n8n pra essa pasta

### Opção 1 — Script automatizado (recomendado)

Roda uma única vez no terminal do Mac:

```bash
cd "/Users/pmfprodutora/Documents/PMF AGENCIA/VISU-IMOB"
./workflows/n8n/export.sh
```

Ele vai pedir a N8N_API_KEY se não tiver exportada, e salva cada workflow como `<nome-slug>.json` nessa pasta, além de um `_index.json` com a lista completa.

### Opção 2 — Via Claude Code local (com MCP n8n-mcp)

No teu Claude Code configurado com `n8n-mcp`, cola:

```
Usa o MCP do n8n pra listar todos os workflows.
Pra cada workflow, exporta o JSON completo e salva em
workflows/n8n/<nome-slugified>.json (nessa pasta mesmo).
Nunca exporta credenciais — o n8n export já usa placeholder,
mas confirma antes de salvar.
```

## Convenção de nomes

- `atendimento-whatsapp.json` — workflow principal de atendimento
- `lead-followup-24h.json` — follow-up automático depois de 24h sem resposta
- `onboarding-tenant.json` — roda quando cadastra imobiliária nova
- `lead-para-crm.json` — empurra lead do ChatWoot pro Supabase `leads`
- `cadastro-imovel-cascata.json` — dispara cascata de geração quando cadastra imóvel

Substitua os valores hardcoded do teu n8n atual por placeholders:
- `{{TENANT_ID}}`
- `{{SUPABASE_URL}}`
- `{{SUPABASE_SERVICE_KEY}}`
- `{{WHATSAPP_NUMBER}}`
- `{{IMOBILIARIA_NOME}}`

O worker de onboarding substitui essas variáveis antes de importar no n8n de cada cliente.

## Segurança

- **NUNCA** comita o `.env` com API keys reais
- O export via API do n8n já substitui credenciais por placeholder, mas sempre revise o JSON antes de commitar
- Workflows com secrets nunca no Git — só os templates limpos
