import { useState, useEffect } from 'react';
import { FileText as FileIcon } from 'lucide-react';
import type { DriveItem, MaterialSaved } from '../types';
import {
  getDriveItems,
  saveDriveItem,
  deleteDriveItem,
  getMaterials,
  generateId,
} from '../services/storageService';
import { NIVELES, ASIGNATURAS } from '../types';

export function DriveView() {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadNivel, setUploadNivel] = useState('');
  const [uploadAsig, setUploadAsig] = useState('');

  useEffect(() => {
    setItems(getDriveItems());
  }, []);

  const handleUpload = () => {
    if (!uploadName.trim() || !uploadContent.trim()) return;
    const item: DriveItem = {
      id: generateId(),
      nombre: uploadName,
      tipo: 'documento',
      contenido: uploadContent,
      nivel: uploadNivel,
      asignatura: uploadAsig,
      carpetaId: null,
      fecha: new Date().toLocaleString('es-CL'),
      tamano: uploadContent.length,
    };
    const updated = saveDriveItem(item);
    setItems(updated);
    setShowUpload(false);
    setUploadName('');
    setUploadContent('');
    setUploadNivel('');
    setUploadAsig('');
  };

  const importFromMaterials = () => {
    const materials = getMaterials();
    for (const m of materials) {
      const exists = items.some((i) => i.nombre === m.titulo);
      if (!exists) {
        const item: DriveItem = {
          id: generateId(),
          nombre: m.titulo,
          tipo: 'material',
          contenido: m.contenido,
          nivel: m.nivel,
          asignatura: m.asignatura,
          carpetaId: null,
          fecha: new Date().toLocaleString('es-CL'),
          tamano: m.contenido.length,
        };
        saveDriveItem(item);
      }
    }
    setItems(getDriveItems());
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este archivo del drive?')) {
      setItems(deleteDriveItem(id));
    }
  };

  const handleDownload = (item: DriveItem) => {
    const blob = new Blob([item.contenido], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${item.nombre.replace(/[^a-zA-Z0-9áéíóúñ ]/g, '')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filtered = search
    ? items.filter(
        (i) =>
          i.nombre.toLowerCase().includes(search.toLowerCase()) ||
          i.nivel.toLowerCase().includes(search.toLowerCase()) ||
          i.asignatura.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="view" id="drive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Drive docente</h2>
        <div className="btnrow" style={{ margin: 0 }}>
          <button className="secondary small" onClick={importFromMaterials}>
            Importar desde materiales
          </button>
          <button className="primary" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? 'Cancelar' : 'Subir documento'}
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="card">
          <h3>Nuevo documento</h3>
          <div className="grid">
            <div>
              <label>Nombre del documento</label>
              <input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Ej.: Planificación unidad 1"
              />
            </div>
            <div>
              <label>Tipo</label>
              <select disabled>
                <option>Documento de texto</option>
              </select>
            </div>
            <div>
              <label>Nivel</label>
              <select value={uploadNivel} onChange={(e) => setUploadNivel(e.target.value)}>
                <option value="">Seleccionar</option>
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select value={uploadAsig} onChange={(e) => setUploadAsig(e.target.value)}>
                <option value="">Seleccionar</option>
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <label>Contenido textual</label>
          <textarea
            value={uploadContent}
            onChange={(e) => setUploadContent(e.target.value)}
            placeholder="Pega o escribe el contenido del documento..."
            style={{ minHeight: 120 }}
          />
          <div className="btnrow">
            <button className="primary" onClick={handleUpload}>Guardar en Drive</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <input
            placeholder="Buscar documentos por nombre, nivel o asignatura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="muted">
            {items.length === 0
              ? 'Drive vacío. Sube documentos o impórtalos desde Mis materiales.'
              : 'No se encontraron documentos con ese filtro.'}
          </p>
        ) : (
          <div className="resource-list">
            {filtered.map((item) => (
              <div key={item.id} className="resource-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FileIcon size={16} /> {item.nombre}</b>
                    <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                      {item.nivel || 'Sin nivel'} · {item.asignatura || 'Sin asignatura'} ·{' '}
                      {item.fecha} ·                        {((item.tamano || 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    margin: '8px 0',
                    color: 'var(--muted)',
                    maxHeight: 60,
                    overflow: 'hidden',
                  }}
                >
                  {item.contenido.slice(0, 200)}
                  {item.contenido.length > 200 ? '...' : ''}
                </p>
                <div className="btnrow" style={{ marginTop: 8 }}>
                  <button className="small secondary" onClick={() => handleDownload(item)}>
                    Descargar
                  </button>
                  <button className="small danger" onClick={() => handleDelete(item.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
