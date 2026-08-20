import { useState, useEffect, useRef } from 'react';
import { Bot, Copy, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/apiClient';
import { md } from '../utils/htmlUtils';
import { getCourses, getSubjectsByCourse, getObjectives } from '../services/curriculumD1Service';

type CopilotIntent =
  | 'search_curriculum'
  | 'generate_material'
  | 'edit_material'
  | 'save_to_bank'
  | 'list_resources'
  | 'navigate_to_view'
  | 'answer_question'
  | 'clarify';

interface CopilotAction {
  tool: string;
  arguments: Record<string, unknown>;
}

interface CopilotChatResponse {
  ok: boolean;
  conversationId: string;
  message: string;
  intent: CopilotIntent;
  requiresConfirmation: boolean;
  actions: CopilotAction[];
  citations?: Array<{ source: string; label: string }>;
  toolResults?: Array<{ tool: string; ok: boolean; result?: unknown; error?: string }>;
}

interface ActiveContext {
  level?: string;
  subject?: string;
  objectiveCode?: string;
  objectiveText?: string;
  [key: string]: unknown;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  intent?: CopilotIntent;
};

interface PendingConfirmation {
  messageIndex: number;
  actions: CopilotAction[];
}

const REQUEST_TIMEOUT_MS = 30_000;

const INTENT_BADGES: Record<CopilotIntent, string> = {
  search_curriculum: '🔍 Buscar currículo',
  generate_material: '✏️ Generar material',
  edit_material: '🛠️ Editar material',
  save_to_bank: '💾 Guardar en banco',
  list_resources: '📋 Ver recursos',
  navigate_to_view: '🧭 Navegar',
  answer_question: '💬 Responder pregunta',
  clarify: '❓ Aclarar',
};

interface AgenteViewProps {
  // Contexto curricular que el componente padre ya conoce (ej. el profesor
  // viene de FlujoDocenteView con un OA seleccionado). Si no se pasa, se usa
  // lo que el propio selector de nivel/asignatura/OA de esta vista tenga
  // seleccionado — el copilot igual puede inferir contexto adicional de lo
  // que el profesor escriba en el chat.
  activeContext?: ActiveContext;
  // Mismo patrón que el resto de las vistas (BancoRecursosView, EvaluacionesView,
  // etc.): la vista padre decide cómo interpretar el string de destino.
  onNavigate?: (view: string) => void;
}

export function AgenteView({ activeContext: activeContextProp, onNavigate }: AgenteViewProps) {
  const [nivel, setNivel] = useState('1° básico');
  const [asignatura, setAsignatura] = useState('Lenguaje y Comunicación');
  const [oa, setOa] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  // D1 data
  const [d1Courses, setD1Courses] = useState<any[]>([]);
  const [d1Subjects, setD1Subjects] = useState<any[]>([]);
  const [d1Objectives, setD1Objectives] = useState<any[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [selectedD1Objective, setSelectedD1Objective] = useState<any | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loadingD1, setLoadingD1] = useState(false);

  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  useEffect(() => {
    getCourses().then(setD1Courses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) { setD1Subjects([]); return; }
    getSubjectsByCourse(selectedCourseId).then(setD1Subjects).catch(() => {});
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId || !selectedSubjectId) { setD1Objectives([]); return; }
    setLoadingD1(true);
    getObjectives(selectedCourseId, selectedSubjectId)
      .then(setD1Objectives)
      .catch(() => setD1Objectives([]))
      .finally(() => setLoadingD1(false));
  }, [selectedCourseId, selectedSubjectId]);

  function resolveActiveContext(): ActiveContext {
    if (activeContextProp) return activeContextProp;
    return {
      level: nivel || undefined,
      subject: asignatura || undefined,
      objectiveCode: selectedD1Objective?.code || undefined,
      objectiveText: oa || undefined,
    };
  }

  function applyResponse(data: CopilotChatResponse) {
    setConversationId(data.conversationId);
    setMessages((prev) => {
      const next = [...prev, { role: 'assistant' as const, content: data.message, intent: data.intent }];
      if (data.requiresConfirmation && data.actions.length > 0) {
        setPendingConfirmation({ messageIndex: next.length - 1, actions: data.actions });
      } else {
        setPendingConfirmation(null);
      }
      return next;
    });

    if (data.intent === 'navigate_to_view' && !data.requiresConfirmation && onNavigate) {
      const navResult = data.toolResults?.find((t) => t.tool === 'navigate_to_view' && t.ok);
      const view = (navResult?.result as { view?: string } | undefined)?.view
        ?? (data.actions.find((a) => a.tool === 'navigate_to_view')?.arguments.view as string | undefined);
      if (view) onNavigate(view);
    }
  }

  const send = async (suggestion?: string) => {
    const message = (suggestion || input).trim();
    if (!message || busy) return;
    const next = [...messages, { role: 'user' as const, content: message }];
    setMessages(next); setInput(''); setBusy(true); setError(''); setPendingConfirmation(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const data = await api.post<CopilotChatResponse>('/api/copilot/chat', {
        message,
        conversationId: conversationIdRef.current ?? undefined,
        activeContext: resolveActiveContext(),
      }, controller.signal);
      applyResponse(data);
    } catch (e) {
      const isTimeout = e instanceof DOMException && e.name === 'AbortError';
      setError(isTimeout
        ? 'El copiloto está tardando más de lo esperado. Intenta de nuevo en unos segundos.'
        : e instanceof Error ? e.message : 'No se pudo contactar al copiloto');
    } finally {
      clearTimeout(timeoutId);
      setBusy(false);
    }
  };

  const confirmPending = () => {
    if (!pendingConfirmation) return;
    setPendingConfirmation(null);
    send('Sí, procede con esa acción.');
  };

  const cancelPending = () => {
    setPendingConfirmation(null);
  };

  return (
    <div className="view agent-view">
      <div className="banner">
        <Bot size={32} />
        <div><b>Agente pedagógico Planifica</b><br /><span className="muted">Crea, diferencia y revisa materiales mediante una conversación, con contexto curricular chileno.</span></div>
      </div>
      <div className="card">
        <div className="grid3">
          <div><label>Nivel/Curso</label>
            <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); const c = d1Courses.find((c: any) => c.id === e.target.value); if (c) setNivel(c.name); }}>
              <option value="">Seleccionar curso</option>
              {d1Courses.filter(c => (c.objective_count || 0) > 0).map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.objective_count})</option>)}
            </select>
          </div>
          <div><label>Asignatura</label>
            <select value={selectedSubjectId} onChange={e => { setSelectedSubjectId(e.target.value); const s = d1Subjects.find((s: any) => s.id === e.target.value); if (s) setAsignatura(s.name); }}>
              <option value="">Seleccionar asignatura</option>
              {d1Subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.objective_count})</option>)}
            </select>
          </div>
        </div>
        <label>OA exacto (opcional)</label><textarea value={oa} onChange={e => setOa(e.target.value)} placeholder="Pega aquí el Objetivo de Aprendizaje ministerial..." rows={2} />
        {d1Objectives.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <label>Seleccionar OA desde D1 ({d1Objectives.length} disponibles)</label>
            <select
              value={selectedObjectiveId}
              onChange={e => {
                const objId = e.target.value;
                setSelectedObjectiveId(objId);
                const obj = d1Objectives.find((o: any) => String(o.id) === String(objId));
                if (obj) {
                  setSelectedD1Objective(obj);
                  const code = obj.code || '';
                  const text = obj.official_text || '';
                  setOa(`${code} — ${text}`.trim());
                } else {
                  setSelectedD1Objective(null);
                }
              }}
            >
              <option value="">Seleccionar OA desde D1</option>
              {d1Objectives.map((o: any) => <option key={o.id} value={o.id}>{o.code} — {(o.official_text || '').substring(0, 60)}...</option>)}
            </select>
            {oa && <p style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 4 }}>OA seleccionado: {oa.substring(0, 80)}...</p>}
          </div>
        )}
        {loadingD1 && <p style={{ fontSize: 12, color: 'var(--muted2)' }}><Loader2 size={12} className="spin inline" /> Cargando objetivos...</p>}
        {selectedCourseId && selectedSubjectId && d1Objectives.length === 0 && !loadingD1 && (
          <p style={{ fontSize: 12, color: 'var(--muted2)' }}>No hay objetivos cargados para esta combinación curso/asignatura.</p>
        )}
      </div>
      <div className="card agent-chat">
        {messages.length === 0 && <div className="agent-empty"><Sparkles size={30} /><h3>¿Qué quieres preparar?</h3><div className="btnrow"><button className="secondary" onClick={() => send('Busca objetivos de aprendizaje relacionados con este tema.')}>Buscar currículo</button><button className="secondary" onClick={() => send('Muéstrame los últimos recursos que he generado.')}>Ver mis recursos</button><button className="secondary" onClick={() => send('Llévame al flujo para generar un material nuevo.')}>Generar material</button></div></div>}
        {messages.map((m, i) => (
          <div key={i} className={`agent-message ${m.role}`}>
            <div className="agent-role">{m.role === 'user' ? 'Tú' : 'Planifica IA'}</div>
            {m.role === 'assistant' ? (
              <>
                <div className="output" dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                {m.intent && <span className="badge" style={{ fontSize: 11, opacity: 0.75 }}>{INTENT_BADGES[m.intent]}</span>}
                <button className="ghost" onClick={() => navigator.clipboard.writeText(m.content)}><Copy size={14} /> Copiar</button>
                {pendingConfirmation?.messageIndex === i && (
                  <div className="btnrow" style={{ marginTop: 8 }}>
                    <button className="primary" onClick={confirmPending} disabled={busy}>Confirmar</button>
                    <button className="secondary" onClick={cancelPending} disabled={busy}>Cancelar</button>
                  </div>
                )}
              </>
            ) : <p>{m.content}</p>}
          </div>
        ))}
        {busy && <div className="status">Planifica está preparando el material…</div>}
        {error && <div className="status bad">{error}</div>}
        <div className="agent-compose"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ej.: crea tres clases sobre la comprensión de cuentos..." rows={3} /><button className="primary" disabled={busy || !input.trim()} onClick={() => send()}>Enviar</button></div>
      </div>
    </div>
  );
}
