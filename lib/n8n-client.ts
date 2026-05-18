/**
 * Cliente completo da API REST do n8n self-hosted.
 *
 * Auth: header X-N8N-API-KEY (gerada em n8n → Settings → API)
 * Base URL: process.env.N8N_BASE_URL (ex: https://imobflow-n8n.ae01aa.easypanel.host)
 *
 * Endpoints documentados: https://docs.n8n.io/api/api-reference/
 *
 * Uso server-only — nunca expor pro browser. Acesso via routes /api/admin/n8n/*
 * com proteção de isSuperAdminEmail.
 */

const API_VERSION = 'v1';

export class N8nApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `n8n API ${status}: ${statusText}`);
    this.name = 'N8nApiError';
  }
}

type N8nFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
};

async function n8nFetch<T = any>(
  path: string,
  opts: N8nFetchOptions = {},
): Promise<T> {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  if (!baseUrl) {
    throw new Error('N8N_BASE_URL não configurada no .env');
  }
  if (!apiKey) {
    throw new Error(
      'N8N_API_KEY não configurada no .env. Gere em n8n → Settings → API.',
    );
  }

  const url = new URL(`${baseUrl}/api/${API_VERSION}${path}`);
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 20_000);

  try {
    const res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      throw new N8nApiError(
        res.status,
        res.statusText,
        parsed,
        `n8n ${opts.method ?? 'GET'} ${path} → ${res.status}: ${parsed?.message ?? res.statusText}`,
      );
    }

    return parsed as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 *  WORKFLOWS
 * ───────────────────────────────────────────────────────────────────────── */

export type N8nWorkflowSummary = {
  id: string;
  name: string;
  active: boolean;
  tags?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

export type N8nWorkflow = N8nWorkflowSummary & {
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
};

export const workflows = {
  async list(opts?: { limit?: number; active?: boolean; tags?: string }) {
    const r = await n8nFetch<{ data: N8nWorkflowSummary[]; nextCursor?: string }>(
      '/workflows',
      {
        searchParams: {
          limit: opts?.limit ?? 100,
          active: opts?.active,
          tags: opts?.tags,
        },
      },
    );
    return r.data ?? [];
  },

  async get(id: string) {
    return n8nFetch<N8nWorkflow>(`/workflows/${encodeURIComponent(id)}`);
  },

  /**
   * Cria um workflow novo a partir de JSON exportado.
   * O n8n exige um shape específico: { name, nodes, connections, settings }.
   * Remove campos que o POST não aceita (id, createdAt, updatedAt, active, etc).
   */
  async create(workflowJson: any) {
    const cleaned = sanitizeWorkflowForCreate(workflowJson);
    return n8nFetch<N8nWorkflow>('/workflows', {
      method: 'POST',
      body: cleaned,
    });
  },

  async update(id: string, workflowJson: any) {
    const cleaned = sanitizeWorkflowForUpdate(workflowJson);
    return n8nFetch<N8nWorkflow>(`/workflows/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: cleaned,
    });
  },

  async activate(id: string) {
    return n8nFetch<N8nWorkflow>(
      `/workflows/${encodeURIComponent(id)}/activate`,
      { method: 'POST' },
    );
  },

  async deactivate(id: string) {
    return n8nFetch<N8nWorkflow>(
      `/workflows/${encodeURIComponent(id)}/deactivate`,
      { method: 'POST' },
    );
  },

  async delete(id: string) {
    return n8nFetch<{ id: string }>(`/workflows/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Tenta achar workflow com um nome específico — útil pra evitar duplicar.
   */
  async findByName(name: string): Promise<N8nWorkflowSummary | null> {
    const all = await this.list({ limit: 250 });
    return all.find((w) => w.name === name) ?? null;
  },
};

function sanitizeWorkflowForCreate(json: any) {
  const {
    id,
    createdAt,
    updatedAt,
    active,
    versionId,
    triggerCount,
    meta,
    pinData,
    shared,
    tags,
    ...rest
  } = json;

  return {
    name: rest.name ?? 'Imported workflow',
    nodes: rest.nodes ?? [],
    connections: rest.connections ?? {},
    settings: rest.settings ?? { executionOrder: 'v1' },
    staticData: rest.staticData ?? null,
  };
}

function sanitizeWorkflowForUpdate(json: any) {
  const {
    id,
    createdAt,
    updatedAt,
    active,
    versionId,
    triggerCount,
    ...rest
  } = json;
  return rest;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  CREDENTIALS
 * ───────────────────────────────────────────────────────────────────────── */

export type N8nCredentialSummary = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export const credentials = {
  /**
   * Lista credentials (NÃO retorna o data sensível — só metadados).
   * Pra ler valores, usa `get(id)` que tbm não retorna password fields.
   */
  async list() {
    // n8n API antes da 1.0 não tinha listagem de credentials via API REST;
    // versões recentes (1.x) sim. Tenta /credentials, fallback pra array vazio.
    try {
      const r = await n8nFetch<{ data: N8nCredentialSummary[] }>(
        '/credentials',
      );
      return r.data ?? [];
    } catch (e) {
      if (e instanceof N8nApiError && e.status === 404) return [];
      throw e;
    }
  },

  async get(id: string) {
    return n8nFetch(`/credentials/${encodeURIComponent(id)}`);
  },

  async create(opts: { name: string; type: string; data: Record<string, any> }) {
    return n8nFetch<{ id: string; name: string; type: string }>(
      '/credentials',
      { method: 'POST', body: opts },
    );
  },

  async delete(id: string) {
    return n8nFetch(`/credentials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async findByName(name: string): Promise<N8nCredentialSummary | null> {
    const all = await this.list();
    return all.find((c) => c.name === name) ?? null;
  },

  /**
   * Cria credentials master Visualis idempotente — se já existe não duplica.
   * Recebe as keys do env e cria 3 credentials no n8n: Anthropic, OpenAI, WAHA.
   */
  async ensureMasterCredentials(opts: {
    anthropicKey?: string | null;
    openaiKey?: string | null;
    wahaApiKey?: string | null;
    wahaBaseUrl?: string | null;
  }) {
    const result: { created: string[]; existed: string[]; errors: string[] } = {
      created: [],
      existed: [],
      errors: [],
    };

    if (opts.anthropicKey) {
      const name = 'Anthropic Master Visualis';
      const exists = await this.findByName(name);
      if (exists) result.existed.push(name);
      else {
        try {
          await this.create({
            name,
            type: 'anthropicApi',
            data: { apiKey: opts.anthropicKey },
          });
          result.created.push(name);
        } catch (e: any) {
          result.errors.push(`${name}: ${e.message}`);
        }
      }
    }

    if (opts.openaiKey) {
      const name = 'OpenAI Master Visualis';
      const exists = await this.findByName(name);
      if (exists) result.existed.push(name);
      else {
        try {
          await this.create({
            name,
            type: 'openAiApi',
            data: { apiKey: opts.openaiKey },
          });
          result.created.push(name);
        } catch (e: any) {
          result.errors.push(`${name}: ${e.message}`);
        }
      }
    }

    if (opts.wahaApiKey && opts.wahaBaseUrl) {
      const name = 'WAHA WhatsApp Master';
      const exists = await this.findByName(name);
      if (exists) result.existed.push(name);
      else {
        try {
          // WAHA não tem credential type oficial — usa httpHeaderAuth
          await this.create({
            name,
            type: 'httpHeaderAuth',
            data: {
              name: 'X-Api-Key',
              value: opts.wahaApiKey,
            },
          });
          result.created.push(name);
        } catch (e: any) {
          result.errors.push(`${name}: ${e.message}`);
        }
      }
    }

    return result;
  },
};

/* ─────────────────────────────────────────────────────────────────────────
 *  VARIABLES (n8n env vars editáveis na UI)
 * ───────────────────────────────────────────────────────────────────────── */

export type N8nVariable = {
  id: string;
  key: string;
  value: string;
  type?: string;
};

export const variables = {
  async list(): Promise<N8nVariable[]> {
    try {
      const r = await n8nFetch<{ data: N8nVariable[] }>('/variables');
      return r.data ?? [];
    } catch (e) {
      if (e instanceof N8nApiError && e.status === 404) return [];
      throw e;
    }
  },

  async create(opts: { key: string; value: string }) {
    return n8nFetch<N8nVariable>('/variables', {
      method: 'POST',
      body: opts,
    });
  },

  async delete(id: string) {
    return n8nFetch(`/variables/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Cria ou atualiza (deletando + recriando porque API n8n não tem PUT em variables).
   */
  async upsert(opts: { key: string; value: string }) {
    const all = await this.list();
    const existing = all.find((v) => v.key === opts.key);
    if (existing) {
      await this.delete(existing.id);
    }
    return this.create(opts);
  },

  /**
   * Garante as 3 vars que o workflow master precisa pra falar com o ImobIA.
   */
  async ensureImobiaVariables(opts: {
    imobiaBaseUrl: string;
    internalToken: string;
    webhookSecret: string;
  }) {
    const result: { upserted: string[]; errors: string[] } = {
      upserted: [],
      errors: [],
    };
    const pairs = [
      ['IMOBIA_BASE_URL', opts.imobiaBaseUrl],
      ['IMOBIA_INTERNAL_TOKEN', opts.internalToken],
      ['N8N_WEBHOOK_SECRET', opts.webhookSecret],
    ];
    for (const [key, value] of pairs) {
      try {
        await this.upsert({ key, value });
        result.upserted.push(key);
      } catch (e: any) {
        result.errors.push(`${key}: ${e.message}`);
      }
    }
    return result;
  },
};

/* ─────────────────────────────────────────────────────────────────────────
 *  EXECUTIONS
 * ───────────────────────────────────────────────────────────────────────── */

export type N8nExecutionSummary = {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status?: 'running' | 'success' | 'error' | 'waiting' | 'canceled' | 'crashed';
};

export const executions = {
  async list(opts?: {
    workflowId?: string;
    status?: 'success' | 'error' | 'waiting';
    limit?: number;
    includeData?: boolean;
  }) {
    const r = await n8nFetch<{ data: N8nExecutionSummary[]; nextCursor?: string }>(
      '/executions',
      {
        searchParams: {
          workflowId: opts?.workflowId,
          status: opts?.status,
          limit: opts?.limit ?? 50,
          includeData: opts?.includeData,
        },
      },
    );
    return r.data ?? [];
  },

  async get(id: string, includeData = true) {
    return n8nFetch(
      `/executions/${encodeURIComponent(id)}?includeData=${includeData}`,
    );
  },

  async delete(id: string) {
    return n8nFetch(`/executions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

/* ─────────────────────────────────────────────────────────────────────────
 *  Health check (ping rápido)
 * ───────────────────────────────────────────────────────────────────────── */

export async function healthCheck(): Promise<{
  ok: boolean;
  latencyMs: number;
  message: string;
  workflowCount?: number;
}> {
  const startedAt = Date.now();
  try {
    const wfs = await workflows.list({ limit: 1 });
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: 'API n8n respondendo.',
      workflowCount: wfs.length,
    };
  } catch (e: any) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: e?.message ?? 'Erro desconhecido',
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Default export — facilita o uso
 * ───────────────────────────────────────────────────────────────────────── */

export const n8n = {
  workflows,
  credentials,
  variables,
  executions,
  healthCheck,
};

export default n8n;
