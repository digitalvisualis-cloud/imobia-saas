-- ============================================================================
-- MIGRATION 0001 — Tenantização do projeto "imob todos"
-- ============================================================================
-- Objetivo: transformar o Supabase "imob todos" (hoje single-tenant com uma
-- tabela IMOBILIARIA_ANDRE hardcoded) em SaaS multi-tenant onde N imobiliárias
-- compartilham o mesmo schema e cada linha tem um tenant_id que controla
-- quem vê o quê via RLS.
--
-- Antes de aplicar:
--   1. Fazer backup manual no Supabase Dashboard → Database → Backups
--   2. Rotacionar a service_role key (vazou no JSON do ListaPro)
--   3. Revisar essa migration e confirmar os mapeamentos de tenant
--
-- Depois de aplicar:
--   - Consultar qualquer tabela deve retornar só linhas do tenant do usuário
--   - O IMOBILIARIA_ANDRE fica como view legacy até que o Lovable antigo saia do ar
-- ============================================================================

-- ============================================================================
-- PARTE 1 — TABELA CORE `tenants`
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,              -- "morada-one", "andre-imob", "one-star"
  nome text NOT NULL,                     -- "Imobiliária Morada One"
  cidade text,
  estado text DEFAULT 'PR',
  whatsapp_number text UNIQUE,            -- número conectado na UazAPI
  uazapi_instance_id text UNIQUE,         -- id da instância no UazAPI
  chatwoot_account_id text,               -- id da conta no ChatWoot (pra humanos)
  plan text NOT NULL DEFAULT 'base',      -- base | pro | premium
  active boolean NOT NULL DEFAULT true,
  brand_kit jsonb NOT NULL DEFAULT '{}',  -- cores/logo/tipografia (será populado depois)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenants IS
  'Cada linha = uma imobiliária cliente do SaaS. Identificador de tenant em todas as tabelas de negócio.';


-- ============================================================================
-- PARTE 2 — TABELA `tenant_members` (liga usuário ↔ tenant)
-- ============================================================================
-- Um mesmo usuário pode ter acesso a múltiplos tenants (ex: Pablo/suporte/admin),
-- mas cada sessão tem UM tenant ativo resolvido via JWT claim ou tabela.

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'agent')),
  is_default boolean NOT NULL DEFAULT false,  -- tenant ativo por padrão
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Um usuário só pode ter UM tenant padrão
CREATE UNIQUE INDEX tenant_members_one_default_per_user
  ON public.tenant_members (user_id)
  WHERE is_default = true;


-- ============================================================================
-- PARTE 3 — HELPER: função que retorna tenant_id do usuário logado
-- ============================================================================
-- Usada por TODAS as policies RLS pra filtrar linhas.
-- Lê o JWT: procura `tenant_id` em app_metadata; se não achar, usa o default_tenant.

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- prioridade 1: claim explícita no JWT (app_metadata.tenant_id)
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    -- prioridade 2: tenant marcado como default no tenant_members
    (SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() AND is_default = true LIMIT 1),
    -- prioridade 3: qualquer tenant que o usuário faça parte (fallback)
    (SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

COMMENT ON FUNCTION public.current_tenant_id() IS
  'Retorna o tenant_id do usuário logado. Usado em todas as RLS policies.';


-- ============================================================================
-- PARTE 4 — ADICIONAR COLUNA `tenant_id` NAS TABELAS DE NEGÓCIO
-- ============================================================================
-- Adicionamos NULLABLE primeiro (pra backfill), depois NOT NULL no final.

ALTER TABLE public.imoveis              ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clientes             ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.negocios             ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.financeiro           ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.config_site          ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.ai_config            ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.listapro_jobs        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.listapro_config      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.n8n_chat_histories   ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.ai_search_logs       ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.imovel_views         ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.agent_permissions    ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.api_keys             ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Índices pra performance (queries com WHERE tenant_id = X precisam ser rápidas)
CREATE INDEX IF NOT EXISTS idx_imoveis_tenant            ON public.imoveis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant           ON public.clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_negocios_tenant           ON public.negocios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_tenant         ON public.financeiro(tenant_id);
CREATE INDEX IF NOT EXISTS idx_listapro_jobs_tenant      ON public.listapro_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_tenant           ON public.n8n_chat_histories(tenant_id);


-- ============================================================================
-- PARTE 5 — NOVA TABELA `leads` (pra substituir IMOBILIARIA_ANDRE)
-- ============================================================================
-- Mantém TODAS as colunas que existem hoje no IMOBILIARIA_ANDRE, só que
-- tenantizada e com nomes normalizados (snake_case em vez de espaços).

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  identificador_lead uuid UNIQUE DEFAULT gen_random_uuid(),  -- compatível com schema antigo
  nome text,
  whatsapp text,
  tipo_imovel text,
  finalidade text,
  bairro_desejado text,
  resumo_conversa text,
  data_visita text,
  marcou_no_grupo text,
  inicio_atendimento timestamptz,
  timestamp_ultima_msg timestamptz,
  follow_up_1 text,
  follow_up_2 text,
  follow_up_3 text,
  chatwoot_account_id text,
  chatwoot_conversation_id text,
  chatwoot_lead_id text,
  chatwoot_inbox_id text,
  agendamento_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON public.leads(tenant_id, whatsapp);


-- ============================================================================
-- PARTE 6 — TABELA `messaging_conversations` (pra o dispatcher IA/humano)
-- ============================================================================
-- O workflow VC-02 já consulta uma tabela com esse nome. Criamos ela aqui
-- pra ter o esqueleto pronto quando ativar os workflows VC-01/VC-02.

CREATE TABLE IF NOT EXISTS public.messaging_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  chatwoot_conversation_id text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- quando humano assume
  ai_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_msgconv_tenant_phone ON public.messaging_conversations(tenant_id, phone);


-- ============================================================================
-- PARTE 7 — SEED: criar os 2 tenants atuais (Andre Imob + Morada One)
-- ============================================================================
-- Esses UUIDs são fixos (pra dar pra referenciar no código).

INSERT INTO public.tenants (id, slug, nome, cidade, estado, plan, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'andre-imob',  'Andre Imob',                NULL,            'PR', 'base', false),  -- legado, inativo
  ('22222222-2222-2222-2222-222222222222', 'morada-one',  'Imobiliária Morada One',    NULL,            'PR', 'base', true)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- PARTE 8 — BACKFILL: marca todos os dados existentes com o tenant certo
-- ============================================================================
-- Assumimos:
--   - Tudo que já está em `imoveis`, `config_site`, `ai_config`, `listapro_*`,
--     `n8n_chat_histories`, `ai_search_logs`, `imovel_views`, `agent_permissions`,
--     `api_keys` = Morada One (cliente ativo)
--   - O conteúdo de IMOBILIARIA_ANDRE → vai pra tabela leads com tenant_id = Andre
--
-- ⚠️ Se essa premissa estiver errada, REVISA antes de aplicar!

UPDATE public.imoveis            SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.config_site        SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.ai_config          SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.listapro_jobs      SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.listapro_config    SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.n8n_chat_histories SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.ai_search_logs     SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.imovel_views       SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.agent_permissions  SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
UPDATE public.api_keys           SET tenant_id = '22222222-2222-2222-2222-222222222222' WHERE tenant_id IS NULL;
-- clientes, negocios, financeiro são vazias — nada a backfillar

-- Migra IMOBILIARIA_ANDRE → leads (com tenant_id = andre-imob)
INSERT INTO public.leads (
  tenant_id, identificador_lead, nome, whatsapp, tipo_imovel, finalidade,
  bairro_desejado, resumo_conversa, data_visita, marcou_no_grupo,
  inicio_atendimento, timestamp_ultima_msg,
  follow_up_1, follow_up_2, follow_up_3,
  chatwoot_account_id, chatwoot_conversation_id, chatwoot_lead_id, chatwoot_inbox_id,
  agendamento_id
)
SELECT
  '11111111-1111-1111-1111-111111111111' AS tenant_id,
  "identificador_lead",
  "Nome",
  "Whatsapp",
  "Tipo de imovel",
  "Finalidade",
  "Bairro desejado",
  "Resumo da conversa",
  "Data da visita",
  "Marcou no Grupo",
  "Inicio do atendimento",
  "Timestamp ultima msg",
  "Follow UP 1",
  "Follow UP 2",
  "Follow UP 3",
  "IDConta ChatWoot",
  "IDConversa ChatWoot",
  "IDLead ChatWoot",
  "InboxID ChatWoot",
  "id_agendamento"
FROM public."IMOBILIARIA_ANDRE"
ON CONFLICT (identificador_lead) DO NOTHING;


-- ============================================================================
-- PARTE 9 — CONSTRAINT: tenant_id agora é obrigatório
-- ============================================================================
-- Depois do backfill, podemos travar NOT NULL pra evitar linhas órfãs.

ALTER TABLE public.imoveis              ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.config_site          ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ai_config            ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.listapro_jobs        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.listapro_config      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.n8n_chat_histories   ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ai_search_logs       ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.imovel_views         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.agent_permissions    ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.api_keys             ALTER COLUMN tenant_id SET NOT NULL;
-- clientes / negocios / financeiro ficam nullable por enquanto pq estão vazias;
-- no app novo nunca vão ser inseridas sem tenant_id, então o default virá do código.


-- ============================================================================
-- PARTE 10 — RLS: policies por tenant em todas as tabelas
-- ============================================================================
-- Padrão: USING (tenant_id = public.current_tenant_id())
-- Isso garante que SELECT/UPDATE/DELETE só enxergam linhas do tenant do usuário.

-- Ativa RLS onde ainda não tá
ALTER TABLE public.tenants                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_conversations   ENABLE ROW LEVEL SECURITY;

-- Limpa policies antigas genéricas ("Anyone can...") antes de recriar tenantizadas
DROP POLICY IF EXISTS "Anyone can view imoveis" ON public.imoveis;
DROP POLICY IF EXISTS "Anyone can create imoveis" ON public.imoveis;
DROP POLICY IF EXISTS "Anyone can update imoveis" ON public.imoveis;
DROP POLICY IF EXISTS "Anyone can delete imoveis" ON public.imoveis;

-- === tenants: usuário vê tenants onde é membro ===
CREATE POLICY "tenants_select_own" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

-- === tenant_members: vê os membros dos tenants que faz parte ===
CREATE POLICY "members_select_own" ON public.tenant_members
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

-- === Macro pra criar 4 policies (SELECT/INSERT/UPDATE/DELETE) numa tabela ===
-- Como Postgres não tem macro, repetimos pra cada tabela:

-- imoveis (publicado=true é visível pelo site público; logado vê do tenant)
CREATE POLICY "imoveis_public_read"   ON public.imoveis FOR SELECT USING (publicado = true);
CREATE POLICY "imoveis_tenant_all"    ON public.imoveis FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- clientes
CREATE POLICY "clientes_tenant_all" ON public.clientes FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- negocios
CREATE POLICY "negocios_tenant_all" ON public.negocios FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- financeiro
CREATE POLICY "financeiro_tenant_all" ON public.financeiro FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- config_site (leitura pública pq o site precisa renderizar)
CREATE POLICY "config_site_public_read" ON public.config_site FOR SELECT USING (true);
CREATE POLICY "config_site_tenant_write" ON public.config_site FOR UPDATE
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ai_config / listapro_config — só leitura e escrita do próprio tenant
CREATE POLICY "ai_config_tenant_all" ON public.ai_config FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "listapro_config_tenant_all" ON public.listapro_config FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- listapro_jobs
CREATE POLICY "listapro_jobs_tenant_all" ON public.listapro_jobs FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- n8n_chat_histories (acesso só pelo próprio tenant — o n8n usa service_role e bypassa)
CREATE POLICY "n8n_chat_tenant_all" ON public.n8n_chat_histories FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ai_search_logs
CREATE POLICY "ai_logs_tenant_all" ON public.ai_search_logs FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- imovel_views (insert público pra tracking anônimo; leitura só do tenant)
CREATE POLICY "views_public_insert" ON public.imovel_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views_tenant_read"   ON public.imovel_views FOR SELECT
  USING (tenant_id = public.current_tenant_id());

-- agent_permissions
CREATE POLICY "perm_tenant_all" ON public.agent_permissions FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- api_keys
CREATE POLICY "keys_tenant_all" ON public.api_keys FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- leads (nova tabela)
CREATE POLICY "leads_tenant_all" ON public.leads FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- messaging_conversations
CREATE POLICY "msg_tenant_all" ON public.messaging_conversations FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());


-- ============================================================================
-- PARTE 11 — VIEW de compatibilidade pro Lovable antigo
-- ============================================================================
-- Enquanto o Lovable atual ainda aponta pra IMOBILIARIA_ANDRE, criamos uma VIEW
-- com esse nome que filtra leads pelo tenant Andre. Assim o Lovable não quebra.
-- Quando trocarmos pro Next.js novo, a gente apaga essa view e a tabela original.

-- Renomeia tabela antiga pra _legacy (não dropamos ainda — segurança)
ALTER TABLE public."IMOBILIARIA_ANDRE" RENAME TO "IMOBILIARIA_ANDRE_legacy";

-- Cria view com nome original mapeando pra leads do tenant Andre
CREATE OR REPLACE VIEW public."IMOBILIARIA_ANDRE" AS
SELECT
  inicio_atendimento           AS "Inicio do atendimento",
  nome                         AS "Nome",
  whatsapp                     AS "Whatsapp",
  tipo_imovel                  AS "Tipo de imovel",
  finalidade                   AS "Finalidade",
  bairro_desejado              AS "Bairro desejado",
  resumo_conversa              AS "Resumo da conversa",
  data_visita                  AS "Data da visita",
  marcou_no_grupo              AS "Marcou no Grupo",
  timestamp_ultima_msg         AS "Timestamp ultima msg",
  follow_up_1                  AS "Follow UP 1",
  follow_up_2                  AS "Follow UP 2",
  follow_up_3                  AS "Follow UP 3",
  chatwoot_account_id          AS "IDConta ChatWoot",
  chatwoot_conversation_id     AS "IDConversa ChatWoot",
  chatwoot_lead_id             AS "IDLead ChatWoot",
  chatwoot_inbox_id            AS "InboxID ChatWoot",
  identificador_lead,
  agendamento_id               AS "id_agendamento"
FROM public.leads
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';


-- ============================================================================
-- PARTE 12 — TRIGGER: atualiza updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER tenants_updated       BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leads_updated         BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER msgconv_updated       BEFORE UPDATE ON public.messaging_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================================
-- VERIFICAÇÃO FINAL (rode manualmente depois)
-- ============================================================================
-- SELECT slug, nome, active FROM public.tenants;
-- SELECT count(*), tenant_id FROM public.imoveis GROUP BY tenant_id;
-- SELECT count(*), tenant_id FROM public.leads   GROUP BY tenant_id;
-- SELECT * FROM public.tenant_members;  -- deve estar vazio (próximo passo: linkar Pablo)
