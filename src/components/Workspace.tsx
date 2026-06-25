import { useState, useEffect, useCallback } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Target, Sparkles, Plus, Search, CheckCircle } from 'lucide-react';
import { useProject, type ProjectData } from '../contexts/ProjectContext';

interface WorkspaceProps {
  onNavigate?: (view: string) => void;
}

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
  const [oat, setOat] = useState(currentProject?.oat || '');
  const [indicadores, setIndicadores] = useState(currentProject?.indicadores || '');
  const [inicio, setInicio] = useState(currentProject?.inicio || '');
  const [desarrollo, setDesarrollo] = useState(currentProject?.desarrollo || '');
  const [cierre, setCierre] = useState(currentProject?.cierre || '');
  const [recursos, setRecursos] = useState(currentProject?.recursos || '');
  const [evaluacion, setEvaluacion] = useState(currentProject?.evaluacion || '');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    setObjetivos(currentProject.objetivos || '');
    setOat(currentProject.oat || '');
    setIndicadores(currentProject.indicadores || '');
    setInicio(currentProject.inicio || '');
    setDesarrollo(currentProject.desarrollo || '');
    setCierre(currentProject.cierre || '');
    setRecursos(currentProject.recursos || '');
    setEvaluacion(currentProject.evaluacion || '');
  }, [currentProject]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  const handleChange = (field: keyof ProjectData, setter: typeof setInicio) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    if (field) updateProjectField(field, e.target.value);
  };

  const handleSelectOA = (texto: string) => {
    if (texto) {
      const next = objetivos + (objetivos ? '\n\n' : '') + texto;
      setObjetivos(next);
      updateProjectField('objetivos', next);
    }
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

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Asignatura', 'Curso', 'Unidad', 'Tiempo'].map(label => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'var(--bg2)', fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>
              {label}
            </span>
          ))}
        </div>

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
            onChange={handleChange('objetivos', setObjetivos)}
            placeholder="Haz clic en 'Buscar OA' para seleccionar un objetivo..."
            style={{ minHeight: 60, fontSize: 16, fontWeight: 600, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
          />
        </div>

        <CollapsibleSection title="OAT E INDICADORES" icon={<Target size={20} />} defaultExpanded>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>Objetivo de Aprendizaje Transversal (OAT)</label>
            <textarea
              className="output"
              value={oat}
              onChange={handleChange('oat', setOat)}
              style={{ minHeight: 80, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Escribe el OAT relacionado…"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>Indicadores de Evaluación</label>
            <textarea
              className="output"
              value={indicadores}
              onChange={handleChange('indicadores', setIndicadores)}
              style={{ minHeight: 80, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Indicadores para evaluar el logro del OA…"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="DETALLE DE ACTIVIDADES" icon={<Play size={20} />} defaultExpanded>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Inicio</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Inicio')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={inicio}
              onChange={handleChange('inicio', setInicio)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Actividades de inicio, activación de conocimientos previos, motivación…"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Desarrollo</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Desarrollo')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={desarrollo}
              onChange={handleChange('desarrollo', setDesarrollo)}
              style={{ minHeight: 200, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Estrategias de enseñanza, actividades principales, trabajo colaborativo…"
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Cierre</label>
              <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Cierre')}>
                <Sparkles size={12} /> IA
              </button>
            </div>
            <textarea
              className="output"
              value={cierre}
              onChange={handleChange('cierre', setCierre)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Síntesis, ticket de salida, retroalimentación, conexión con próxima clase…"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="RECURSOS Y MATERIALES" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={recursos}
            onChange={handleChange('recursos', setRecursos)}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Enlaces, archivos, referencias, materiales didácticos…"
          />
        </CollapsibleSection>

        <CollapsibleSection title="INSTRUMENTO DE EVALUACIÓN" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={evaluacion}
            onChange={handleChange('evaluacion', setEvaluacion)}
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
      `}</style>
    </div>
  );
}
