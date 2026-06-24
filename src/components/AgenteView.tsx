import { useState } from 'react';
import { Bot, Copy, Sparkles } from 'lucide-react';
import { api } from '../services/apiClient';
import { md } from '../utils/htmlUtils';
import { NIVELES, ASIGNATURAS } from '../types';

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
          <div><label>Nivel</label><select value={nivel} onChange={e => setNivel(e.target.value)}>{NIVELES.map(x => <option key={x}>{x}</option>)}</select></div>
          <div><label>Asignatura</label><select value={asignatura} onChange={e => setAsignatura(e.target.value)}>{ASIGNATURAS.map(x => <option key={x}>{x}</option>)}</select></div>
        </div>
        <label>OA exacto (recomendado)</label><textarea value={oa} onChange={e => setOa(e.target.value)} placeholder="Pega aquí el Objetivo de Aprendizaje ministerial..." rows={2} />
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
