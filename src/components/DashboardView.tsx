import { ClipboardEdit, Package, FileText, Database } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

interface DashboardViewProps {
  onNavigate: (view: string, state?: { tab?: string }) => void;
}

const ACTIONS = [
  { view: 'workspace', icon: ClipboardEdit, color: '#6d5dfc', title: 'Crear Planificación', desc: 'Diseña clases y unidades completas con inicio, desarrollo y cierre.' },
  { view: 'banco', icon: Package, color: '#00a7a7', title: 'Generar Recurso / Guía', desc: 'Crea guías, fichas, presentaciones y actividades para tus estudiantes.' },
  { view: 'agente', icon: FileText, color: '#f59e0b', title: 'Crear Evaluación', desc: 'Elabora evaluaciones formativas, sumativas y tipo SIMCE con pauta.' },
  { view: 'banco-recursos', icon: Database, color: '#a78bfa', title: 'Ir a mi Banco de Recursos', desc: 'Revisa, descarga y gestiona todo tu material generado.' },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { newProject } = useProject();

  const handleClick = (view: string) => {
    if (view === 'workspace') newProject();
    onNavigate(view, view === 'banco-recursos' ? { tab: 'planificaciones' } : undefined);
  };

  return (
    <div className="view" id="inicio">
      <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>¿Qué vamos a preparar hoy, Profe?</h1>
        <p className="muted" style={{ fontSize: 15 }}>
          Crea materiales educativos alineados al Currículum Nacional de Chile en minutos.
        </p>
      </div>
      <div className="action-grid">
        {ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.view} className="action-card" onClick={() => handleClick(a.view)}>
              <div className="action-icon" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}dd)` }}>
                <Icon size={28} />
              </div>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          );
        })}
      </div>
      <style>{`
        .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .action-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 28px 24px; cursor: pointer; transition: all var(--t-base); position: relative; overflow: hidden; }
        .action-card:hover { border-color: var(--brand); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(109,93,252,0.15); }
        .action-card:active { transform: translateY(-1px); }
        .action-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 16px; }
        .action-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--ink); }
        .action-card p { font-size: 13px; color: var(--muted); line-height: 1.5; }
      `}</style>
    </div>
  );
}
