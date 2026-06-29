import { BookOpen } from 'lucide-react';
import { Workspace } from './Workspace';

interface WorkspaceViewProps {
  onNavigate?: (view: string) => void;
}

export function WorkspaceView(_props: WorkspaceViewProps) {
  return (
    <div className="view workspace">
      <div className="module-header">
        <h2 className="module-title"><BookOpen size={22} /> Espacio de Trabajo</h2>
        <p className="muted">Planifica tu clase.</p>
      </div>

      <div style={{ animation: 'fadeIn .2s ease' }}>
        <Workspace onNavigate={_props.onNavigate} />
      </div>
    </div>
  );
}
