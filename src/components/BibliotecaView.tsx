import { FolderOpen, Search, Plus } from 'lucide-react';

export function BibliotecaView() {
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
            <input placeholder="Buscar en tu biblioteca…" />
          </div>
          <button className="primary"><Plus size={14} /> Nuevo</button>
        </div>
      </div>

      <div className="card empty-state" style={{ minHeight: 300 }}>
        <FolderOpen size={48} />
        <p>Aquí aparecerán tus recursos guardados desde el Espacio de Trabajo y el Banco OA.</p>
        <p className="muted" style={{ marginTop: 8 }}>Integra tus materiales creados en un solo lugar.</p>
      </div>
    </div>
  );
}