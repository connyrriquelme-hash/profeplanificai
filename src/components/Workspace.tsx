import { useState, useEffect, useCallback } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Sparkles, Plus, Search, CheckCircle, Loader } from 'lucide-react';
import { useProject, type ProjectData } from '../contexts/ProjectContext';
import { niveles, getAsignaturas, getOAs, type CurriculumItem } from '../data/curriculumData';
import { AIAssistant, type PedagogicalContext } from './AIAssistant';
import { generarConIA } from '../services/aiService';

interface WorkspaceProps {
  onNavigate?: (view: string) => void;
}

const selectClass =
  'w-full px-3 py-[10px] text-[13px] sm:text-sm border border-[var(--line)] rounded-[var(--radius)] bg-[var(--card)] text-[var(--ink)] font-[Inter,system-ui,sans-serif] cursor-pointer outline-none transition-[border-color] duration-150';



function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--success)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, animation: 'fadeIn .2s ease' }}>
      <CheckCircle size={18} />
      {message}
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
          `Eres un Mentor Pedagógico Experto en el sistema educativo chileno. Tu tarea es generar una secuencia didáctica completa (Inicio, Desarrollo y Cierre) dentro de un único bloque de texto.`,
          ``,
          `Debes usar el siguiente contexto pedagógico:`,
          `Nivel: ${selectedNivel}`,
          `Asignatura: ${selectedAsignatura}`,
          `OA: ${selectedOA.oa_id} - ${selectedOA.oa_texto}`,
          `Habilidad(es): ${selectedHabilidad || 'No especificada'}`,
          ...(selectedOA.indicadores.length ? [`Indicadores:`, ...selectedOA.indicadores.map(i => `- ${i}`)] : []),
          '',
          `Tu respuesta debe estar estructurada obligatoriamente con estos tres encabezados claros:`,
          `- Inicio: (con activación de conocimientos previos y motivación)`,
          `- Desarrollo: (con actividades específicas, metodologías activas como ABP o DUA, y mediación docente)`,
          `- Cierre: (con síntesis, metacognición y ticket de salida)`,
          '',
          `Usa un tono innovador, amigable y profesional. Incluye sugerencias de material didáctico concreto que sea fácil de implementar en una sala de clases chilena.`,
          `- Lenguaje docente chileno claro y directo.`,
          `- Incluir preguntas de mediación para el docente.`,
          `- Incluir sugerencias de evaluación formativa.`,
          `- Formato listo para copiar y pegar.`,
          `- Extensión total: entre 600 y 1000 palabras.`,
        ].join('\n'),
        estilo: 'completo',
        duracion: '90 min',
        onStatus: () => {},
      });
      const text = result.texto || `**Inicio (10-15 min):**\nActivación de conocimientos previos mediante lluvia de ideas…\n\n**Desarrollo (25-30 min):**\nTrabajo colaborativo en grupos…\n\n**Cierre (5-10 min):**\nTicket de salida con pregunta de metacognición…`;
      setEstructuraClase(text);
      updateProjectField('inicio', text);
      showToast('Estructura de clase generada con IA.');
    } catch {
      const fallback = `**Inicio (10-15 min):**\nActivación de conocimientos previos mediante lluvia de ideas…\n\n**Desarrollo (25-30 min):**\nTrabajo colaborativo en grupos…\n\n**Cierre (5-10 min):**\nTicket de salida con pregunta de metacognición…`;
      setEstructuraClase(fallback);
      updateProjectField('inicio', fallback);
      showToast('Generado en modo local (fallback).');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!currentProject) return;
    addToLibrary();
    showToast('¡Planificación guardada con éxito!');
    setTimeout(() => onNavigate?.('agente'), 800);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Toast message={toastMessage} visible={toastVisible} />

      {/* ── Left panel: configuration ── */}
      <div className="lg:col-span-4 space-y-5">
        {/* ── Cascading selectors ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Nivel</label>
            <select
              value={selectedNivel}
              onChange={e => handleNivelChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Seleccionar nivel</option>
              {niveles.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Asignatura</label>
            <select
              value={selectedAsignatura}
              onChange={e => handleAsignaturaChange(e.target.value)}
              className={selectClass}
              disabled={!selectedNivel}
            >
              <option value="">{selectedNivel ? 'Seleccionar asignatura' : 'Primero elige nivel'}</option>
              {selectedNivel && getAsignaturas(selectedNivel).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Objetivo (OA)</label>
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
              className={selectClass}
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }} className="text-[10px] sm:text-[11px] lg:text-xs">Habilidad</label>
            <select
              value={selectedHabilidad}
              onChange={e => setSelectedHabilidad(e.target.value)}
              className={selectClass}
              disabled={!selectedOA}
            >
              <option value="">{selectedOA ? 'Seleccionar habilidad' : 'Primero elige OA'}</option>
              {selectedOA?.habilidades.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* ── OA card with auto-filled text ── */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 24, background: 'var(--card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted2)' }} className="text-[10px] sm:text-[11px] lg:text-xs">OBJETIVO DE APRENDIZAJE (OA)</div>
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

        <aside>
          <AIAssistant context={pedagogicalContext} />
        </aside>
      </div>

      {/* ── Right panel: content ── */}
      <div className="lg:col-span-8 space-y-5">

        <CollapsibleSection title="ESTRUCTURA DE LA CLASE" icon={<Play size={20} />} defaultExpanded>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="text-xs sm:text-sm" style={{ fontWeight: 600, color: 'var(--ink2)' }}>Secuencia didáctica completa</label>
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
            className="output p-3 sm:p-4 lg:p-5"
            value={estructuraClase}
            onChange={handleChange(setEstructuraClase, 'inicio')}
            style={{ minHeight: 460, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff', border: 'none', borderRadius: 0 }}
            placeholder={`### INICIO (10-15 min)\nActivación de conocimientos previos…\n\n### DESARROLLO (25-30 min)\nEstrategias de enseñanza…\n\n### CIERRE (5-10 min)\nTicket de salida…`}
          />
        </CollapsibleSection>

        <CollapsibleSection title="RECURSOS Y MATERIALES" icon={<FileText size={20} />}>
          <textarea
            className="output p-3 sm:p-4"
            value={recursos}
            onChange={handleChange(setRecursos, 'recursos')}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Enlaces, archivos, referencias, materiales didácticos…"
          />
        </CollapsibleSection>

        <CollapsibleSection title="INSTRUMENTO DE EVALUACIÓN" icon={<FileText size={20} />}>
          <textarea
            className="output p-3 sm:p-4"
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

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
