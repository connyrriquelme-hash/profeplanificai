interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

import { CheckCircle } from 'lucide-react';

export function DashboardView({ onNavigate }: DashboardViewProps) {
  return (
    <div className="view" id="inicio">
      <div className="banner">
        <div style={{ fontSize: 28 }}><CheckCircle size={28} style={{ color: 'var(--brand2)' }} /></div>
        <div>
          <b>PlanificaIA Chile está listo para usar.</b>
          <br />
          <span className="muted">
            Plataforma docente chilena para crear planificaciones, guías, evaluaciones,
            rúbricas y recursos DUA alineados al Currículum Nacional MINEDUC.
            Funciona en modo local sin API key. Si conectas una IA externa opcional,
            las respuestas serán más ricas; si falla, vuelve al generador local.
          </span>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <b>1</b>
          <span>Selecciona nivel, asignatura y OA</span>
        </div>
        <div className="metric">
          <b>2</b>
          <span>Genera planificaciones, recursos o evaluaciones</span>
        </div>
        <div className="metric">
          <b>3</b>
          <span>Copia, descarga, imprime o exporta a PDF</span>
        </div>
      </div>

      <div className="card">
        <h2>Qué puedes generar</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <b>Planificaciones</b> clase a clase con inicio, desarrollo, cierre,
            evaluación formativa y DUA.
          </li>
          <li>
            <b>Guías, rúbricas, tickets de salida</b>, actividades colaborativas,
            estructura PPT y prompts para IA externa.
          </li>
          <li>
            <b>Evaluaciones tipo SIMCE</b> con alternativas, habilidades, pauta y
            retroalimentación.
          </li>
          <li>
            <b>Recursos DUA</b> con múltiples formas de representación, acción y
            participación.
          </li>
          <li>
            <b>Exportación</b> a HTML, PDF con vista imprimible y copia al portapapeles.
          </li>
        </ul>
        <div className="btnrow">
          <button className="primary" onClick={() => onNavigate('agente')}>
            Abrir agente IA
          </button>
          <button className="primary" onClick={() => onNavigate('planificador')}>
            Crear planificación
          </button>
          <button className="secondary" onClick={() => onNavigate('recursos')}>
            Crear recurso
          </button>
          <button className="ghost" onClick={() => onNavigate('config')}>
            Configurar IA
          </button>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(245, 215, 110, 0.3)' }}>
        <b>Nota curricular:</b>{' '}
        <span className="muted">
          Los OA que aparecen como ejemplo son orientativos/editables. Para uso
          formal, pega el OA ministerial exacto desde tus bases curriculares o
          programa de estudio.
        </span>
      </div>
    </div>
  );
}
