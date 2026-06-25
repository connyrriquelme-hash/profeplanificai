import { useState, useEffect, useCallback } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Zap, Target, Sparkles, Plus, Search, CheckCircle, ChevronDown } from 'lucide-react';

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
  const [inicio, setInicio] = useState('');
  const [desarrollo, setDesarrollo] = useState('');
  const [cierre, setCierre] = useState('');
  const [detalleClase, setDetalleClase] = useState('');
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
      inicio,
      desarrollo,
      cierre,
      detalleClase,
      recursos,
      evaluacion,
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    showToast('¡Planificación guardada con éxito!');
  };

  return (
    <div>
      <Toast message={toastMessage} visible={toastVisible} />

      <div style={{ marginBottom: 16 }}>
        <div className="btnrow">
          <button className="primary" onClick={() => setIsSelectorOpen(!isSelectorOpen)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} /> Buscar OA
            <ChevronDown size={14} style={{ transition: 'transform .2s', transform: isSelectorOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>
        </div>
        {isSelectorOpen && (
          <div style={{ marginTop: 8, padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)' }}>
            <SelectorOA onSelect={(oa) => { handleSelectOA(oa); setIsSelectorOpen(false); }} />
          </div>
        )}
      </div>

      <CollapsibleSection title="Objetivos de Aprendizaje" icon={<Target size={20} />} defaultExpanded>
        <textarea
          className="output"
          value={objetivos}
          onChange={handleChange(setObjetivos)}
          style={{ minHeight: 100, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Los OAs seleccionados aparecerán aquí…"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Inicio" icon={<Play size={20} />} defaultExpanded>
        <textarea
          className="output"
          value={inicio}
          onChange={handleChange(setInicio)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Actividades de inicio, activación de conocimientos previos, motivación…"
        />
        <div className="btnrow" style={{ marginTop: 8 }}>
          <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Inicio')}>
            <Sparkles size={12} /> IA
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Desarrollo" icon={<Zap size={20} />} defaultExpanded>
        <textarea
          className="output"
          value={desarrollo}
          onChange={handleChange(setDesarrollo)}
          style={{ minHeight: 250, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Estrategias de enseñanza, actividades principales, trabajo colaborativo…"
        />
        <div className="btnrow" style={{ marginTop: 8 }}>
          <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Desarrollo')}>
            <Sparkles size={12} /> IA
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Cierre" icon={<FileText size={20} />} defaultExpanded>
        <textarea
          className="output"
          value={cierre}
          onChange={handleChange(setCierre)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Síntesis, ticket de salida, retroalimentación, conexión con próxima clase…"
        />
        <div className="btnrow" style={{ marginTop: 8 }}>
          <button className="small secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => console.log('Generar sección: Cierre')}>
            <Sparkles size={12} /> IA
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Detalle de la Clase" icon={<Play size={20} />}>
        <textarea
          className="output"
          value={detalleClase}
          onChange={handleChange(setDetalleClase)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Curso, duración, materiales necesarios…"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Recursos" icon={<Play size={20} />}>
        <textarea
          className="output"
          value={recursos}
          onChange={handleChange(setRecursos)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Enlaces, archivos, referencias…"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Evaluación" icon={<Play size={20} />}>
        <textarea
          className="output"
          value={evaluacion}
          onChange={handleChange(setEvaluacion)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Criterios de evaluación, rúbrica, indicadores…"
        />
        <div className="btnrow" style={{ marginTop: 12 }}>
          <button className="primary"><Sparkles size={14} /> Generar plan completo</button>
          <button className="secondary" onClick={handleSaveToLibrary}><Plus size={14} /> Guardar en Biblioteca</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
