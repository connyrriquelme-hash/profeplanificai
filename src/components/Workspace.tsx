import { useState } from 'react';
import { SelectorOA } from './SelectorOA';
import { CollapsibleSection } from './CollapsibleSection';
import { FileText, Info, FolderOpen, CheckSquare, Sparkles, Plus } from 'lucide-react';

export function Workspace() {
  const [objetivos, setObjetivos] = useState('');
  const [planificacion, setPlanificacion] = useState('');
  const [detalleClase, setDetalleClase] = useState('');
  const [recursos, setRecursos] = useState('');
  const [evaluacion, setEvaluacion] = useState('');

  const handleChange = (setter: typeof setPlanificacion) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
  };

  const handleSelectOA = (texto: string) => {
    if (texto) setObjetivos(prev => prev + (prev ? '\n\n' : '') + texto);
  };

  return (
    <div>
      <CollapsibleSection title="Planificación" icon={<FileText size={20} />} defaultExpanded>
        <SelectorOA onSelect={handleSelectOA} />
        <textarea
          className="output"
          value={objetivos}
          onChange={handleChange(setObjetivos)}
          style={{ minHeight: 100, fontFamily: 'inherit', resize: 'vertical', marginTop: 12 }}
          placeholder="Los OAs seleccionados aparecerán aquí…"
        />
        <textarea
          className="output"
          value={planificacion}
          onChange={handleChange(setPlanificacion)}
          style={{ minHeight: 300, fontFamily: 'inherit', resize: 'vertical', marginTop: 12 }}
          placeholder="Escribe tu planificación aquí…"
        />
        <div className="btnrow" style={{ marginTop: 12 }}>
          <button className="primary"><Sparkles size={14} /> Generar con IA</button>
          <button className="secondary"><Plus size={14} /> Guardar en Biblioteca</button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Detalle de la Clase" icon={<Info size={20} />}>
        <textarea
          className="output"
          value={detalleClase}
          onChange={handleChange(setDetalleClase)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Curso, duración, materiales necesarios…"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Recursos" icon={<FolderOpen size={20} />}>
        <textarea
          className="output"
          value={recursos}
          onChange={handleChange(setRecursos)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Enlaces, archivos, referencias…"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Evaluación" icon={<CheckSquare size={20} />}>
        <textarea
          className="output"
          value={evaluacion}
          onChange={handleChange(setEvaluacion)}
          style={{ minHeight: 150, fontFamily: 'inherit', resize: 'vertical' }}
          placeholder="Criterios de evaluación, rúbrica, indicadores…"
        />
      </CollapsibleSection>
    </div>
  );
}
