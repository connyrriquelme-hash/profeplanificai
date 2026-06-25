import { useState } from 'react';
import { Sparkles, Layers, FileEdit, FolderOpen, Search, Plus, BookOpen, Clock, Trash2, Users, X } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

interface BibliotecaViewProps {
  onNavigate?: (view: string) => void;
}

const CREATIVE_ACTIONS = [
  { icon: Sparkles, title: 'Lección individual', desc: 'Una lección puntual', color: '#6d5dfc' },
  { icon: Layers, title: 'Serie de lecciones', desc: 'Varias lecciones sobre un tema', color: '#00a7a7' },
  { icon: FileEdit, title: 'Fichas de actividades', desc: 'Fichas de tareas listas para imprimir', color: '#f59e0b' },
];

export function BibliotecaView({ onNavigate }: BibliotecaViewProps) {
  const { library, removeFromLibrary, newProject } = useProject();
  const [query, setQuery] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleNew = () => {
    newProject();
    onNavigate?.('workspace');
  };

  const filtered = query
    ? library.filter(i => i.titulo.toLowerCase().includes(query.toLowerCase()) || (i.objetivos || '').toLowerCase().includes(query.toLowerCase()))
    : library;

  return (
    <div className="view biblioteca">
      {/* Biblioteca Creativa */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">¿Qué creamos hoy? ✨</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREATIVE_ACTIONS.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-[var(--ink)] mb-1">{title}</h3>
              <p className="text-sm text-[var(--muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Collaborative Banner */}
      {isBannerVisible && (
        <div className="relative rounded-2xl bg-orange-50 border border-orange-200 p-6 mb-8 flex items-center gap-6">
          <button
            className="absolute top-3 right-3 p-1 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100 transition-colors"
            onClick={() => setIsBannerVisible(false)}
            aria-label="Cerrar banner"
          >
            <X size={16} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Users size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-orange-900 mb-1">ProfePlanificaI es mejor en equipo</h3>
            <p className="text-sm text-orange-700 leading-relaxed max-w-xl">
              Crea un equipo, invita a colegas y comparte lecciones que podáis remixar y hacer vuestras.
            </p>
          </div>
          <button className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
            Crear un equipo
          </button>
        </div>
      )}

      {/* Section divider */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted2)]">Banco de Recursos Curriculares</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      {/* Existing library section */}
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
