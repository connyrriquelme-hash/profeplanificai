import { useState, useEffect } from 'react';
import { Database, Search, Plus, BookOpen, Clock, Trash2, FileText, ClipboardCheck, Copy, FileDown, X, AlertCircle } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useResources } from '../hooks/useResources';
import { exportToPDF } from '../utils/exportPdf';

type Tab = 'planificaciones' | 'recursos' | 'evaluaciones';

interface BancoRecursosViewProps {
  initialTab?: Tab;
  onNavigate?: (view: string) => void;
}

interface Resource {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  level: string;
  content: string;
  created_at: string;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'planificaciones', label: 'Mis Planificaciones', icon: <BookOpen size={16} /> },
  { id: 'recursos', label: 'Mis Recursos', icon: <FileText size={16} /> },
  { id: 'evaluaciones', label: 'Mis Evaluaciones', icon: <ClipboardCheck size={16} /> },
];

export function BancoRecursosView({ initialTab, onNavigate }: BancoRecursosViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'planificaciones');
  const { library, removeFromLibrary, newProject } = useProject();
  const { resources, isLoading, error, fetchResources } = useResources();
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Resource | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'recursos') fetchResources();
  }, [activeTab, fetchResources]);

  const filteredPlans = query
    ? library.filter(i => i.titulo.toLowerCase().includes(query.toLowerCase()) || i.objetivos.toLowerCase().includes(query.toLowerCase()))
    : library;

  const filteredResources = query.trim()
    ? resources.filter(r =>
        r.title?.toLowerCase().includes(query.toLowerCase()) ||
        r.subject?.toLowerCase().includes(query.toLowerCase()) ||
        r.level?.toLowerCase().includes(query.toLowerCase()))
    : resources;

  const handleNewClick = () => {
    newProject();
    onNavigate?.('workspace');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-CL');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'planificaciones':
        return (
          <>
            {filteredPlans.length === 0 ? (
              <div className="card empty-state" style={{ minHeight: 300 }}>
                <BookOpen size={48} />
                <p>{query ? 'No se encontraron planificaciones.' : 'Aún no tienes planificaciones guardadas.'}</p>
                <p className="muted" style={{ marginTop: 8 }}>Crea tu primera planificación desde el Espacio de Trabajo.</p>
                <button className="primary" style={{ marginTop: 16 }} onClick={handleNewClick}>
                  <Plus size={14} /> Crear Planificación
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredPlans.map(item => (
                  <div key={item.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{item.titulo}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                          <Clock size={12} />
                          {formatDate(item.fecha)}
                        </div>
                      </div>
                      <button className="ghost" style={{ padding: 4, color: 'var(--muted)' }} onClick={() => removeFromLibrary(item.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {item.objetivos && <span style={{ fontSize: 11, background: 'var(--bg2)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)' }}><BookOpen size={10} style={{ marginRight: 4 }} />OA</span>}
                      {item.inicio && <span style={{ fontSize: 11, background: 'var(--bg2)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)' }}>Inicio</span>}
                      {item.desarrollo && <span style={{ fontSize: 11, background: 'var(--bg2)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)' }}>Desarrollo</span>}
                      {item.cierre && <span style={{ fontSize: 11, background: 'var(--bg2)', padding: '2px 8px', borderRadius: 4, color: 'var(--muted)' }}>Cierre</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                      {item.objetivos || item.inicio || 'Sin contenido'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      case 'recursos':
        if (isLoading && resources.length === 0) {
          return <div className="card empty-state"><Database size={38} /><p>Cargando recursos…</p></div>;
        }
        return (
          <>
            {error && (
              <div className="card" style={{ borderColor: 'var(--error)', background: 'var(--error-bg)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--error)' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              </div>
            )}
            {!isLoading && !filteredResources.length ? (
              <div className="card empty-state">
                <Database size={38} />
                <p>{query ? 'No hay recursos que coincidan con tu búsqueda.' : 'Aún no hay recursos guardados.'}</p>
              </div>
            ) : (
              <div className="recursos-grid">
                {filteredResources.map(r => (
                  <div key={r.id} className="card recurso-card" onClick={() => setDetail(r)} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{r.title || 'Sin título'}</h3>
                    <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span><BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{r.subject}</span>
                      <span><BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{r.level}</span>
                      <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      case 'evaluaciones':
        return (
          <div className="card empty-state" style={{ minHeight: 300 }}>
            <ClipboardCheck size={48} />
            <p>Próximamente: gestión de evaluaciones.</p>
            <p className="muted" style={{ marginTop: 8 }}>Aquí podrás crear y gestionar rúbricas, listas de cotejo y pautas de evaluación.</p>
          </div>
        );
    }
  };

  return (
    <div className="view banco-recursos">
      <div className="module-header">
        <div>
          <h2 className="module-title"><Database size={22} /> Banco de Recursos</h2>
          <p className="muted">Gestiona tus planificaciones, recursos y evaluaciones.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <Search className="search-icon" size={16} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={activeTab === 'planificaciones' ? 'Buscar planificaciones…' : activeTab === 'recursos' ? 'Buscar por título, asignatura o nivel…' : 'Buscar evaluaciones…'}
            />
          </div>
          <button className="primary" onClick={handleNewClick}>
            <Plus size={14} /> Nuevo
          </button>
          {activeTab === 'recursos' && (
            <button className="secondary" onClick={fetchResources} disabled={isLoading}>
              {isLoading ? 'Cargando…' : 'Recargar'}
            </button>
          )}
        </div>
      </div>

      <div className="tabs" role="tablist" style={{ marginBottom: 20 }}>
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={{ animation: 'fadeIn .2s ease' }}>{renderTabContent()}</div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h2>{detail.title}</h2>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {detail.subject} · {detail.level} · {formatDate(detail.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                <button className="secondary" onClick={() => navigator.clipboard.writeText(detail.content)}>
                  <Copy size={14} />
                </button>
                <button className="primary" onClick={() => exportToPDF(detail.title, detail.content)}>
                  <FileDown size={14} /> PDF
                </button>
                <button className="ghost" onClick={() => setDetail(null)}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="detail-body" style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14, color: 'var(--ink2)' }}>
                {detail.content}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .tab-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: var(--radius-md); border: 1px solid var(--line); background: var(--card); color: var(--ink); font-weight: 500; font-size: 13; cursor: pointer; transition: all .15s; }
        .tab-btn.active { background: var(--brand); color: #fff; border-color: var(--brand); }
        .tab-btn:hover:not(.active) { background: var(--bg2); border-color: var(--brand); color: var(--brand); }
        .recursos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .recurso-card { padding: 18px; transition: box-shadow var(--t-fast), transform var(--t-fast); }
        .recurso-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 40px 20px; overflow-y: auto; }
        .modal { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); max-width: 800px; width: 100%; }
        .detail-modal { max-width: 900px; }
        .detail-header { display: flex; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--card); border-radius: var(--radius) var(--radius) 0 0; z-index: 1; }
        .detail-header h2 { font-size: 18px; margin: 0 0 4px; }
        .detail-body { max-height: 70vh; overflow-y: auto; }
      `}</style>
    </div>
  );
}
