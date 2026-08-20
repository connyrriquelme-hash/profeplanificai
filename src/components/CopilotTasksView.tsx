import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ListChecks, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../services/apiClient';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface CopilotTask {
  id: string;
  intent: string;
  status: TaskStatus;
  requiresConfirmation: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente', running: 'En progreso', completed: 'Completada', failed: 'Fallida', cancelled: 'Cancelada',
};

const INTENT_LABELS: Record<string, string> = {
  save_to_bank: 'Guardar en banco', search_curriculum: 'Buscar currículo', generate_material: 'Generar material',
  plan: 'Planificar', edit_material: 'Editar material', navigate_to_view: 'Navegar', unknown: 'Solicitud general',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'completed') return <CheckCircle2 size={18} className="text-emerald-600" />;
  if (status === 'failed' || status === 'cancelled') return <XCircle size={18} className="text-rose-600" />;
  return <Clock3 size={18} className="text-amber-600" />;
}

export function CopilotTasksView() {
  const [tasks, setTasks] = useState<CopilotTask[]>([]);
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
      const response = await api.get<{ data: CopilotTask[] }>(`/api/copilot/tasks${query}`);
      setTasks(response.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]"><ListChecks size={16} /> Copilot</p>
            <h1 className="text-2xl font-bold text-slate-900">Mis tareas IA</h1>
            <p className="mt-1 text-sm text-slate-500">Revisa las solicitudes que el asistente ha preparado y ejecutado.</p>
          </div>
          <button type="button" onClick={() => void loadTasks()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'running', 'completed', 'failed', 'cancelled'] as const).map((filter) => (
            <button key={filter} type="button" onClick={() => setStatus(filter)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${status === filter ? 'bg-[var(--primary)] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              {filter === 'all' ? 'Todas' : STATUS_LABELS[filter]}
            </button>
          ))}
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {loading && <div className="flex items-center justify-center py-16 text-sm text-slate-500"><Loader2 size={20} className="mr-2 animate-spin" /> Cargando tareas...</div>}
        {!loading && !error && tasks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ListChecks size={32} className="mx-auto mb-3 text-slate-300" /><h2 className="font-semibold text-slate-800">No hay tareas en este estado</h2><p className="mt-1 text-sm text-slate-500">Cuando uses el Copilot, sus tareas aparecerán aquí.</p></div>}
        {!loading && tasks.length > 0 && <div className="grid gap-3">{tasks.map((task) => {
          const title = typeof task.metadata?.taskTitle === 'string' ? task.metadata.taskTitle : typeof task.metadata?.title === 'string' ? task.metadata.title : INTENT_LABELS[task.intent] || task.intent;
          return <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><StatusIcon status={task.status} /><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{INTENT_LABELS[task.intent] || task.intent} · Creada {formatDate(task.createdAt)}</p></div></div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{STATUS_LABELS[task.status]}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Actualizada: {formatDate(task.updatedAt)}</span>{task.requiresConfirmation && <span>Requiere confirmación</span>}<span className="font-mono">{task.id}</span></div>
          </article>;
        })}</div>}
      </div>
    </div>
  );
}