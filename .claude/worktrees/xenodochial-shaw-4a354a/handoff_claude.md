# Handoff ImobIA SaaS — 2026-04-27

## Projeto
`/Users/pmfprodutora/Documents/ImobIA_SaaS`
Stack: Next.js 16 + Prisma 7 + Supabase + NextAuth v5 (JWT) + OpenAI

---

## Estado Atual (o que funciona)

### Autenticação
- Login com email/senha: **funciona**
- Signup cria tenant + user + configMarca + agenteIA + site em transação: **funciona**
- JWT carrega `tenantId` e `role` na sessão
- Login com Google: **NÃO funciona** — faltam `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`
- `middleware.ts` foi renomeado para `proxy.ts` (breaking change do Next.js 16)

### Multi-tenancy
- Todas as APIs agora usam `session.user.tenantId` — **não há mais fallback para tenant "demo"**
- Rotas corrigidas: `/api/imoveis`, `/api/sites`, `/api/configuracoes/marca`, `/api/leads`
- Página `/imoveis/[id]` verifica se o imóvel pertence ao tenant da sessão

### Páginas do dashboard
| Página | Status |
|---|---|
| `/dashboard` | Dados mockados (métricas estáticas) |
| `/imoveis` | Busca real do banco por tenantId |
| `/imoveis/novo` | Formulário funcional, envia para `/api/imoveis` |
| `/imoveis/[id]` | Mostra detalhes + aba ListaPro com trigger |
| `/leads` | Conectado à API real, kanban drag-and-drop, estado vazio correto |
| `/atendimento` | UI de configuração do agente (sem termos técnicos), teste de chat |
| `/configuracoes` | Aba "Marca" carrega/salva da API real; aba "Perfil" ainda mockada |
| `/sites` | Gerenciador de site funcional via API |
| `/s/[slug]` | Site público do corretor |

### APIs
| Rota | Método | Status |
|---|---|---|
| `/api/auth/signup` | POST | Funciona |
| `/api/imoveis` | POST | Funciona com auth; upload fotos até 50MB |
| `/api/sites` | GET/POST | Funciona com auth |
| `/api/leads` | GET/POST/PATCH | Funciona com auth |
| `/api/agente` | GET/PUT | Funciona com auth |
| `/api/configuracoes/marca` | GET/PUT | Funciona com auth |
| `/api/ia/post` | POST | Gera post via OpenAI |
| `/api/ia/descricao` | POST | Gera descrição via OpenAI |
| `/api/listapro/trigger` | POST | Marca imóvel como GERANDO (stub — sem N8N real) |
| `/api/listapro/status` | GET | Mock de 10s retorna PRONTO (para testar UI) |

---

## Pendências em aberto

### Alta prioridade
1. **Login Google** — adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` ao `.env.local`
2. **Erro ao cadastrar imóvel** — verificar se o erro de FormData foi resolvido pelo `middlewareClientMaxBodySize: 52428800` no `next.config.ts`. Testar na prática com fotos reais.
3. **Dashboard** — `/dashboard` ainda mostra métricas estáticas. Conectar a dados reais: contar imóveis, leads por etapa, site ativo/inativo.

### Média prioridade
4. **Aba "Perfil" em /configuracoes** — campos do usuário (nome, CRECI, telefone) não estão conectados à API. Precisaria de um endpoint `PUT /api/auth/profile` que atualize a tabela `User`.
5. **ListaPro → N8N real** — substituir o stub em `/api/listapro/trigger/route.ts` pelo webhook real. Precisa da URL do webhook N8N.
6. **Atendimento → salvar no banco** — o formulário de configuração do agente não persiste. Conectar ao endpoint `/api/agente` (PUT) que já existe.
7. **Sidebar usuario** — nome e plano do usuário aparecem como "Minha conta / Plano Free". Precisaria chamar a sessão para mostrar nome real e plano real.

### Baixa prioridade
8. **Página `/contatos`** — aparece no log como 404. Definir o que é: lista de contatos/leads separada dos imóveis?
9. **Leads Kanban** — aba de detalhe do lead (modal) não salva edições ainda.
10. **Stripe** — planos e cobrança não estão conectados.

---

## Arquivos-chave modificados nesta sessão

```
next.config.ts                           ← middlewareClientMaxBodySize 50MB
proxy.ts                                 ← renomeado de middleware.ts
app/(dashboard)/layout.tsx               ← sidebar sem hardcode, site slug dinâmico
app/(dashboard)/leads/page.tsx           ← conectado à API, remove mock
app/(dashboard)/atendimento/page.tsx     ← sem jargão técnico, presets visuais
app/(dashboard)/configuracoes/page.tsx   ← carrega/salva marca via API
app/(dashboard)/imoveis/page.tsx         ← usa sessão real, sem demo fallback
app/(dashboard)/imoveis/[id]/page.tsx    ← verifica tenantId
app/(dashboard)/imoveis/novo/page.tsx    ← bloco ListaPro em linguagem de corretor
app/api/imoveis/route.ts                 ← auth obrigatória, sem demo fallback
app/api/sites/route.ts                   ← auth obrigatória, sem demo fallback
```

---

## Como continuar

1. Abrir o projeto: `cd /Users/pmfprodutora/Documents/ImobIA_SaaS`
2. Dev server: `npm run dev` (porta 3000)
3. Banco já está conectado ao Supabase (credenciais no `.env.local`)
4. Para testar: criar conta em `http://localhost:3000/cadastro`, fazer login
5. Próximo passo recomendado: corrigir o Google OAuth e testar o cadastro de imóvel com fotos
