# Handoff — ImobIA SaaS (branch `claude/sweet-leavitt-f4dab6`)

**Status:** frontend em iteração via Lovable. Branch NÃO está em main.

## App em produção

- https://app.visualisdigital.com
- Tenant de teste: `pablo-medina` (FREE, 3 imóveis)
- Site público: https://app.visualisdigital.com/s/pablo-medina

## Onde estamos

### Sites (3 temas)
- **Onyx** — aprovado pelo cliente (estilo douglasnavarro.com.br)
- **Brisa** — reescrito seguindo `IMOBIA_VISUAL_HANDOFF_CLAUDE/visual-lab`
- **Aura** — reescrito seguindo o mesmo lab

Sistema de tokens (`components/themes/ThemeScope.tsx`) expõe 11 CSS vars:
`--t-bg`, `--t-fg`, `--t-card`, `--t-muted`, `--t-line`, `--t-primary`,
`--t-primary-ink`, `--t-secondary`, `--t-secondary-ink`, `--t-ink`
(auto-derivado do bg luminance), `--t-font-heading`, `--t-font-body`.

Cada seção em wrapper `rounded-2xl border bg-card` pra separação visual.

### Posts (20 templates do lab)
Estrutura nova em `app/_post-templates/`:

- `lab-posts.css` (2060 linhas, copy do `visual-lab/styles.css` + runtime
  bridge do Codex pra escalar artboard 360→1080)
- `PostShell.tsx` (12 slots: post-bg, soft-fade, top-logo, location,
  headline, price-box, spec-strip, glass-panel, thumb-stack, contact-pill,
  cta-pill, footer-brand)
- `lab-templates.tsx` (20 exports T01..T20)
- `registry.ts` (POST_TEMPLATES list — 20 novos + legados)

Consumer: `components/conteudo/PostPreview.tsx` consulta o registry; se
variant for `p1..p20` renderiza via PostShell escalado; senão fallback inline.

## Features funcionando (não mexer)

- Cadastro de imóveis (IPTU, condomínio, voz IA)
- Site público multi-tenant com 3 temas
- Blog (CRUD + IA gera artigo via gpt-4o-mini + Pollinations capa + SEO)
- Captação (página dedicada)
- Newsletter Alertas (form + dispatcher Resend stub)
- Funil de Vendas Kanban
- Agenda
- Form público de Lead
- Modais via React Portal
- Editor de site com preview full-height

## Próxima etapa

Pablo está iterando no **Lovable** pra polir o visual antes de subir a
versão final pra esta branch.

## Migrações Supabase aplicadas

Projeto: `obddnxcoaillnxxpknjf` (sa-east-1)

- `add_lead_tipo_and_newsletter_inscricao`
- `add_artigo_blog`
- (Anteriores: iptuMensal, condominioMensal, corTextoHero, políticas legais)

## Comandos

```bash
git clone https://github.com/digitalvisualis-cloud/imobia-saas.git
cd imobia-saas
git checkout claude/sweet-leavitt-f4dab6
npm ci
npx prisma generate
npm run dev
```

## Audit de segurança pendente

- Rotacionar senha DB Supabase
- Rotacionar `NEXTAUTH_SECRET` / `AUTH_SECRET`
- Rotacionar Google OAuth `client_secret`
- Tornar repo privado
- Trocar `WAHA_API_KEY` fraca (`imobia123`)
- Apagar `HANDOFF_*.md` antigos do histórico Git

## Documentação relacionada

- Visual handoff usado:
  `/Users/pmfprodutora/Documents/Codex/2026-05-17/digitalvisualis-cloud-imobia-saas-https-github/IMOBIA_VISUAL_HANDOFF_CLAUDE`
- Brief Pablo no Obsidian:
  `09_Squads/Clientes_Visualis/Visualis_Digital/Nichos/Imobiliario/05_Clientes/Pablo_Medina/00_Brief.md`
- Handoff Frontend detalhado:
  `.../Pablo_Medina/01_Handoff_Frontend.md`
