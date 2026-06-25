import { useState, useEffect, useCallback, useRef } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Sparkles, Plus, Search, CheckCircle, Loader, X } from 'lucide-react';
import { useProject, type ProjectData } from '../contexts/ProjectContext';
import { niveles, getAsignaturas, getOAs, type CurriculumItem } from '../data/curriculumData';
import { AIAssistant, type PedagogicalContext } from './AIAssistant';
import { generarConIA, type GenAIOpts } from '../services/aiService';

interface SuggestionModalState {
  suggestion: string;
  edited: string;
}

interface WorkspaceProps {
  onNavigate?: (view: string) => void;
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
  fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer',
  outline: 'none', transition: 'border-color .15s',
};



function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--success)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, animation: 'fadeIn .2s ease' }}>
      <CheckCircle size={18} />
      {message}
    </div>
  );
}

function SuggestionModal({
  state,
  onInsert,
  onCancel,
  onEdit,
}: {
  state: SuggestionModalState;
  onInsert: (text: string) => void;
  onCancel: () => void;
  onEdit: (text: string) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal suggestion-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="suggestion-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} style={{ color: 'var(--brand)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Sugerencia IA — Estructura de la Clase</h3>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Revisa y edita la propuesta antes de insertarla</p>
            </div>
          </div>
          <button className="ghost" onClick={onCancel} style={{ padding: 6 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <textarea
            value={state.edited}
            onChange={e => onEdit(e.target.value)}
            style={{
              width: '100%', minHeight: 400, padding: 14, border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: 13,
              lineHeight: 1.6, resize: 'vertical', background: '#fff', marginTop: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="secondary" onClick={onCancel}>Cancelar</button>
            <button className="primary" onClick={() => onInsert(state.edited)}>
              <Sparkles size={14} /> Insertar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Workspace({ onNavigate }: WorkspaceProps) {
  const { currentProject, updateProjectField, addToLibrary } = useProject();

  const [objetivos, setObjetivos] = useState(currentProject?.objetivos || '');
  const [indicadores, setIndicadores] = useState(currentProject?.indicadores || '');
  const [estructuraClase, setEstructuraClase] = useState(currentProject?.inicio || '');
  const [recursos, setRecursos] = useState(currentProject?.recursos || '');
  const [evaluacion, setEvaluacion] = useState(currentProject?.evaluacion || '');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionModal, setSuggestionModal] = useState<SuggestionModalState | null>(null);
  const [selectedNivel, setSelectedNivel] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [selectedOA, setSelectedOA] = useState<CurriculumItem | null>(null);
  const [selectedHabilidad, setSelectedHabilidad] = useState('');
  const [oaSearch, setOaSearch] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  // Rehydrate all fields when a saved project is loaded
  useEffect(() => {
    if (!currentProject) return;
    setObjetivos(currentProject.objetivos || '');
    setIndicadores(currentProject.indicadores || '');
    setEstructuraClase(currentProject.inicio || '');
    setRecursos(currentProject.recursos || '');
    setEvaluacion(currentProject.evaluacion || '');
    setSelectedNivel(currentProject.nivel || '');
    setSelectedAsignatura(currentProject.asignatura || '');
    setSelectedHabilidad(currentProject.habilidad || '');
    setOaSearch('');
    if (currentProject.oa_id && currentProject.nivel && currentProject.asignatura) {
      const oas = getOAs(currentProject.nivel, currentProject.asignatura);
      const found = oas.find(o => o.oa_id === currentProject.oa_id);
      setSelectedOA(found || null);
    } else {
      setSelectedOA(null);
    }
  }, [currentProject]);

  // Build pedagogical context for the AI agent
  const pedagogicalContext: PedagogicalContext | null = selectedOA ? {
    nivel: selectedNivel,
    asignatura: selectedAsignatura,
    oa_id: selectedOA.oa_id,
    oa_texto: selectedOA.oa_texto,
    habilidades: selectedOA.habilidades,
    indicadores: selectedOA.indicadores,
  } : null;

  // Auto-fill OA text, indicadores, habilidades and persist curriculum context
  useEffect(() => {
    if (!selectedOA) return;
    setObjetivos(selectedOA.oa_texto);
    updateProjectField('objetivos', selectedOA.oa_texto);
    setIndicadores(selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    updateProjectField('indicadores', selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    setSelectedHabilidad(selectedOA.habilidades[0] || '');
    updateProjectField('oa_id', selectedOA.oa_id);
    updateProjectField('indicadores_raw', JSON.stringify(selectedOA.indicadores));
    updateProjectField('nivel', selectedNivel);
    updateProjectField('asignatura', selectedAsignatura);
  }, [selectedOA]);

  // Persist habilidad whenever it changes
  useEffect(() => {
    updateProjectField('habilidad', selectedHabilidad);
  }, [selectedHabilidad]);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, field?: keyof ProjectData) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    if (field) updateProjectField(field, e.target.value);
  };

  const handleNivelChange = (value: string) => {
    setSelectedNivel(value);
    setSelectedAsignatura('');
    setSelectedOA(null);
    setSelectedHabilidad('');
    setOaSearch('');
    updateProjectField('nivel', value);
    updateProjectField('asignatura', '');
    updateProjectField('oa_id', '');
    updateProjectField('habilidad', '');
    updateProjectField('indicadores_raw', '[]');
  };

  const handleAsignaturaChange = (value: string) => {
    setSelectedAsignatura(value);
    setSelectedOA(null);
    setSelectedHabilidad('');
    setOaSearch('');
    updateProjectField('asignatura', value);
    updateProjectField('oa_id', '');
    updateProjectField('habilidad', '');
    updateProjectField('indicadores_raw', '[]');
  };

  const handleSelectOA = (texto: string) => {
    if (texto) {
      const next = objetivos + (objetivos ? '\n\n' : '') + texto;
      setObjetivos(next);
      updateProjectField('objetivos', next);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOA) {
      showToast('Selecciona un OA primero.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generarConIA({
        tipo: 'planificacion',
        nivel: selectedNivel,
        asignatura: selectedAsignatura,
        oa: selectedOA.oa_texto,
        habilidad: selectedHabilidad,
        promptExt: [
          `Eres un/una docente chileno/a experto/a en planificación curricular.`,
          `Genera la estructura completa de una planificación de clase con las secciones INICIO, DESARROLLO y CIERRE.`,
          `Nivel: ${selectedNivel}`,
          `Asignatura: ${selectedAsignatura}`,
          `OA: ${selectedOA.oa_id} - ${selectedOA.oa_texto}`,
          `Habilidad: ${selectedHabilidad || 'No especificada'}`,
          ...(selectedOA.indicadores.length ? ['Indicadores:', ...selectedOA.indicadores.map(i => `- ${i}`)] : []),
          '',
          `Formato esperado:`,
          `### INICIO (10-15 min)`,
          `[contenido del inicio]`,
          ``,
          `### DESARROLLO (25-30 min)`,
          `[contenido del desarrollo]`,
          ``,
          `### CIERRE (5-10 min)`,
          `[contenido del cierre]`,
          '',
          `Requisitos:`,
          `- Lenguaje docente chileno claro y directo.`,
          `- Actividades concretas y aplicables en aula chilena real.`,
          `- Incluir preguntas de mediación para el docente.`,
          `- Incluir sugerencias de evaluación formativa.`,
          `- Usar metodologías activas (ABP, DUA, Gamificación, Aula Invertida).`,
          `- Incluir recursos materiales tangibles (fáciles de encontrar en una escuela).`,
          `- Formato listo para copiar y pegar.`,
          `- Extensión total: entre 600 y 1000 palabras.`,
        ].join('\n'),
        estilo: 'completo',
        duracion: '90 min',
        onStatus: () => {},
      });
      const text = result.texto || '### INICIO (10-15 min)\n\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\n\nEstrategia principal…\n\n### CIERRE (5-10 min)\n\nTicket de salida…';
      setSuggestionModal({ suggestion: text, edited: text });
    } catch {
      setSuggestionModal({
        suggestion: '### INICIO (10-15 min)\n\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\n\nEstrategia principal…\n\n### CIERRE (5-10 min)\n\nTicket de salida…',
        edited: '### INICIO (10-15 min)\n\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\n\nEstrategia principal…\n\n### CIERRE (5-10 min)\n\nTicket de salida…',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertSuggestion = (text: string) => {
    if (!suggestionModal) return;
    setEstructuraClase(text);
    updateProjectField('inicio', text);
    setSuggestionModal(null);
    showToast('Estructura de clase insertada correctamente.');
  };

  const handleEditSuggestion = (text: string) => {
    setSuggestionModal(prev => prev ? { ...prev, edited: text } : null);
  };

  const handleSaveToLibrary = () => {
    if (!currentProject) return;
    addToLibrary();
    showToast('¡Planificación guardada con éxito!');
    setTimeout(() => onNavigate?.('agente'), 800);
  };

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Toast message={toastMessage} visible={toastVisible} />

      {suggestionModal && (
        <SuggestionModal
          state={suggestionModal}
          onInsert={handleInsertSuggestion}
          onCancel={() => setSuggestionModal(null)}
          onEdit={handleEditSuggestion}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ── Cascading selectors ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nivel</label>
            <select
              value={selectedNivel}
              onChange={e => handleNivelChange(e.target.value)}
              style={selectStyle}
            >
              <option value="">Seleccionar nivel</option>
              {niveles.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Asignatura</label>
            <select
              value={selectedAsignatura}
              onChange={e => handleAsignaturaChange(e.target.value)}
              style={selectStyle}
              disabled={!selectedNivel}
            >
              <option value="">{selectedNivel ? 'Seleccionar asignatura' : 'Primero elige nivel'}</option>
              {selectedNivel && getAsignaturas(selectedNivel).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Objetivo (OA)</label>
            {selectedAsignatura && (
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--muted2)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={oaSearch}
                  onChange={e => setOaSearch(e.target.value)}
                  placeholder="Buscar OA por código o texto…"
                  style={{
                    width: '100%', padding: '8px 10px 8px 30px', border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
                    fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <select
              value={selectedOA?.oa_id || ''}
              onChange={e => {
                const oas = getOAs(selectedNivel, selectedAsignatura);
                setSelectedOA(oas.find(o => o.oa_id === e.target.value) || null);
              }}
              style={selectStyle}
              disabled={!selectedAsignatura}
            >
              <option value="">{selectedAsignatura ? 'Seleccionar OA' : 'Primero elige asignatura'}</option>
              {selectedNivel && selectedAsignatura && getOAs(selectedNivel, selectedAsignatura)
                .filter(o => !oaSearch || o.oa_id.toLowerCase().includes(oaSearch.toLowerCase()) || o.oa_texto.toLowerCase().includes(oaSearch.toLowerCase()))
                .map(o => (
                <option key={o.oa_id} value={o.oa_id}>{o.oa_id} — {o.oa_texto.slice(0, 60)}…</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Habilidad</label>
            <select
              value={selectedHabilidad}
              onChange={e => setSelectedHabilidad(e.target.value)}
              style={selectStyle}
              disabled={!selectedOA}
            >
              <option value="">{selectedOA ? 'Seleccionar habilidad' : 'Primero elige OA'}</option>
              {selectedOA?.habilidades.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* ── OA card with auto-filled text ── */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20, background: 'var(--card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted2)' }}>OBJETIVO DE APRENDIZAJE (OA)</div>
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
            onChange={handleChange(setObjetivos, 'objetivos')}
            placeholder="Haz clic en 'Buscar OA' o selecciona desde los filtros superiores..."
            style={{ minHeight: 60, fontSize: 16, fontWeight: 600, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
          />
          {selectedOA && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 11, background: 'var(--brand)', color: '#fff', padding: '2px 10px', borderRadius: 12, fontWeight: 500 }}>
                {selectedOA.oa_id}
              </span>
              {selectedOA.habilidades.map(h => (
                <span key={h} style={{ fontSize: 11, background: 'var(--bg2)', color: 'var(--ink2)', padding: '2px 10px', borderRadius: 12 }}>
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>



        <CollapsibleSection title="ESTRUCTURA DE LA CLASE" icon={<Play size={20} />} defaultExpanded>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Secuencia didáctica completa</label>
            <button
              className="small secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader size={12} className="spin" /> : <Sparkles size={12} />} Generar con IA
            </button>
          </div>
          <textarea
            className="output"
            value={estructuraClase}
            onChange={handleChange(setEstructuraClase, 'inicio')}
            style={{ minHeight: 460, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff', border: 'none', borderRadius: 0, padding: 0 }}
            placeholder={`### INICIO (10-15 min)\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\nEstrategias de enseñanza…\n\n### CIERRE (5-10 min)\nTicket de salida…`}
          />
        </CollapsibleSection>

        <CollapsibleSection title="RECURSOS Y MATERIALES" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={recursos}
            onChange={handleChange(setRecursos, 'recursos')}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Enlaces, archivos, referencias, materiales didácticos…"
          />
        </CollapsibleSection>

        <CollapsibleSection title="INSTRUMENTO DE EVALUACIÓN" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={evaluacion}
            onChange={handleChange(setEvaluacion, 'evaluacion')}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Criterios de evaluación, rúbrica, lista de cotejo, pauta de observación…"
          />
          <div className="btnrow" style={{ marginTop: 12 }}>
            <button className="primary"><Sparkles size={14} /> Generar plan completo</button>
            <button className="secondary" onClick={handleSaveToLibrary}><Plus size={14} /> Guardar en Biblioteca</button>
          </div>
        </CollapsibleSection>
      </div>

      <aside style={{ width: 280, flexShrink: 0, display: 'block' }}>
        <AIAssistant context={pedagogicalContext} />
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 40px 20px; overflow-y: auto; }
        .modal { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); max-width: 680px; width: 100%; }
        .suggestion-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--line); }
      `}</style>
    </div>
  );
}
