import { useEffect, useState } from 'react';
import { Database, Search, Copy, FileDown, ExternalLink, X, Clock, BookOpen } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { exportToPDF } from '../utils/exportPdf';

interface Resource {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  level: string;
  content: string;
  created_at: string;
}

export function BancoRecursosView() {
  const { resources, isLoading, error, fetchResources, saveResource } = useResources();
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Resource | null>(null);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const filtered = search.trim()
    ? resources.filter(r =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.subject?.toLowerCase().includes(search.toLowerCase()) ||
        r.level?.toLowerCase().includes(search.toLowerCase()))
    : resources;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('es-CL', { timeZone: 'America/Santiago' });

  if (isLoading && resources.length === 0) {
    return (
      <div className="view banco-recursos">
        <div className="module-header">
          <h2 className="module-title"><Database size={22} /> Banco de Recursos</h2>
        </div>
        <div className="card empty-state"><Database size={3 size={38} /><p>Cargando recursos…</p></div>
      </div>
    );
  }

  return (
    <div className="view banco-recursos">
      <div className="module-header">
        <div>
          <h2 className="module-title"><Database size={22} /> Banco de Recursos</h2>
          <p className="muted">{resources.length} recursos guardados en D1.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search className="search-icon" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, asignatura o nivel…"
            />
          </div>
          <button className="secondary" onClick={fetchResources} disabled={isLoading}>
            {isLoading ? 'Cargando…' : 'Recargar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--error)', background: 'var(--error-bg)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--error)' }}>
            <AlertCircle size={18} /> {error}
          </div>
        </div>
      )}

      {!isLoading && !filtered.length ? (
        <div className="card empty-state">
          <Database size={38} />
          <p>{search ? 'No hay recursos que coincidan con tu búsqueda.' : 'Aún no hay recursos guardados.'}</p>
        </div>
      ) : (
        <div className="recursos-grid">
          {filtered.map(r => (
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

// Need to import AlertCircle
import { AlertCircle } from 'lucide-react';