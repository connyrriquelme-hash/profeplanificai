import { useState, useEffect, useCallback } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Target, Sparkles, Plus, Search, CheckCircle, MessageSquare, Send } from 'lucide-react';

const STORAGE_KEY = 'planificaciones_guardadas';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#16a34a', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, animation: 'fadeIn .2s ease' }}>
      <CheckCircle size={18} />
      {message}
    </div>
  );
}

export function Workspace() {
  const [objetivos, setObjetivos] = useState('');
  const [oat, setOat] = useState('');
  const [indicadores, setIndicadores] = useState('');
  const [inicio, setInicio] = useState('');
  const [desarrollo, setDesarrollo] = useState('');
  const [cierre, setCierre] = useState('');
  const [recursos, setRecursos] = useState('');
  const [evaluacion, setEvaluacion] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  const handleChange = (setter: typeof setInicio) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
  };

  const handleSelectOA = (texto: string) => {
    if (texto) setObjetivos(prev => prev + (prev ? '\n\n' : '') + texto);
  };

  const handleSaveToLibrary = () => {
    const data = {
      id: generateId(),
      titulo: `Planificación - ${new Date().toLocaleDateString('es-CL')}`,
      fecha: new Date().toISOString(),
      objetivos,
      oat,
      indicadores,
      inicio,
      desarrollo,
      cierre,
      recursos,
      evaluacion,
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    showToast('¡Planificación guardada con éxito!');
  };

  const [chatInput, setChatInput] = useState('');

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Toast message={toastMessage} visible={toastVisible} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Asignatura', 'Curso', 'Unidad', 'Tiempo'].map(label => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 999, background: '#f3f4f6', fontSize: 12, fontWeight: 500, color: '#4b5563' }}>
              {label}
            </span>
          ))}
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 20, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#9ca3af' }}>OBJETIVO DE APRENDIZAJE (OA)</div>
            <button className="primary" onClick={() => setIsSelectorOpen(!isSelectorOpen)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}>
              <Search size={12} /> Buscar OA
            </button>
          </div>
          {isSelectorOpen && (
            <div style={{ marginBottom: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--bg2)' }}>
              <SelectorOA onSelect={(oa) => { handleSelectOA(oa); setIsSelectorOpen(false); }} />
            </div>
          )}
          <textarea
            className="output"
            value={objetivos}
            onChange={handleChange(setObjetivos)}
            placeholder="Haz clic en 'Buscar OA' para seleccionar un objetivo..."
            style={{ minHeight: 60, fontSize: 16, fontWeight: 600, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
          />
        </div>

        <CollapsibleSection title="OAT E INDICADORES" icon={<Target size={20} />} defaultExpanded>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Objetivo de Aprendizaje Transversal (OAT)</label>
            <textarea
              className="output"
              value={oat}
              onChange={handleChange(setOat)}
              style={{ minHeight: 80, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Escribe el OAT relacionado…"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Indicadores de Evaluación</label>
            <textarea
              className="output"
              value={indicadores}
              onChange={handleChange(setIndicadores)}
              style={{ minHeight: 80, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Indicadores para evaluar el logro del OA…"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="DETALLE DE ACTIVIDADES" icon={<Play size={20} />} defaultExpanded>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Inicio</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Inicio')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={inicio}
              onChange={handleChange(setInicio)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Actividades de inicio, activación de conocimientos previos, motivación…"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Desarrollo</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Desarrollo')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={desarrollo}
              onChange={handleChange(setDesarrollo)}
              style={{ minHeight: 200, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Estrategias de enseñanza, actividades principales, trabajo colaborativo…"
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Cierre</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Cierre')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={cierre}
              onChange={handleChange(setCierre)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Síntesis, ticket de salida, retroalimentación, conexión con próxima clase…"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="RECURSOS Y MATERIALES" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={recursos}
            onChange={handleChange(setRecursos)}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Enlaces, archivos, referencias, materiales didácticos…"
          />
        </CollapsibleSection>

        <CollapsibleSection title="INSTRUMENTO DE EVALUACIÓN" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={evaluacion}
            onChange={handleChange(setEvaluacion)}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Criterios de evaluación, rúbrica, lista de cotejo, pauta de observación…"
          />
          <div className="btnrow" style={{ marginTop: 12 }}>
            <button className="primary"><Sparkles size={14} /> Generar plan completo</button>
            <button className="secondary" onClick={handleSaveToLibrary}><Plus size={14} /> Guardar en Biblioteca</button>
          </div>
        </CollapsibleSection>
      </div>

      <aside style={{ width: 300, flexShrink: 0, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#9ca3af' }}>ASISTENTE IA</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>PlanificaIA</div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, minHeight: 200, marginBottom: 12, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={12} color="#fff" />
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 12, padding: '8px 12px', fontSize: 13, color: '#374151' }}>
                Hola, soy tu asistente. Puedo ayudarte a redactar actividades, rúbricas y más.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Sugerencia: Haz preguntas sobre planificación, actividades o rúbricas"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
            <button className="primary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
