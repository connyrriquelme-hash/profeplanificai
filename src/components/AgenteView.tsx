import { useState, useEffect } from 'react';
import { Bot, Copy, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/apiClient';
import { md } from '../utils/htmlUtils';
import { getCourses, getSubjectsByCourse, getObjectives } from '../services/curriculumD1Service';

type Mode = 'chat' | 'secuencia' | 'unidad' | 'diferenciacion' | 'evaluacion';
type Message = { role: 'user' | 'assistant'; content: string };

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'chat', label: 'Asistente' },
  { value: 'secuencia', label: 'Secuencia de clases' },
  { value: 'unidad', label: 'Miniunidad' },
  { value: 'diferenciacion', label: 'Diferenciación' },
  { value: 'evaluacion', label: 'Evaluación completa' },
];

export function AgenteView() {
  const [mode, setMode] = useState<Mode>('chat');
  const [nivel, setNivel] = useState('1° básico');
  const [asignatura, setAsignatura] = useState('Lenguaje y Comunicación');
  const [oa, setOa] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // D1 data
  const [d1Courses, setD1Courses] = useState<any[]>([]);
  const [d1Subjects, setD1Subjects] = useState<any[]>([]);
  const [d1Objectives, setD1Objectives] = useState<any[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [selectedD1Objective, setSelectedD1Objective] = useState<any | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loadingD1, setLoadingD1] = useState(false);

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

  const send = async (suggestion?: string) => {
    const message = (suggestion || input).trim();
    if (!message || busy) return;
    const next = [...messages, { role: 'user' as const, content: message }];
    setMessages(next); setInput(''); setBusy(true); setError('');
    try {
      const data = await api.post<{ content: string }>('/api/agent', {
        message, mode, context: { nivel, asignatura, oa }, history: messages.slice(-8),
      });
      setMessages([...next, { role: 'assistant', content: data.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo contactar al agente');
    } finally { setBusy(false); }
  };

  return (
    <div className="view agent-view">
      <div className="banner">
        <Bot size={32} />
        <div><b>Agente pedagógico Planifica</b><br /><span className="muted">Crea, diferencia y revisa materiales mediante una conversación, con contexto curricular chileno.</span></div>
      </div>
      <div className="card">
        <div className="grid3">
          <div><label>Proceso</label><select value={mode} onChange={e => setMode(e.target.value as Mode)}>{MODES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
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
        <label>OA exacto (recomendado)</label><textarea value={oa} onChange={e => setOa(e.target.value)} placeholder="Pega aquí el Objetivo de Aprendizaje ministerial..." rows={2} />
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
        {messages.length === 0 && <div className="agent-empty"><Sparkles size={30} /><h3>¿Qué quieres preparar?</h3><div className="btnrow"><button className="secondary" onClick={() => send('Diseña una clase de 90 minutos con actividades, DUA y ticket de salida.')}>Crear clase</button><button className="secondary" onClick={() => send('Crea una guía diferenciada en versiones apoyo, estándar y desafío.')}>Diferenciar guía</button><button className="secondary" onClick={() => send('Diseña una evaluación completa con pauta y rúbrica.')}>Crear evaluación</button></div></div>}
        {messages.map((m, i) => <div key={i} className={`agent-message ${m.role}`}><div className="agent-role">{m.role === 'user' ? 'Tú' : 'Planifica IA'}</div>{m.role === 'assistant' ? <><div className="output" dangerouslySetInnerHTML={{ __html: md(m.content) }} /><button className="ghost" onClick={() => navigator.clipboard.writeText(m.content)}><Copy size={14} /> Copiar</button></> : <p>{m.content}</p>}</div>)}
        {busy && <div className="status">Planifica está preparando el material…</div>}
        {error && <div className="status bad">{error}</div>}
        <div className="agent-compose"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ej.: crea tres clases sobre la comprensión de cuentos..." rows={3} /><button className="primary" disabled={busy || !input.trim()} onClick={() => send()}>Enviar</button></div>
      </div>
    </div>
  );
}
