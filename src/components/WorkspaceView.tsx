import { useState } from 'react';
import { BookOpen, FileText, Users } from 'lucide-react';
import { Workspace } from './Workspace';

interface WorkspaceViewProps {
  output?: string;
  onNavigate?: (view: string) => void;
  onSave?: () => void;
  onCopy?: () => void;
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  onClose?: () => void;
  initialMessage?: string;
}

type Tab = 'planificacion' | 'evaluaciones' | 'colaboracion';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'planificacion', label: 'Planificación', icon: <BookOpen size={16} /> },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: <FileText size={16} /> },
  { id: 'colaboracion', label: 'Colaboración', icon: <Users size={16} /> },
];

export function WorkspaceView(_props: WorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('planificacion');

  return (
    <div className="view workspace">
      <div className="module-header">
        <h2 className="module-title"><BookOpen size={22} /> Espacio de Trabajo</h2>
        <p className="muted">Crea, evalúa y colabora en un solo lugar.</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: activeTab === id ? 'var(--brand)' : 'var(--card)',
              color: activeTab === id ? '#fff' : 'var(--ink)',
              fontWeight: 500, fontSize: 13, cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={{ animation: 'fadeIn .2s ease' }}>
        {activeTab === 'planificacion' && <Workspace />}
        {activeTab === 'evaluaciones' && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted" style={{ fontSize: 15 }}>En construcción</p>
          </div>
        )}
        {activeTab === 'colaboracion' && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted" style={{ fontSize: 15 }}>En construcción</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .tab-btn:hover:not(.active) { background: var(--bg2); border-color: var(--brand); color: var(--brand); }
      `}</style>
    </div>
  );
}
