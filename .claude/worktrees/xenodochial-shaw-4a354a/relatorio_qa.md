# Relatório de QA e Próximos Passos (Para o Claude Code)

Acabei de rodar um agente automatizado que navegou por todo o `/dashboard` do projeto (Imóveis, Leads, Atendimento, Sites e Configurações). Visualmente e em termos de navegação, o sistema está **100% estável**, sem quebras de layout e sem erros no console (as páginas abrem, os formulários renderizam e as abas trocam perfeitamente).

No entanto, aqui estão as funcionalidades de backend que **NÃO ESTÃO FUNCIONANDO** (ainda não foram implementadas ou estão usando *Mocks*) e que você deve focar em construir a partir de agora:

## 1. Módulo ListaPro / N8N (Integração Fake)
- **O que está acontecendo:** Se você for em `/imoveis/[id]`, aba "ListaPro" e clicar em gerar, ele funciona lindamente na tela. Mas a API (`/api/listapro/status/route.ts` e `/trigger/route.ts`) é apenas um *mock* (simulação com `setTimeout` de 10s que devolve links falsos).
- **Tarefa:** Você precisa substituir as rotas de API do ListaPro para disparar um Webhook real do N8N ou invocar a Edge Function original do Supabase.

## 2. Página de Configurações (`/configuracoes`)
- **O que está acontecendo:** A página de configurações (`/configuracoes/page.tsx`) está linda, as abas mudam, mas **nenhum formulário funciona**. O botão de "Salvar configurações de marca" não faz POST para lugar nenhum.
- **Tarefa:** Criar as rotas de API (ex: `/api/configuracoes`) para ler/gravar na tabela `ConfigMarca` do Prisma e carregar os dados reais quando a página abrir.

## 3. Assistente Virtual / Chatwoot (`/atendimento`)
- **O que está acontecendo:** A UI permite configurar o nome da IA (Sofia), tom de voz, e colocar o link do Webhook. Mas isso ainda não está gravando na tabela `AgenteIA` do banco, e a simulação de chat na lateral não interage com a API da OpenAI/N8N.
- **Tarefa:** Conectar o form do Atendimento com o backend (via API) e implementar o gatilho real do webhook quando um lead falar.

## 4. Vitrine do Site (`/s/[slug]`)
- **O que está acontecendo:** O gerador de site cria e liga/desliga o site corretamente, mas quando abrimos a vitrine final (`/s/imobiliaria/page.tsx`), a listagem de imóveis que aparece no site público pode estar incompleta ou dependendo de algum mock antigo (verifique as variáveis do `tenant`).
- **Tarefa:** Revisar a página pública de vitrine para garantir que ela faça um `prisma.imovel.findMany({ where: { tenantId, publicado: true } })` e exiba os imóveis reais com a identidade de marca do tenant (`ConfigMarca`).

## 5. Kanban de Leads (`/leads`)
- **O que está acontecendo:** O quadro Kanban de leads existe na UI e permite arrastar cards, mas não tem persistência de banco de dados vinculada à atualização do status (`etapa`) do Lead.
- **Tarefa:** Garantir que ao arrastar um Lead na coluna, dispare uma chamada para atualizar o Prisma.
