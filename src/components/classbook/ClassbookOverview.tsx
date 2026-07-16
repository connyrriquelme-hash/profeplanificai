import type { ClassbookSession } from '../../types/classbook';

interface Props {
  sessions: ClassbookSession[];
  onNavigate: (view: string, state?: Record<string, unknown>) => void;
  onRefresh: () => void;
}

export function ClassbookOverview({ sessions, onNavigate, onRefresh }: Props) {
  const total = sessions.length;
  const scheduled = sessions.filter(s => s.status === 'scheduled').length;
  const completed = sessions.filter(s => s.status === 'completed' || s.status === 'signed').length;
  const pendingSignature = sessions.filter(s => s.status === 'pending_signature').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Resumen</h1>
        <button onClick={onRefresh} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total sesiones" value={total} color="violet" />
        <StatCard label="Programadas" value={scheduled} color="blue" />
        <StatCard label="Completadas" value={completed} color="green" />
        <StatCard label="Pendientes firma" value={pendingSignature} color="amber" />
      </div>

      {total === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <svg className="mx-auto mb-4 text-slate-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-slate-500 text-sm font-medium">No hay sesiones registradas</p>
          <button
            onClick={() => onNavigate('mis-clases')}
            className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-semibold"
          >
            Ir a Mis Clases
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Sesiones recientes</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {sessions.slice(0, 5).map(session => (
              <button
                key={session.id}
                onClick={() => onNavigate('libro-clases-session', { sessionId: session.id })}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{session.date}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{session.planned_content ?? 'Sin contenido'}</p>
                </div>
                <StatusBadge status={session.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colorMap[color]?.split(' ')[1] ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
    pending_signature: 'bg-orange-50 text-orange-700',
    signed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<string, string> = {
    scheduled: 'Programada',
    in_progress: 'En progreso',
    completed: 'Completada',
    pending_signature: 'Pendiente firma',
    signed: 'Firmada',
    cancelled: 'Cancelada',
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {labels[status] ?? status}
    </span>
  );
}
