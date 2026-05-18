#!/bin/bash
# Exporta todos os workflows do n8n self-hosted para JSONs versionados.
# Uso: ./workflows/n8n/export.sh
#
# Variáveis obrigatórias (ficam no .env.local da raiz do repo):
#   N8N_URL — ex: https://imobflow-n8n.ae01aa.easypanel.host
#   N8N_API_KEY — gerada em Settings -> API dentro do n8n

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

# Parser seguro: lê .env.local linha a linha, sem usar `source` (não interpreta nada).
if [ -f "$ENV_FILE" ]; then
  # Sanity check: rejeita arquivo que parece RTF (TextEdit converteu sem querer)
  FIRST_BYTES="$(head -c 5 "$ENV_FILE" 2>/dev/null || true)"
  if [[ "$FIRST_BYTES" == "{\\rtf"* ]]; then
    echo "ERRO: .env.local está em formato RTF (o TextEdit converteu)."
    echo ""
    echo "Conserta assim no terminal:"
    echo "  rm '$ENV_FILE'"
    echo "  cp .env.local.example .env.local"
    echo "  nano .env.local      # NÃO use TextEdit"
    echo ""
    echo "No nano: cola o conteúdo, Ctrl+O pra salvar, Enter, Ctrl+X pra sair."
    exit 1
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    # remove \r (caso o arquivo tenha vindo com quebras de linha do Windows)
    line="${line%$'\r'}"
    # pula comentários e linhas vazias
    case "$line" in
      ''|\#*) continue ;;
    esac
    # precisa ter '='
    if [[ "$line" != *"="* ]]; then
      continue
    fi
    key="${line%%=*}"
    value="${line#*=}"
    # remove aspas nas pontas (se houver)
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    # sanitiza o nome da variável
    key="$(echo "$key" | tr -d ' ')"
    [ -z "$key" ] && continue
    export "$key=$value"
  done < "$ENV_FILE"
fi

# Defaults conhecidos (podem ser sobrescritos pelo .env.local)
N8N_URL="${N8N_URL:-https://imobflow-n8n.ae01aa.easypanel.host}"

if [ -z "$N8N_API_KEY" ]; then
  echo "ERRO: N8N_API_KEY não encontrada."
  echo ""
  echo "Cria um arquivo .env.local na raiz do repo (use nano, NÃO TextEdit):"
  echo "  cd '$REPO_ROOT'"
  echo "  nano .env.local"
  echo ""
  echo "Conteúdo mínimo:"
  echo "  N8N_URL=https://imobflow-n8n.ae01aa.easypanel.host"
  echo "  N8N_API_KEY=sua-key-aqui"
  echo ""
  echo "Gere a key em: $N8N_URL/settings/api"
  exit 1
fi

OUT_DIR="$SCRIPT_DIR"
mkdir -p "$OUT_DIR"

echo "==> Listando workflows de $N8N_URL ..."
LIST_JSON=$(curl -sS -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Accept: application/json" \
  "$N8N_URL/api/v1/workflows?limit=250")

if ! echo "$LIST_JSON" | jq -e '.data' > /dev/null 2>&1; then
  echo "ERRO: resposta inválida da API do n8n. Confere URL e API key."
  echo "Resposta recebida:"
  echo "$LIST_JSON" | head -c 500
  exit 1
fi

COUNT=$(echo "$LIST_JSON" | jq '.data | length')
echo "==> Encontrados $COUNT workflows"

# Índice resumido
echo "$LIST_JSON" | jq '[.data[] | {id, name, active, createdAt, updatedAt, tags: [.tags[]?.name]}]' \
  > "$OUT_DIR/_index.json"

# Pra cada workflow, baixa o JSON completo
echo "$LIST_JSON" | jq -r '.data[] | "\(.id)|\(.name)"' | while IFS='|' read -r WF_ID WF_NAME; do
  SLUG=$(echo "$WF_NAME" | iconv -t ASCII//TRANSLIT 2>/dev/null | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g' || echo "workflow-$WF_ID")
  [ -z "$SLUG" ] && SLUG="workflow-$WF_ID"
  OUT_FILE="$OUT_DIR/${SLUG}.json"

  echo "   -> $WF_NAME -> $SLUG.json"

  curl -sS -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Accept: application/json" \
    "$N8N_URL/api/v1/workflows/$WF_ID" | jq . > "$OUT_FILE"
done

echo ""
echo "==> Concluído. Arquivos salvos em: $OUT_DIR"
ls -1 "$OUT_DIR"/*.json 2>/dev/null | wc -l | xargs -I {} echo "    Total: {} arquivos JSON"
