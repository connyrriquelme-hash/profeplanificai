import { useState } from 'react';
import type { ClassbookSession } from '../../types/classbook';

interface Props {
  sessions: ClassbookSession[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
}

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'pending_signature' | 'signed';

export function ClassSessionList({ sessions, onRefresh, onOpenSession }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = sessions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search && !s.date.includes(search) && !(s.planned_content ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Sesiones</h1>
        <button onClick={onRefresh} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          aria-label="Buscar por fecha o contenido"
          placeholder="Buscar por fecha o contenido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1 min-w-[200px]"
        />
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {(['all', 'scheduled', 'completed', 'pending_signature', 'signed'] as StatusFilter[]).map(f => (
            <button
              key={f}
              aria-pressed={statusFilter === f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                statusFilter === f ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'scheduled' ? 'Programadas' : f === 'completed' ? 'Completadas' : f === 'pending_signature' ? 'Pendientes' : 'Firmadas'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No se encontraron sesiones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <ClassSessionCard key={session.id} session={session} onOpen={onOpenSession} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassSessionCard({ session, onOpen }: { session: ClassbookSession; onOpen: (id: string) => void }) {
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
    pending_signature: 'bg-orange-50 text-orange-700',
    signed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
  };
  const statusLabels: Record<string, string> = {
    scheduled: 'Programada',
    in_progress: 'En progreso',
    completed: 'Completada',
    pending_signature: 'Pendiente firma',
    signed: 'Firmada',
    cancelled: 'Cancelada',
  };

  return (
    <button
      aria-label={`Abrir sesión del ${session.date}: ${session.planned_content ?? 'Sin contenido planificado'}, estado ${statusLabels[session.status] ?? session.status}`}
      onClick={() => onOpen(session.id)}
      className="w-full bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-violet-200 transition text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{session.date}</span>
            {session.start_time && (
              <span className="text-xs text-slate-400">{session.start_time}{session.end_time ? ` – ${session.end_time}` : ''}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1 truncate">
            {session.planned_content ?? 'Sin contenido planificado'}
          </p>
          {session.taught_content && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">Realizado: {session.taught_content}</p>
          )}
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${statusStyles[session.status] ?? 'bg-slate-100 text-slate-500'}`}>
          {statusLabels[session.status] ?? session.status}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
        <span>v{session.version}</span>
        {session.lesson_instance_id && <span className="text-violet-500">Desde planificación</span>}
      </div>
    </button>
  );
}
