interface Material {
  id: string;
  titulo: string;
  fecha: string;
  nivel?: string;
  asignatura?: string;
}

interface MaterialListProps<T extends Material> {
  items: T[];
  onCargar: (item: T) => void;
  onEliminar: (id: string) => void;
  emptyMsg?: string;
}

export function MaterialList<T extends Material>({
  items,
  onCargar,
  onEliminar,
  emptyMsg = 'Aún no hay elementos guardados.',
}: MaterialListProps<T>) {
  if (items.length === 0) {
    return <p className="muted">{emptyMsg}</p>;
  }

  return (
    <div className="resource-list">
      {items.map((m) => (
        <div key={m.id} className="resource-item">
          <b>{m.titulo}</b>
          <span className="muted" style={{ fontSize: 12 }}>
            {m.nivel && `${m.nivel} · `}
            {m.asignatura && `${m.asignatura} · `}
            {new Date(m.fecha).toLocaleString('es-CL')}
          </span>
          <div className="btnrow">
            <button className="small secondary" onClick={() => onCargar(m)}>
              Cargar
            </button>
            <button className="small danger" onClick={() => onEliminar(m.id)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
