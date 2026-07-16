import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classbookService } from '../../services/classbookService';
import { canCreateObservation } from '../../utils/classbookPermissions';
import type { ClassbookSession, ClassbookObservation } from '../../types/classbook';

interface Props {
  institutionId: string;
  yearId: string;
  sessions: ClassbookSession[];
}

const CATEGORIES = ['academic', 'behavioral', 'social', 'emotional', 'attendance', 'other'];

export function ObservationsPanel({ institutionId, yearId, sessions }: Props) {
  const { user } = useAuth();
  const [observations, setObservations] = useState<ClassbookObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', course_id: '', category: 'academic', content: '', visibility: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canCreate = canCreateObservation(user);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    classbookService.getObservations(institutionId, {}, ctrl.signal)
      .then(obs => { setObservations(obs); setLoading(false); })
      .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [institutionId]);

  const handleCreate = useCallback(async () => {
    if (!formData.student_id || !formData.course_id || !formData.content) return;
    setSaving(true);
    try {
      const obs = await classbookService.createObservation({
        academic_year_id: yearId,
        course_id: formData.course_id,
        student_id: formData.student_id,
        category: formData.category,
        content: formData.content,
        visibility: formData.visibility,
      });
      setObservations(prev => [obs, ...prev]);
      setShowForm(false);
      setFormData({ student_id: '', course_id: '', category: 'academic', content: '', visibility: 'teacher' });
      setMessage('Observación creada');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Error al crear');
    } finally {
      setSaving(false);
    }
  }, [formData, yearId]);

  const handleArchive = useCallback(async (obsId: string) => {
    try {
      await classbookService.archiveObservation(obsId);
      setObservations(prev => prev.filter(o => o.id !== obsId));
    } catch {
      setMessage('Error al archivar');
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Observaciones</h1>
        {canCreate && (
          <button
            aria-expanded={showForm}
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            {showForm ? 'Cancelar' : '+ Nueva'}
          </button>
        )}
      </div>

      {message && (
        <div role="status" aria-live="polite" className={`text-sm px-4 py-2 rounded-xl ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              aria-label="ID del estudiante"
              placeholder="Student ID"
              value={formData.student_id}
              onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              aria-label="ID del curso"
              placeholder="Course ID"
              value={formData.course_id}
              onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <select
              aria-label="Categoría"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              aria-label="Visibilidad"
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="teacher">Solo docente</option>
              <option value="institution">Institución</option>
            </select>
          </div>
          <textarea
            aria-label="Contenido de la observación"
            placeholder="Contenido de la observación..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
          <button
            onClick={handleCreate}
            disabled={saving || !formData.student_id || !formData.course_id || !formData.content}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            {saving ? 'Guardando...' : 'Crear observación'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div role="status" aria-label="Cargando observaciones" className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : observations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No hay observaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map(obs => (
            <div key={obs.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{obs.category}</span>
                    <span className="text-xs text-slate-400">{obs.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{obs.content}</p>
                </div>
                {canCreate && (
                  <button onClick={() => handleArchive(obs.id)} className="text-xs text-slate-400 hover:text-red-500 transition">
                    Archivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
