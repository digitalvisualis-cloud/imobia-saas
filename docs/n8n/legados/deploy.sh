#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# Deploy do workflow "ListaPro — Gerador de Assets" no n8n
#
# Uso:
#   ./workflows/n8n/deploy.sh [path-do-json]
#
# Padrão: workflows/n8n/listapro-gerador-de-assets.json
#
# Lê N8N_URL e N8N_API_KEY de .env.local na raiz do repo.
# Cria o workflow se não existir, atualiza se existir.
# Ativa automaticamente.
# ────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOW_FILE="${1:-$REPO_ROOT/workflows/n8n/listapro-gerador-de-assets.json}"
ENV_FILE="$REPO_ROOT/.env.local"

# ─── Lê env vars ──────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE não encontrado. Copia .env.local.example pra .env.local e preenche N8N_URL + N8N_API_KEY."
  exit 1
fi

# Parse .env.local linha por linha (safe contra caracteres especiais)
N8N_URL=""
N8N_API_KEY=""
while IFS='=' read -r key val; do
  key="${key## }"; key="${key%% }"
  case "$key" in
    N8N_URL) N8N_URL="${val%\"}"; N8N_URL="${N8N_URL#\"}" ;;
    N8N_API_KEY) N8N_API_KEY="${val%\"}"; N8N_API_KEY="${N8N_API_KEY#\"}" ;;
  esac
done < <(grep -E '^[A-Z_][A-Z0-9_]*=' "$ENV_FILE" | grep -v '^#')

if [[ -z "$N8N_URL" || -z "$N8N_API_KEY" ]]; then
  echo "❌ N8N_URL ou N8N_API_KEY faltando em $ENV_FILE"
  exit 1
fi
N8N_URL="${N8N_URL%/}"  # remove trailing slash

if [[ ! -f "$WORKFLOW_FILE" ]]; then
  echo "❌ Workflow JSON não encontrado: $WORKFLOW_FILE"
  exit 1
fi

echo "🔧 n8n URL: $N8N_URL"
echo "📄 Workflow: $WORKFLOW_FILE"

# ─── Extrai nome do workflow pra buscar ─────────────────────────
WORKFLOW_NAME="$(jq -r '.name' "$WORKFLOW_FILE")"
echo "🏷️  Nome: $WORKFLOW_NAME"

# ─── Busca workflow existente por nome ──────────────────────────
echo "🔍 Buscando se já existe..."
EXISTING=$(curl -sS \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Accept: application/json" \
  "$N8N_URL/api/v1/workflows?limit=250" \
  | jq -r --arg name "$WORKFLOW_NAME" '.data[] | select(.name == $name) | .id' | head -1)

# ─── Monta payload pro n8n (só campos aceitos pelo POST/PUT) ────
# n8n rejeita campos como id, createdAt, updatedAt, webhookId no body
PAYLOAD=$(jq '{
  name: .name,
  nodes: .nodes,
  connections: .connections,
  settings: .settings,
  staticData: .staticData
}' "$WORKFLOW_FILE")

if [[ -n "$EXISTING" ]]; then
  echo "♻️  Workflow já existe (id=$EXISTING). Atualizando..."
  RESPONSE=$(curl -sS -X PUT \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$N8N_URL/api/v1/workflows/$EXISTING")
  WF_ID="$EXISTING"
else
  echo "✨ Workflow novo. Criando..."
  RESPONSE=$(curl -sS -X POST \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$N8N_URL/api/v1/workflows")
  WF_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
fi

if [[ -z "$WF_ID" ]]; then
  echo "❌ Falha ao criar/atualizar workflow:"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "✅ Workflow salvo (id=$WF_ID)"

# ─── Ativa ───────────────────────────────────────────────────────
echo "🔌 Ativando..."
ACTIVATE=$(curl -sS -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows/$WF_ID/activate")

ACTIVE=$(echo "$ACTIVATE" | jq -r '.active // false')
if [[ "$ACTIVE" == "true" ]]; then
  echo "✅ Workflow ATIVO"
else
  echo "⚠️  Workflow salvo mas não ativou. Resposta:"
  echo "$ACTIVATE" | jq . 2>/dev/null || echo "$ACTIVATE"
fi

# ─── Mostra info do webhook ─────────────────────────────────────
WEBHOOK_PATH=$(jq -r '.nodes[] | select(.type == "n8n-nodes-base.webhook") | .parameters.path' "$WORKFLOW_FILE" | head -1)
if [[ -n "$WEBHOOK_PATH" ]]; then
  echo ""
  echo "🎯 Webhook URL pronto:"
  echo "   $N8N_URL/webhook/$WEBHOOK_PATH"
  echo ""
  echo "Pra testar:"
  echo "   curl -X POST $N8N_URL/webhook/$WEBHOOK_PATH \\"
  echo "     -H 'Content-Type: application/json' \\"
  echo "     -H 'x-webhook-secret: \$(grep ^N8N_WEBHOOK_SECRET .env.local | cut -d= -f2)' \\"
  echo "     -d @test-payload.json"
fi

echo ""
echo "🔗 Abrir no navegador:"
echo "   $N8N_URL/workflow/$WF_ID"
