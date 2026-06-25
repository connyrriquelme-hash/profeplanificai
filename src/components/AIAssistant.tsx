import { Sparkles, BookOpen, Target, ListChecks, BrainCircuit } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface PedagogicalContext {
  nivel: string;
  asignatura: string;
  oa_id: string;
  oa_texto: string;
  habilidades: string[];
  indicadores: string[];
}

interface AIAssistantProps {
  context: PedagogicalContext | null;
}

export function AIAssistant({ context }: AIAssistantProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!context) {
      setSystemPrompt('');
      return;
    }
    setSystemPrompt(
      `Eres un experto pedagógico en el currículum chileno. El usuario está planificando para el nivel: ${context.nivel}, asignatura: ${context.asignatura}. El OA seleccionado es: ${context.oa_texto}. Sus habilidades son: ${context.habilidades.join(', ')} y sus indicadores son: ${context.indicadores.join(', ')}. Responde siempre basándote en este contexto pedagógico específico.`
    );
  }, [context]);

  const handleCopy = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{ padding: 16, position: 'sticky', top: 16, borderRadius: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <strong style={{ fontSize: 13, display: 'block' }}>Agente Pedagógico</strong>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Experto en currículum chileno</span>
        </div>
      </div>

      {!context ? (
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Selecciona un Nivel, Asignatura y OA desde los filtros superiores para activar el contexto pedagógico del agente.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <BookOpen size={14} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{context.nivel}</span>
                <span style={{ color: 'var(--muted)' }}> · {context.asignatura}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Target size={14} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
              <span style={{ color: 'var(--ink2)', lineHeight: 1.4 }}>{context.oa_id}: {context.oa_texto}</span>
            </div>
            {context.habilidades.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <BrainCircuit size={14} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {context.habilidades.map(h => (
                    <span key={h} style={{ fontSize: 10, background: 'var(--bg2)', padding: '2px 8px', borderRadius: 8, color: 'var(--ink2)' }}>{h}</span>
                  ))}
                </div>
              </div>
            )}
            {context.indicadores.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <ListChecks size={14} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
                <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--muted)' }}>
                  {context.indicadores.slice(0, 3).map((ind, i) => (
                    <li key={i} style={{ lineHeight: 1.4 }}>{ind}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <details style={{ fontSize: 12, marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--muted2)', fontWeight: 500, userSelect: 'none' }}>
              Prompt del agente
            </summary>
            <div style={{ marginTop: 8, padding: 10, background: 'var(--bg2)', borderRadius: 10, maxHeight: 160, overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--ink2)' }}>
                {systemPrompt}
              </pre>
            </div>
          </details>

          <button className="secondary" style={{ width: '100%', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleCopy}>
            {copied ? '✓ Copiado' : 'Copiar prompt al portapapeles'}
          </button>
        </>
      )}

      <style>{`
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details > summary::before { content: '▸ '; }
        details[open] > summary::before { content: '▾ '; }
      `}</style>
    </div>
  );
}
