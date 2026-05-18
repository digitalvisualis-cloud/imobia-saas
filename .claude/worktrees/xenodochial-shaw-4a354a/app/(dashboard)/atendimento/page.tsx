'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './atendimento.module.css';

type FlowStep = { id: string; label: string; desc: string; icon: string; active: boolean; };

const DEFAULT_STEPS: FlowStep[] = [
  { id: 'boas_vindas', label: 'Apresentação', desc: 'O agente se apresenta e pergunta o nome do visitante', icon: '👋', active: true },
  { id: 'consultivo', label: 'Entender o que busca', desc: 'Descobre tipo de imóvel, bairro e valor', icon: '🔍', active: true },
  { id: 'apresentar', label: 'Mostrar imóveis', desc: 'Sugere imóveis do seu portfólio com base no perfil', icon: '🏠', active: true },
  { id: 'interesse', label: 'Medir interesse', desc: 'Identifica se o lead está pronto para dar o próximo passo', icon: '🎯', active: true },
  { id: 'notificar', label: 'Avisar você', desc: 'Você recebe uma mensagem quando um lead está quente', icon: '📲', active: true },
  { id: 'agendar', label: 'Propor visita', desc: 'O agente oferece agendar uma visita automaticamente', icon: '📅', active: false },
  { id: 'encerrar', label: 'Encerrar conversa', desc: 'Finaliza com uma mensagem de despedida e envia resumo para você', icon: '✅', active: true },
];

const PERSONALIDADES = [
  { id: 'consultivo', emoji: '🤝', label: 'Consultivo', desc: 'Próximo, acolhedor, faz perguntas para entender o cliente' },
  { id: 'direto', emoji: '⚡', label: 'Direto', desc: 'Objetivo, rápido, focado em resolver na hora' },
  { id: 'formal', emoji: '💼', label: 'Formal', desc: 'Profissional e elegante — ideal para alto padrão' },
  { id: 'amigavel', emoji: '😊', label: 'Descontraído', desc: 'Leve e acessível — para um público mais jovem' },
];

export default function AtendimentoPage() {
  const [tab, setTab] = useState<'config' | 'teste'>('config');
  const [steps, setSteps] = useState<FlowStep[]>(DEFAULT_STEPS);
  const [agentName, setAgentName] = useState('Sofia');
  const [personality, setPersonality] = useState('consultivo');
  const [saudacao, setSaudacao] = useState('');
  const [notifyWhats, setNotifyWhats] = useState('');
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; msg: string }[]>([
    { role: 'ai', msg: `Olá! Sou a Sofia, sua consultora virtual de imóveis 🏡 Como posso te ajudar hoje?` },
  ]);

  // Carrega configuração do banco
  useEffect(() => {
    fetch('/api/agente').then(r => r.json()).then(d => {
      if (!d || d.error) return;
      if (d.nome) setAgentName(d.nome);
      if (d.personalidade) setPersonality(d.personalidade);
      if (d.apresentacao) setSaudacao(d.apresentacao);
      if (d.etapas && Array.isArray(d.etapas) && d.etapas.length > 0) {
        setSteps(prev => prev.map(s => {
          const saved = (d.etapas as any[]).find((e: any) => e.id === s.id);
          return saved ? { ...s, active: saved.active } : s;
        }));
      }
    }).catch(() => {});
  }, []);

  async function saveAgente() {
    setSaving(true);
    try {
      const res = await fetch('/api/agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: agentName,
          personalidade: personality,
          apresentacao: saudacao,
          etapas: steps.map(s => ({ id: s.id, active: s.active })),
          ativo: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Agente salvo e ativado!');
    } catch {
      toast.error('Erro ao salvar agente');
    } finally {
      setSaving(false);
    }
  }

  function toggleStep(id: string) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  }

  function sendTest() {
    if (!testMsg.trim()) return;
    const msg = testMsg;
    setChat(prev => [...prev, { role: 'user', msg }]);
    setTestMsg('');
    setTimeout(() => {
      setChat(prev => [...prev, { role: 'ai', msg: 'Entendido! Posso te ajudar a encontrar o imóvel ideal. Qual o tipo de imóvel você procura? Apartamento, casa ou studio?' }]);
    }, 800);
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Assistente Virtual</h1>
          <p className="text-muted">Configure seu agente de atendimento para responder leads automaticamente</p>
        </div>
        <button className="btn btn-primary" onClick={saveAgente} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar e Ativar'}
        </button>
      </div>

      <div className={styles.tabs}>
        {[['config', '⚙️ Configurar'], ['teste', '💬 Testar agora']].map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`} onClick={() => setTab(id as any)}>{label}</button>
        ))}
      </div>

      {tab === 'config' && (
        <div className={styles.configGrid}>
          {/* LEFT */}
          <div className="flex flex-col gap-4">

            {/* Identidade */}
            <div className="card">
              <h3 className="mb-4">🤖 Como chamar seu agente?</h3>
              <div className="form-group">
                <label className="label">Nome do agente</label>
                <input className="input" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Ex: Sofia, Lucas, Luana..." />
                <p className="text-xs text-muted mt-1">Este nome aparece para os clientes no chat</p>
              </div>
            </div>

            {/* Personalidade */}
            <div className="card">
              <h3 className="mb-4">🎭 Como ele deve se comunicar?</h3>
              <div className="flex flex-col gap-2">
                {PERSONALIDADES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonality(p.id)}
                    className={styles.personalityOption + (personality === p.id ? ' ' + styles.personalityActive : '')}
                  >
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{p.label}</p>
                      <p className="text-xs text-muted">{p.desc}</p>
                    </div>
                    {personality === p.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Saudação */}
            <div className="card">
              <h3 className="mb-2">👋 Primeira mensagem</h3>
              <p className="text-sm text-muted mb-3">Como o agente vai se apresentar? Deixe em branco para usar o padrão.</p>
              <textarea
                className="input" rows={3}
                value={saudacao} onChange={e => setSaudacao(e.target.value)}
                placeholder={`Olá! Sou ${agentName || 'Sofia'}, consultora virtual. Como posso te ajudar a encontrar o imóvel ideal?`}
              />
            </div>

            {/* Notificações */}
            <div className="card">
              <h3 className="mb-2">📲 Quando avisar você?</h3>
              <p className="text-sm text-muted mb-3">Receba uma mensagem no WhatsApp quando um lead demonstrar interesse real.</p>
              <div className="form-group">
                <label className="label">Seu WhatsApp (com DDD)</label>
                <input className="input" value={notifyWhats} onChange={e => setNotifyWhats(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

          </div>

          {/* RIGHT — Fluxo */}
          <div className="card">
            <h3 className="mb-2">🔄 O que o agente faz?</h3>
            <p className="text-sm text-muted mb-4">Ative ou desative cada etapa da conversa conforme sua preferência.</p>
            <div className={styles.flowList}>
              {steps.map((step, i) => (
                <div key={step.id} className={`${styles.flowStep} ${!step.active ? styles.flowStepDisabled : ''}`}>
                  <div className={styles.flowLine}>
                    {i < steps.length - 1 && <div className={styles.connector} />}
                  </div>
                  <div className={styles.flowContent}>
                    <div className={styles.flowIcon}>{step.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p className="font-medium text-sm">{step.label}</p>
                      <p className="text-xs text-muted">{step.desc}</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" checked={step.active} onChange={() => toggleStep(step.id)} />
                      <span className={styles.slider} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'teste' && (
        <div className={styles.testeWrap}>
          <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>
              <div className={styles.chatBot}>🤖</div>
              <div>
                <p className="font-semibold text-sm">{agentName || 'Agente'}</p>
                <p className="text-xs text-green">● Online</p>
              </div>
            </div>
            <div className={styles.chatMessages}>
              {chat.map((m, i) => (
                <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAi}`}>
                  {m.msg}
                </div>
              ))}
            </div>
            <div className={styles.chatInput}>
              <input
                className="input" value={testMsg} onChange={e => setTestMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendTest(); }}
                placeholder="Digite uma mensagem para simular um cliente..."
              />
              <button className="btn btn-primary" onClick={sendTest}>Enviar</button>
            </div>
          </div>
          <div className={styles.testeInfo}>
            <div className="card">
              <h4 className="mb-3">Configuração atual</h4>
              <div className="flex flex-col gap-2">
                <div className={styles.infoRow}><span className="text-muted text-sm">Nome:</span><span className="text-sm font-medium">{agentName || '—'}</span></div>
                <div className={styles.infoRow}><span className="text-muted text-sm">Tom:</span><span className="text-sm font-medium">{PERSONALIDADES.find(p => p.id === personality)?.label ?? '—'}</span></div>
                <div className={styles.infoRow}><span className="text-muted text-sm">Etapas ativas:</span><span className="text-sm font-medium">{steps.filter(s => s.active).length}/{steps.length}</span></div>
              </div>
            </div>
            <div className="card mt-4">
              <h4 className="mb-3">Etapas ativas</h4>
              {steps.filter(s => s.active).map(s => (
                <div key={s.id} className={styles.activeStep}>
                  <span>{s.icon}</span><span className="text-sm">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
