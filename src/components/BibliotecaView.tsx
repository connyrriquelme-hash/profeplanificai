import { useState } from 'react';
import { FolderOpen, Search, Plus, BookOpen, Clock, Trash2 } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

interface BibliotecaViewProps {
  onNavigate?: (view: string) => void;
}

export function BibliotecaView({ onNavigate }: BibliotecaViewProps) {
  const { library, removeFromLibrary, newProject } = useProject();
  const [query, setQuery] = useState('');

  const handleNew = () => {
    newProject();
    onNavigate?.('workspace');
  };

  const filtered = query
    ? library.filter(i => i.titulo.toLowerCase().includes(query.toLowerCase()) || i.objetivos.toLowerCase().includes(query.toLowerCase()))
    : library;

  return (
    <div className="view biblioteca">
      <div className="module-header">
        <div>
          <h2 className="module-title"><FolderOpen size={22} /> Biblioteca</h2>
          <p className="muted">Tus recursos guardados, planificaciones y materiales.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <Search className="search-icon" size={16} />
            <input placeholder="Buscar en tu biblioteca…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="primary" onClick={handleNew}><Plus size={14} /> Nuevo</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state" style={{ minHeight: 300 }}>
          <FolderOpen size={48} />
          <p>{query ? 'No se encontraron planificaciones.' : 'Aquí aparecerán tus recursos guardados desde el Espacio de Trabajo y el Banco OA.'}</p>
          <p className="muted" style={{ marginTop: 8 }}>Integra tus materiales creados en un solo lugar.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{item.titulo}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                    <Clock size={12} />
                    {new Date(item.fecha).toLocaleString('es-CL')}
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
    </div>
  );
}
